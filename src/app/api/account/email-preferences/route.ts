import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const preferenceKeys = ["event_updates", "support_updates", "giving_updates", "marketplace_updates", "impact_updates", "marketing_opt_in"] as const;
type PreferenceKey = (typeof preferenceKeys)[number];

const defaults: Record<PreferenceKey, boolean> = {
  event_updates: true,
  support_updates: true,
  giving_updates: true,
  marketplace_updates: true,
  impact_updates: true,
  marketing_opt_in: false,
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("email_preferences").select(preferenceKeys.join(", ")).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Email preferences are temporarily unavailable." }, { status: 503 });
  const saved = data as Partial<Record<PreferenceKey, boolean>> | null;
  return NextResponse.json({ preferences: { ...defaults, ...(saved ?? {}) } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const update: Record<string, boolean> = {};
  for (const key of preferenceKeys) {
    if (typeof payload?.[key] === "boolean") update[key] = payload[key] as boolean;
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "No preference changes were supplied." }, { status: 400 });
  const { data, error } = await supabase.from("email_preferences").upsert({ user_id: user.id, ...defaults, ...update, updated_at: new Date().toISOString() }).select(preferenceKeys.join(", ")).single();
  if (error) return NextResponse.json({ error: "We could not save your email preferences." }, { status: 400 });
  return NextResponse.json({ preferences: data });
}
