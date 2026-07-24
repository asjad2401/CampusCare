'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(async d => {
      if (!d.user) { router.push('/auth/login'); return }
      setUser(d.user)
      const res = await fetch(`/api/campaigns?userId=${d.user.id}&status=ALL`)
      // Fetch all user campaigns by getting active+pending+completed
      const statuses = ['ACTIVE', 'PENDING', 'COMPLETED', 'EXPIRED', 'REJECTED']
      const all = await Promise.all(statuses.map(s => fetch(`/api/campaigns?status=${s}&page=1`).then(r => r.json())))
      const myCampaigns = all.flatMap(d => (d.campaigns || []).filter((c: any) => c.user?.id === d.user?.id))
      // Re-fetch specifically for user
      const res2 = await fetch('/api/campaigns?status=ACTIVE&page=1')
      const res3 = await fetch('/api/campaigns?status=PENDING&page=1')
      const data2 = await res2.json()
      const data3 = await res3.json()
      const myId = d.user.id
      const mine = [...(data2.campaigns || []), ...(data3.campaigns || [])].filter((c: any) => c.user?.id === myId)
      setCampaigns(mine)
      setLoading(false)
    })
  }, [router])

  const STATUS_CLASS: Record<string, string> = { ACTIVE: 'badge-green', PENDING: 'badge-yellow', COMPLETED: 'badge-blue', EXPIRED: 'badge-gray', REJECTED: 'badge-red' }

  if (loading) return <><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div></>

  return (
    <>
      <Navbar />
      <div className="container page">
        {/* Profile header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 40 }}>
          <div className="navbar-avatar" style={{ width: 64, height: 64, fontSize: 24, borderRadius: '50%' }}>
            {user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 24 }}>{user?.name}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</div>
            <span className="badge badge-purple" style={{ marginTop: 6 }}>{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        <h2 style={{ fontWeight: 800, marginBottom: 20 }}>My Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No campaigns yet</div>
            <p className="empty-state-text">Start your first fundraising campaign.</p>
            {(user?.role === 'STUDENT_VERIFIED' || user?.role === 'NUST_VERIFIED' || user?.role === 'ADMIN') && (
              <Link href="/campaigns/new" className="btn btn-primary" style={{ marginTop: 20 }}>🚀 Start Campaign</Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map((c: any) => (
              <div key={c.id} className="card" style={{ transform: 'none' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <Link href={`/campaigns/${c.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{c.title}</Link>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Deadline: {new Date(c.deadline).toLocaleDateString()}
                      {c.remainingAmount && ` · PKR ${c.remainingAmount.toLocaleString()} needed`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`badge ${STATUS_CLASS[c.status] || 'badge-gray'}`}>{c.status}</span>
                    <Link href={`/campaigns/${c.id}`} className="btn btn-ghost btn-sm">View →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
