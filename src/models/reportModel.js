const pool = require('../config/db');

async function getDoctorsReport() {
  const [rows] = await pool.query(
    `SELECT d.id AS doctor_id, d.name, d.specialty,
            COUNT(CASE WHEN a.status = 'booked' THEN 1 END) AS booked_appointments,
            COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_appointments,
            COALESCE(SUM(CASE WHEN a.status = 'booked' THEN a.amount_paid
                              WHEN a.status = 'cancelled' THEN a.amount_paid - COALESCE(a.refund_amount, 0)
                         END), 0) AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id, d.name, d.specialty
     ORDER BY d.id`
  );
  return rows;
}

async function getBusyDays({ cap, threshold }) {
  const [rows] = await pool.query(
    `SELECT d.id AS doctor_id, d.name AS doctor_name, DATE(a.appt_datetime) AS day,
            COUNT(*) AS booked_appointments,
            ROUND(COUNT(*) * 100 / ?, 1) AS utilization_percent
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status = 'booked'
     GROUP BY d.id, d.name, DATE(a.appt_datetime)
     HAVING COUNT(*) > ? * ?
     ORDER BY day, d.id`,
    [cap, cap, threshold]
  );
  return rows;
}

module.exports = { getDoctorsReport, getBusyDays };