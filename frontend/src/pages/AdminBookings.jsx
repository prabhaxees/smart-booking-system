import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import SidebarLayout from "../components/SidebarLayout";
import "./AdminBookings.css";

function AdminBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";

  const fetchBookings = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    setError("");
    try {
      const res = await API.get("/bookings/admin/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    fetchBookings();
  }, [fetchBookings, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const socket = io("http://localhost:5000");
    socket.on("bookings:changed", () => {
      fetchBookings({ showLoading: false });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchBookings, isAdmin]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) {
      return;
    }
    setMessage("");
    setError("");
    try {
      await API.put(
        `/bookings/admin/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchBookings({ showLoading: false });
      setMessage("Booking cancelled.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this cancelled booking?")) {
      return;
    }
    setMessage("");
    setError("");
    try {
      await API.delete(`/bookings/admin/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBookings((prev) => prev.filter((booking) => booking._id !== id));
      setMessage("Booking deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete booking");
    }
  };

  if (!isAdmin) {
    return (
      <SidebarLayout title="Admin Bookings">
        <div className="admin-card">
          <h2>Admin Bookings</h2>
          <p>You do not have admin access.</p>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Admin Bookings">
      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-header">
            <div>
              <h3>All Bookings</h3>
              <p className="admin-sub">
                Manage active bookings and delete cancelled bookings.
              </p>
            </div>
            <button className="ghost-button" onClick={fetchBookings}>
              Refresh
            </button>
          </div>
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : bookings.length === 0 ? (
            <p className="empty-state">No bookings.</p>
          ) : (
            <div className="booking-list">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-row">
                  <div>
                    <strong>{booking.resource?.name || "Resource"}</strong>
                    <div className="booking-sub">
                      {booking.date} {booking.startTime}-{booking.endTime}
                    </div>
                    <div className="booking-sub">
                      {booking.user?.name || "User"}
                      <span className="meta-sep" aria-hidden="true" />
                      {booking.user?.email || "No email"}
                    </div>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-actions">
                    {booking.status === "cancelled" ? (
                      <button
                        className="danger"
                        onClick={() => handleDelete(booking._id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        className="danger"
                        onClick={() => handleCancel(booking._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

export default AdminBookings;
