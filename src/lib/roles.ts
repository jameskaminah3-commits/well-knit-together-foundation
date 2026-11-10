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
  beneficiary: "Caregiver / beneficiary",
};

export const staffRoles: AppRole[] = [
  "superadmin",
  "admin",
  "program_manager",
  "finance",
  "marketplace_manager",
  "content_editor",
];

export const communityRoles: AppRole[] = ["donor", "partner", "volunteer", "beneficiary"];

export function isStaffRole(role: AppRole) {
  return staffRoles.includes(role);
}

export type RoleGuide = {
  role: AppRole;
  summary: string;
  canDo: string[];
  cannotDo: string[];
  workspaces: Array<{ label: string; href: string }>;
  assignedBy: string;
  requiresMfa: boolean;
};

/** Plain-language description of every role. Shown in the workspace and kept in docs/ROLES.md. */
export const roleGuide: RoleGuide[] = [
  {
    role: "superadmin",
    summary: "The foundation's most trusted account. Owns payment settings and can appoint other super administrators.",
    canDo: ["Everything an administrator can do", "Manage payment settings: Paybill, Till, bank details, M-Pesa credentials, and the online giving switch", "Grant or remove super administrator access", "See the full activity log"],
    cannotDo: ["Remove the last super administrator", "Change their own roles", "See M-Pesa secrets after they are saved"],
    workspaces: [{ label: "Payment settings", href: "/dashboard/settings/payments" }, { label: "Administration", href: "/dashboard/admin" }],
    assignedBy: "Another super administrator",
    requiresMfa: true,
  },
  {
    role: "admin",
    summary: "Runs the platform day to day: people and access, publishing approvals, communications, and oversight of every workspace.",
    canDo: ["Invite staff and grant or revoke roles (except super administrator)", "Link partner and volunteer accounts", "Approve content for publication and approve public impact figures", "Approve exports of case data", "See email delivery and the activity log", "Open every staff workspace"],
    cannotDo: ["Change payment settings", "Grant super administrator access", "Change their own roles"],
    workspaces: [{ label: "Administration", href: "/dashboard/admin" }, { label: "Communications", href: "/dashboard/communications" }],
    assignedBy: "Super administrator",
    requiresMfa: true,
  },
  {
    role: "program_manager",
    summary: "Looks after caregivers and families: support cases, referrals, partners, volunteers, events, and programme evidence.",
    canDo: ["Triage, assign, refer, and close support cases; add private case notes", "Review partner and volunteer applications and complete due diligence", "Assign partners and volunteers to programmes; mark event attendance", "Send in-app updates to partners, volunteers, or everyone", "Record indicator data and draft public impact figures"],
    cannotDo: ["See donations or orders", "Publish content or public figures without an administrator's approval", "Export case data without an administrator's approval"],
    workspaces: [{ label: "Support cases", href: "/dashboard/support" }, { label: "Engagement", href: "/dashboard/engagement" }, { label: "Reporting", href: "/dashboard/reporting" }],
    assignedBy: "Administrator or super administrator",
    requiresMfa: true,
  },
  {
    role: "finance",
    summary: "Keeps the money accountable: gifts, receipts, campaign totals, and order payments.",
    canDo: ["See every gift, receipt, and campaign total", "Record gifts received directly by Paybill, bank transfer, or cash so donors get a receipt", "Update marketplace order payment status", "See reporting data"],
    cannotDo: ["Change payment settings (super administrator only)", "See support cases", "Edit or delete a confirmed gift"],
    workspaces: [{ label: "Finance", href: "/dashboard/finance" }, { label: "Reporting", href: "/dashboard/reporting" }],
    assignedBy: "Administrator or super administrator",
    requiresMfa: true,
  },
  {
    role: "marketplace_manager",
    summary: "Runs the shop with the maker groups: products, prices, stock, and order fulfilment.",
    canDo: ["Add and edit products, prices, stock, and what is featured", "Move orders through paid, processing, and fulfilled with delivery notes", "Help with engagement: maker partners, volunteers, and events"],
    cannotDo: ["See donations or support cases", "Publish stories or news"],
    workspaces: [{ label: "Shop", href: "/dashboard/shop" }, { label: "Engagement", href: "/dashboard/engagement" }],
    assignedBy: "Administrator or super administrator",
    requiresMfa: true,
  },
  {
    role: "content_editor",
    summary: "Tells the foundation's story: programmes, stories, news, events, resources, reports, and translations.",
    canDo: ["Draft and edit programmes, stories, news, events, resources, and reports", "Add Kiswahili translations", "Upload consented photos to the media library", "Submit content for an administrator's review"],
    cannotDo: ["Publish without review", "See support cases, gifts, or orders"],
    workspaces: [{ label: "Content studio", href: "/dashboard/content" }, { label: "Media library", href: "/dashboard/content/media" }],
    assignedBy: "Administrator or super administrator",
    requiresMfa: true,
  },
  {
    role: "donor",
    summary: "A supporter who gives. Every signed-in person can see their own gifts; the donor role marks regular supporters.",
    canDo: ["See their own gifts and receipt numbers", "Choose which emails they receive", "Track their shop orders"],
    cannotDo: ["See other people's gifts or any private records"],
    workspaces: [{ label: "My giving", href: "/dashboard/giving" }],
    assignedBy: "Administrator (optional: anyone signed in can give)",
    requiresMfa: false,
  },
  {
    role: "partner",
    summary: "A member of an approved partner organisation that takes referrals or delivers part of a programme.",
    canDo: ["See programmes assigned to their organisation", "Accept, decline, or complete referrals sent to their organisation and record the outcome", "Read updates sent to partners"],
    cannotDo: ["See caregivers' contact details or case notes", "See other organisations' referrals"],
    workspaces: [{ label: "Partner workspace", href: "/dashboard/partner" }],
    assignedBy: "Administrator, after the organisation's application and due diligence are approved",
    requiresMfa: false,
  },
  {
    role: "volunteer",
    summary: "Someone giving time and skills: facilitation, therapy, interpretation, photography, or admin.",
    canDo: ["See their volunteer applications and assignments", "See events they registered for", "Read updates sent to volunteers"],
    cannotDo: ["See support cases or caregivers' details"],
    workspaces: [{ label: "My volunteering", href: "/dashboard/volunteer" }],
    assignedBy: "Administrator, after a programme manager approves the application",
    requiresMfa: false,
  },
  {
    role: "beneficiary",
    summary: "A caregiver or family member receiving support. Most caregivers never need an account; it simply lets them follow their requests.",
    canDo: ["Request support and follow the status of their own requests", "See events they registered for", "Choose which messages they receive, in English or Kiswahili"],
    cannotDo: ["See staff case notes or anyone else's information"],
    workspaces: [{ label: "My support requests", href: "/support/requests" }],
    assignedBy: "Administrator, with the caregiver's consent",
    requiresMfa: false,
  },
];
