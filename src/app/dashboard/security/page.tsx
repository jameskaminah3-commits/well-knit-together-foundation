"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; factor_type: string; status: string };

export default function SecurityPage() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFactors() {
    const { data, error: listError } = await createClient().auth.mfa.listFactors();
    if (listError) setError(listError.message);
    else setFactors((data?.all ?? []) as Factor[]);
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (!active) return;
      if (listError) setError(listError.message);
      else setFactors((data?.all ?? []) as Factor[]);
    });
    return () => { active = false; };
  }, []);

  async function beginEnrollment() {
    setBusy(true);
    setError("");
    setMessage("");
    const { data, error: enrollError } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Well Knit Together Authenticator" });
    if (enrollError) setError(enrollError.message);
    else if (data) {
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setMessage("Scan the QR code with an authenticator app, then enter the six-digit code.");
    }
    setBusy(false);
  }

  async function verifyEnrollment() {
    if (!factorId || !code) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) setError(challengeError.message);
    else {
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (verifyError) setError(verifyError.message);
      else {
        setMessage("Authenticator verification complete. Your factor is now enrolled.");
        setQrCode("");
        setSecret("");
        setCode("");
        await loadFactors();
      }
    }
    setBusy(false);
  }

  return (
    <section className="dashboard-page narrow-page">
      <p className="eyebrow">Security</p>
      <h1>Protect your account.</h1>
      <p className="lead muted">Use an authenticator app to add a time-based one-time password to your account. Privileged staff enforcement will be enabled with the role administration phase.</p>
      {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
      {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
      <div className="info-card security-card">
        <p className="eyebrow">Authenticator app</p>
        <h3>{factors.some((factor) => factor.status === "verified") ? "Authenticator enabled" : "Add an authenticator"}</h3>
        <p>{factors.some((factor) => factor.status === "verified") ? "A verified authenticator factor is connected to this account." : "Use Google Authenticator, 1Password, Microsoft Authenticator, or another compatible app."}</p>
        {factors.filter((factor) => factor.status === "verified").map((factor) => <p className="security-factor" key={factor.id}><strong>Verified:</strong> {factor.friendly_name || "Authenticator app"}</p>)}
        {!qrCode && !factors.some((factor) => factor.status === "verified") && <button className="button" type="button" onClick={beginEnrollment} disabled={busy}>{busy ? "Preparing…" : "Set up authenticator"}</button>}
        {qrCode && <div className="mfa-enrollment"><Image src={qrCode} width={190} height={190} unoptimized alt="Authenticator setup QR code" /><p className="form-note">If scanning is unavailable, enter this setup key manually: <code>{secret}</code></p><label>Verification code<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" /></label><button className="button" type="button" onClick={verifyEnrollment} disabled={busy || code.length < 6}>{busy ? "Verifying…" : "Verify and enable"}</button></div>}
      </div>
      <p><Link className="text-link" href="/dashboard">Return to workspace</Link></p>
    </section>
  );
}
