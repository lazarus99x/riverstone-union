import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: { [key: string]: unknown } }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
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

  // Check if route is public
  const isPublic = publicRoutes.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/"),
  );
  const isNextInternal =
    pathname.startsWith("/_next") || pathname === "/favicon.ico";

  // --- Admin route — let page handle auth ---
  if (pathname.startsWith("/admin")) {
    return supabaseResponse;
  }

  // --- General auth protection for all other private routes ---
  if (!user && !isPublic && !isNextInternal) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
