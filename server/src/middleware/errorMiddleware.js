export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Server error",
    code: err.code || null,
    details: err.details || null,
    lockUntil: err.lockUntil || null,
    remainingMinutes: err.remainingMinutes || null
  });
}
