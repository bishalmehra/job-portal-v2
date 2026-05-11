const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type Role = "user" | "host";

export type TokenResponse = {
  access_token: string;
  token_type: string;
  role: Role;
  name: string;
  user_id: string;
};

export type SalaryRange = {
  min?: number | null;
  max?: number | null;
  currency?: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  category: string;
  skills: string[];
  salary?: SalaryRange | null;
  is_active: boolean;
  host_id: string;
  posted_at: string;
  updated_at?: string | null;
};

export type JobSearchResponse = {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  jobs: Job[];
};

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.detail === "string") return j.detail;
    if (Array.isArray(j?.detail)) return j.detail.map((d: { msg?: string }) => d.msg).join(", ");
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

export async function signup(body: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function login(body: { email: string; password: string }): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export type SearchParams = {
  q?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  category?: string;
  salary_min?: number;
  salary_max?: number;
  page?: number;
  page_size?: number;
};

export async function searchJobs(token: string, params: SearchParams): Promise<JobSearchResponse> {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.location?.trim()) sp.set("location", params.location.trim());
  if (params.job_type) sp.set("job_type", params.job_type);
  if (params.experience_level) sp.set("experience_level", params.experience_level);
  if (params.category?.trim()) sp.set("category", params.category.trim());
  if (params.salary_min != null && params.salary_min > 0) sp.set("salary_min", String(params.salary_min));
  if (params.salary_max != null && params.salary_max > 0) sp.set("salary_max", String(params.salary_max));
  sp.set("page", String(params.page ?? 1));
  sp.set("page_size", String(params.page_size ?? 10));

  const res = await fetch(`${API_BASE}/api/jobs/search?${sp.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getJob(token: string, jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listHostJobs(
  token: string,
  page = 1,
  page_size = 20
): Promise<JobSearchResponse> {
  const sp = new URLSearchParams({ page: String(page), page_size: String(page_size) });
  const res = await fetch(`${API_BASE}/api/host/jobs?${sp.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
