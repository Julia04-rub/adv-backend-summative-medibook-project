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
module.exports = { findAll, findById, create, update, remove, findByIdForUpdate };