const { Queue } = require('bullmq');
const config = require('../config');
const { JOB_QUEUE_NAME, JOBS } = require('../constants');

const queue = new Queue(JOB_QUEUE_NAME, {
  connection: { host: config.redis.host, port: config.redis.port, enableOfflineQueue: false },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

queue.on('error', (err) => console.error('Job queue error:', err.message));

async function addJob(name, data) {
  try {
    await queue.add(name, data);
  } catch (err) {
    console.error(`Could not enqueue ${name}:`, err.message);
  }
}

function enqueueConfirmation(appointment) {
  return addJob(JOBS.SEND_CONFIRMATION, {
    appointmentId: appointment.id,
    patientId: appointment.patient_id,
    doctorId: appointment.doctor_id,
    appointmentDatetime: appointment.appt_datetime,
  });
}

function enqueueWaitlistPromotion(appointment) {
  return addJob(JOBS.PROMOTE_WAITLIST, {
    doctorId: appointment.doctor_id,
    slot: appointment.appt_datetime,
  });
}

module.exports = { enqueueConfirmation, enqueueWaitlistPromotion };