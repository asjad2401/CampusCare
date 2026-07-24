import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { campaignSchema } from '@/lib/validations'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'
import { sanitizeHtml } from '@/lib/sanitize'
import { CampaignCategory, CampaignStatus, Prisma } from '@prisma/client'

const MAX_DEADLINE_DAYS = 30

export async function GET(req: NextRequest) {
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'ACTIVE'
  const sort = searchParams.get('sort') || 'newest'
  const search = searchParams.get('search') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 12

  const where: Prisma.CampaignWhereInput = {
    status: status as CampaignStatus,
    ...(category && category !== 'ALL' ? { category: category as CampaignCategory } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const orderBy: Prisma.CampaignOrderByWithRelationInput =
    sort === 'deadline'
      ? { deadline: 'asc' }
      : sort === 'oldest'
      ? { createdAt: 'asc' }
      : sort === 'remaining'
      ? { remainingAmount: 'asc' }
      : { createdAt: 'desc' }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        customCategory: true,
        goalAmount: true,
        remainingAmount: true,
        status: true,
        deadline: true,
        imageUrl: true,
        createdAt: true,
        user: { select: { name: true, id: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ])

  return NextResponse.json({ campaigns, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'NUST_VERIFIED' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only NUST-verified accounts can post campaigns' }, { status: 403 })
  }

  // Rate limit by user ID
  const { limited, response } = await withRateLimit(limiters.createCampaign, session.sub)
  if (limited) return response!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const data = parsed.data

  // Validate deadline
  const deadline = new Date(data.deadline)
  const maxDeadline = new Date(Date.now() + MAX_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
  if (deadline > maxDeadline) {
    return NextResponse.json({ error: `Deadline cannot exceed ${MAX_DEADLINE_DAYS} days` }, { status: 400 })
  }
  if (deadline < new Date()) {
    return NextResponse.json({ error: 'Deadline must be in the future' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.sub,
      title: data.title,
      description: sanitizeHtml(data.description),
      category: data.category as CampaignCategory,
      customCategory: data.customCategory || null,
      goalAmount: data.goalAmount || null,
      remainingAmount: data.remainingAmount || null,
      status: 'PENDING',
      deadline,
      bankName: data.bankName,
      accountTitle: data.accountTitle,
      accountNumber: data.accountNumber,
      iban: data.iban || null,
      mobileWallet: data.mobileWallet || null,
      imageUrl: data.imageUrl || null,
    },
  })

  return NextResponse.json({ campaign }, { status: 201 })
}
