'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const CATEGORY_LABELS: Record<string, string> = {
  MEDICAL_EMERGENCY: 'Medical Emergency', ACADEMIC_FEES: 'Academic Fees',
  ORPHANAGE: 'Orphanage', OLD_HOME: 'Old Home',
  COMMUNITY_SERVICE: 'Community Service', DISASTER_RELIEF: 'Disaster Relief',
  STUDENT_WELFARE: 'Student Welfare', OTHER: 'Other',
}

function daysLeft(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
function fmt(d: string) { return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) }
function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [updateAmount, setUpdateAmount] = useState('')
  const [posting, setPosting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${id}`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([cd, ud]) => {
      setCampaign(cd.campaign)
      setUser(ud.user)
      setLoading(false)
    })
  }, [id])

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  async function postComment() {
    if (!comment.trim()) return
    setCommenting(true)
    const res = await fetch(`/api/campaigns/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    })
    if (res.ok) {
      const data = await res.json()
      setCampaign((c: any) => ({ ...c, comments: [data.comment, ...(c.comments || [])] }))
      setComment('')
    }
    setCommenting(false)
  }

  async function postUpdate() {
    if (!updateText.trim()) return
    setPosting(true)
    const res = await fetch(`/api/campaigns/${id}/updates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: updateText, remainingAmount: updateAmount ? parseFloat(updateAmount) : null }),
    })
    if (res.ok) {
      const data = await res.json()
      setCampaign((c: any) => ({ ...c, updates: [data.update, ...(c.updates || [])], remainingAmount: updateAmount ? parseFloat(updateAmount) : c.remainingAmount }))
      setUpdateText(''); setUpdateAmount(''); setShowUpdateForm(false)
    }
    setPosting(false)
  }

  async function markComplete() {
    if (!confirm('Mark this campaign as complete?')) return
    setCompleting(true)
    const res = await fetch(`/api/campaigns/${id}/complete`, { method: 'POST' })
    if (res.ok) { const d = await res.json(); setCampaign((c: any) => ({ ...c, status: d.campaign.status })) }
    setCompleting(false)
  }

  if (loading) return <><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div></>
  if (!campaign) return <><Navbar /><div className="container page"><div className="empty-state"><div className="empty-state-icon">❌</div><div className="empty-state-title">Campaign not found</div></div></div></>

  const isOwner = user && campaign.user?.id === user.id
  const isAdmin = user?.role === 'ADMIN'
  const days = daysLeft(campaign.deadline)
  const pct = campaign.goalAmount && campaign.remainingAmount != null
    ? Math.min(100, Math.round(((campaign.goalAmount - campaign.remainingAmount) / campaign.goalAmount) * 100)) : null
  const catLabel = campaign.category === 'OTHER' && campaign.customCategory ? campaign.customCategory : CATEGORY_LABELS[campaign.category] || campaign.category
  const STATUS_COLOR: Record<string, string> = { ACTIVE: 'badge-green', PENDING: 'badge-yellow', COMPLETED: 'badge-blue', EXPIRED: 'badge-gray', REJECTED: 'badge-red' }

  return (
    <>
      <Navbar />
      <div className="container page">
        {campaign.imageUrl
          ? <img src={campaign.imageUrl} alt={campaign.title} className="campaign-detail-img" />
          : <div className="campaign-detail-img-placeholder"><span style={{ fontSize: 20, letterSpacing: '1px', textTransform: 'uppercase' }}>{catLabel}</span></div>
        }

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '20px 0 8px', alignItems: 'center' }}>
          <span className={`badge ${STATUS_COLOR[campaign.status] || 'badge-gray'}`}>{campaign.status}</span>
          <span className="badge badge-purple">{catLabel}</span>
          {days <= 3 && campaign.status === 'ACTIVE' && <span className="badge badge-red">{days === 0 ? 'Expires today' : `${days}d left`}</span>}
        </div>

        <div className="campaign-detail-layout">
          {/* Main */}
          <div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>{campaign.title}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              by <strong style={{ color: 'var(--text-secondary)' }}>{campaign.user?.name}</strong> · {fmt(campaign.createdAt)} · Deadline: {fmt(campaign.deadline)}
            </div>

            {(isOwner || isAdmin) && campaign.status === 'ACTIVE' && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowUpdateForm(v => !v)}>Post Update</button>
                <button className="btn btn-success btn-sm" onClick={markComplete} disabled={completing}>{completing ? <span className="spinner" /> : 'Mark Complete'}</button>
              </div>
            )}

            {showUpdateForm && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ fontWeight: 700 }}>Post an Update</h4>
                  <textarea className="form-textarea" style={{ minHeight: 90 }} placeholder="Share progress with supporters…" value={updateText} onChange={e => setUpdateText(e.target.value)} />
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">New Remaining Amount (PKR) <span className="form-hint">optional</span></label>
                      <input className="form-input" type="number" placeholder="e.g. 15000" value={updateAmount} onChange={e => setUpdateAmount(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={postUpdate} disabled={posting}>{posting ? <span className="spinner" /> : 'Post'}</button>
                  </div>
                </div>
              </div>
            )}

            {pct !== null && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{pct}% raised</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6, color: 'var(--text-muted)' }}>
                  <span>Goal: PKR {campaign.goalAmount?.toLocaleString()}</span>
                  {campaign.remainingAmount != null && <span>Still needed: PKR {campaign.remainingAmount.toLocaleString()}</span>}
                </div>
              </div>
            )}

            <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 32, whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: campaign.description }} />

            {/* Updates */}
            {campaign.updates?.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h3 style={{ fontWeight: 800, marginBottom: 20 }}>Campaign Updates</h3>
                <div className="timeline">
                  {campaign.updates.map((u: any) => (
                    <div key={u.id} className="timeline-item">
                      <div className="timeline-line"><div className="timeline-dot" /><div className="timeline-connector" /></div>
                      <div className="timeline-content">
                        <div className="timeline-date">{relTime(u.createdAt)}</div>
                        <div className="timeline-text">{u.content}</div>
                        {u.remainingAmount && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--accent-light)', fontWeight: 600 }}>PKR {u.remainingAmount.toLocaleString()} still needed</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 20 }}>Comments ({campaign.comments?.length || 0})</h3>
              {user ? (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <div className="comment-avatar">{user.name?.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                    <input className="form-input" placeholder="Write a comment…" value={comment} onChange={e => setComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()} />
                    <button className="btn btn-primary btn-sm" onClick={postComment} disabled={commenting || !comment.trim()}>{commenting ? <span className="spinner" /> : 'Post'}</button>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  <a href="/auth/login" style={{ color: 'inherit', fontWeight: 600 }}>Sign in</a> to leave a comment.
                </div>
              )}
              {campaign.comments?.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No comments yet. Be the first to show support!</p>
                : campaign.comments?.map((c: any) => (
                    <div key={c.id} className="comment">
                      <div className="comment-avatar">{c.user?.name?.slice(0,2).toUpperCase()}</div>
                      <div className="comment-body">
                        <div className="comment-meta"><span className="comment-name">{c.user?.name}</span> · {relTime(c.createdAt)}</div>
                        <div className="comment-text">{c.content}</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Sidebar */}
          <div className="campaign-detail-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-card-title">Time Remaining</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: days <= 3 ? 'var(--danger)' : 'var(--accent-light)' }}>
                {days === 0 ? 'Expires Today' : `${days} days`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Deadline: {fmt(campaign.deadline)}</div>
            </div>

            {campaign.documentUrl && (
              <div className="sidebar-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div className="sidebar-card-title" style={{ color: 'var(--success)' }}>
                  Verification Document
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 12px', lineHeight: '1.5' }}>
                  Verification proof (fee slip, estimate, or document) attached for transparency.
                </p>
                <a
                  href={campaign.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', textAlign: 'center', display: 'block' }}
                >
                  View Proof Document →
                </a>
              </div>
            )}

            {!user ? (
              <div className="sidebar-card">
                <div className="sidebar-card-title">Payment Details</div>
                <div className="alert alert-info" style={{ fontSize: 13 }}>
                  <a href="/auth/login" style={{ color: 'inherit', fontWeight: 600 }}>Sign in</a> to view bank account details.
                </div>
              </div>
            ) : (
              <div className="sidebar-card">
                <div className="sidebar-card-title">How to Donate</div>
                {[
                  ['Bank', campaign.bankName],
                  ['Account Title', campaign.accountTitle],
                  ['Account Number', campaign.accountNumber],
                  campaign.iban ? ['IBAN', campaign.iban] : null,
                  campaign.mobileWallet ? ['Mobile Wallet', campaign.mobileWallet] : null,
                ].filter(Boolean).map(([label, value]: any) => (
                  <div key={label} className="bank-detail-row">
                    <div className="bank-detail-label">{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="bank-detail-value">{value}</div>
                      <button onClick={() => copy(value, label)} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === label ? 'var(--success)' : 'var(--text-muted)', padding: '2px 6px', fontSize: 12, borderRadius: 4 }}>
                        {copied === label ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(isOwner || isAdmin) && campaign.status === 'PENDING' && (
              <div className="alert alert-warning" style={{ fontSize: 13 }}>This campaign is awaiting admin approval.</div>
            )}
            {campaign.status === 'REJECTED' && (
              <div className="alert alert-error" style={{ fontSize: 13 }}>Rejected: {campaign.rejectionReason}</div>
            )}
            {campaign.status === 'COMPLETED' && (
              <div className="alert alert-success" style={{ fontSize: 13 }}>This campaign has been marked complete.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
