"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else setMessage("Your password has been updated. You can now use it to sign in.");
    setBusy(false);
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Choose a new password.</h1>
        <form className="form-stack" onSubmit={updatePassword}>
          <label>New password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></label>
          <label>Confirm password<input type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" /></label>
          {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
          {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
          <button className="button button-full" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
        </form>
        <div className="auth-links"><Link href="/login">Return to sign in</Link></div>
      </div>
    </section>
  );
}
