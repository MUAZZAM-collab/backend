import { validationResult } from "express-validator";

/**
 * Runs after express-validator chains. If any error exists, sends 400
 * with a field → message map.
 */
export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const err of result.array()) {
    if (!errors[err.path]) errors[err.path] = err.msg;
  }
  return res.status(400).json({ ok: false, errors });
}