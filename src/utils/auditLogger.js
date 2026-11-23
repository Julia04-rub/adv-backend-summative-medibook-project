const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

async function logAudit(event, data = {}) {
  try {
    const line = JSON.stringify({ timestamp: new Date().toISOString(), event, ...data });
    await fs.mkdir(path.dirname(config.auditLogPath), { recursive: true });
    await fs.appendFile(config.auditLogPath, `${line}\n`, 'utf8');
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { logAudit };