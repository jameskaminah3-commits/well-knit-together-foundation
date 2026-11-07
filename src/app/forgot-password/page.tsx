"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    if (resetError) setError(resetError.message);
    else setMessage("If an account exists for that email, a password reset link is on its way.");
    setBusy(false);
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your password.</h1>
        <p className="form-note">We will send a secure link to the email address associated with your account.</p>
        <form className="form-stack" onSubmit={requestReset}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
          {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
          <button className="button button-full" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
        <div className="auth-links"><Link href="/login">Return to sign in</Link></div>
      </div>
    </section>
  );
}
