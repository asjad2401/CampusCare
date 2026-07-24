'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const CATEGORIES = [
  { value: 'BLOOD_DONATION', label: '🩸 Urgent Blood Donation Appeal' },
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    title: '', description: '', category: 'BLOOD_DONATION', customCategory: '',
    goalAmount: '', remainingAmount: '', deadline: '',
    bankName: '', accountTitle: '', accountNumber: '', iban: '', mobileWallet: '',
    imageUrl: '', documentUrl: '', isAnonymous: false,
  })

  const set = (k: string, v: any) => {
    setForm(f => ({ ...f, [k]: v }))
    if (fieldErrors[k]) {
      setFieldErrors(e => {
        const copy = { ...e }
        delete copy[k]
        return copy
      })
    }
  }

  function scrollToFirstError(errs: Record<string, string>) {
    const firstFieldKey = Object.keys(errs)[0]
    if (firstFieldKey) {
      const el = document.getElementById(`field-${firstFieldKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setFieldErrors({})

    const body = {
      ...form,
      goalAmount: form.goalAmount ? parseFloat(form.goalAmount) : null,
      remainingAmount: form.remainingAmount ? parseFloat(form.remainingAmount) : null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : '',
      customCategory: form.category === 'OTHER' ? form.customCategory : undefined,
      iban: form.iban || null, mobileWallet: form.mobileWallet || null,
      imageUrl: form.imageUrl || null, documentUrl: form.documentUrl || null,
      isAnonymous: Boolean(form.isAnonymous),
    }

    const res = await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Submission failed. Please fix the highlighted fields.')
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setFieldErrors(data.fieldErrors)
        scrollToFirstError(data.fieldErrors)
      }
      return
    }
    router.push(`/campaigns/${data.campaign.id}`)
  }

  return (
    <>
      <Navbar />
      <div className="container page">
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div className="fade-up">
            <h1 className="section-title">Start a Campaign</h1>
            <p className="section-subtitle">Your campaign will be reviewed by an admin before going live.</p>
          </div>
          <div className="card" style={{ marginTop: 32 }}>
            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="alert alert-info">After submission, your campaign will be reviewed by platform admins before going live.</div>

                <div className="form-group">
                  <label className="form-label">Campaign Title *</label>
                  <input
                    id="field-title"
                    className={`form-input ${fieldErrors.title ? 'input-error' : ''}`}
                    placeholder="E.g., Urgent O-Negative Blood Appeal for General Hospital"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    required
                  />
                  {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      id="field-category"
                      className={`form-select ${fieldErrors.category ? 'input-error' : ''}`}
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
                  </div>

                  {form.category === 'OTHER' && (
                    <div className="form-group">
                      <label className="form-label">Custom Category *</label>
                      <input
                        id="field-customCategory"
                        className={`form-input ${fieldErrors.customCategory ? 'input-error' : ''}`}
                        placeholder="E.g., Sports tournament fund"
                        value={form.customCategory}
                        onChange={e => set('customCategory', e.target.value)}
                        required
                      />
                      {fieldErrors.customCategory && <span className="field-error">{fieldErrors.customCategory}</span>}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Deadline * <span className="form-hint">(max 30 days)</span></label>
                    <input
                      id="field-deadline"
                      className={`form-input ${fieldErrors.deadline ? 'input-error' : ''}`}
                      type="datetime-local"
                      min={new Date().toISOString().slice(0,16)}
                      max={maxDate()}
                      value={form.deadline}
                      onChange={e => set('deadline', e.target.value)}
                      required
                    />
                    {fieldErrors.deadline && <span className="field-error">{fieldErrors.deadline}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    id="field-description"
                    className={`form-textarea ${fieldErrors.description ? 'input-error' : ''}`}
                    style={{ minHeight: 160 }}
                    placeholder="Explain your cause in detail. Include who benefits, hospital/location details if applicable, and how funds or blood donations will be handled."
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    required
                  />
                  {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Goal Amount (PKR) <span className="form-hint">optional</span></label>
                    <input
                      id="field-goalAmount"
                      className={`form-input ${fieldErrors.goalAmount ? 'input-error' : ''}`}
                      type="number"
                      placeholder="50000"
                      value={form.goalAmount}
                      onChange={e => set('goalAmount', e.target.value)}
                    />
                    {fieldErrors.goalAmount && <span className="field-error">{fieldErrors.goalAmount}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount Still Needed (PKR) <span className="form-hint">optional</span></label>
                    <input
                      id="field-remainingAmount"
                      className={`form-input ${fieldErrors.remainingAmount ? 'input-error' : ''}`}
                      type="number"
                      placeholder="30000"
                      value={form.remainingAmount}
                      onChange={e => set('remainingAmount', e.target.value)}
                    />
                    {fieldErrors.remainingAmount && <span className="field-error">{fieldErrors.remainingAmount}</span>}
                  </div>
                </div>

                <hr className="divider" />
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Bank / Payment Details</h3>
                <p className="form-hint">These will only be visible to logged-in users.</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Bank Name *</label>
                    <input
                      id="field-bankName"
                      className={`form-input ${fieldErrors.bankName ? 'input-error' : ''}`}
                      placeholder="HBL / Meezan / JazzCash"
                      value={form.bankName}
                      onChange={e => set('bankName', e.target.value)}
                      required
                    />
                    {fieldErrors.bankName && <span className="field-error">{fieldErrors.bankName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Title *</label>
                    <input
                      id="field-accountTitle"
                      className={`form-input ${fieldErrors.accountTitle ? 'input-error' : ''}`}
                      placeholder="Muhammad Ahmed"
                      value={form.accountTitle}
                      onChange={e => set('accountTitle', e.target.value)}
                      required
                    />
                    {fieldErrors.accountTitle && <span className="field-error">{fieldErrors.accountTitle}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Number *</label>
                    <input
                      id="field-accountNumber"
                      className={`form-input ${fieldErrors.accountNumber ? 'input-error' : ''}`}
                      placeholder="01234567890123"
                      value={form.accountNumber}
                      onChange={e => set('accountNumber', e.target.value)}
                      required
                    />
                    {fieldErrors.accountNumber && <span className="field-error">{fieldErrors.accountNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">IBAN <span className="form-hint">optional</span></label>
                    <input
                      id="field-iban"
                      className={`form-input ${fieldErrors.iban ? 'input-error' : ''}`}
                      placeholder="PK36SCBL0000001123456702"
                      value={form.iban}
                      onChange={e => set('iban', e.target.value)}
                    />
                    {fieldErrors.iban && <span className="field-error">{fieldErrors.iban}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Wallet <span className="form-hint">optional</span></label>
                    <input
                      id="field-mobileWallet"
                      className={`form-input ${fieldErrors.mobileWallet ? 'input-error' : ''}`}
                      placeholder="e.g. 03001234567"
                      value={form.mobileWallet}
                      onChange={e => set('mobileWallet', e.target.value)}
                    />
                    {fieldErrors.mobileWallet && <span className="field-error">{fieldErrors.mobileWallet}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Campaign Image URL <span className="form-hint">optional</span></label>
                    <input
                      id="field-imageUrl"
                      className={`form-input ${fieldErrors.imageUrl ? 'input-error' : ''}`}
                      type="url"
                      placeholder="https://…"
                      value={form.imageUrl}
                      onChange={e => set('imageUrl', e.target.value)}
                    />
                    {fieldErrors.imageUrl && <span className="field-error">{fieldErrors.imageUrl}</span>}
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Proof of Need / Verification Document URL <span className="form-hint">optional</span></label>
                    <input
                      id="field-documentUrl"
                      className={`form-input ${fieldErrors.documentUrl ? 'input-error' : ''}`}
                      type="url"
                      placeholder="https://drive.google.com/... or image link"
                      value={form.documentUrl}
                      onChange={e => set('documentUrl', e.target.value)}
                    />
                    {fieldErrors.documentUrl && <span className="field-error">{fieldErrors.documentUrl}</span>}
                  </div>
                </div>

                {/* Anonymous Posting Option */}
                <div className="card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.isAnonymous}
                        onChange={e => set('isAnonymous', e.target.checked)}
                        style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent-light)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Post campaign anonymously</span>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                          Your name will be displayed as <strong>"Anonymous Student"</strong> to public visitors and donors. Platform administrators will still be able to verify your identity for safety.
                        </p>
                      </div>
                    </label>
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
