import { useState } from "react";
import API from "../services/api";
import "./Auth.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", form);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h2>Create Account</h2>
          <p className="auth-helper">Join to book spaces and track your activity.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <input name="name" placeholder="Name" onChange={handleChange} />
          <input name="email" placeholder="Email" onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
