import type { AppRole } from "@/types/domain";

export const roleLabels: Record<AppRole, string> = {
  superadmin: "Super administrator",
  admin: "Administrator",
  program_manager: "Program manager",
  finance: "Finance",
  marketplace_manager: "Marketplace manager",
  content_editor: "Content editor",
  donor: "Donor",
  partner: "Partner",
  volunteer: "Volunteer",
  beneficiary: "Beneficiary",
};

export const staffRoles: AppRole[] = [
  "superadmin",
  "admin",
  "program_manager",
  "finance",
  "marketplace_manager",
  "content_editor",
];

export function isStaffRole(role: AppRole) {
  return staffRoles.includes(role);
}
