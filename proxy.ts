import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_ROUTES = ['/campaigns/new', '/profile']
const ADMIN_ROUTES = ['/admin']
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/verify-otp']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('nust_donate_session')?.value

  const session = token ? await verifyToken(token) : null

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some(r => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Protect campaign creation and profile
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    if (!session) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin-only routes
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/campaigns/new',
    '/profile',
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
  ],
}
