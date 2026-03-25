import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String, // lab, room, hall
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    openingTime: {
      type: String, // "09:00"
      required: true,
    },
    closingTime: {
      type: String, // "18:00"
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "maintenance"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resource", resourceSchema);