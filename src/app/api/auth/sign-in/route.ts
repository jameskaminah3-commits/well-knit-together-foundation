import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit, requestKey } from "@/lib/security/rate-limit";

function safeNextPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function POST(request: NextRequest) {
  const rate = consumeRateLimit(requestKey(request, "sign-in"), 8, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; nextPath?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email address and password." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, nextPath: safeNextPath(body?.nextPath) });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: "Those sign-in details were not recognized." }, { status: 401 });
  }

  return response;
}
