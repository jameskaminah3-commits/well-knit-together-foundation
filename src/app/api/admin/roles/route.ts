import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminActor, hasAdminAccess } from "@/lib/auth/admin-access";
import { staffRoles } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasAdminAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Admin access requires a verified authenticator session." }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server administration is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { userId?: string; role?: AppRole; operation?: "grant" | "revoke" } | null;
  const { userId, role, operation } = body ?? {};
  if (!userId || !role || !operation || !staffRoles.includes(role) || !["grant", "revoke"].includes(operation)) {
    return NextResponse.json({ error: "A user, staff role, and valid operation are required." }, { status: 400 });
  }
  if (userId === actor.user.id) return NextResponse.json({ error: "You cannot change your own administrative roles." }, { status: 400 });
  if (role === "superadmin" && !actor.roles.includes("superadmin")) return NextResponse.json({ error: "Only a superadmin can manage superadmin access." }, { status: 403 });

  if (operation === "grant") {
    const { error } = await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    if (role === "superadmin") {
      const { count, error: countError } = await admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "superadmin");
      if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });
      if ((count ?? 0) <= 1) return NextResponse.json({ error: "The final superadmin role cannot be removed." }, { status: 400 });
    }
    const { error } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({ actor_id: actor.user.id, action: `staff_role_${operation}`, entity_type: "user_role", metadata: { user_id: userId, role } });
  return NextResponse.json({ ok: true });
}
