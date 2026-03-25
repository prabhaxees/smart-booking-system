import Booking from "../models/booking.js";

// ➕ Create Booking
export const createBooking = async (req, res) => {
  try {
    const { resource, date, startTime, endTime } = req.body;

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