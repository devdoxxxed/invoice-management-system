import React, { useEffect, useState } from "react";
import { api } from "./api";

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(target * progress);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/invoices/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Couldn't load your numbers right now — refresh to try again."));
  }, []);

  const total = useCountUp(summary?.total_invoices);
  const paid = useCountUp(summary?.paid_invoices);
  const pending = useCountUp(summary?.pending_amount);
  const overdue = useCountUp(summary?.overdue_invoices);

  if (error) return <div className="error-msg">{error}</div>;
  if (!summary) return <div className="loader">Loading...</div>;

  return (
    <div>
      <div className="dashboard-hero">
        <div className="dashboard-hero-label">Outstanding right now</div>
        <div className="dashboard-hero-value">${pending.toFixed(2)}</div>
        <div className="dashboard-hero-sub">
          {Math.round(overdue) > 0
            ? `${Math.round(overdue)} invoice${Math.round(overdue) === 1 ? "" : "s"} overdue — worth a look.`
            : "Nothing overdue. You're on top of it."}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{Math.round(total)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Paid Invoices</div>
          <div className="stat-value">{Math.round(paid)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Overdue Invoices</div>
          <div className="stat-value stat-danger">{Math.round(overdue)}</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;