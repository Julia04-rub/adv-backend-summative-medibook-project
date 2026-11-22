const pool = require('../config/db');

const COLUMNS = `id, patient_id, doctor_id, appt_datetime, amount_paid, booked_on,
  status, cancelled_at, refund_percent, refund_amount`;

async function findById(id, db = pool) {
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM appointments WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function countActiveForDay(doctorId, dayStart, dayEnd, db = pool) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE doctor_id = ? AND status = 'booked' AND appt_datetime >= ? AND appt_datetime < ?`,
    [doctorId, dayStart, dayEnd]
  );
  return rows[0].total;
}

async function create({ patientId, doctorId, apptDatetime, amountPaid }, db = pool) {
  const [result] = await db.query(
    'INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES (?, ?, ?, ?)',
    [patientId, doctorId, apptDatetime, amountPaid]
  );
  return result.insertId;
}

module.exports = { findById, countActiveForDay, create };