import express from "express";
import {
  createBooking,
  getMyBookings,
  getActiveBookings,
  getAllBookings,
  cancelBooking,
  cancelBookingAsAdmin,
  deleteBooking,
  deleteBookingAsAdmin,
  deleteSeries,
  cancelSeries,
  updateSeries,
} from "../controllers/bookingController.js";
import { createRecurringBooking } from "../controllers/bookingController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/active", protect, adminOnly, getActiveBookings);
router.get("/admin/all", protect, adminOnly, getAllBookings);
router.delete("/admin/:id", protect, adminOnly, deleteBookingAsAdmin);
router.delete("/series/:seriesId", protect, deleteSeries);
router.delete("/:id", protect, deleteBooking);
router.put("/:id/cancel", protect, cancelBooking);
router.put("/admin/:id/cancel", protect, adminOnly, cancelBookingAsAdmin);
router.put("/series/:seriesId/cancel", protect, cancelSeries);
router.put("/series/:seriesId", protect, updateSeries);
router.post("/recurring", protect, createRecurringBooking);

export default router;
