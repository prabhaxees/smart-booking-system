import express from "express";
import {
  createResource,
  getResources,
  updateResource,
  deleteResource,
} from "../controllers/resourceController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Only admin can create
router.post("/", protect, adminOnly, createResource);
router.put("/:id", protect, adminOnly, updateResource);
router.delete("/:id", protect, adminOnly, deleteResource);

// 👀 All users can view
router.get("/", protect, getResources);

export default router;
