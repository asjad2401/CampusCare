import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const isOwner = campaign.userId === session.sub
  const isAdmin = session.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (campaign.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 })
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })

  return NextResponse.json({ campaign: updated })
}
