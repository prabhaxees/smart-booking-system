import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";


// ✅ LOAD ENV FIRST
dotenv.config();

const app = express();

// ✅ THEN connect DB
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API Running");
});


app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});