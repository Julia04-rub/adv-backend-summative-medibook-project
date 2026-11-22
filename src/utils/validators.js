const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]{7,20}$/;

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