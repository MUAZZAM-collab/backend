import { Router } from "express";
import { body } from "express-validator";
import {
  listEnquiries,
  getEnquiry,
  updateStatus,
  deleteEnquiry,
} from "../controllers/enquiryController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { adminLimiter } from "../middleware/rateLimit.js";

const router = Router();

// POST /api/admin/login — verify token, return ok
router.post(
  "/login",
  adminLimiter,
  [
    body("token")
      .isString()
      .notEmpty()
      .withMessage("Token is required."),
  ],
  validateRequest,
  (req, res) => {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      return res.status(503).json({ error: "Admin is not configured." });
    }
    if (req.body.token !== expected) {
      return res.status(401).json({ ok: false, error: "Incorrect token." });
    }
    res.json({ ok: true });
  },
);

// Everything below requires a valid admin token.
router.use(requireAdmin);

// GET /api/admin/enquiries?status=new&division=technology&q=ali&page=1&limit=50
router.get("/enquiries", listEnquiries);

// GET /api/admin/enquiries/:id
router.get("/enquiries/:id", getEnquiry);

// PATCH /api/admin/enquiries/:id  { status: "new" | "read" | "archived" }
router.patch(
  "/enquiries/:id",
  [
    body("status")
      .isIn(["new", "read", "archived"])
      .withMessage("Invalid status."),
  ],
  validateRequest,
  updateStatus,
);

// DELETE /api/admin/enquiries/:id
router.delete("/enquiries/:id", deleteEnquiry);

export default router;