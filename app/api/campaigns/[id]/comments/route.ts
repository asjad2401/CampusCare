import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { commentSchema } from '@/lib/validations'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!
  const { id } = await params

  const comments = await prisma.comment.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Both NUST_VERIFIED and DONOR can comment
  if (session.role === 'ADMIN' || session.role === 'NUST_VERIFIED' || session.role === 'DONOR') {
    // allowed
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit per user
  const { limited, response } = await withRateLimit(limiters.comment, session.sub)
  if (limited) return response!

  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Cannot comment on inactive campaigns' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      campaignId: id,
      userId: session.sub,
      content: parsed.data.content.slice(0, 500),
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
