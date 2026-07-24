import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Called by Vercel Cron: vercel.json { "crons": [{ "path": "/api/cron/expire-campaigns", "schedule": "0 0 * * *" }] }
export async function GET(req: NextRequest) {
  // Verify cron secret from Vercel
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Fallback: allow admin to trigger manually
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()

  // Expire overdue campaigns
  const expired = await prisma.campaign.updateMany({
    where: {
      status: 'ACTIVE',
      deadline: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  // Delete COMPLETED campaigns that have been complete for >24 hours
  const completedCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const deleted = await prisma.campaign.deleteMany({
    where: {
      status: 'COMPLETED',
      completedAt: { lt: completedCutoff },
    },
  })

  // Delete EXPIRED campaigns older than 7 days
  const expiredCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const deletedExpired = await prisma.campaign.deleteMany({
    where: {
      status: 'EXPIRED',
      deadline: { lt: expiredCutoff },
    },
  })

  return NextResponse.json({
    expired: expired.count,
    deleted: deleted.count,
    deletedExpired: deletedExpired.count,
    timestamp: now.toISOString(),
  })
}
