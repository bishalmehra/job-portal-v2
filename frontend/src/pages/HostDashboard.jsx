import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'

const EMPTY_FORM = {
  title: '', description: '', company: '', location: '',
  job_type: 'full-time', experience_level: 'mid', category: 'Engineering',
  skills: '', salary_min: '', salary_max: '', is_active: true,
}

const JOB_TYPES  = ['full-time', 'part-time', 'contract', 'internship', 'remote']
const EXP_LEVELS = ['entry', 'mid', 'senior', 'lead']
const CATEGORIES = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'General']

export default function HostDashboard() {
  const [jobs, setJobs]             = useState([])
  const [stats, setStats]           = useState({ total_jobs: 0, active_jobs: 0, inactive_jobs: 0 })
  const [loading, setLoading]       = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [editJob, setEditJob]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [deleteConfirm, setDeleteConfirm]       = useState(null)
  const [filterActive, setFilterActive]         = useState('all')
  const [viewApplications, setViewApplications] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [jobsRes, statsRes] = await Promise.all([
        api.get('/host/jobs', { params: { page_size: 50 } }),
        api.get('/host/stats'),
      ])
      setJobs(jobsRes.data.jobs)
      setStats(statsRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setEditJob(null); setError(''); setShowForm(true) }
  const openEdit   = job => {
    setForm({
      title: job.title, description: job.description, company: job.company,
      location: job.location, job_type: job.job_type, experience_level: job.experience_level,
      category: job.category, skills: (job.skills || []).join(', '),
      salary_min: job.salary?.min || '', salary_max: job.salary?.max || '',
      is_active: job.is_active,
    })
    setEditJob(job); setError(''); setShowForm(true)
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const salaryMin = form.salary_min !== '' ? parseInt(form.salary_min) : null
      const salaryMax = form.salary_max !== '' ? parseInt(form.salary_max) : null
      const payload = {
        title: form.title.trim(), description: form.description.trim(),
        company: form.company.trim(), location: form.location.trim(),
        job_type: form.job_type, experience_level: form.experience_level,
        category: form.category, is_active: form.is_active,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        salary: salaryMin ? { min: salaryMin, max: salaryMax, currency: 'INR' } : null,
      }
      if (editJob) {
        await api.patch(`/host/jobs/${editJob.id}`, payload)
      } else {
        await api.post('/host/jobs', payload)
      }
      setShowForm(false); fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (jobId, permanent = false) => {
    try {
      await api.delete(`/host/jobs/${jobId}${permanent ? '/permanent' : ''}`)
      setDeleteConfirm(null); fetchAll()
    } catch (e) { console.error(e) }
  }

  const filteredJobs = jobs.filter(j =>
    filterActive === 'all' ? true : filterActive === 'active' ? j.is_active : !j.is_active
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-50)' }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Listings', value: stats.total_jobs,    icon: '📋', color: 'var(--blue-600)' },
            { label: 'Active',         value: stats.active_jobs,   icon: '✅', color: '#16a34a' },
            { label: 'Inactive',       value: stats.inactive_jobs, icon: '⏸️', color: 'var(--slate-400)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, fontFamily: 'Fraunces, serif' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 500, marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilterActive(f)} style={{
                padding: '6px 16px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 500,
                border: `1.5px solid ${filterActive === f ? 'var(--blue-400)' : 'var(--slate-200)'}`,
                background: filterActive === f ? 'var(--blue-50)' : 'var(--white)',
                color: filterActive === f ? 'var(--blue-700)' : 'var(--slate-500)',
                textTransform: 'capitalize', cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius)', background: 'var(--blue-600)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
            <span style={{ fontSize: '1.1rem' }}>+</span> Post a Job
          </button>
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--blue-200)', borderTopColor: 'var(--blue-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>No listings yet</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Post your first job to start attracting candidates</p>
            <button onClick={openCreate} style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius)', background: 'var(--blue-600)', color: 'white', fontWeight: 600 }}>Post a Job</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredJobs.map((job, i) => (
              <HostJobCard key={job.id} job={job} index={i}
                onEdit={() => openEdit(job)}
                onDelete={() => setDeleteConfirm(job)}
                onViewApps={() => setViewApplications(job)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Applications modal ── */}
      {viewApplications && (
        <ApplicationsModal job={viewApplications} onClose={() => setViewApplications(null)} />
      )}

      {/* ── Create / Edit form modal ── */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {editJob ? 'Edit Listing' : 'Post a New Job'}
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {editJob ? 'Update the details below.' : 'Fill in the job details to attract the right candidates.'}
          </p>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Job Title"  name="title"   value={form.title}   onChange={handleChange} required />
              <FormField label="Company"    name="company" value={form.company} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Location" name="location" value={form.location} onChange={handleChange} required />
              <FormSelect label="Category" name="category" value={form.category} onChange={handleChange} options={CATEGORIES} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormSelect label="Job Type"         name="job_type"         value={form.job_type}         onChange={handleChange} options={JOB_TYPES} />
              <FormSelect label="Experience Level" name="experience_level" value={form.experience_level} onChange={handleChange} options={EXP_LEVELS} />
            </div>
            <div>
              <label style={lblStyle}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={5}
                placeholder="Describe the role, responsibilities, and requirements…"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <FormField label="Skills (comma-separated)" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Min Salary (INR)" name="salary_min" type="number" value={form.salary_min} onChange={handleChange} placeholder="e.g. 600000" />
              <FormField label="Max Salary (INR)" name="salary_max" type="number" value={form.salary_max} onChange={handleChange} placeholder="e.g. 1200000" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--blue-600)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--slate-700)', fontWeight: 500 }}>Listing is active (visible to job seekers)</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.75rem', borderRadius: 'var(--radius)', background: saving ? 'var(--slate-300)' : 'var(--blue-600)', color: 'white', fontWeight: 600 }}>
                {saving ? 'Saving…' : (editJob ? 'Save Changes' : 'Post Job')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} small>
          <div style={{ textAlign: 'center', padding: '0.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Remove listing?</h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <strong>"{deleteConfirm.title}"</strong><br />
              Deactivate keeps the record; delete removes it permanently.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--slate-800)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Deactivate (hide from seekers)</button>
              <button onClick={() => handleDelete(deleteConfirm.id, true)} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: '#dc2626', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Delete permanently</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 600, fontSize: '0.9rem' }}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Applications Modal ─────────────────────────────────────────────────────────

