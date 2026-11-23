const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const appointmentModel = require('../models/appointmentModel');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../utils/transaction');
const { toSqlDateTime, getDayRange } = require('../utils/dateTime');
const { MAX_APPOINTMENTS_PER_DAY } = require('../constants');

async function bookAppointment({ patientId, doctorId, date }) {
  const patient = await patientModel.findById(patientId);
  if (!patient) throw new AppError('Patient not found', 404);

  const appointmentId = await withTransaction(async (connection) => {
    // Locking the doctor row serialises bookings per doctor, so the count below is always current
    const doctor = await doctorModel.findByIdForUpdate(doctorId, connection);
    if (!doctor) throw new AppError('Doctor is fully booked for this day. Join the waitlist with POST /api/waitlist', 409, 'DAY_FULL');

    const { start, end } = getDayRange(date);
    const booked = await appointmentModel.countActiveForDay(doctorId, start, end, connection);
    if (booked >= MAX_APPOINTMENTS_PER_DAY) {
      throw new AppError('This time slot is already booked. Join the waitlist with POST /api/waitlist', 409, 'SLOT_TAKEN');
    }

    const isBooked = await appointmentModel.isSlotBooked(doctorId, toSqlDateTime(date), connection);
    if (isBooked) {
      throw new AppError('This time slot is already booked. Join the waitlist with POST /api/waitlist', 409, 'SLOT_TAKEN');
    }

    try {
      return await appointmentModel.create(
        { patientId, doctorId, apptDatetime: toSqlDateTime(date), amountPaid: doctor.consultation_fee },
        connection
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') throw new AppError('This time slot is already booked. Join the waitlist with POST /api/waitlist', 409, 'SLOT_TAKEN');
      throw err;
    }
  });

  return appointmentModel.findById(appointmentId);
}

module.exports = { bookAppointment };