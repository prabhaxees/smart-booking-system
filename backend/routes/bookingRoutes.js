import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/bookingController.js";
import { createRecurringBooking } from "../controllers/bookingController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.put("/:id/cancel", protect, cancelBooking);
router.post("/recurring", protect, createRecurringBooking);

export default router;