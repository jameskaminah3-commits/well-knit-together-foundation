import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit, requestKey } from "@/lib/security/rate-limit";
import { safeNextPath } from "@/lib/security/redirect";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; nextPath?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  // Limit guessing per account, with a looser cap per network so that staff
  // sharing an office connection, or a training room, are not locked out.
  const perAccount = consumeRateLimit(`${requestKey(request, "sign-in")}:${email.toLowerCase()}`, 8, 15 * 60 * 1000);
  const perNetwork = consumeRateLimit(requestKey(request, "sign-in-network"), 60, 15 * 60 * 1000);
  const rate = !perAccount.allowed ? perAccount : perNetwork;
  if (!perAccount.allowed || !perNetwork.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

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
