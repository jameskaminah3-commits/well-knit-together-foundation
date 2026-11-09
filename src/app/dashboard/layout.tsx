import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { roleLabels } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

export const metadata = { title: "Workspace" };

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

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/dashboard"><span className="brand-mark">WKT</span><span><strong>Well Knit Together</strong><small>Secure workspace</small></span></Link>
        <nav className="dashboard-nav" aria-label="Workspace navigation">
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/account">My account</Link>
          <Link href="/dashboard/security">Security</Link>
          <Link href="/dashboard/orders">My orders</Link>
          {(roles.includes("donor") || roles.includes("finance") || roles.includes("admin") || roles.includes("superadmin")) && <Link href="/dashboard/giving">My giving</Link>}
          {(roles.includes("finance") || roles.includes("admin") || roles.includes("superadmin")) && <Link href="/dashboard/finance">Finance</Link>}
          {(roles.includes("admin") || roles.includes("superadmin")) && <Link href="/dashboard/admin">Administration</Link>}
          {(roles.includes("program_manager") || roles.includes("admin") || roles.includes("superadmin")) && <Link href="/dashboard/support">Support cases</Link>}
          {(roles.includes("program_manager") || roles.includes("marketplace_manager") || roles.includes("admin") || roles.includes("superadmin")) && <Link href="/dashboard/engagement">Engagement</Link>}
          {(roles.includes("program_manager") || roles.includes("finance") || roles.includes("admin") || roles.includes("superadmin")) && <Link href="/dashboard/reporting">Reporting & measurement</Link>}
          {roles.includes("partner") && <Link href="/dashboard/partner">Partner workspace</Link>}
          {(roles.includes("content_editor") || roles.includes("admin") || roles.includes("superadmin")) && <><Link href="/dashboard/content">Content studio</Link><Link href="/dashboard/content/media">Media library</Link></>}
        </nav>
        <div className="dashboard-user">
          <span className="dashboard-user-label">Signed in as</span>
          <strong>{user.email}</strong>
          <div className="role-list">{roles.length ? roles.map((role) => <span className="role-chip" key={role}>{roleLabels[role] ?? role}</span>) : <span className="role-chip role-chip-muted">Access pending</span>}</div>
          <SignOutButton />
        </div>
      </aside>
      <main className="dashboard-content">{children}</main>
    </div>
  );
}
