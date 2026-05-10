import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Authenticated users
router.get("/", protect, getAnalytics);

export default router;
