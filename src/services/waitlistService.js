const redis = require('../config/redis');
const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const appointmentModel = require('../models/appointmentModel');
const bookingService = require('./bookingService');
const { enqueueConfirmation } = require('./jobQueue');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');
const { toSqlDateTime, parseDateTime, getDayRange } = require('../utils/dateTime');
const { MAX_APPOINTMENTS_PER_DAY } = require('../constants');

const QUEUE_PREFIX = 'waitlist:queue:';
const PROCESSING_PREFIX = 'waitlist:processing:';
const FAILED_KEY = 'waitlist:failed';

const queueKey = (doctorId, day) => `${QUEUE_PREFIX}${doctorId}:${day}`;
const processingKey = (doctorId, day) => `${PROCESSING_PREFIX}${doctorId}:${day}`;
const dayOf = (sqlDatetime) => sqlDatetime.slice(0, 10);

async function joinWaitlist({ patientId, doctorId, date }) {
  if (!(await patientModel.findById(patientId))) throw new AppError('Patient not found', 404);
  if (!(await doctorModel.findById(doctorId))) throw new AppError('Doctor not found', 404);

  const requestedDatetime = toSqlDateTime(date);
  const { start, end } = getDayRange(date);
  const slotTaken = await appointmentModel.isSlotBooked(doctorId, requestedDatetime);
  const dayFull = (await appointmentModel.countActiveForDay(doctorId, start, end)) >= MAX_APPOINTMENTS_PER_DAY;
  if (!slotTaken && !dayFull) {
    throw new AppError('This slot is available, book it directly', 409, 'SLOT_AVAILABLE');
  }

  const key = queueKey(doctorId, dayOf(requestedDatetime));
  const waiting = await redis.lrange(key, 0, -1);
  if (waiting.some((raw) => JSON.parse(raw).patientId === patientId)) {
    throw new AppError('Patient is already on this waitlist', 409, 'ALREADY_WAITLISTED');
  }

  const entry = { patientId, doctorId, requestedDatetime, joinedAt: new Date().toISOString() };
  const position = await redis.rpush(key, JSON.stringify(entry));
  return { ...entry, position };
}

async function getWaitlist(doctorId, day) {
  const waiting = await redis.lrange(queueKey(doctorId, day), 0, -1);
  return waiting.map((raw, index) => ({ position: index + 1, ...JSON.parse(raw) }));
}

async function handleFailedPromotion(err, raw, { waitingKey, inFlightKey, doctorId, slot, patientId }) {
  const permanent = err instanceof AppError && err.statusCode === 404;

  const multi = redis.multi().lrem(inFlightKey, 1, raw);
  if (permanent) multi.rpush(FAILED_KEY, raw);
  else multi.lpush(waitingKey, raw);
  await multi.exec();

  await logAudit('waitlist.promotion_failed', {
    patientId,
    doctorId,
    slot,
    reason: err.message,
    outcome: permanent ? 'moved_to_failed_list' : 'requeued_at_front',
  });

  if (!(err instanceof AppError)) throw err;
  return { promoted: false, reason: err.code || 'FAILED' };
}

async function promoteFromWaitlist({ doctorId, slot }) {
  const day = dayOf(slot);
  const waitingKey = queueKey(doctorId, day);
  const inFlightKey = processingKey(doctorId, day);

  const raw = await redis.lmove(waitingKey, inFlightKey, 'LEFT', 'RIGHT');
  if (!raw) return { promoted: false, reason: 'EMPTY_WAITLIST' };

  const { patientId } = JSON.parse(raw);
  let appointment;
  try {
    appointment = await bookingService.bookAppointment({ patientId, doctorId, date: parseDateTime(slot) });
  } catch (err) {
    return handleFailedPromotion(err, raw, { waitingKey, inFlightKey, doctorId, slot, patientId });
  }

  await redis.lrem(inFlightKey, 1, raw);
  await logAudit('waitlist.promoted', {
    appointmentId: appointment.id,
    patientId,
    doctorId,
    appointmentDatetime: appointment.appt_datetime,
  });
  await enqueueConfirmation(appointment);
  return { promoted: true, appointmentId: appointment.id };
}

async function recoverStuckEntries() {
  let recovered = 0;
  for await (const keys of redis.scanStream({ match: `${PROCESSING_PREFIX}*` })) {
    for (const inFlightKey of keys) {
      const waitingKey = inFlightKey.replace(PROCESSING_PREFIX, QUEUE_PREFIX);
      while (await redis.lmove(inFlightKey, waitingKey, 'RIGHT', 'LEFT')) recovered += 1;
    }
  }
  return recovered;
}

module.exports = { joinWaitlist, getWaitlist, promoteFromWaitlist, recoverStuckEntries };