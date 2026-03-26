import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const fetchActiveBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/bookings/active", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBookings();
  }, []);

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
      setBookings((prev) => prev.filter((booking) => booking._id !== id));
      setMessage("Booking cancelled.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
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
              <h3>Active Bookings</h3>
              <p className="admin-sub">
                Manage and cancel any active booking.
              </p>
            </div>
            <button className="ghost-button" onClick={fetchActiveBookings}>
              Refresh
            </button>
          </div>
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : bookings.length === 0 ? (
            <p className="empty-state">No active bookings.</p>
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
                  </div>
                  <div className="booking-actions">
                    <button
                      className="danger"
                      onClick={() => handleCancel(booking._id)}
                    >
                      Cancel
                    </button>
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
