import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { searchJobs, type Job, type SearchParams } from "../api/client";

type JobFilters = Omit<SearchParams, "page" | "page_size">;

const JOB_TYPES = [
  { value: "", label: "Any type" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
];

const EXP_LEVELS = [
  { value: "", label: "Any level" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

function formatSalary(j: Job): string | null {
  const s = j.salary;
  if (!s || (s.min == null && s.max == null)) return null;
  const cur = s.currency ?? "INR";
  if (s.min != null && s.max != null) return `${cur} ${s.min.toLocaleString()} – ${s.max.toLocaleString()}`;
  if (s.min != null) return `${cur} ${s.min.toLocaleString()}+`;
  if (s.max != null) return `Up to ${cur} ${s.max.toLocaleString()}`;
  return null;
}

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    q: "",
    location: "",
    job_type: "",
    experience_level: "",
    category: "",
    salary_min: "" as string,
    salary_max: "" as string,
  });

  const [applied, setApplied] = useState<JobFilters>({});

  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: SearchParams = {
        ...applied,
        page,
        page_size: pageSize,
      };
      const res = await searchJobs(token, params);
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, applied]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const salary_min = filters.salary_min ? Number(filters.salary_min) : undefined;
    const salary_max = filters.salary_max ? Number(filters.salary_max) : undefined;
    setPage(1);
    setApplied({
      q: filters.q || undefined,
      location: filters.location || undefined,
      job_type: filters.job_type || undefined,
      experience_level: filters.experience_level || undefined,
      category: filters.category || undefined,
      salary_min: Number.isFinite(salary_min) ? salary_min : undefined,
      salary_max: Number.isFinite(salary_max) ? salary_max : undefined,
    });
  }

  function clearFilters() {
    setFilters({
      q: "",
      location: "",
      job_type: "",
      experience_level: "",
      category: "",
      salary_min: "",
      salary_max: "",
    });
    setPage(1);
    setApplied({});
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "2rem", margin: "0 0 0.35rem" }}>
          Open roles
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Latest listings load automatically. Use search and filters to narrow results.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>Search & filters</h2>
        <form onSubmit={applyFilters}>
          <div className="field">
            <label className="label" htmlFor="q">
              Keywords
            </label>
            <input
              id="q"
              className="input"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="Title, skills, description…"
            />
          </div>
          <div className="grid-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className="input"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                placeholder="City or region"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="category">
                Category
              </label>
              <input
                id="category"
                className="input"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Engineering"
              />
            </div>
          </div>
          <div className="grid-2" style={{ marginTop: "0.75rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="job_type">
                Job type
              </label>
              <select
                id="job_type"
                className="select"
                value={filters.job_type}
                onChange={(e) => setFilters((f) => ({ ...f, job_type: e.target.value }))}
              >
                {JOB_TYPES.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="experience_level">
                Experience
              </label>
              <select
                id="experience_level"
                className="select"
                value={filters.experience_level}
                onChange={(e) => setFilters((f) => ({ ...f, experience_level: e.target.value }))}
              >
                {EXP_LEVELS.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid-2" style={{ marginTop: "0.75rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="salary_min">
                Min salary (INR)
              </label>
              <input
                id="salary_min"
                className="input"
                type="number"
                min={0}
                value={filters.salary_min}
                onChange={(e) => setFilters((f) => ({ ...f, salary_min: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="salary_max">
                Max salary (INR)
              </label>
              <input
                id="salary_max"
                className="input"
                type="number"
                min={0}
                value={filters.salary_max}
                onChange={(e) => setFilters((f) => ({ ...f, salary_max: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary">
              Apply filters
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
        <span className="muted">
          {loading ? "Loading…" : `${total} role${total === 1 ? "" : "s"} found`}
        </span>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {!loading &&
          jobs.map((job) => {
            const open = expandedJob === job.id;
            return (
              <li key={job.id} className="card" style={{ padding: "1rem 1.15rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 600 }}>{job.title}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "flex-start" }}>
                    <span className="pill">{job.job_type}</span>
                    <span className="pill">{job.experience_level}</span>
                    {formatSalary(job) && <span className="pill">{formatSalary(job)}</span>}
                  </div>
                </div>
                <p className="muted" style={{ margin: "0.65rem 0 0", fontSize: "0.85rem" }}>
                  {job.category}
                  {job.skills?.length ? ` · ${job.skills.slice(0, 5).join(", ")}${job.skills.length > 5 ? "…" : ""}` : ""}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ marginTop: "0.65rem", paddingLeft: 0 }}
                  onClick={() => setExpandedJob(open ? null : job.id)}
                >
                  {open ? "Hide description" : "View description"}
                </button>
                {open && (
                  <p style={{ margin: "0.5rem 0 0", whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    {job.description}
                  </p>
                )}
              </li>
            );
          })}
      </ul>

      {!loading && jobs.length === 0 && !error && (
        <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
          No jobs match your filters yet. Try clearing filters or check back later.
        </p>
      )}

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="muted" style={{ alignSelf: "center", fontSize: "0.9rem" }}>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
