import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'CampusCare — Student Community Fundraising', template: '%s | CampusCare' },
  description: 'A verified fundraising platform for students — post campaigns, support peers, and make a difference on campus.',
  keywords: ['campus', 'student', 'fundraising', 'donation', 'community', 'welfare'],
  authors: [{ name: 'CampusCare' }],
  openGraph: {
    title: 'CampusCare',
    description: 'Community fundraising for students',
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
