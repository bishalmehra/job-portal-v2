import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'

const JOB_TYPES  = ['full-time', 'part-time', 'contract', 'internship', 'remote']
const EXP_LEVELS = ['entry', 'mid', 'senior', 'lead']

export default function UserDashboard() {
  const [jobs, setJobs]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [page, setPage]         = useState(1)
  const [appliedIds, setAppliedIds] = useState(new Set())

  const [filters, setFilters] = useState({ q: '', location: '', job_type: '', experience_level: '', salary_min: '', salary_max: '' })
  const [draftQ, setDraftQ]   = useState('')

  const fetchJobs = useCallback(async (f, p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, page_size: 10 }
      if (f.q)                params.q                = f.q
      if (f.location)         params.location         = f.location
      if (f.job_type)         params.job_type         = f.job_type
      if (f.experience_level) params.experience_level = f.experience_level
      if (f.salary_min)       params.salary_min       = f.salary_min
      if (f.salary_max)       params.salary_max       = f.salary_max
      const { data } = await api.get('/jobs/search', { params })
      setJobs(data.jobs)
      setTotal(data.total)
      setPage(p)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  // Load applied job IDs so we can show "Applied" badge
  const fetchApplied = async () => {
    try {
      const { data } = await api.get('/my-applications')
      setAppliedIds(new Set(data.map(a => a.job_id)))
    } catch {}
  }

  useEffect(() => { fetchJobs(filters, 1); fetchApplied() }, [])

  const handleSearch = e => {
    e.preventDefault()
    const f = { ...filters, q: draftQ }
    setFilters(f); fetchJobs(f, 1)
  }

  const handleFilter = (key, val) => {
    const f = { ...filters, [key]: val }
    setFilters(f); fetchJobs(f, 1)
  }

  const clearFilters = () => {
    const f = { q: '', location: '', job_type: '', experience_level: '', salary_min: '', salary_max: '' }
    setFilters(f); setDraftQ(''); fetchJobs(f, 1)
  }

  const onApplied = (jobId) => {
    setAppliedIds(prev => new Set([...prev, jobId]))
    setSelected(null)
  }

  const totalPages    = Math.ceil(total / 10)
  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== 'q').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-50)' }}>
      <Navbar />

      {/* Search bar */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--slate-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={draftQ} onChange={e => setDraftQ(e.target.value)}
                placeholder="Search job title, skills, or company…"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.95rem', background: 'var(--slate-50)' }} />
            </div>
            <input value={filters.location} onChange={e => handleFilter('location', e.target.value)}
              placeholder="Location"
              style={{ width: 180, padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.95rem', background: 'var(--slate-50)' }} />
            <button type="submit" style={{ padding: '0.75rem 1.75rem', borderRadius: 'var(--radius)', background: 'var(--blue-600)', color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* Filters sidebar */}
        <aside>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filters</span>
              {activeFilters > 0 && <button onClick={clearFilters} style={{ fontSize: '0.75rem', color: 'var(--blue-600)', background: 'none', fontWeight: 500 }}>Clear all</button>}
            </div>
            <FilterSection title="Job Type">
              {JOB_TYPES.map(t => <FilterChip key={t} label={t} active={filters.job_type === t} onClick={() => handleFilter('job_type', filters.job_type === t ? '' : t)} />)}
            </FilterSection>
            <FilterSection title="Experience">
              {EXP_LEVELS.map(l => <FilterChip key={l} label={l} active={filters.experience_level === l} onClick={() => handleFilter('experience_level', filters.experience_level === l ? '' : l)} />)}
            </FilterSection>
            <FilterSection title="Salary (INR / yr)">
              <input type="number" placeholder="Min" value={filters.salary_min} onChange={e => handleFilter('salary_min', e.target.value)} style={filterInputStyle} />
              <input type="number" placeholder="Max" value={filters.salary_max} onChange={e => handleFilter('salary_max', e.target.value)} style={{ ...filterInputStyle, marginTop: '0.5rem' }} />
            </FilterSection>
          </div>
        </aside>

        {/* Results */}
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
              {loading ? 'Searching…' : `${total} job${total !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--blue-200)', borderTopColor: 'var(--blue-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : jobs.length === 0 ? <EmptyState /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {jobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} applied={appliedIds.has(job.id)} onClick={() => setSelected(job)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => fetchJobs(filters, p)} style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${p === page ? 'var(--blue-500)' : 'var(--slate-200)'}`,
                  background: p === page ? 'var(--blue-50)' : 'var(--white)',
                  color: p === page ? 'var(--blue-700)' : 'var(--slate-600)',
                  fontWeight: p === page ? 600 : 400, fontSize: '0.875rem',
                }}>{p}</button>
              ))}
            </div>
          )}
        </main>
      </div>

      {selected && (
        <JobModal job={selected} applied={appliedIds.has(selected.id)}
          onClose={() => setSelected(null)} onApplied={onApplied} />
      )}
    </div>
  )
}

function FilterSection({ title, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>{children}</div>
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 500,
      border: `1.5px solid ${active ? 'var(--blue-400)' : 'var(--slate-200)'}`,
      background: active ? 'var(--blue-50)' : 'var(--white)',
      color: active ? 'var(--blue-700)' : 'var(--slate-500)',
      cursor: 'pointer', textTransform: 'capitalize',
    }}>{label}</button>
  )
}

const filterInputStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--slate-200)', fontSize: '0.85rem', color: 'var(--slate-700)', display: 'block' }

