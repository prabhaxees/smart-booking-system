import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminResources.css";
import SidebarLayout from "../components/SidebarLayout";

const emptyForm = {
  name: "",
  type: "",
  capacity: "",
  features: "",
  openingTime: "",
  closingTime: "",
  status: "active",
};

const parseFeatures = (value) =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

function AdminResources() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";

  const loadResources = async () => {
    const res = await API.get("/resources", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return res.data;
  };

  const refreshResources = async () => {
    try {
      setResources(await loadResources());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resources");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchInitialResources = async () => {
      try {
        const data = await loadResources();
        if (!cancelled) {
          setResources(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load resources");
        }
      }
    };

    fetchInitialResources();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await API.post(
        "/resources",
        {
          ...form,
          capacity: Number(form.capacity),
          features: parseFeatures(form.features),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage("Resource added successfully.");
      setForm(emptyForm);
      refreshResources();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add resource");
    }
  };

  const startEdit = (resource) => {
    setEditingId(resource._id);
    setEditForm({
      name: resource.name || "",
      type: resource.type || "",
      capacity: resource.capacity || "",
      features: (resource.features || []).join(", "),
      openingTime: resource.openingTime || "",
      closingTime: resource.closingTime || "",
      status: resource.status || "active",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveEdit = async (id) => {
    setMessage("");
    setError("");
    try {
      await API.put(
        `/resources/${id}`,
        {
          ...editForm,
          capacity: Number(editForm.capacity),
          features: parseFeatures(editForm.features),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessage("Resource updated successfully.");
      cancelEdit();
      refreshResources();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update resource");
    }
  };

  const deleteResource = async (id) => {
    setMessage("");
    setError("");
    try {
      await API.delete(`/resources/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setMessage("Resource deleted.");
      refreshResources();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete resource");
    }
  };

  if (!isAdmin) {
    return (
      <SidebarLayout title="Admin Resources">
        <div className="admin-card">
          <h2>Admin Resources</h2>
          <p>You do not have admin access.</p>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Admin Resources">
      <div className="admin-grid">
        <div className="admin-card">
          <h3>Add Resource</h3>
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit} className="resource-form">
            <input
              name="name"
              placeholder="Resource name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <select name="type" value={form.type} onChange={handleChange} required>
              <option value="">Select type</option>
              <option value="lab">Lab</option>
              <option value="room">Room</option>
              <option value="hall">Hall</option>
            </select>
            <input
              name="capacity"
              type="number"
              min="1"
              placeholder="Capacity"
              value={form.capacity}
              onChange={handleChange}
              required
            />
            <input
              name="features"
              placeholder="Features (projector, whiteboard, ac)"
              value={form.features}
              onChange={handleChange}
            />
            <div className="time-row">
              <input
                name="openingTime"
                type="time"
                value={form.openingTime}
                onChange={handleChange}
                required
              />
              <input
                name="closingTime"
                type="time"
                value={form.closingTime}
                onChange={handleChange}
                required
              />
            </div>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button type="submit">Add Resource</button>
          </form>
        </div>

        <div className="admin-card">
          <h3>All Resources</h3>
          {resources.length === 0 && <p className="empty-state">No resources yet.</p>}
          <div className="resource-list">
            {resources.map((resource) => (
              <div key={resource._id} className="resource-row">
                {editingId === resource._id ? (
                  <div className="resource-edit">
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      placeholder="Resource name"
                    />
                    <select name="type" value={editForm.type} onChange={handleEditChange}>
                      <option value="">Select type</option>
                      <option value="lab">Lab</option>
                      <option value="room">Room</option>
                      <option value="hall">Hall</option>
                    </select>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={editForm.capacity}
                      onChange={handleEditChange}
                      placeholder="Capacity"
                    />
                    <input
                      name="features"
                      value={editForm.features}
                      onChange={handleEditChange}
                      placeholder="Features"
                    />
                    <div className="time-row">
                      <input
                        name="openingTime"
                        type="time"
                        value={editForm.openingTime}
                        onChange={handleEditChange}
                      />
                      <input
                        name="closingTime"
                        type="time"
                        value={editForm.closingTime}
                        onChange={handleEditChange}
                      />
                    </div>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    <div className="resource-actions">
                      <button onClick={() => saveEdit(resource._id)}>Save</button>
                      <button className="ghost" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{resource.name}</strong>
                      <div className="resource-sub">
                        {resource.type}
                        <span className="meta-sep" aria-hidden="true" />
                        Capacity {resource.capacity}
                      </div>
                      {resource.features?.length > 0 && (
                        <div className="resource-sub">Features: {resource.features.join(", ")}</div>
                      )}
                      <div className="resource-sub">
                        {resource.openingTime} - {resource.closingTime}
                      </div>
                    </div>
                    <div className="resource-meta">
                      <span className={`resource-status ${resource.status}`}>
                        {resource.status}
                      </span>
                      <div className="resource-actions">
                        <button onClick={() => startEdit(resource)}>Edit</button>
                        <button className="danger" onClick={() => deleteResource(resource._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default AdminResources;
