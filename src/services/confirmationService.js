const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const { logAudit } = require('../utils/auditLogger');

async function sendConfirmation({ appointmentId, patientId, doctorId, appointmentDatetime }) {
  const [patient, doctor] = await Promise.all([
    patientModel.findById(patientId),
    doctorModel.findById(doctorId),
  ]);
  if (!patient || !doctor) {
    throw new Error(`Cannot confirm appointment ${appointmentId}: patient or doctor not found`);
  }

  await logAudit('confirmation.sent', {
    appointmentId,
    to: patient.email,
    message: `Hello ${patient.name}, your appointment with ${doctor.name} is confirmed for ${appointmentDatetime} (room ${doctor.room}).`,
  });
}

module.exports = { sendConfirmation };