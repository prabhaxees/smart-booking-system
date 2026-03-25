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
} from "recharts";

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
    <div>
      <h2>Analytics Dashboard</h2>

      <h3>Top Resources</h3>
      <BarChart width={400} height={300} data={data.topResources}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" />
      </BarChart>

      <h3>Peak Hours</h3>
      <BarChart width={400} height={300} data={data.peakHours}>
        <XAxis dataKey="_id" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" />
      </BarChart>

      <h3>Daily Trends</h3>
      <LineChart width={400} height={300} data={data.dailyTrends}>
        <XAxis dataKey="_id" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" />
      </LineChart>
    </div>
  );
}

export default Analytics;