import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware responsibilities:
 * 1. Refresh the Supabase session on every request (token rotation).
 * 2. Redirect unauthenticated users away from protected routes.
 * 3. Redirect authenticated users away from the auth pages.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // IMPORTANT: do NOT write any logic between createServerClient and
  // supabase.auth.getUser() – the cookie-setting closure below is load-bearing.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Authenticated users visiting /auth/* → home (home handles smart redirect)
  if (pathname.startsWith("/auth") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated users visiting protected routes → /auth/login
  const protectedPaths = ["/dashboard", "/onboarding"];
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
