import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/domain";

export async function getAdminActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as User | null, roles: [] as AppRole[], assuranceLevel: null as string | null };

  const [{ data: roleRows }, { data: assurance }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const roles = (roleRows ?? []).map((row) => row.role as AppRole);
  return { supabase, user, roles, assuranceLevel: assurance?.currentLevel ?? null };
}

export function hasAdminRole(roles: AppRole[]) {
  return roles.includes("admin") || roles.includes("superadmin");
}

export function hasAdminAccess(roles: AppRole[], assuranceLevel: string | null) {
  return hasAdminRole(roles) && assuranceLevel === "aal2";
}

export function hasContentAccess(roles: AppRole[], assuranceLevel: string | null) {
  return assuranceLevel === "aal2" && (roles.includes("content_editor") || hasAdminRole(roles));
}

export function hasCaseAccess(roles: AppRole[], assuranceLevel: string | null) {
  return assuranceLevel === "aal2" && (roles.includes("program_manager") || hasAdminRole(roles));
}

export function hasExportApprovalAccess(roles: AppRole[], assuranceLevel: string | null) {
  return hasAdminAccess(roles, assuranceLevel);
}
