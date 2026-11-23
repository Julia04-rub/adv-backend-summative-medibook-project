const appointmentModel = require('../models/appointmentModel');
const bookingService = require('../services/bookingService');
const cancellationService = require('../services/cancellationService');
const { enqueueConfirmation, enqueueWaitlistPromotion } = require('../services/jobQueue');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../utils/auditLogger');
const { parseBookingRequest } = require('../utils/bookingRequest');
const { isPositiveInt } = require('../utils/validators');

exports.book = asyncHandler(async (req, res) => {
  const { patientId, doctorId, date } = parseBookingRequest(req.body);
  const appointment = await bookingService.bookAppointment({ patientId, doctorId, date });

  await logAudit('appointment.booked', {
    appointmentId: appointment.id,
    patientId: appointment.patient_id,
    doctorId: appointment.doctor_id,
    appointmentDatetime: appointment.appt_datetime,
    amountPaid: appointment.amount_paid,
  });
  await enqueueConfirmation(appointment);

  res.status(201).json(appointment);
});

exports.getOne = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) throw new AppError('id must be a positive integer', 400);
  const appointment = await appointmentModel.findById(req.params.id);
  if (!appointment) throw new AppError('Appointment not found', 404);
  res.json(appointment);
});

exports.cancel = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) throw new AppError('id must be a positive integer', 400);

  const appointment = await cancellationService.cancelAppointment(req.params.id);

  await logAudit('appointment.cancelled', {
    appointmentId: appointment.id,
    patientId: appointment.patient_id,
    doctorId: appointment.doctor_id,
    appointmentDatetime: appointment.appt_datetime,
    refundPercent: appointment.refund_percent,
    refundAmount: appointment.refund_amount,
  });
  await enqueueWaitlistPromotion(appointment);

  res.json({
    appointment,
    refund: { percent: appointment.refund_percent, amount: appointment.refund_amount },
  });
});