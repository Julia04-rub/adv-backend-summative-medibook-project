const { REFUND } = require('../constants');

const MS_PER_HOUR = 60 * 60 * 1000;

function calculateRefund(appointmentDate, amountPaid, now = new Date()) {
  const hoursNotice = (appointmentDate - now) / MS_PER_HOUR;

  let percent = 0;
  if (hoursNotice > REFUND.FULL_NOTICE_HOURS) percent = REFUND.FULL_PERCENT;
  else if (hoursNotice >= REFUND.PARTIAL_NOTICE_HOURS) percent = REFUND.PARTIAL_PERCENT;

  const amount = Math.round(Number(amountPaid) * percent) / 100;
  return { percent, amount };
}

module.exports = { calculateRefund };