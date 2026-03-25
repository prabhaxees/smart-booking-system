import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <h2>Welcome to Dashboard 🎉</h2>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={() => navigate("/analytics")}>
        View Analytics
      </button>
      <button onClick={() => navigate("/booking")}>
        Book Resource
      </button>
    </div>
  );
}

export default Dashboard;