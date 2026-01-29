import { NextResponse, NextRequest } from 'next/server'
import { NextAuthOptions } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Note: Middleware in Next.js 14 cannot be async
// We'll use a simpler approach - let the page handle auth check

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

export function middleware(request: NextRequest) {
  // Handle legacy redirects first
  const redirectResponse = handleRedirects(request)
  if (redirectResponse) {
    return redirectResponse
  }

  // Note: Auth check is handled in the page component itself
  // Middleware in Next.js 14 doesn't support async operations easily
  // Protected routes will check auth in the page component
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/questioonaire/result',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}


