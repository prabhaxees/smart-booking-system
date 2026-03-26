import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./SidebarLayout.css";

function SidebarLayout({ title, children }) {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const isAdmin = user?.role === "admin";

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>Booking</h2>
        <ul>
          <li onClick={() => navigate("/dashboard")}>Home</li>
          <li onClick={() => navigate("/booking")}>Book</li>
          <li onClick={() => navigate("/analytics")}>Analytics</li>
          {isAdmin && (
            <>
              <li onClick={() => navigate("/admin/resources")}>Admin Resources</li>
              <li onClick={() => navigate("/admin/bookings")}>Admin Bookings</li>
            </>
          )}
        </ul>
      </div>

      <div className="main">
        <div className="navbar">
          <h3>{title}</h3>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default SidebarLayout;
