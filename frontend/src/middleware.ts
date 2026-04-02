import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ['/']; // Root is protected in this app
  
  if (protectedPaths.some(path => pathname === path) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to home if already logged in and hitting login/register
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register'],
};
