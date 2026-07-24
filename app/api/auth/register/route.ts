import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { sendOtpEmail } from '@/lib/email'
import { registerSchema } from '@/lib/validations'
import { limiters, getClientIp, withRateLimit } from '@/lib/rate-limit'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = getClientIp(req)
  const { limited, response } = await withRateLimit(limiters.register, ip)
  if (limited) return response!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid input' },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && existing.emailVerified) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Determine role
  const cleanEmail = email.trim().toLowerCase()
  const isNust = cleanEmail.endsWith('@nust.edu.pk') || cleanEmail.endsWith('.nust.edu.pk')
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = adminEmails.includes(cleanEmail)
  const role = isAdmin ? 'ADMIN' : isNust ? 'STUDENT_VERIFIED' : 'DONOR'

  // Upsert user (allow re-registration if not verified)
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: role as 'ADMIN' | 'STUDENT_VERIFIED' | 'DONOR', emailVerified: false },
    create: { email, name, passwordHash, role: role as 'ADMIN' | 'STUDENT_VERIFIED' | 'DONOR' },
  })

  // Generate OTP & store in Redis with 10-min TTL
  const otp = generateOtp()
  await redis.set(`otp:signup:${email}`, otp, { ex: 600 })

  try {
    await sendOtpEmail(email, otp, 'signup')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP email'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }

  return NextResponse.json({ message: 'OTP sent to your email', email })
}
