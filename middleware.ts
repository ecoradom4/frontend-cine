import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for an admin route
  if (pathname.startsWith("/admin")) {
    // Get user data from localStorage (in a real app, this would be from cookies/JWT)
    // For now, we'll let the client-side RoleGuard handle the protection
    // since we can't access localStorage in middleware

    // In a production app, you would:
    // 1. Check for authentication token in cookies
    // 2. Verify the token and extract user role
    // 3. Redirect if unauthorized

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
