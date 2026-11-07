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

  const body = await request.json().catch(() => null) as { email?: string; role?: AppRole } | null;
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role;
  if (!email || !email.includes("@") || !role || !staffRoles.includes(role)) {
    return NextResponse.json({ error: "A valid email and staff role are required." }, { status: 400 });
  }
  if (role === "superadmin" && !actor.roles.includes("superadmin")) {
    return NextResponse.json({ error: "Only a superadmin can invite another superadmin." }, { status: 403 });
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`;
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inviteError || !invitation.user) return NextResponse.json({ error: inviteError?.message ?? "Invitation failed." }, { status: 400 });

  const { error: roleError } = await admin.from("user_roles").insert({ user_id: invitation.user.id, role });
  if (roleError) return NextResponse.json({ error: `Invitation sent, but role assignment failed: ${roleError.message}` }, { status: 500 });

  await admin.from("staff_invitations").insert({ email, role, invited_by: actor.user.id, auth_user_id: invitation.user.id });
  await admin.from("audit_logs").insert({ actor_id: actor.user.id, action: "staff_invited", entity_type: "user", entity_id: invitation.user.id, metadata: { email, role } });
  return NextResponse.json({ ok: true });
}
