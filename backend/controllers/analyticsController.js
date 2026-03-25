import Booking from "../models/booking.js";

// 📊 Get Demand Analytics
export const getAnalytics = async (req, res) => {
  try {
    // 🔝 Most booked resources
    const topResources = await Booking.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$resource",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "_id",
          as: "resource",
        },
      },
      {
        $unwind: {
          path: "$resource",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          resourceId: "$_id",
          name: "$resource.name",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // ⏰ Peak hours
    const peakHours = await Booking.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$startTime",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 📅 Daily trends
    const dailyTrends = await Booking.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$date",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      topResources,
      peakHours,
      dailyTrends,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
