import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../api/client";

export default function AuthPage() {
  const { isAuthenticated, role, login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [accountRole, setAccountRole] = useState<Role>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated && role) {
    return <Navigate to={role === "host" ? "/host" : "/jobs"} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup({ name, email, password, role: accountRole });
        navigate(accountRole === "host" ? "/host" : "/jobs", { replace: true });
      } else {
        const t = await login(email, password);
        navigate(t.role === "host" ? "/host" : "/jobs", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto" }}>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "2.25rem",
            margin: "0 0 0.5rem",
            lineHeight: 1.2,
          }}
        >
          Find work or hire talent
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Sign in to continue. New here? Create an account as a job seeker or employer.
        </p>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            padding: 4,
            gap: 4,
            background: "var(--surface)",
            borderRadius: 10,
            marginBottom: "1.25rem",
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => setMode("signin")}
            style={{
              flex: 1,
              border: "none",
              background: mode === "signin" ? "var(--bg-elevated)" : "transparent",
              boxShadow: mode === "signin" ? "0 1px 0 rgba(255,255,255,0.06)" : "none",
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              border: "none",
              background: mode === "signup" ? "var(--bg-elevated)" : "transparent",
              boxShadow: mode === "signup" ? "0 1px 0 rgba(255,255,255,0.06)" : "none",
            }}
          >
            Sign up
          </button>
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <span className="label">I am joining as</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setAccountRole("user")}
                style={{
                  flex: 1,
                  borderColor: accountRole === "user" ? "var(--accent)" : undefined,
                  background: accountRole === "user" ? "rgba(56, 189, 248, 0.1)" : undefined,
                }}
              >
                Job seeker
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setAccountRole("host")}
                style={{
                  flex: 1,
                  borderColor: accountRole === "host" ? "var(--accent)" : undefined,
                  background: accountRole === "host" ? "rgba(56, 189, 248, 0.1)" : undefined,
                }}
              >
                Employer (host)
              </button>
            </div>
            <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.8rem" }}>
              Seekers browse and apply to listings. Employers publish and manage jobs via the API.
            </p>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="field">
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                required
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="At least 6 characters"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
