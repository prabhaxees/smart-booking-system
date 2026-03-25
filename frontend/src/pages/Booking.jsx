import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import API from "../services/api";
import SidebarLayout from "../components/SidebarLayout";
import "./Booking.css";

function Booking() {
  const [date, setDate] = useState(new Date());
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Fetch resources
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

  // Handle booking
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

      alert("Booking successful");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <SidebarLayout title="Book Resource">
      <div className="booking-page">
        <div className="booking-hero">
          <h2>Book a Resource</h2>
          <p>Select a date, resource, and time to lock in your booking.</p>
        </div>

        <div className="booking-grid">
          <div className="booking-card booking-calendar">
            <Calendar onChange={setDate} value={date} />
          </div>

          <div className="booking-card">
            <h3>Booking Details</h3>
            <div className="booking-form">
              <select onChange={(e) => setSelectedResource(e.target.value)}>
                <option>Select Resource</option>
                {resources.map((r) => (
                  <option key={r._id} value={r._id} disabled={r.status === "maintenance"}>
                    {r.name}{r.status === "maintenance" ? " (Maintenance)" : ""}
                  </option>
                ))}
              </select>

              <div className="booking-time-row">
                <input
                  type="time"
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <input
                  type="time"
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <button className="booking-action" onClick={handleBooking}>Book</button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default Booking;
