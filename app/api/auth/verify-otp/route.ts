import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { signToken, setSessionCookie } from '@/lib/auth'
import { otpSchema } from '@/lib/validations'
import { limiters, withRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = otpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, otp, purpose } = parsed.data

  // Rate limit per email
  const { limited, response } = await withRateLimit(limiters.verifyOtp, `otp:${email}`)
  if (limited) return response!

  const key = `otp:${purpose}:${email}`
  const rawOtp = await redis.get<string | number>(key)
  const storedOtp = rawOtp !== null && rawOtp !== undefined ? String(rawOtp) : null

  if (!storedOtp || storedOtp !== otp) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
  }

  // Delete OTP after use (single-use)
  await redis.del(key)

  // Mark email as verified and get user
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  })

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })

  await setSessionCookie(token)

  return NextResponse.json({
    message: 'Verified successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
