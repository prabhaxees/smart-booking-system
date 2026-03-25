import express from "express";
import {
  createResource,
  getResources,
} from "../controllers/resourceController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Only admin can create
router.post("/", protect, adminOnly, createResource);

// 👀 All users can view
router.get("/", protect, getResources);

export default router;