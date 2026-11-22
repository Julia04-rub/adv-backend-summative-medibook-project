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