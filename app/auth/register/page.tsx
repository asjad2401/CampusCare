'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StudentEmailGuide from '@/components/StudentEmailGuide'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      router.push(`/auth/verify-otp?email=${encodeURIComponent(form.email)}&purpose=signup`)
    } catch {
      setLoading(false)
      setError('Connection error. Please try again.')
    }
  }

  const isNust = form.email.endsWith('@nust.edu.pk')

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <div className="auth-logo">CampusCare</div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join the student fundraising community</p>
          </div>
          <div className="card">
            <div className="card-body">
              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="Muhammad Ali" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Email Address</label>
                    <span style={{ fontSize: '11.5px', color: '#c4b5fd', background: 'rgba(124, 58, 237, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                      Campaign posters need student email
                    </span>
                  </div>
                  <input className="form-input" type="email" placeholder="you@nust.edu.pk"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  <span className="form-hint" style={{ marginTop: '6px', fontSize: '12.5px', display: 'block', color: isNust ? 'var(--success)' : 'var(--text-muted)' }}>
                    {isNust 
                      ? 'Verified student email detected — permissions to post campaigns will be enabled.' 
                      : 'Signing up with a .nust.edu.pk email is required to post campaigns. General emails can browse & donate.'}
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                  {loading ? <><span className="spinner" />Sending OTP…</> : 'Create Account →'}
                </button>
              </form>
              <StudentEmailGuide />
            </div>
          </div>
          <p className="auth-footer">Already have an account? <Link href="/auth/login">Sign in</Link></p>
        </div>
      </div>
    </>
  )
}
