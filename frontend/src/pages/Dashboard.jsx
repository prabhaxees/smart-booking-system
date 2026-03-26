import "./Dashboard.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import SidebarLayout from "../components/SidebarLayout";

function Dashboard() {
  const [stats, setStats] = useState({
    active: 0,
    cancelled: 0,
    total: 0,
  });

  const [activeTab, setActiveTab] = useState("calendar");
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState(new Date());
  const [editingSeriesId, setEditingSeriesId] = useState(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await API.get("/bookings/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const list = res.data;

      const active = list.filter((b) => b.status === "active").length;
      const cancelled = list.filter((b) => b.status === "cancelled").length;

      setStats({
        active,
        cancelled,
        total: list.length,
      });

      setBookings(list);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDateKey = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const key = booking.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(booking);
    });
    return map;
  }, [bookings]);

  const groupedBookings = useMemo(() => {
    const seriesMap = new Map();
    const singles = [];

    bookings.forEach((booking) => {
      if (booking.recurring && booking.seriesId) {
        if (!seriesMap.has(booking.seriesId)) {
          seriesMap.set(booking.seriesId, []);
        }
        seriesMap.get(booking.seriesId).push(booking);
      } else {
        singles.push(booking);
      }
    });

    const seriesGroups = Array.from(seriesMap.entries()).map(
      ([seriesId, seriesBookings]) => {
        const sorted = [...seriesBookings].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        const startDate = sorted[0]?.date;
        const endDate = sorted[sorted.length - 1]?.date;
        const startTime = sorted[0]?.startTime || "";
        const endTime = sorted[0]?.endTime || "";
        const activeCount = sorted.filter((b) => b.status === "active").length;
        const cancelledCount = sorted.length - activeCount;
        const resourceName = sorted[0]?.resource?.name || "Resource";

        return {
          type: "series",
          seriesId,
          resourceName,
          startDate,
          endDate,
          startTime,
          endTime,
          total: sorted.length,
          activeCount,
          cancelledCount,
          date: startDate,
        };
      }
    );

    const singleItems = singles.map((booking) => ({
      type: "single",
      booking,
      date: booking.date,
    }));

    return [...seriesGroups, ...singleItems].sort((a, b) =>
      (a.date || "").localeCompare(b.date || "")
    );
  }, [bookings]);

  const handleCancelBooking = async (id) => {
    try {
      await API.put(
        `/bookings/${id}/cancel`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSeries = async (seriesId) => {
    try {
      await API.put(
        `/bookings/series/${seriesId}/cancel`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingSeries = (group) => {
    setEditingSeriesId(group.seriesId);
    setEditStartTime(group.startTime);
    setEditEndTime(group.endTime);
  };

  const handleSaveSeries = async (seriesId) => {
    try {
      await API.put(
        `/bookings/series/${seriesId}`,
        {
          startTime: editStartTime,
          endTime: editEndTime,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setEditingSeriesId(null);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SidebarLayout title="Dashboard">
      <div className="tabs">
        <button
          className={activeTab === "calendar" ? "active" : ""}
          onClick={() => setActiveTab("calendar")}
        >
          Calendar
        </button>
        <button
          className={activeTab === "bookings" ? "active" : ""}
          onClick={() => setActiveTab("bookings")}
        >
          My Bookings
        </button>
      </div>

      {activeTab === "calendar" && (
        <div className="calendar-grid">
          <div className="calendar">
            <h3>Calendar</h3>
            <Calendar
              onChange={setDate}
              value={date}
              tileContent={({ date: tileDate, view }) => {
                if (view !== "month") {
                  return null;
                }
                const key = formatDateKey(tileDate);
                const dayBookings = bookingsByDate.get(key) || [];
                if (dayBookings.length === 0) {
                  return null;
                }

                return (
                  <div className="tile-bookings">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <span
                        key={booking._id}
                        className={`booking-badge ${booking.status}`}
                        title={`${booking.resource?.name || "Resource"} ${booking.startTime} - ${booking.endTime}`}
                      >
                        {booking.resource?.name || "Resource"} {booking.startTime}-{booking.endTime}
                      </span>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="booking-more">
                        +{dayBookings.length - 3} more
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </div>

          <div className="activity">
            <h3>My Activity</h3>
            <p>Active Bookings: {stats.active}</p>
            <p>Cancelled: {stats.cancelled}</p>
            <p>Total: {stats.total}</p>
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="bookings-tab">
          <h3>My Bookings</h3>
          {groupedBookings.length === 0 && (
            <p className="bookings-empty empty-state">No bookings yet.</p>
          )}
          <div className="bookings-list">
            {groupedBookings.map((item) => {
              if (item.type === "series") {
                const isEditing = editingSeriesId === item.seriesId;
                return (
                  <div key={item.seriesId} className="booking-row">
                    <div className="booking-main">
                      <span className="booking-title">
                        {item.resourceName} (Series)
                      </span>
                      <span className="booking-time">
                        {item.startDate} to {item.endDate}
                      </span>
                      <span className="booking-sub">
                        {item.startTime}-{item.endTime}
                        <span className="meta-sep" aria-hidden="true" />
                        {item.total} bookings
                      </span>
                      <span className="booking-sub">
                        Active {item.activeCount}
                        <span className="meta-sep" aria-hidden="true" />
                        Cancelled {item.cancelledCount}
                      </span>
                      {isEditing && (
                        <div className="series-edit">
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                          />
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                          />
                          <button
                            className="series-save"
                            onClick={() => handleSaveSeries(item.seriesId)}
                          >
                            Save
                          </button>
                          <button
                            className="series-cancel"
                            onClick={() => setEditingSeriesId(null)}
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="booking-actions">
                      <button
                        className="booking-action"
                        onClick={() => startEditingSeries(item)}
                      >
                        Edit Series
                      </button>
                      <button
                        className="booking-action danger"
                        onClick={() => handleCancelSeries(item.seriesId)}
                      >
                        Cancel Series
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.booking._id} className="booking-row">
                  <div className="booking-main">
                    <span className="booking-title">
                      {item.booking.resource?.name || "Resource"}
                    </span>
                    <span className="booking-time">
                      {item.booking.date} {item.booking.startTime}-{item.booking.endTime}
                    </span>
                    <span className={`booking-status ${item.booking.status}`}>
                      {item.booking.status}
                    </span>
                  </div>
                  <div className="booking-actions">
                    <button
                      className="booking-action danger"
                      onClick={() => handleCancelBooking(item.booking._id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-footer">
        <span>Created by Prabhasees</span>
        <span className="footer-sep" aria-hidden="true" />
        <a href="mailto:sprabhasees@gmail.com">sprabhasees@gmail.com</a>
      </div>
    </SidebarLayout>
  );
}

export default Dashboard;
