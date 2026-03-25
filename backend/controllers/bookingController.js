import { v4 as uuidv4 } from "uuid";
import Booking from "../models/booking.js";
import Resource from "../models/resource.js";

// ➕ Create Booking
export const createBooking = async (req, res) => {
  try {
    const { resource, date, startTime, endTime } = req.body;

    const resourceDoc = await Resource.findById(resource);
    if (!resourceDoc) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resourceDoc.status === "maintenance") {
      return res.status(400).json({ message: "Resource is under maintenance" });
    }

    // ⚠️ Conflict Detection
    const conflict = await Booking.findOne({
      resource,
      date,
      status: "active",
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({ message: "Time slot already booked" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      resource,
      date,
      startTime,
      endTime,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("resource");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // only owner can cancel
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;

    const result = await Booking.updateMany(
      { user: req.user._id, seriesId },
      { $set: { status: "cancelled" } }
    );

    res.json({
      message: "Series cancelled",
      modified: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Start and end time required" });
    }

    const result = await Booking.updateMany(
      { user: req.user._id, seriesId },
      { $set: { startTime, endTime } }
    );

    res.json({
      message: "Series updated",
      modified: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRecurringBooking = async (req, res) => {
  try {
    const { resource, startDate, endDate, days, startTime, endTime } = req.body;

    const resourceDoc = await Resource.findById(resource);
    if (!resourceDoc) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resourceDoc.status === "maintenance") {
      return res.status(400).json({ message: "Resource is under maintenance" });
    }

    const seriesId = uuidv4();
    const bookings = [];

    let currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
      const day = currentDate.getDay(); // 0=Sun, 1=Mon...

      if (days.includes(day)) {
        const dateStr = currentDate.toISOString().split("T")[0];

        // conflict check
        const conflict = await Booking.findOne({
          resource,
          date: dateStr,
          status: "active",
          $or: [
            {
              startTime: { $lt: endTime },
              endTime: { $gt: startTime },
            },
          ],
        });

        if (!conflict) {
          bookings.push({
            user: req.user._id,
            resource,
            date: dateStr,
            startTime,
            endTime,
            recurring: true,
            seriesId,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const created = await Booking.insertMany(bookings);

    res.status(201).json({
      message: "Recurring bookings created",
      count: created.length,
      seriesId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
