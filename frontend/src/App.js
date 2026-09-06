import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard";
import InvoiceList from "./InvoiceList";
import InvoiceDetail from "./InvoiceDetail";

function AnimatedRoutes({ role }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-fade">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/invoices" element={<InvoiceList role={role} />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
      </Routes>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "admin");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  return (
    <BrowserRouter>
      <div className="app-bg" data-theme={theme}>
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">L</span>
            <div>
              <h1>Ledger</h1>
              <p className="brand-tagline">Invoices, kept in order.</p>
            </div>
          </div>
          <nav className="top-nav">
            <Link to="/">Dashboard</Link>
            <Link to="/invoices">Invoices</Link>
          </nav>
          <div className="top-actions">
            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              title="Mocked role (no real auth) — hides admin-only actions for Viewer"
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </header>

        <div className="container">
          <AnimatedRoutes role={role} />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;