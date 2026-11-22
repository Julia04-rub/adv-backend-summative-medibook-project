const appointmentModel = require('../models/appointmentModel');
const bookingService = require('../services/bookingService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseDateTime } = require('../utils/dateTime');
const { isPositiveInt, validateBookingInput, getSlotViolations } = require('../utils/validators');

exports.book = asyncHandler(async (req, res) => {
  const errors = validateBookingInput(req.body);
  if (errors.length) throw new AppError(errors.join('; '), 400);

  const date = parseDateTime(req.body.appt_datetime);
  if (!date) throw new AppError('appt_datetime must be a valid date like "2026-12-15 09:30"', 400);

  const violations = getSlotViolations(date);
  if (violations.length) throw new AppError(violations.join('; '), 422);

  const appointment = await bookingService.bookAppointment({
    patientId: req.body.patient_id,
    doctorId: req.body.doctor_id,
    date,
  });
  res.status(201).json(appointment);
});

exports.getOne = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) throw new AppError('id must be a positive integer', 400);
  const appointment = await appointmentModel.findById(req.params.id);
  if (!appointment) throw new AppError('Appointment not found', 404);
  res.json(appointment);
});