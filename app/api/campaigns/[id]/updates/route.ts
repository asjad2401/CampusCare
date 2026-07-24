import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { updateSchema } from '@/lib/validations'
import { sanitizeHtml } from '@/lib/sanitize'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!
  const { id } = await params

  const updates = await prisma.campaignUpdate.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ updates })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const isOwner = campaign.userId === session.sub
  const isAdmin = session.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { content, remainingAmount } = parsed.data

  // Update remaining amount on campaign if provided
  if (remainingAmount !== undefined && remainingAmount !== null) {
    await prisma.campaign.update({
      where: { id },
      data: { remainingAmount },
    })
  }

  const update = await prisma.campaignUpdate.create({
    data: {
      campaignId: id,
      userId: session.sub,
      content: sanitizeHtml(content),
      remainingAmount: remainingAmount || null,
    },
  })

  return NextResponse.json({ update }, { status: 201 })
}
