import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, setSessionCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { limited, response } = await withRateLimit(limiters.login, ip)
  if (limited) return response!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  // Constant-time failure to prevent user enumeration
  if (!user || !user.emailVerified) {
    await bcrypt.compare(password, '$2a$12$dummyhashfortimingnopqrstuvwxyzABCDEFGHIJKLMN')
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (user.banned) {
    return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })

  await setSessionCookie(token)

  return NextResponse.json({
    message: 'Logged in successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
