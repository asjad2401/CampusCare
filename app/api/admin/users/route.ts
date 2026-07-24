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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      banned: true,
      createdAt: true,
      _count: { select: { campaigns: true } },
    },
  })

  return NextResponse.json({ users })
}
