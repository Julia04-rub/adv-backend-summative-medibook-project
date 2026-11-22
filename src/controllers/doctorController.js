const doctorModel = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isPositiveInt, validateDoctor } = require('../utils/validators');

async function loadDoctor(idParam) {
  if (!isPositiveInt(idParam)) throw new AppError('id must be a positive integer', 400);
  const doctor = await doctorModel.findById(idParam);
  if (!doctor) throw new AppError('Doctor not found', 404);
  return doctor;
}

function assertValid(body) {
  const errors = validateDoctor(body);
  if (errors.length) throw new AppError(errors.join('; '), 400);
}

exports.list = asyncHandler(async (req, res) => {
  res.json(await doctorModel.findAll());
});

exports.getOne = asyncHandler(async (req, res) => {
  res.json(await loadDoctor(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  assertValid(req.body);
  const id = await doctorModel.create(req.body);
  res.status(201).json(await doctorModel.findById(id));
});

exports.update = asyncHandler(async (req, res) => {
  await loadDoctor(req.params.id);
  assertValid(req.body);
  await doctorModel.update(req.params.id, req.body);
  res.json(await doctorModel.findById(req.params.id));
});

exports.remove = asyncHandler(async (req, res) => {
  await loadDoctor(req.params.id);
  await doctorModel.remove(req.params.id);
  res.status(204).send();
});