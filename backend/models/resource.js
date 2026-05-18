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
      set: (value) => String(value).trim().toLowerCase(),
    },
    capacity: {
      type: Number,
      required: true,
    },
    features: {
      type: [String],
      default: [],
      set: (values) =>
        Array.isArray(values)
          ? [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
          : [],
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
