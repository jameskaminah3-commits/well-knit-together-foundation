import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-art";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { roleLabels } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

export const metadata = { title: "Workspace", robots: { index: false, follow: false } };

type NavItem = { href: string; label: string; roles?: AppRole[] };

const personal: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/support/requests", label: "My support requests" },
  { href: "/dashboard/giving", label: "My giving" },
  { href: "/dashboard/orders", label: "My orders" },
  { href: "/dashboard/volunteer", label: "My volunteering", roles: ["volunteer"] },
  { href: "/dashboard/partner", label: "Partner workspace", roles: ["partner"] },
  { href: "/dashboard/account", label: "My account" },
  { href: "/dashboard/security", label: "Security" },
];

const staff: NavItem[] = [
  { href: "/dashboard/support", label: "Support cases", roles: ["program_manager", "admin", "superadmin"] },
  { href: "/dashboard/engagement", label: "Engagement", roles: ["program_manager", "marketplace_manager", "admin", "superadmin"] },
  { href: "/dashboard/reporting", label: "Reporting", roles: ["program_manager", "finance", "admin", "superadmin"] },
  { href: "/dashboard/content", label: "Content studio", roles: ["content_editor", "admin", "superadmin"] },
  { href: "/dashboard/content/media", label: "Media library", roles: ["content_editor", "admin", "superadmin"] },
  { href: "/dashboard/shop", label: "Shop", roles: ["marketplace_manager", "finance", "admin", "superadmin"] },
  { href: "/dashboard/finance", label: "Finance", roles: ["finance", "admin", "superadmin"] },
  { href: "/dashboard/admin", label: "Administration", roles: ["admin", "superadmin"] },
  { href: "/dashboard/communications", label: "Communications", roles: ["admin", "superadmin"] },
  { href: "/dashboard/settings/payments", label: "Payment settings", roles: ["superadmin"] },
];

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const requestHeaders = await headers();
    const pathname = requestHeaders.get("x-pathname") ?? requestHeaders.get("next-url");
    const nextPath = pathname === "/dashboard" || pathname?.startsWith("/dashboard/") ? pathname : "/dashboard";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (roleRows ?? []).map((row) => row.role as AppRole);
  const visible = (items: NavItem[]) => items.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
  const staffItems = visible(staff);

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/dashboard"><BrandMark size={40} /><span><strong>Well Knit Together</strong><small>Secure workspace</small></span></Link>
        <nav className="dashboard-nav" aria-label="Workspace navigation">
          <span className="dashboard-nav-label">Your space</span>
          {visible(personal).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          {staffItems.length > 0 && <span className="dashboard-nav-label">Staff tools</span>}
          {staffItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          <span className="dashboard-nav-label">Help</span>
          <Link href="/dashboard/roles">Roles and permissions</Link>
        </nav>
        <div className="dashboard-user">
          <span className="dashboard-user-label">Signed in as</span>
          <strong>{user.email}</strong>
          <div className="role-list">{roles.length ? roles.map((role) => <span className="role-chip" key={role}>{roleLabels[role] ?? role}</span>) : <span className="role-chip role-chip-muted">Supporter</span>}</div>
          <SignOutButton />
        </div>
      </aside>
      <main className="dashboard-content">{children}</main>
    </div>
  );
}
