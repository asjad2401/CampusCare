'use client'
import { useState } from 'react'

export default function StudentEmailGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      marginTop: '20px',
      background: 'rgba(124, 58, 237, 0.08)',
      border: '1px solid rgba(124, 58, 237, 0.25)',
      borderRadius: '12px',
      padding: '14px 16px',
      textAlign: 'left',
      transition: 'all 0.2s ease',
    }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--accent-light)',
          fontWeight: '600',
          fontSize: '13.5px',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          How to check your <strong>@student.nust.edu.pk</strong> inbox?
        </span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>{open ? '▲ Hide' : '▼ Show Guide'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed rgba(124, 58, 237, 0.2)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
            NUST student emails are hosted on <strong>Microsoft Office 365</strong>. Follow these 4 steps to add it to your Gmail app:
          </p>
          <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              Open the <strong>Gmail App</strong> on your phone (or go to <a href="https://gmail.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>gmail.com</a>).
            </li>
            <li>
              Tap your profile picture → Select <strong>"Add another account"</strong>.
            </li>
            <li>
              Select <strong>"Exchange and Office 365"</strong> (or <em>Outlook, Hotmail, and Live</em>).
            </li>
            <li>
              Enter your student email <em>(e.g., <code>ahmad.bscs21seecs@student.nust.edu.pk</code>)</em> and enter your student account password.
            </li>
          </ol>
          <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> Once set up, OTP emails from CampusCare will appear directly in your primary Gmail inbox or notifications!
          </div>
        </div>
      )}
    </div>
  )
}
