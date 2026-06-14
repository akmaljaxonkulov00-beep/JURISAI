import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  // Temporarily allow all routes without authentication
  // This is to debug the infinite loading issue
  console.log('Proxy called for:', request.nextUrl.pathname);
  
  // Allow all routes to pass through
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
