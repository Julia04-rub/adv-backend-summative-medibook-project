const appointmentModel = require('../models/appointmentModel');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../utils/transaction');
const { parseDateTime, toSqlDateTime } = require('../utils/dateTime');
const { calculateRefund } = require('./refundService');

async function cancelAppointment(id, now = new Date()) {
  await withTransaction(async (connection) => {
    const appointment = await appointmentModel.findByIdForUpdate(id, connection);
    if (!appointment) throw new AppError('Appointment not found', 404);
    if (appointment.status === 'cancelled') {
      throw new AppError('Appointment is already cancelled', 409, 'ALREADY_CANCELLED');
    }

    const appointmentDate = parseDateTime(appointment.appt_datetime);
    if (appointmentDate <= now) throw new AppError('Past appointments cannot be cancelled', 422);

    const { percent, amount } = calculateRefund(appointmentDate, appointment.amount_paid, now);
    await appointmentModel.markCancelled(
      id,
      { cancelledAt: toSqlDateTime(now), refundPercent: percent, refundAmount: amount },
      connection
    );
  });

  return appointmentModel.findById(id);
}

module.exports = { cancelAppointment };