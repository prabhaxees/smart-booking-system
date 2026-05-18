import Booking from "../models/booking.js";
import Resource from "../models/resource.js";

const getMaxActiveBookings = () =>
  Number.parseInt(process.env.MAX_ACTIVE_BOOKINGS_PER_USER || "0", 10);

const ensureTimeWindowValid = (resourceDoc, startTime, endTime) => {
  if (startTime >= endTime) {
    const error = new Error("End time must be later than start time");
    error.statusCode = 400;
    throw error;
  }

  if (
    startTime < resourceDoc.openingTime ||
    endTime > resourceDoc.closingTime
  ) {
    const error = new Error(
      `Booking must be within resource hours (${resourceDoc.openingTime} - ${resourceDoc.closingTime})`
    );
    error.statusCode = 400;
    throw error;
  }
};

export const assertBookingAllowed = async ({
  userId,
  resourceId,
  date,
  startTime,
  endTime,
}) => {
  const resourceDoc = await Resource.findById(resourceId);
  if (!resourceDoc) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }

  if (resourceDoc.status === "maintenance") {
    const error = new Error("Resource is under maintenance");
    error.statusCode = 400;
    throw error;
  }

  ensureTimeWindowValid(resourceDoc, startTime, endTime);

  const maxActiveBookings = getMaxActiveBookings();
  if (maxActiveBookings > 0) {
    const activeCount = await Booking.countDocuments({
      user: userId,
      status: "active",
    });

    if (activeCount >= maxActiveBookings) {
      const error = new Error(
        `Active booking limit reached (${maxActiveBookings}). Cancel a booking to create a new one.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const conflict = await Booking.findOne({
    resource: resourceId,
    date,
    status: "active",
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflict) {
    const error = new Error("Time slot already booked");
    error.statusCode = 400;
    throw error;
  }

  return resourceDoc;
};

export const createBookingForUser = async ({
  userId,
  resourceId,
  date,
  startTime,
  endTime,
}) => {
  const resourceDoc = await assertBookingAllowed({
    userId,
    resourceId,
    date,
    startTime,
    endTime,
  });

  const booking = await Booking.create({
    user: userId,
    resource: resourceId,
    date,
    startTime,
    endTime,
  });

  return { booking, resourceDoc };
};

export const hasBookingConflict = async ({
  resourceId,
  date,
  startTime,
  endTime,
}) => {
  const conflict = await Booking.findOne({
    resource: resourceId,
    date,
    status: "active",
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  return Boolean(conflict);
};
