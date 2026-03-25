import { useEffect, useState } from "react";
import API from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import SidebarLayout from "../components/SidebarLayout";
import "./Analytics.css";

function Analytics() {
  const [data, setData] = useState({
    topResources: [],
    peakHours: [],
    dailyTrends: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/analytics", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <SidebarLayout title="Analytics">
      <div className="analytics">
        <div className="analytics-hero">
          <h2>Analytics Dashboard</h2>
          <p>Track resource demand, peak hours, and daily booking trends.</p>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Top Resources</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topResources}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1f4ea3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Peak Hours</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peakHours}>
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2b73ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Daily Trends</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyTrends}>
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1f4ea3" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default Analytics;
