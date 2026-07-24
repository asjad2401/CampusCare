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

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'

  const campaigns = await prisma.campaign.findMany({
    where: { status: status as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REJECTED' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ campaigns })
}
