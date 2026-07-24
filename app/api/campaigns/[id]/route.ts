import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { campaignSchema } from '@/lib/validations'
import { sanitizeHtml } from '@/lib/sanitize'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'
import { CampaignCategory } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { limited, response } = await withRateLimit(limiters.general, getClientIp(req))
  if (limited) return response!

  const { id } = await params
  const session = await getSession()

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      updates: { orderBy: { createdAt: 'desc' } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { comments: true } },
    },
  })

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  // Hide bank details from non-logged-in users
  const bankDetails = session
    ? {
        bankName: campaign.bankName,
        accountTitle: campaign.accountTitle,
        accountNumber: campaign.accountNumber,
        iban: campaign.iban,
        mobileWallet: campaign.mobileWallet,
      }
    : null

  return NextResponse.json({ campaign: { ...campaign, ...bankDetails } })
}

export async function PUT(req: NextRequest, { params }: Params) {
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

  const parsed = campaignSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const data = parsed.data
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: sanitizeHtml(data.description) }),
      ...(data.category && { category: data.category as CampaignCategory }),
      ...(data.customCategory !== undefined && { customCategory: data.customCategory }),
      ...(data.goalAmount !== undefined && { goalAmount: data.goalAmount }),
      ...(data.remainingAmount !== undefined && { remainingAmount: data.remainingAmount }),
      ...(data.deadline && { deadline: new Date(data.deadline) }),
      ...(data.bankName && { bankName: data.bankName }),
      ...(data.accountTitle && { accountTitle: data.accountTitle }),
      ...(data.accountNumber && { accountNumber: data.accountNumber }),
      ...(data.iban !== undefined && { iban: data.iban }),
      ...(data.mobileWallet !== undefined && { mobileWallet: data.mobileWallet }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  })

  return NextResponse.json({ campaign: updated })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const isOwner = campaign.userId === session.sub
  const isAdmin = session.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.campaign.delete({ where: { id } })
  return NextResponse.json({ message: 'Campaign deleted' })
}
