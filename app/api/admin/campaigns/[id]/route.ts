import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { adminActionSchema } from '@/lib/validations'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

type Params = { params: Promise<{ id: string }> }

async function requireAdmin(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}

export async function GET(req: NextRequest) {
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!
  const { error } = await requireAdmin(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'

  const campaigns = await prisma.campaign.findMany({
    where: { status: status as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REJECTED' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!

  const { error } = await requireAdmin(req)
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = adminActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { action, reason } = parsed.data

  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  if (action === 'approve') {
    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE', rejectionReason: null },
    })
    return NextResponse.json({ campaign: updated })
  }

  if (action === 'reject') {
    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason || 'Does not meet guidelines' },
    })
    return NextResponse.json({ campaign: updated })
  }

  if (action === 'remove') {
    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ message: 'Campaign removed' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
