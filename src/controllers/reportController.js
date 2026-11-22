const reportModel = require('../models/reportModel');
const asyncHandler = require('../utils/asyncHandler');
const { MAX_APPOINTMENTS_PER_DAY, BUSY_DAY_THRESHOLD } = require('../constants');

exports.doctorsReport = asyncHandler(async (req, res) => {
  res.json(await reportModel.getDoctorsReport());
});

exports.busyDays = asyncHandler(async (req, res) => {
  const rows = await reportModel.getBusyDays({
    cap: MAX_APPOINTMENTS_PER_DAY,
    threshold: BUSY_DAY_THRESHOLD,
  });
  res.json(rows);
});