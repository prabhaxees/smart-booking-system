import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Analytics from "../pages/Analytics";
import ProtectedRoute from "./ProtectedRoute";
import Booking from "../pages/Booking";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking"
          element={
           <ProtectedRoute>
             <Booking />
           </ProtectedRoute>
          }
       />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;