import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    date: {
      type: String, // "2026-03-25"
      required: true,
    },
    startTime: {
      type: String, // "10:00"
      required: true,
    },
    endTime: {
      type: String, // "11:00"
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    seriesId: {
      type: String,
    },
    
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);