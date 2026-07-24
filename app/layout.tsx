import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'NUST Donate — Community Fundraising', template: '%s | NUST Donate' },
  description: 'A verified fundraising platform for the NUST community — post campaigns, support peers, and make a difference.',
  keywords: ['NUST', 'fundraising', 'donation', 'Pakistan', 'student'],
  authors: [{ name: 'NUST Donate' }],
  openGraph: {
    title: 'NUST Donate',
    description: 'Community fundraising for NUST students',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
