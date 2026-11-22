function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with this unique value already exists' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Cannot delete: record is referenced by appointments' });
  }
 if (err.statusCode) {
  return res.status(err.statusCode).json({ error: err.message, ...(err.code && { code: err.code }) });
}
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };