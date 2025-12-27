import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // If no password is set, allow access (development mode)
    if (!adminPassword) {
      return NextResponse.next();
    }

    // Check Authorization header (Basic auth)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Basic ")) {
      const base64Credentials = authHeader.substring(6);
      try {
        const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
        const [, password] = credentials.split(":");
        if (password === adminPassword) {
          return NextResponse.next();
        }
      } catch {
        // Invalid base64
      }
    }

    // Return 401 with Basic auth challenge
    return new NextResponse("Admin access required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Voice ELO Admin"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

