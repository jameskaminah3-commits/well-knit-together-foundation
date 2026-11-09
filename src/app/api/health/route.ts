import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailDeliveryConfigured, emailWebhookConfigured } from "@/lib/email/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const emailConfigured = emailDeliveryConfigured();
  const emailWebhook = emailWebhookConfigured();
  if (!configured) {
    return NextResponse.json({ status: "degraded", service: "web", checks: { configuration: "missing", email: emailConfigured ? "ok" : "not_configured", email_webhook: emailWebhook ? "ok" : "not_configured" } }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("programs").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    const status = process.env.REQUIRE_EMAIL_DELIVERY === "true" && (!emailConfigured || !emailWebhook) ? "degraded" : "ok";
    return NextResponse.json({ status, service: "web", checks: { configuration: "ok", database: "ok", email: emailConfigured ? "ok" : "not_configured", email_webhook: emailWebhook ? "ok" : "not_configured" }, timestamp: new Date().toISOString() }, { status: status === "ok" ? 200 : 503 });
  } catch {
    return NextResponse.json({ status: "degraded", service: "web", checks: { configuration: "ok", database: "unavailable", email: emailConfigured ? "ok" : "not_configured", email_webhook: emailWebhook ? "ok" : "not_configured" }, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