function ApplicationsModal({ job, onClose }) {
  const [apps, setApps]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    setLoading(true)
    setFetchError('')
    api.get(`/host/jobs/${job.id}/applications`)
      .then(r => {
        setApps(r.data.applications || [])
      })
      .catch(e => {
        console.error('Applications fetch error:', e)
        setFetchError(e.response?.data?.detail || 'Failed to load applications.')
      })
      .finally(() => setLoading(false))
  }, [job.id])

  const updateStatus = async (appId, newStatus) => {
    setUpdating(appId)
    try {
      const { data } = await api.patch(`/host/applications/${appId}/status?new_status=${newStatus}`)
      setApps(prev => prev.map(a => a.id === appId ? data : a))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const statusColors = {
    pending:     ['#fef3c7', '#92400e'],
    reviewed:    ['#dbeafe', '#1d4ed8'],
    shortlisted: ['#d1fae5', '#065f46'],
    rejected:    ['#fee2e2', '#991b1b'],
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1.5rem', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 720, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', animation: 'fadeIn 0.25s ease both' }}>

        {/* Header */}
        <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', color: 'var(--slate-900)' }}>Applications</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{job.title} · {job.company}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--slate-100)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '1.2rem', color: 'var(--slate-500)' }}>×</button>
        </div>

        <div style={{ padding: '1.5rem 2rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--blue-200)', borderTopColor: 'var(--blue-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : fetchError ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
              <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{fetchError}</p>
            </div>
          ) : apps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>No applications yet for this job.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
              {apps.map((app, i) => {
                const [bg, fg] = statusColors[app.status] || ['#f1f5f9', '#475569']
                return (
                  <div key={app.id} style={{ border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--slate-900)' }}>{app.full_name}</h3>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: bg, color: fg, textTransform: 'capitalize' }}>{app.status}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span>✉️ {app.email}</span>
                          <span>📞 {app.phone}</span>
                          {app.years_of_experience != null && <span>🎯 {app.years_of_experience} yrs exp</span>}
                        </div>
                        {app.resume_link && (
                          <a href={app.resume_link} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--blue-600)', fontWeight: 500 }}>
                            🔗 View Resume / Portfolio
                          </a>
                        )}
                        {app.cover_letter && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--slate-700)', lineHeight: 1.7, borderLeft: '3px solid var(--blue-200)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-400)', marginBottom: '0.4rem' }}>Cover Letter</div>
                            {app.cover_letter}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginLeft: '1rem', flexShrink: 0 }}>
                        {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Status action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {['reviewed', 'shortlisted', 'rejected'].filter(s => s !== app.status).map(s => (
                        <button key={s} onClick={() => updateStatus(app.id, s)} disabled={updating === app.id}
                          style={{
                            padding: '5px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                            border: `1.5px solid ${s === 'shortlisted' ? '#bbf7d0' : s === 'rejected' ? '#fecaca' : 'var(--slate-200)'}`,
                            background: s === 'shortlisted' ? '#f0fdf4' : s === 'rejected' ? '#fff5f5' : 'var(--white)',
                            color: s === 'shortlisted' ? '#166534' : s === 'rejected' ? '#dc2626' : 'var(--slate-600)',
                            opacity: updating === app.id ? 0.6 : 1, textTransform: 'capitalize',
                          }}>
                          {s === 'shortlisted' ? '✓ Shortlist' : s === 'rejected' ? '✗ Reject' : '👁 Mark Reviewed'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared components ──────────────────────────────────────────────────────────

function HostJobCard({ job, index, onEdit, onDelete, onViewApps }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: `1px solid ${job.is_active ? 'var(--slate-200)' : 'var(--slate-100)'}`, padding: '1.25rem 1.5rem', opacity: job.is_active ? 1 : 0.65, animation: `fadeIn 0.3s ease ${index * 0.04}s both`, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)' }}>{job.title}</h3>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: job.is_active ? '#dcfce7' : '#f1f5f9', color: job.is_active ? '#166534' : '#64748b' }}>
              {job.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>📍 {job.location}</span>
            <span style={{ textTransform: 'capitalize' }}>💼 {job.job_type}</span>
            <span style={{ textTransform: 'capitalize' }}>🎯 {job.experience_level}</span>
            {job.salary?.min && <span>💰 ₹{(job.salary.min / 100000).toFixed(1)}L+</span>}
          </div>
          {job.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
              {job.skills.slice(0, 4).map(s => (
                <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 99, background: 'var(--blue-50)', color: 'var(--blue-700)', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0 }}>
          <button onClick={onViewApps} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, border: '1.5px solid var(--blue-200)', background: 'var(--blue-50)', color: 'var(--blue-700)', cursor: 'pointer' }}>
            👥 Applications
          </button>
          <button onClick={onEdit} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, border: '1.5px solid var(--slate-200)', background: 'var(--white)', color: 'var(--slate-600)', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--blue-400)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--slate-200)'}>
            ✏️ Edit
          </button>
          <button onClick={onDelete} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, border: '1.5px solid #fecaca', background: '#fff5f5', color: '#dc2626', cursor: 'pointer' }}>
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

function Modal({ children, onClose, small }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: small ? 400 : 680, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', padding: '2rem', animation: 'fadeIn 0.25s ease both' }}>
        {children}
      </div>
    </div>
  )
}

const lblStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }

function FormField({ label, name, type = 'text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label style={lblStyle}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
        style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.9rem', color: 'var(--slate-800)' }} />
    </div>
  )
}

function FormSelect({ label, name, value, onChange, options }) {
  return (
    <div>
      <label style={lblStyle}>{label}</label>
      <select name={name} value={value} onChange={onChange}
        style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--slate-200)', fontSize: '0.9rem', color: 'var(--slate-800)', background: 'var(--white)', cursor: 'pointer' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}