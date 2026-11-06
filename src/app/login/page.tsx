import Link from "next/link";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="auth-shell"><div className="auth-card"><p className="eyebrow">Secure access</p><h1>Welcome back.</h1><p className="form-note">Authentication will be connected to Supabase Auth with role-aware portals and stronger protection for staff accounts.</p><div className="button-row"><Link className="button" href="/dashboard">Open workspace preview</Link><Link className="button button-secondary" href="/">Return home</Link></div></div></section>
  );
}
