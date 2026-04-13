import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow login page and all API routes (including auth)
  if (pathname === '/login' || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Protect all other routes
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
