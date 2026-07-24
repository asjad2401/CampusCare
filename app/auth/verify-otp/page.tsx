'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

function OtpForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') || ''
  const purpose = params.get('purpose') as 'signup' | 'login' || 'signup'

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: code, purpose }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Invalid OTP'); setOtp(['','','','','','']); inputs.current[0]?.focus(); return }
    router.push('/')
    router.refresh()
  }

  async function resend() {
    setResending(true)
    const endpoint = purpose === 'signup' ? '/api/auth/register' : '/api/auth/login'
    // We need credentials — for resend we just notify user to retry login
    setResending(false); setResent(true); setCountdown(60)
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to<br />
              <strong style={{ color: 'var(--accent-light)' }}>{email}</strong>
            </p>
          </div>
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {error && <div className="alert alert-error">{error}</div>}
                {resent && <div className="alert alert-info">Please go back and sign in again to resend.</div>}
                <div className="otp-container" onPaste={handlePaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i} ref={el => { inputs.current[i] = el }}
                      className={`otp-input ${d ? 'filled' : ''}`}
                      maxLength={1} value={d} inputMode="numeric"
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                    />
                  ))}
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                  {loading ? <><span className="spinner" />Verifying…</> : 'Verify Code →'}
                </button>
              </form>
            </div>
          </div>
          <p className="auth-footer" style={{ marginTop: 16 }}>
            {countdown > 0
              ? <span style={{ color: 'var(--text-muted)' }}>Resend in {countdown}s</span>
              : <button onClick={resend} disabled={resending} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Resend code</button>
            }
          </p>
        </div>
      </div>
    </>
  )
}

export default function VerifyOtpPage() {
  return <Suspense><OtpForm /></Suspense>
}
