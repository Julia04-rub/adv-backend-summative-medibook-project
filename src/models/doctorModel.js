const pool = require('../config/db');

const COLUMNS = 'id, name, specialty, consultation_fee, room';

async function findAll() {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM doctors ORDER BY id`);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM doctors WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ name, specialty, consultation_fee, room }) {
  const [result] = await pool.query(
    'INSERT INTO doctors (name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [name, specialty, consultation_fee, room]
  );
  return result.insertId;
}

async function update(id, { name, specialty, consultation_fee, room }) {
  await pool.query(
    'UPDATE doctors SET name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?',
    [name, specialty, consultation_fee, room, id]
  );
}

async function remove(id) {
  await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
}
async function findByIdForUpdate(id, db = pool) {
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM doctors WHERE id = ? FOR UPDATE`, [id]);
  return rows[0] || null;
}

async function getSummary(id, { now, cap, days }) {
  const [rows] = await pool.query(
    `SELECT t.revenue_collected, t.upcoming_appointments, t.booked_in_window,
            ROUND(t.booked_in_window * 100 / (? * ?), 1) AS utilization_percent
     FROM (
       SELECT
         COALESCE(SUM(CASE WHEN status = 'booked' THEN amount_paid
                           ELSE amount_paid - COALESCE(refund_amount, 0) END), 0) AS revenue_collected,
         COUNT(CASE WHEN status = 'booked' AND appt_datetime > ? THEN 1 END) AS upcoming_appointments,
         COUNT(CASE WHEN status = 'booked' AND appt_datetime >= DATE(?)
                     AND appt_datetime < DATE(?) + INTERVAL ? DAY THEN 1 END) AS booked_in_window
       FROM appointments
       WHERE doctor_id = ?
     ) t`,
    [cap, days, now, now, now, days, id]
  );
  return rows[0];
}

async function getDailyLoad(id, { now, cap, days }) {
  const [rows] = await pool.query(
    `WITH RECURSIVE window_days AS (
       SELECT DATE(?) AS day
       UNION ALL
       SELECT day + INTERVAL 1 DAY FROM window_days WHERE day < DATE(?) + INTERVAL ? DAY
     )
     SELECT w.day, COUNT(a.id) AS appointments,
            ROUND(COUNT(a.id) * 100 / ?, 1) AS utilization_percent
     FROM window_days w
     LEFT JOIN appointments a
       ON a.doctor_id = ? AND a.status = 'booked'
      AND a.appt_datetime >= w.day AND a.appt_datetime < w.day + INTERVAL 1 DAY
     GROUP BY w.day
     ORDER BY w.day`,
    [now, now, days - 1, cap, id]
  );
  return rows;
}
module.exports = { findAll, findById, create, update, remove, findByIdForUpdate, getSummary, getDailyLoad };