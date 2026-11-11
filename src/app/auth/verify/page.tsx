"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/security/redirect";

/** Second step of sign-in for accounts with an authenticator app. */
export default function VerifyPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  function nextPath() {
    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/login?next=${encodeURIComponent(nextPath())}`); return; }
      const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level?.currentLevel === "aal2") { router.replace(nextPath()); return; }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((factor) => factor.status === "verified");
      if (!totp) { router.replace("/dashboard/security"); return; }
      if (active) { setFactorId(totp.id); setBusy(false); }
    })();
    return () => { active = false; };
  }, [router]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (verifyError) {
      setError("That code did not work. Check the time on your phone and try the newest code.");
      setBusy(false);
      return;
    }
    router.replace(nextPath());
    router.refresh();
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Two-step verification</p>
        <h1>Enter your code.</h1>
        <p className="form-note">Open your authenticator app and enter the six-digit code for Well Knit Together.</p>
        <form className="form-stack" onSubmit={verify}>
          <label>Verification code<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required autoFocus /></label>
          {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
          <button className="button button-full" type="submit" disabled={busy || code.length !== 6}>{busy && factorId ? "Checking…" : "Verify"}</button>
        </form>
        <div className="auth-links"><Link href="/dashboard">Continue without staff tools</Link><span className="form-note">Lost your phone? Ask an administrator to reset your authenticator.</span></div>
      </div>
    </section>
  );
}
