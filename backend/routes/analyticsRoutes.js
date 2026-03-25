import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 👑 Admin only
router.get("/", protect, adminOnly, getAnalytics);

export default router;