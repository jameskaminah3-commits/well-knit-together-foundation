import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminActor, hasAdminAccess } from "@/lib/auth/admin-access";
import { communityRoles, staffRoles } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasAdminAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Admin access requires a verified authenticator session." }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server administration is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { userId?: string; role?: AppRole; operation?: "grant" | "revoke"; linkApplicationId?: string } | null;
  const { userId, role, operation, linkApplicationId } = body ?? {};
  const allowedRoles = [...staffRoles, ...communityRoles];
  if (!userId || !uuidPattern.test(userId) || !role || !operation || !allowedRoles.includes(role) || !["grant", "revoke"].includes(operation)) {
    return NextResponse.json({ error: "A user, role, and valid operation are required." }, { status: 400 });
  }
  if (linkApplicationId && !uuidPattern.test(linkApplicationId)) return NextResponse.json({ error: "That application could not be found." }, { status: 400 });
  if (userId === actor.user.id) return NextResponse.json({ error: "You cannot change your own roles." }, { status: 400 });
  if (role === "superadmin" && !actor.roles.includes("superadmin")) return NextResponse.json({ error: "Only a super administrator can manage super administrator access." }, { status: 403 });

  if (operation === "grant") {
    if (role === "partner") {
      if (!linkApplicationId) return NextResponse.json({ error: "Choose the approved partner organisation this person belongs to." }, { status: 400 });
      const { data: application } = await admin.from("partner_applications").select("id").eq("id", linkApplicationId).eq("status", "approved").maybeSingle();
      if (!application) return NextResponse.json({ error: "Only approved partner organisations can be linked." }, { status: 400 });
      const { error: membershipError } = await admin.from("partner_memberships").upsert({ partner_application_id: linkApplicationId, user_id: userId, membership_status: "active", created_by: actor.user.id }, { onConflict: "partner_application_id,user_id" });
      if (membershipError) return NextResponse.json({ error: "The partner organisation could not be linked." }, { status: 400 });
    }
    if (role === "volunteer" && linkApplicationId) {
      const { data: linked, error: linkError } = await admin.from("volunteer_applications").update({ applicant_id: userId }).eq("id", linkApplicationId).eq("status", "approved").or(`applicant_id.is.null,applicant_id.eq.${userId}`).select("id");
      if (linkError || !linked?.length) return NextResponse.json({ error: "That volunteer application is not approved or belongs to someone else." }, { status: 400 });
    }
    const { error } = await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    if (error) return NextResponse.json({ error: "The role could not be granted." }, { status: 400 });
  } else {
    if (role === "superadmin") {
      const { count, error: countError } = await admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "superadmin");
      if (countError) return NextResponse.json({ error: "Could not check super administrators." }, { status: 400 });
      if ((count ?? 0) <= 1) return NextResponse.json({ error: "The final super administrator cannot be removed." }, { status: 400 });
    }
    const { error } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return NextResponse.json({ error: "The role could not be removed." }, { status: 400 });
    if (role === "partner") await admin.from("partner_memberships").update({ membership_status: "ended" }).eq("user_id", userId).eq("membership_status", "active");
  }

  await admin.from("audit_logs").insert({ actor_id: actor.user.id, action: `role_${operation}`, entity_type: "user_role", metadata: { user_id: userId, role, linked_application_id: linkApplicationId ?? null } });
  return NextResponse.json({ ok: true });
}
