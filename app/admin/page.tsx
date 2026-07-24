'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

type Tab = 'pending' | 'active' | 'completed' | 'expired' | 'rejected' | 'users'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'ADMIN') router.push('/')
    })
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [router])

  useEffect(() => {
    setLoading(true)
    if (tab === 'users') {
      fetch('/api/admin/users').then(r => r.json()).then(d => {
        setUsersList(d.users || [])
        setLoading(false)
      })
    } else {
      fetch(`/api/admin/campaigns/stats?status=${tab.toUpperCase()}`).then(r => r.json())
        .then(d => { setCampaigns(d.campaigns || []); setLoading(false) })
    }
  }, [tab])

  async function action(id: string, act: 'approve' | 'reject' | 'remove') {
    setActionLoading(id + act)
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, reason: rejectReason[id] }),
    })
    if (res.ok) {
      setCampaigns(cs => cs.filter(c => c.id !== id))
      fetch('/api/admin/stats').then(r => r.json()).then(setStats)
    }
    setActionLoading(null)
  }

  const STATUS_CLASS: Record<string, string> = { ACTIVE: 'badge-green', PENDING: 'badge-yellow', COMPLETED: 'badge-blue', EXPIRED: 'badge-gray', REJECTED: 'badge-red' }
  const TABS: { key: Tab; label: string }[] = [
    { key: 'pending', label: `⏳ Pending (${stats?.pending ?? '…'})` },
    { key: 'active', label: `✅ Active (${stats?.active ?? '…'})` },
    { key: 'completed', label: `🎉 Completed (${stats?.completed ?? '…'})` },
    { key: 'expired', label: `⌛ Expired (${stats?.expired ?? '…'})` },
    { key: 'rejected', label: `❌ Rejected (${stats?.rejected ?? '…'})` },
    { key: 'users', label: `👥 Users (${stats?.users ?? '…'})` },
  ]

  return (
    <>
      <Navbar />
      <div className="container page">
        <div style={{ marginBottom: 32 }}>
          <h1 className="section-title">🛡️ Admin Dashboard</h1>
          <p className="section-subtitle">Review and moderate campaigns and registered users</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="admin-stats-grid">
            {[
              { label: 'Total', value: stats.total, color: 'var(--accent-light)' },
              { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
              { label: 'Active', value: stats.active, color: 'var(--success)' },
              { label: 'Completed', value: stats.completed, color: 'var(--info)' },
              { label: 'Expired', value: stats.expired, color: 'var(--text-muted)' },
              { label: 'Rejected', value: stats.rejected, color: 'var(--danger)' },
              { label: 'Users', value: stats.users, color: 'var(--accent-light)' },
            ].map(s => (
              <div key={s.label} className="admin-stat-card">
                <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`admin-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* Table View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
        ) : tab === 'users' ? (
          usersList.length === 0 ? (
            <div className="empty-state"><div className="empty-state-title">No users registered yet</div></div>
          ) : (
            <div className="card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Email Status</th>
                    <th>Campaigns Created</th>
                    <th>Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u: any) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-red' : u.role.includes('VERIFIED') ? 'badge-green' : 'badge-gray'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.emailVerified ? 'badge-green' : 'badge-yellow'}`}>
                          {u.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{u._count?.campaigns ?? 0}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : campaigns.length === 0 ? (
          <div className="empty-state"><div className="empty-state-title">All clear!</div></div>
        ) : (
          <div className="card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Creator</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/campaigns/${c.id}`} style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{c.title}</Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{(c.description?.replace(/<[^>]+>/g,'') || '').slice(0,80) + '...'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {c.user?.name} {c.isAnonymous && <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 500 }}>(Anonymous)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.user?.email}</div>
                    </td>
                    <td><span className="badge badge-purple" style={{ fontSize: 10 }}>{c.category}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(c.deadline).toLocaleDateString()}</td>
                    <td><span className={`badge ${STATUS_CLASS[c.status]}`}>{c.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.status === 'PENDING' && <>
                          <button className="btn btn-success btn-sm" onClick={() => action(c.id, 'approve')} disabled={actionLoading === c.id+'approve'}>
                            {actionLoading === c.id+'approve' ? <span className="spinner" /> : '✅ Approve'}
                          </button>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input className="form-input" style={{ width: 120, padding: '4px 8px', fontSize: 12 }} placeholder="Reason…" value={rejectReason[c.id] || ''} onChange={e => setRejectReason(r => ({ ...r, [c.id]: e.target.value }))} />
                            <button className="btn btn-danger btn-sm" onClick={() => action(c.id, 'reject')} disabled={actionLoading === c.id+'reject'}>
                              {actionLoading === c.id+'reject' ? <span className="spinner" /> : '❌ Reject'}
                            </button>
                          </div>
                        </>}
                        {c.status === 'ACTIVE' && (
                          <button className="btn btn-danger btn-sm" onClick={() => { const r = prompt('Reason for removal:'); if (r !== null) { setRejectReason(re => ({ ...re, [c.id]: r })); action(c.id, 'remove') } }}>
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
