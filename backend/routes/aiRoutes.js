import express from "express";
import {
  confirmAiBooking,
  getAiBookingSuggestion,
} from "../controllers/aiBookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/bookings/suggest", protect, getAiBookingSuggestion);
router.post("/bookings/confirm", protect, confirmAiBooking);

export default router;
