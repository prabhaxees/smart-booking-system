import { v4 as uuidv4 } from "uuid";
import Booking from "../models/booking.js";
import Resource from "../models/resource.js";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
  sendRecurringBookingConfirmedEmail,
} from "../services/emailService.js";

// ➕ Create Booking
export const createBooking = async (req, res) => {
  try {
    const { resource, date, startTime, endTime } = req.body;
    const maxActiveBookings = Number.parseInt(
      process.env.MAX_ACTIVE_BOOKINGS_PER_USER || "0",
      10
    );

    const resourceDoc = await Resource.findById(resource);
    if (!resourceDoc) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resourceDoc.status === "maintenance") {
      return res.status(400).json({ message: "Resource is under maintenance" });
    }

    if (maxActiveBookings > 0) {
      const activeCount = await Booking.countDocuments({
        user: req.user._id,
        status: "active",
      });

      if (activeCount >= maxActiveBookings) {
        return res.status(400).json({
          message: `Active booking limit reached (${maxActiveBookings}). Cancel a booking to create a new one.`,
        });
      }
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

    try {
      await sendBookingConfirmedEmail({
        to: req.user.email,
        userName: req.user.name,
        resourceName: resourceDoc.name,
        date,
        startTime,
        endTime,
        bookingId: booking._id,
      });
    } catch (emailError) {
      console.error("SendGrid booking confirmation failed:", emailError?.message || emailError);
    }

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
    const booking = await Booking.findById(req.params.id).populate("resource");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // only owner can cancel
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.status = "cancelled";
    await booking.save();

    try {
      await sendBookingCancelledEmail({
        to: req.user.email,
        userName: req.user.name,
        resourceName: booking.resource?.name || "Resource",
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking._id,
      });
    } catch (emailError) {
      console.error("SendGrid cancellation failed:", emailError?.message || emailError);
    }

    res.json({ message: "Booking cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;

    const bookingsToCancel = await Booking.find({
      user: req.user._id,
      seriesId,
      status: "active",
    }).populate("resource");

    const result = await Booking.updateMany(
      { user: req.user._id, seriesId },
      { $set: { status: "cancelled" } }
    );

    const emailPromises = bookingsToCancel.map((booking) =>
      sendBookingCancelledEmail({
        to: req.user.email,
        userName: req.user.name,
        resourceName: booking.resource?.name || "Resource",
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking._id,
      })
    );

    const emailResults = await Promise.allSettled(emailPromises);
    emailResults.forEach((r) => {
      if (r.status === "rejected") {
        console.error("SendGrid series cancellation failed:", r.reason?.message || r.reason);
      }
    });

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
    const maxActiveBookings = Number.parseInt(
      process.env.MAX_ACTIVE_BOOKINGS_PER_USER || "0",
      10
    );

    const resourceDoc = await Resource.findById(resource);
    if (!resourceDoc) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resourceDoc.status === "maintenance") {
      return res.status(400).json({ message: "Resource is under maintenance" });
    }

    let activeCount = 0;
    if (maxActiveBookings > 0) {
      activeCount = await Booking.countDocuments({
        user: req.user._id,
        status: "active",
      });

      if (activeCount >= maxActiveBookings) {
        return res.status(400).json({
          message: `Active booking limit reached (${maxActiveBookings}). Cancel a booking to create a new one.`,
        });
      }
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

    if (maxActiveBookings > 0 && activeCount + bookings.length > maxActiveBookings) {
      return res.status(400).json({
        message: `Recurring booking would exceed active booking limit (${maxActiveBookings}).`,
      });
    }

    const created = await Booking.insertMany(bookings);

    try {
      await sendRecurringBookingConfirmedEmail({
        to: req.user.email,
        userName: req.user.name,
        resourceName: resourceDoc.name,
        startDate,
        endDate,
        startTime,
        endTime,
        count: created.length,
        seriesId,
      });
    } catch (emailError) {
      console.error(
        "SendGrid recurring booking confirmation failed:",
        emailError?.message || emailError
      );
    }

    res.status(201).json({
      message: "Recurring bookings created",
      count: created.length,
      seriesId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
