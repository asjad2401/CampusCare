'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User { id: string; name: string; email: string; role: string }

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user))
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">Campus<span>Care</span></Link>
        <div className="navbar-links">
          <Link href="/" className="navbar-link">Browse</Link>
          {user && (user.role === 'STUDENT_VERIFIED' || user.role === 'NUST_VERIFIED' || user.role === 'ADMIN') && (
            <Link href="/campaigns/new" className="btn btn-primary btn-sm">New Campaign</Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="navbar-link">Admin</Link>
          )}
          {!user ? (
            <>
              <Link href="/auth/login" className="navbar-link">Sign In</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Join</Link>
            </>
          ) : (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="navbar-avatar" onClick={() => setMenuOpen(o => !o)} title={user.name}>{initials}</button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '46px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px', minWidth: '180px', boxShadow: 'var(--shadow)', zIndex: 200 }}>
                  <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                  <Link href="/profile" className="navbar-link" style={{ display: 'block', width: '100%', padding: '8px 12px' }} onClick={() => setMenuOpen(false)}>My Profile</Link>
                  <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign Out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
