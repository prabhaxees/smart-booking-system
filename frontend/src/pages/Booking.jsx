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
  const [isRecurring, setIsRecurring] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [recurringDays, setRecurringDays] = useState([]);

  const weekdayOptions = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  const startDateStr = date.toISOString().split("T")[0];

  useEffect(() => {
    if (!isRecurring) {
      return;
    }
    if (!endDate || endDate < startDateStr) {
      setEndDate(startDateStr);
    }
  }, [date, isRecurring, endDate, startDateStr]);

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
      if (!selectedResource) {
        alert("Please select a resource");
        return;
      }
      if (!startTime || !endTime) {
        alert("Please select a start and end time");
        return;
      }

      if (isRecurring) {
        if (!endDate) {
          alert("Please select an end date");
          return;
        }
        if (endDate < startDateStr) {
          alert("End date must be on or after the start date");
          return;
        }
        if (recurringDays.length === 0) {
          alert("Please select at least one day of the week");
          return;
        }

        await API.post(
          "/bookings/recurring",
          {
            resource: selectedResource,
            startDate: startDateStr,
            endDate,
            days: recurringDays,
            startTime,
            endTime,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        alert("Recurring bookings created");
        return;
      }

      await API.post(
        "/bookings",
        {
          resource: selectedResource,
          date: startDateStr,
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

  const toggleDay = (value) => {
    setRecurringDays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value);
      }
      return [...prev, value].sort((a, b) => a - b);
    });
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

              <label className="booking-toggle">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                Recurring booking
              </label>

              {isRecurring && (
                <div className="booking-recurring">
                  <div className="booking-recurring-row">
                    <label className="booking-label">Start date</label>
                    <div className="booking-recurring-value">{startDateStr}</div>
                  </div>

                  <div className="booking-recurring-row">
                    <label className="booking-label" htmlFor="recurring-end-date">
                      End date
                    </label>
                    <input
                      id="recurring-end-date"
                      type="date"
                      value={endDate}
                      min={startDateStr}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <div className="booking-recurring-row">
                    <label className="booking-label">Days</label>
                    <div className="booking-weekdays">
                      {weekdayOptions.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          className={`booking-weekday${
                            recurringDays.includes(day.value) ? " active" : ""
                          }`}
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button className="booking-action" onClick={handleBooking}>
                {isRecurring ? "Book Recurring" : "Book"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default Booking;
