import { Router } from "express";
import { body } from "express-validator";
import { createEnquiry } from "../controllers/enquiryController.js";
import { validateRequest } from "../middleware/validate.js";
import { submitLimiter } from "../middleware/rateLimit.js";

const router = Router();

// POST /api/enquiries — public
router.post(
  "/",
  submitLimiter,
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Please enter your full name."),
    body("email")
      .isString()
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .isLength({ max: 200 }),
    body("phone")
      .optional({ values: "falsy" })
      .isString()
      .trim()
      .isLength({ max: 40 })
      .withMessage("Phone number is too long."),
    body("division")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Please choose a division."),
    body("divisionTitle").optional().isString().trim(),
    body("message")
      .isString()
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Please describe your requirements (at least 10 characters)."),
  ],
  validateRequest,
  createEnquiry,
);

export default router;