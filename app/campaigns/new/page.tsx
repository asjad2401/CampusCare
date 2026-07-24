'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const CATEGORIES = [
  { value: 'MEDICAL_EMERGENCY', label: 'Medical Emergency' },
  { value: 'ACADEMIC_FEES', label: 'Academic Fees' },
  { value: 'ORPHANAGE', label: 'Orphanage' },
  { value: 'OLD_HOME', label: 'Old Home' },
  { value: 'COMMUNITY_SERVICE', label: 'Community Service' },
  { value: 'DISASTER_RELIEF', label: 'Disaster Relief' },
  { value: 'STUDENT_WELFARE', label: 'Student Welfare' },
  { value: 'OTHER', label: 'Other (specify below)' },
]

function maxDate() {
  const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', category: 'MEDICAL_EMERGENCY', customCategory: '',
    goalAmount: '', remainingAmount: '', deadline: '',
    bankName: '', accountTitle: '', accountNumber: '', iban: '', mobileWallet: '',
    imageUrl: '', documentUrl: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const body = {
      ...form,
      goalAmount: form.goalAmount ? parseFloat(form.goalAmount) : null,
      remainingAmount: form.remainingAmount ? parseFloat(form.remainingAmount) : null,
      deadline: new Date(form.deadline).toISOString(),
      customCategory: form.category === 'OTHER' ? form.customCategory : undefined,
      iban: form.iban || null, mobileWallet: form.mobileWallet || null,
      imageUrl: form.imageUrl || null, documentUrl: form.documentUrl || null,
    }

    const res = await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Submission failed'); return }
    router.push(`/campaigns/${data.campaign.id}`)
  }

  return (
    <>
      <Navbar />
      <div className="container page">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="fade-up">
            <h1 className="section-title">Start a Campaign</h1>
            <p className="section-subtitle">Your campaign will be reviewed by an admin before going live.</p>
          </div>
          <div className="card" style={{ marginTop: 32 }}>
            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="alert alert-info">After submission, your campaign will be reviewed. You'll see it go live once approved.</div>

                <div className="form-group">
                  <label className="form-label">Campaign Title *</label>
                  <input className="form-input" placeholder="E.g., Help Ahmed cover his semester fee" value={form.title} onChange={e => set('title', e.target.value)} required />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {form.category === 'OTHER' && (
                    <div className="form-group">
                      <label className="form-label">Custom Category *</label>
                      <input className="form-input" placeholder="E.g., Sports tournament fund" value={form.customCategory} onChange={e => set('customCategory', e.target.value)} required />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Deadline * <span className="form-hint">(max 30 days)</span></label>
                    <input className="form-input" type="datetime-local" min={new Date().toISOString().slice(0,16)} max={maxDate()} value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" style={{ minHeight: 160 }} placeholder="Explain your cause in detail. Include who benefits, why you need funds, and how donations will be used." value={form.description} onChange={e => set('description', e.target.value)} required />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Goal Amount (PKR) <span className="form-hint">optional</span></label>
                    <input className="form-input" type="number" placeholder="50000" value={form.goalAmount} onChange={e => set('goalAmount', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount Still Needed (PKR) <span className="form-hint">optional</span></label>
                    <input className="form-input" type="number" placeholder="30000" value={form.remainingAmount} onChange={e => set('remainingAmount', e.target.value)} />
                  </div>
                </div>

                <hr className="divider" />
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Bank / Payment Details</h3>
                <p className="form-hint">These will only be visible to logged-in users.</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Bank Name *</label>
                    <input className="form-input" placeholder="HBL / Meezan / Jazz Cash" value={form.bankName} onChange={e => set('bankName', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Title *</label>
                    <input className="form-input" placeholder="Muhammad Ahmed" value={form.accountTitle} onChange={e => set('accountTitle', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number *</label>
                    <input className="form-input" placeholder="01234567890123" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IBAN <span className="form-hint">optional</span></label>
                    <input className="form-input" placeholder="PK36SCBL0000001123456702" value={form.iban} onChange={e => set('iban', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Wallet <span className="form-hint">optional</span></label>
                    <input className="form-input" placeholder="JazzCash/Easypaisa: 03001234567" value={form.mobileWallet} onChange={e => set('mobileWallet', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Campaign Image URL <span className="form-hint">optional</span></label>
                    <input className="form-input" type="url" placeholder="https://…" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Proof of Need / Verification Document URL <span className="form-hint">optional (e.g. fee slip, hospital estimate, ID proof link)</span></label>
                    <input className="form-input" type="url" placeholder="https://drive.google.com/... or image link" value={form.documentUrl} onChange={e => set('documentUrl', e.target.value)} />
                    <span className="form-hint" style={{ marginTop: '4px', display: 'block' }}>Providing verification documents increases donor trust significantly.</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" />Submitting…</> : 'Submit for Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
