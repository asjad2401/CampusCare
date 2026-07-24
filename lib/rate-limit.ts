import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'
import { NextRequest, NextResponse } from 'next/server'

// Pre-configured rate limiters for different endpoints
export const limiters = {
  // 5 requests per 15 minutes (registration)
  register: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:register',
  }),
  // 5 OTP attempts per 10 minutes per email
  verifyOtp: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'rl:verify-otp',
  }),
  // 10 login attempts per 15 minutes
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '15 m'),
    prefix: 'rl:login',
  }),
  // 10 campaign creations per hour per user
  createCampaign: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'rl:create-campaign',
  }),
  // 20 comments per hour per user
  comment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'rl:comment',
  }),
  // General API: 100 req/min per IP
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:general',
  }),
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function withRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ limited: boolean; response?: NextResponse }> {
  const { success, reset } = await limiter.limit(identifier)
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return {
      limited: true,
      response: NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Reset': String(reset),
          },
        }
      ),
    }
  }
  return { limited: false }
}
