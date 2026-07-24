import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!

  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Sync any NUST student accounts that were assigned DONOR by mistake
  await prisma.user.updateMany({
    where: {
      OR: [
        { email: { endsWith: '@nust.edu.pk' } },
        { email: { endsWith: '.nust.edu.pk' } },
      ],
      role: 'DONOR',
    },
    data: { role: 'STUDENT_VERIFIED' },
  })

  const [total, pending, active, completed, expired, rejected, users] = await Promise.all([
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: 'PENDING' } }),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.campaign.count({ where: { status: 'COMPLETED' } }),
    prisma.campaign.count({ where: { status: 'EXPIRED' } }),
    prisma.campaign.count({ where: { status: 'REJECTED' } }),
    prisma.user.count(),
  ])

  return NextResponse.json({ total, pending, active, completed, expired, rejected, users })
}
