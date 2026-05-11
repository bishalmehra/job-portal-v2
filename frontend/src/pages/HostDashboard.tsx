import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listHostJobs, type Job } from "../api/client";

function formatSalary(j: Job): string | null {
  const s = j.salary;
  if (!s || (s.min == null && s.max == null)) return null;
  const cur = s.currency ?? "INR";
  if (s.min != null && s.max != null) return `${cur} ${s.min.toLocaleString()} – ${s.max.toLocaleString()}`;
  if (s.min != null) return `${cur} ${s.min.toLocaleString()}+`;
  return null;
}

export default function HostDashboard() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listHostJobs(token, 1, 50);
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "2rem", margin: "0 0 0.35rem" }}>
          Your job listings
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Post and edit jobs via the API at <code>/api/host/jobs</code> (Swagger: <code>/docs</code>).
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <p className="muted" style={{ marginBottom: "1rem" }}>
        {loading ? "Loading…" : `${total} listing${total === 1 ? "" : "s"}`}
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {!loading &&
          jobs.map((job) => (
            <li key={job.id} className="card" style={{ padding: "1rem 1.15rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 600 }}>{job.title}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                    {job.company} · {job.location}
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  <span className="pill">{job.is_active ? "Active" : "Inactive"}</span>
                  <span className="pill">{job.job_type}</span>
                  {formatSalary(job) && <span className="pill">{formatSalary(job)}</span>}
                </div>
              </div>
            </li>
          ))}
      </ul>

      {!loading && jobs.length === 0 && !error && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.5rem" }}>No listings yet.</p>
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            Use POST <code>/api/host/jobs</code> with your host token to create the first job.
          </p>
        </div>
      )}
    </div>
  );
}
