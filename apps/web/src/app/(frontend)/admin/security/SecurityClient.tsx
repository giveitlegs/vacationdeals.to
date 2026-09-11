"use client";

import { useState } from "react";

export function MfaManager({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState<"idle" | "enrolling">("idle");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/security/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setQr(data.qr); setSecret(data.secret); setStep("enrolling");
    } catch (e) { setError(String(e instanceof Error ? e.message : e)); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/security/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.reload();
    } catch (e) { setError(String(e instanceof Error ? e.message : e)); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (!confirm("Disable two-factor authentication?")) return;
    setBusy(true); setError("");
    try {
      await fetch("/api/admin/security/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      window.location.reload();
    } catch (e) { setError(String(e instanceof Error ? e.message : e)); }
    finally { setBusy(false); }
  };

  if (enabled) {
    return (
      <div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          ✅ Two-factor authentication is ON
        </p>
        <div>
          <button onClick={disable} disabled={busy}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? "…" : "Disable 2FA"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div>
        <p className="mb-3 text-sm text-gray-600">
          2FA is <strong>off</strong>. Enroll with any authenticator app (Google Authenticator, Authy, 1Password) to require a 6-digit code at login.
        </p>
        <button onClick={start} disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? "…" : "Enable 2FA"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <p className="mb-3 text-sm text-gray-600">1. Scan this QR with your authenticator app:</p>
      {qr && <img src={qr} alt="2FA QR code" className="mb-3 h-44 w-44 rounded border border-gray-200" />}
      <p className="mb-3 text-xs text-gray-500">
        Or enter this key manually: <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">{secret}</code>
      </p>
      <p className="mb-2 text-sm text-gray-600">2. Enter the current 6-digit code to confirm:</p>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456"
          inputMode="numeric" autoComplete="one-time-code"
          className="w-32 rounded border border-gray-300 px-3 py-2 text-sm tracking-widest" />
        <button onClick={verify} disabled={busy || code.length < 6}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "…" : "Confirm & enable"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
