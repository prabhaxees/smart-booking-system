import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import API from "../services/api";

function Booking() {
  const [date, setDate] = useState(new Date());
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // 📦 Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      const res = await API.get("/resources", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setResources(res.data);
    };

    fetchResources();
  }, []);

  // 📅 Handle booking
  const handleBooking = async () => {
    try {
      await API.post(
        "/bookings",
        {
          resource: selectedResource,
          date: date.toISOString().split("T")[0],
          startTime,
          endTime,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Booking successful 🎉");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div>
      <h2>Book a Resource</h2>

      {/* 📅 Calendar */}
      <Calendar onChange={setDate} value={date} />

      {/* 🏢 Resource Dropdown */}
      <select onChange={(e) => setSelectedResource(e.target.value)}>
        <option>Select Resource</option>
        {resources.map((r) => (
          <option key={r._id} value={r._id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* ⏰ Time Inputs */}
      <div>
        <input
          type="time"
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>

      {/* ➕ Book Button */}
      <button onClick={handleBooking}>Book</button>
    </div>
  );
}

export default Booking;