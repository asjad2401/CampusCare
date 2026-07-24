import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true, emailVerified: true, banned: true },
  })

  if (!user || user.banned) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({ user })
}
