export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  console.error("Unhandled error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
    return res.status(400).json({ ok: false, errors });
  }

  // Bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ error: "Invalid ID" });
  }

  // CORS
  if (typeof err.message === "string" && err.message.startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }

  // Body parser JSON error
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message,
  });
}