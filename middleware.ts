import { NextResponse, NextRequest } from 'next/server'

// Legacy redirects middleware
// Note: Auth checks are handled in page components (app/dashboard/page.tsx, etc.)
// to avoid loading Node.js dependencies (crypto, pg, etc.) in Edge runtime
export default function middleware(request: NextRequest) {
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/questioonaire/result',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}