function JobCard({ job, index, applied, onClick }) {
  const colors     = { 'full-time': '#dbeafe', 'part-time': '#fef3c7', remote: '#d1fae5', contract: '#ede9fe', internship: '#fce7f3' }
  const textColors = { 'full-time': '#1d4ed8', 'part-time': '#92400e', remote: '#065f46', contract: '#6d28d9', internship: '#9d174d' }
  return (
    <div onClick={onClick} style={{
      background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)',
      padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'all 0.15s',
      animation: `fadeIn 0.3s ease ${index * 0.04}s both`, boxShadow: 'var(--shadow-sm)',
    }}
    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue-300)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)' }}>{job.title}</h3>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: colors[job.job_type] || '#f1f5f9', color: textColors[job.job_type] || '#475569', textTransform: 'capitalize' }}>{job.job_type}</span>
            {applied && <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>✓ Applied</span>}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)', display: 'flex', gap: '1rem' }}>
            <span>🏢 {job.company}</span><span>📍 {job.location}</span><span style={{ textTransform: 'capitalize' }}>🎯 {job.experience_level}</span>
          </div>
          {job.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
              {job.skills.slice(0, 5).map(s => (
                <span key={s} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 99, background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 500 }}>{s}</span>
              ))}
              {job.skills.length > 5 && <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>+{job.skills.length - 5}</span>}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', marginLeft: '1rem', flexShrink: 0 }}>
          {job.salary?.min && <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--blue-700)' }}>₹{(job.salary.min / 100000).toFixed(1)}L{job.salary.max ? ` – ₹${(job.salary.max / 100000).toFixed(1)}L` : '+'}</div>}
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>{new Date(job.posted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
        </div>
      </div>
    </div>
  )
}

// ── Job detail + Apply modal ───────────────────────────────────────────────────

function JobModal({ job, applied, onClose, onApplied }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.25s ease both' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--slate-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--slate-900)', marginBottom: '0.4rem' }}>{job.title}</h2>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>{job.company} · {job.location}</div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--slate-100)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', color: 'var(--slate-500)' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem' }}>
            {[{ label: job.job_type, bg: 'var(--blue-100)', color: 'var(--blue-700)' }, { label: job.experience_level, bg: 'var(--slate-100)', color: 'var(--slate-600)' }, { label: job.category, bg: 'var(--slate-100)', color: 'var(--slate-600)' }].map((b, i) => (
              <span key={i} style={{ padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 500, background: b.bg, color: b.color, textTransform: 'capitalize' }}>{b.label}</span>
            ))}
            {job.salary?.min && <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, background: 'var(--blue-50)', color: 'var(--blue-700)' }}>₹{(job.salary.min / 100000).toFixed(1)}L – ₹{(job.salary.max / 100000).toFixed(1)}L / yr</span>}
          </div>
        </div>
        <div style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>Description</h4>
          <p style={{ color: 'var(--slate-700)', lineHeight: 1.75, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{job.description}</p>
          {job.skills?.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', margin: '1.5rem 0 0.75rem' }}>Skills Required</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {job.skills.map(s => <span key={s} style={{ padding: '5px 12px', borderRadius: 99, background: 'var(--blue-50)', color: 'var(--blue-700)', fontSize: '0.82rem', fontWeight: 500 }}>{s}</span>)}
              </div>
            </>
          )}

          {applied ? (
            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius)', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', textAlign: 'center', fontWeight: 500 }}>
              ✅ You have already applied for this job
            </div>
          ) : showForm ? (
            <ApplyForm job={job} onClose={() => setShowForm(false)} onApplied={onApplied} />
          ) : (
            <button onClick={() => setShowForm(true)} style={{ marginTop: '2rem', width: '100%', padding: '0.875rem', borderRadius: 'var(--radius)', background: 'var(--blue-600)', color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Application form ───────────────────────────────────────────────────────────

function ApplyForm({ job, onClose, onApplied }) {
  const [form, setForm]     = useState({ full_name: '', email: '', phone: '', years_of_experience: '', cover_letter: '', resume_link: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const payload = { ...form, years_of_experience: form.years_of_experience ? +form.years_of_experience : null }
      await api.post(`/jobs/${job.id}/apply`, payload)
      onApplied(job.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--slate-100)', paddingTop: '1.5rem' }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Apply for {job.title}</h3>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{job.company} · {job.location}</p>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
          <AField label="Full Name *" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Rahul Sharma" />
          <AField label="Email *" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
          <AField label="Phone *" name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
          <AField label="Years of Experience" name="years_of_experience" type="number" value={form.years_of_experience} onChange={handleChange} placeholder="e.g. 3" />
        </div>
        <AField label="Resume / Portfolio Link" name="resume_link" value={form.resume_link} onChange={handleChange} placeholder="https://drive.google.com/..." />
        <div>
          <label style={aLbl}>Cover Letter</label>
          <textarea name="cover_letter" value={form.cover_letter} onChange={handleChange} rows={4}
            placeholder="Tell the employer why you're a great fit for this role…"
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 600 }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.75rem', borderRadius: 'var(--radius)', background: loading ? 'var(--slate-300)' : 'var(--blue-600)', color: 'white', fontWeight: 600 }}>
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}

const aLbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }

function AField({ label, name, type = 'text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label style={aLbl}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
        style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.875rem', color: 'var(--slate-800)' }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
      <h3 style={{ fontSize: '1.1rem', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>No jobs found</h3>
      <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>Try adjusting your search or clearing filters</p>
    </div>
  )
}