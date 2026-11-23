const waitlistService = require('../services/waitlistService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseBookingRequest } = require('../utils/bookingRequest');
const { isPositiveInt } = require('../utils/validators');

exports.join = asyncHandler(async (req, res) => {
  const request = parseBookingRequest(req.body);
  const entry = await waitlistService.joinWaitlist(request);
  res.status(201).json(entry);
});

exports.list = asyncHandler(async (req, res) => {
  const { doctor_id: doctorId, date } = req.query;
  if (!isPositiveInt(doctorId)) throw new AppError('doctor_id must be a positive integer', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new AppError('date must be formatted YYYY-MM-DD', 400);
  res.json(await waitlistService.getWaitlist(doctorId, date));
});