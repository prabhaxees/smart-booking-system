import express from "express";
import {
  createBooking,
  getMyBookings,
  getActiveBookings,
  cancelBooking,
  cancelBookingAsAdmin,
  cancelSeries,
  updateSeries,
} from "../controllers/bookingController.js";
import { createRecurringBooking } from "../controllers/bookingController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/active", protect, adminOnly, getActiveBookings);
router.put("/:id/cancel", protect, cancelBooking);
router.put("/admin/:id/cancel", protect, adminOnly, cancelBookingAsAdmin);
router.put("/series/:seriesId/cancel", protect, cancelSeries);
router.put("/series/:seriesId", protect, updateSeries);
router.post("/recurring", protect, createRecurringBooking);

export default router;
