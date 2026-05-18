import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import API from "../services/api";
import SidebarLayout from "../components/SidebarLayout";
import "./Booking.css";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const formatLocalDate = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Booking() {
  const [date, setDate] = useState(new Date());
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [recurringDays, setRecurringDays] = useState([]);
  const [aiRequest, setAiRequest] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const weekdayOptions = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  const startDateStr = formatLocalDate(date);

  useEffect(() => {
    if (!isRecurring) {
      return;
    }
    if (!endDate || endDate < startDateStr) {
      setEndDate(startDateStr);
    }
  }, [date, isRecurring, endDate, startDateStr]);

  useEffect(() => {
    const fetchResources = async () => {
      const res = await API.get("/resources", getAuthConfig());
      setResources(res.data);
    };

    fetchResources();
  }, []);

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
          getAuthConfig()
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
        getAuthConfig()
      );

      alert("Booking successful");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const handleAiSearch = async () => {
    try {
      if (!aiRequest.trim()) {
        alert("Please describe the booking request");
        return;
      }

      setAiLoading(true);
      setPendingBooking(null);

      const res = await API.post(
        "/ai/bookings/suggest",
        {
          message: aiRequest,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        getAuthConfig()
      );

      setAiReply(res.data.reply || "");
      setPendingBooking(
        ["match_found", "closest_match_found"].includes(res.data.status)
          ? res.data.bestMatch
          : null
      );
    } catch (err) {
      setAiReply(err.response?.data?.message || "I could not process that request.");
      setPendingBooking(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiConfirmation = async (confirmed) => {
    if (!confirmed) {
      setAiReply("No problem. Update your request and I can search again.");
      setPendingBooking(null);
      return;
    }

    if (!pendingBooking) {
      return;
    }

    try {
      setAiLoading(true);
      await API.post(
        "/ai/bookings/confirm",
        {
          resourceId: pendingBooking.resourceId,
          date: pendingBooking.date,
          startTime: pendingBooking.startTime,
          endTime: pendingBooking.endTime,
        },
        getAuthConfig()
      );

      setAiReply(
        `Booked ${pendingBooking.name} on ${pendingBooking.date} from ${pendingBooking.startTime} to ${pendingBooking.endTime}.`
      );
      setPendingBooking(null);
    } catch (err) {
      setAiReply(err.response?.data?.message || "Booking confirmation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleDay = (value) => {
    setRecurringDays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((day) => day !== value);
      }
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  return (
    <SidebarLayout title="Book Resource">
      <div className="booking-page">
        <div className="booking-hero">
          <h2>Book a Resource</h2>
          <p>Select manually or describe your needs in natural language and let AI find the best match.</p>
        </div>

        <div className="booking-grid">
          <div className="booking-left-column">
            <div className="booking-card booking-ai-card">
              <div className="booking-card-header">
                <h3>AI Booking Assistant</h3>
                <p>Try: Book a lab for 40 students tomorrow at 2 PM with projector.</p>
              </div>

              <div className="booking-ai-form">
                <textarea
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  placeholder="Describe the booking you want..."
                  rows={4}
                />
                <button className="booking-action" onClick={handleAiSearch} disabled={aiLoading}>
                  {aiLoading ? "Checking..." : "Find Best Match"}
                </button>
              </div>

              {(aiReply || pendingBooking) && (
                <div className="booking-ai-response">
                  {aiReply && <p>{aiReply}</p>}

                  {pendingBooking && (
                    <div className="booking-ai-match">
                      <strong>{pendingBooking.name}</strong>
                      <span>{pendingBooking.type} - Capacity {pendingBooking.capacity}</span>
                      <span>
                        {pendingBooking.date} - {pendingBooking.startTime} - {pendingBooking.endTime}
                      </span>
                      {pendingBooking.features?.length > 0 && (
                        <span>Features: {pendingBooking.features.join(", ")}</span>
                      )}
                      {pendingBooking.missingFeatures?.length > 0 && (
                        <span>Missing requested features: {pendingBooking.missingFeatures.join(", ")}</span>
                      )}
                      <div className="booking-ai-actions">
                        <button
                          className="booking-action"
                          onClick={() => handleAiConfirmation(true)}
                          disabled={aiLoading}
                        >
                          Yes, confirm
                        </button>
                        <button
                          className="booking-secondary-action"
                          onClick={() => handleAiConfirmation(false)}
                          disabled={aiLoading}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="booking-card booking-calendar">
              <Calendar onChange={setDate} value={date} />
            </div>
          </div>

          <div className="booking-card">
            <h3>Manual Booking Details</h3>
            <div className="booking-form">
              <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
                <option value="">Select Resource</option>
                {resources.map((resource) => (
                  <option
                    key={resource._id}
                    value={resource._id}
                    disabled={resource.status === "maintenance"}
                  >
                    {resource.name}
                    {resource.status === "maintenance" ? " (Maintenance)" : ""}
                  </option>
                ))}
              </select>

              <div className="booking-time-row">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
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
                          className={`booking-weekday${recurringDays.includes(day.value) ? " active" : ""}`}
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
