const AppError = require('./AppError');
const { parseDateTime } = require('./dateTime');
const { validateBookingInput, getSlotViolations } = require('./validators');

function parseBookingRequest(body) {
  const errors = validateBookingInput(body);
  if (errors.length) throw new AppError(errors.join('; '), 400);

  const date = parseDateTime(body.appt_datetime);
  if (!date) throw new AppError('appt_datetime must be a valid date like "2026-12-15 09:30"', 400);

  const violations = getSlotViolations(date);
  if (violations.length) throw new AppError(violations.join('; '), 422);

  return { patientId: body.patient_id, doctorId: body.doctor_id, date };
}

module.exports = { parseBookingRequest };