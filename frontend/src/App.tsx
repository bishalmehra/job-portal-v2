import type { ReactNode } from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import JobsPage from "./pages/JobsPage";
import HostDashboard from "./pages/HostDashboard";
import "./App.css";

function Protected({
  children,
  role,
}: {
  children: ReactNode;
  role: "user" | "host";
}) {
  const { isAuthenticated, token, role: r } = useAuth();
  if (!isAuthenticated || !token) return <Navigate to="/" replace />;
  if (r !== role) {
    return <Navigate to={r === "host" ? "/host" : "/jobs"} replace />;
  }
  return <>{children}</>;
}

function AppHeader() {
  const { isAuthenticated, name, role, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <Link to={isAuthenticated ? (role === "host" ? "/host" : "/jobs") : "/"} className="app-brand">
        Job Portal
      </Link>
      {isAuthenticated && (
        <div className="app-header-actions">
          <span className="muted">
            {name}
            <span className="pill" style={{ marginLeft: "0.5rem" }}>
              {role === "host" ? "Employer" : "Seeker"}
            </span>
          </span>
          {role === "user" && (
            <Link to="/jobs" className="btn btn-sm btn-ghost">
              Browse jobs
            </Link>
          )}
          {role === "host" && (
            <Link to="/host" className="btn btn-sm btn-ghost">
              My listings
            </Link>
          )}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/jobs"
            element={
              <Protected role="user">
                <JobsPage />
              </Protected>
            }
          />
          <Route
            path="/host"
            element={
              <Protected role="host">
                <HostDashboard />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
