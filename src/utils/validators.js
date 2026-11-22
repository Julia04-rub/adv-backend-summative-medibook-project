const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]{7,20}$/;
const { SLOT_MINUTES, WORK_START_HOUR, WORK_END_HOUR } = require('../constants');
const { pad } = require('./dateTime');


function isPositiveInt(value) {
  return /^[1-9]\d*$/.test(String(value));
}

function validatePatient(body = {}) {
  const errors = [];
  if (typeof body.name !== 'string' || body.name.trim() === '') errors.push('name is required');
  else if (body.name.length > 100) errors.push('name must be at most 100 characters');
  if (typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email)) errors.push('a valid email is required');
  if (typeof body.phone !== 'string' || !PHONE_REGEX.test(body.phone)) errors.push('a valid phone is required');
  return errors;
}

module.exports = { isPositiveInt, validatePatient };

function validateDoctor(body = {}) {
  const errors = [];
  if (typeof body.name !== 'string' || body.name.trim() === '') errors.push('name is required');
  else if (body.name.length > 100) errors.push('name must be at most 100 characters');
  if (typeof body.specialty !== 'string' || body.specialty.trim() === '') errors.push('specialty is required');
  else if (body.specialty.length > 100) errors.push('specialty must be at most 100 characters');
  if (typeof body.consultation_fee !== 'number' || !(body.consultation_fee >= 0)) {
    errors.push('consultation_fee must be a number >= 0');
  }
  if (typeof body.room !== 'string' || body.room.trim() === '') errors.push('room is required');
  else if (body.room.length > 10) errors.push('room must be at most 10 characters');
  return errors;
}

module.exports = { isPositiveInt, validatePatient, validateDoctor };
function validateBookingInput(body = {}) {
  const errors = [];
  if (!Number.isInteger(body.patient_id) || body.patient_id < 1) errors.push('patient_id must be a positive integer');
  if (!Number.isInteger(body.doctor_id) || body.doctor_id < 1) errors.push('doctor_id must be a positive integer');
  if (typeof body.appt_datetime !== 'string') errors.push('appt_datetime is required');
  return errors;
}

function getSlotViolations(date, now = new Date()) {
  const violations = [];
  if (date <= now) violations.push('appointment must be in the future');

  const startMinutes = date.getHours() * 60 + date.getMinutes();
  const opens = WORK_START_HOUR * 60;
  const closes = WORK_END_HOUR * 60;
  if (startMinutes < opens || startMinutes + SLOT_MINUTES > closes) {
    violations.push(`appointment must fit within working hours (${pad(WORK_START_HOUR)}:00-${pad(WORK_END_HOUR)}:00)`);
  }
  if (date.getMinutes() % SLOT_MINUTES !== 0 || date.getSeconds() !== 0) {
    violations.push(`appointment must start on a ${SLOT_MINUTES}-minute boundary`);
  }
  return violations;
}
module.exports = { isPositiveInt, validatePatient, validateDoctor, validateBookingInput, getSlotViolations };