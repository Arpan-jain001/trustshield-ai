export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Server error",
    details: err.details || null
  });
}
