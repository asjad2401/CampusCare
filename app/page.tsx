'use client'
import { useState, useEffect, useCallback } from 'react'
import CampaignCard from '@/components/CampaignCard'
import Navbar from '@/components/Navbar'

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'MEDICAL_EMERGENCY', label: 'Medical Emergency' },
  { value: 'ACADEMIC_FEES', label: 'Academic Fees' },
  { value: 'ORPHANAGE', label: 'Orphanage' },
  { value: 'OLD_HOME', label: 'Old Home' },
  { value: 'COMMUNITY_SERVICE', label: 'Community Service' },
  { value: 'DISASTER_RELIEF', label: 'Disaster Relief' },
  { value: 'STUDENT_WELFARE', label: 'Student Welfare' },
  { value: 'OTHER', label: 'Other' },
]

interface Campaign {
  id: string; title: string; description: string; category: string;
  customCategory?: string; goalAmount?: number; remainingAmount?: number;
  status: string; deadline: string; imageUrl?: string;
  user: { name: string; id: string }; createdAt: string;
}

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('ALL')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [stats, setStats] = useState({ active: 0, total: 0 })

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ category, sort, page: String(page) })
    if (search) params.set('search', search)
    const res = await fetch(`/api/campaigns?${params}`)
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [category, sort, search, page])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setStats({ active: d.active, total: d.total })
    }).catch(() => {})
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="hero container">
          <div className="hero-grid fade-up">
            <div className="hero-content">
              <h1 className="hero-title">
                Direct community support for university students.
              </h1>
              <p className="hero-subtitle">
                CampusCare connects verified students directly with financial aid for tuition fees, emergency medical expenses, and student welfare.
              </p>
              <div className="hero-cta">
                <a href="/campaigns/new" className="btn btn-primary btn-lg">Start a Campaign</a>
              </div>
            </div>

            {/* How Verification & Aid Works (Process Flow) */}
            <div className="hero-trust-card fade-in">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                How Student Aid Works
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Step 1</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Verify Identity</strong>
                    Students sign up using their official university email (`.student.nust.edu.pk`).
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Step 2</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Submit Proof of Need</strong>
                    Campaign creators attach fee vouchers or medical bills for donor transparency.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Step 3</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Receive Direct Support</strong>
                    Donors send support straight to the student's verified bank account.
                  </div>
                </div>
              </div>

              {stats.active > 0 && (
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats.active}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Campaigns</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats.total}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Campaigns */}
        <section id="campaigns" className="container page" style={{ paddingTop: 0 }}>
          {/* Flat Filter Toolbar */}
          <div className="filters-bar">
            <form onSubmit={handleSearch} style={{ flex: 2, minWidth: 220 }}>
              <input
                className="filter-search"
                placeholder="Search campaigns by title or cause..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </form>
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Sort by</label>
              <select className="filter-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="deadline">Deadline Soonest</option>
                <option value="remaining">Most Urgent</option>
              </select>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setCategory('ALL'); setSort('newest'); setSearch(''); setSearchInput(''); setPage(1) }}>
              Reset
            </button>
          </div>

          {/* Results info */}
          {!loading && total > 0 && (
            <div style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
              Showing {campaigns.length} of {total} campaigns
              {search && <span> for "<strong style={{ color: 'var(--text-primary)' }}>{search}</strong>"</span>}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3 className="empty-state-title">No campaigns match your filters</h3>
              <p className="empty-state-text">Be the first verified student to create a campaign for this cause.</p>
              <a href="/campaigns/new" className="btn btn-secondary btn-sm">Create a campaign &rarr;</a>
            </div>
          ) : (
            <div className="campaigns-grid fade-in">
              {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
