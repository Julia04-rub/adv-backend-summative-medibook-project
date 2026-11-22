const express = require('express');
const patientRoutes = require('./routes/patientRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use('/api/patients', patientRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;