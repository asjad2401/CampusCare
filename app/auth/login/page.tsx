'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.push('/')
      router.refresh()
    } catch {
      setLoading(false)
      setError('Connection error. Please try again.')
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <div className="auth-logo">CampusCare</div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>
          <div className="card">
            <div className="card-body">
              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@example.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Your password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                  {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
                </button>
              </form>
            </div>
          </div>
          <p className="auth-footer">No account? <Link href="/auth/register">Register here</Link></p>
        </div>
      </div>
    </>
  )
}
