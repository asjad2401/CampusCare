import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { sendOtpEmail } from '@/lib/email'
import { loginSchema } from '@/lib/validations'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

  // Send OTP for 2-step login
  const otp = generateOtp()
  await redis.set(`otp:login:${email}`, otp, { ex: 600 })
  try {
    await sendOtpEmail(email, otp, 'login')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP email'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }

  return NextResponse.json({ message: 'OTP sent to your email', email })
}
