const mysql = require('mysql2/promise');
const config = require('./index');

module.exports = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});