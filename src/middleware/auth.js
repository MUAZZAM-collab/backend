const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 8) {
  console.warn(
    "⚠️  ADMIN_TOKEN is not set or too short. Admin routes will reject all requests.",
  );
}

/**
 * Requires an admin token via either:
 *   - Authorization: Bearer <token>
 *   - x-admin-token: <token>
 */
export function requireAdmin(req, res, next) {
  const headerToken = req.get("x-admin-token");
  const authHeader = req.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = headerToken || bearerToken;

  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: "Admin is not configured on the server." });
  }
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}