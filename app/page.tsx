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
          <div className="hero-inner fade-up">
            <div className="hero-content">
              <div className="hero-badge">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                Student-Verified Peer Fundraising
              </div>
              <h1 className="hero-title">
                Direct community support for university students
              </h1>
              <p className="hero-subtitle">
                CampusCare connects verified students with direct financial support for tuition fees, emergency medical expenses, and essential student welfare.
              </p>
              <div className="hero-cta">
                <a href="/campaigns/new" className="btn btn-primary btn-lg">Start a Campaign</a>
                <a href="#campaigns" className="btn btn-ghost btn-lg">Browse Campaigns</a>
              </div>
            </div>

            {stats.active > 0 && (
              <div className="hero-stats fade-in">
                <div>
                  <div className="hero-stat-value">{stats.active}</div>
                  <div className="hero-stat-label">Active Campaigns</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 28 }}>
                  <div className="hero-stat-value">{stats.total}</div>
                  <div className="hero-stat-label">Total Completed</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Campaigns */}
        <section id="campaigns" className="container page" style={{ paddingTop: 16 }}>
          {/* Filters */}
          <div className="filters-bar">
            <form onSubmit={handleSearch} style={{ flex: 2, minWidth: 220 }}>
              <input
                className="filter-search"
                placeholder="Search by title, cause, or keywords…"
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
          {!loading && (
            <div style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: 14 }}>
              {total === 0 ? 'No campaigns found' : `Showing ${campaigns.length} of ${total} campaigns`}
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
              <div className="empty-state-title">No campaigns found</div>
              <p className="empty-state-text">Be the first to start a campaign for your cause.</p>
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
