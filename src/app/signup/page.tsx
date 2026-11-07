"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (signUpError) setError(signUpError.message);
    else if (data.session) router.push("/dashboard");
    else setMessage("Account created. Check your email to verify your address before signing in.");
    setBusy(false);
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Join the circle</p>
        <h1>Create your account.</h1>
        <p className="form-note">Public supporters can create an account. Staff and partner access is granted separately by an authorised administrator.</p>
        <form className="form-stack" onSubmit={signUp}>
          <label>Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required autoComplete="name" /></label>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></label>
          {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
          {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
          <button className="button button-full" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <div className="auth-links"><Link href="/login">Already have an account? Sign in</Link></div>
      </div>
    </section>
  );
}
