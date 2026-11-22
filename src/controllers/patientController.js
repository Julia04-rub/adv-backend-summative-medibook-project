const patientModel = require('../models/patientModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isPositiveInt, validatePatient } = require('../utils/validators');

async function loadPatient(idParam) {
  if (!isPositiveInt(idParam)) throw new AppError('id must be a positive integer', 400);
  const patient = await patientModel.findById(idParam);
  if (!patient) throw new AppError('Patient not found', 404);
  return patient;
}

function assertValid(body) {
  const errors = validatePatient(body);
  if (errors.length) throw new AppError(errors.join('; '), 400);
}

exports.list = asyncHandler(async (req, res) => {
  res.json(await patientModel.findAll());
});

exports.getOne = asyncHandler(async (req, res) => {
  res.json(await loadPatient(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  assertValid(req.body);
  const id = await patientModel.create(req.body);
  res.status(201).json(await patientModel.findById(id));
});

exports.update = asyncHandler(async (req, res) => {
  await loadPatient(req.params.id);
  assertValid(req.body);
  await patientModel.update(req.params.id, req.body);
  res.json(await patientModel.findById(req.params.id));
});

exports.remove = asyncHandler(async (req, res) => {
  await loadPatient(req.params.id);
  await patientModel.remove(req.params.id);
  res.status(204).send();
});