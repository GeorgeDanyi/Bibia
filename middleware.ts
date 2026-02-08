import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Legacy redirects middleware
function handleRedirects(request: NextRequest) {
  const url = request.nextUrl.clone()
  const from = url.pathname + (url.search || '')

  const redirects: { test: RegExp, to: string }[] = [
    { test: /^\/questioonaire\/result$/i, to: '/results' },
  ]

  for (const r of redirects) {
    if (r.test.test(url.pathname)) {
      const to = r.to
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Redirect: ${from} → ${to}`)
      }
      
      const res = NextResponse.redirect(new URL(to, request.url), 308)
      res.headers.set('x-redirect-from', from)
      res.headers.set('x-redirect-to', to)
      res.headers.set('x-redirect-referrer', request.headers.get('referer') || '')
      return res
    }
  }

  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Handle legacy redirects first
  const redirectResponse = handleRedirects(req)
  if (redirectResponse) {
    return redirectResponse
  }

  // Protect /dashboard - requires authentication
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /admin/* - requires authentication AND admin role
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin role
    const userRole = (session.user as any)?.role || 'patient'
    if (userRole !== 'admin') {
      const dashboardUrl = new URL('/dashboard', req.url)
      dashboardUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/questioonaire/result',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}


