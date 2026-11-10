"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/security/redirect";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function getNextPath() {
    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nextPath: getNextPath() }),
    });
    const result = await response.json().catch(() => null) as { error?: string; nextPath?: string } | null;
    if (!response.ok) {
      setError(result?.error ?? "We could not sign you in. Please try again.");
      setBusy(false);
      return;
    }
    window.location.assign(result?.nextPath ?? getNextPath());
  }

  async function sendMagicLink() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextPath())}`,
      },
    });
    if (magicLinkError) setError(magicLinkError.message);
    else setMessage("Check your email for a secure sign-in link.");
    setBusy(false);
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Secure access</p>
        <h1>Welcome back.</h1>
        <p className="form-note">Sign in to your Well Knit Together workspace.</p>
        <form className="form-stack" onSubmit={signIn}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
          {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
          <button className="button button-full" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="auth-links">
          <button className="text-button" type="button" onClick={sendMagicLink} disabled={busy}>Email me a sign-in link</button>
          <Link href="/forgot-password">Forgot your password?</Link>
          <Link href="/signup">Create an account</Link>
        </div>
      </div>
    </section>
  );
}
