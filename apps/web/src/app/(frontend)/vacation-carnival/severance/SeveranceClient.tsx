"use client";

import { useState } from "react";

type Stage = "intake" | "package" | "filed";

// 3 tone variants × 3 structure variants = 9 possible packets for uniqueness.
// We pick deterministically based on the form inputs so returning users get
// the same result (better for sharing).
const SEVERANCE_TEMPLATES = [
  {
    title: "Effective Immediately: A Declaration",
    intro: (reason: string, role: string) =>
      `This serves as my formal notice, effective immediately, that I will no longer be absorbing ${reason.toLowerCase()}. My role as ${role} will be terminated at the close of business today, with full benefits retained by me personally.`,
    body: (reason: string) =>
      `I have reviewed my ongoing responsibilities in light of the ${reason.toLowerCase()}, and have determined that my continued participation would constitute ongoing harm to myself, my family, and the small vestiges of a soul that remain at the end of each quarter. Severance is therefore calculated in favor of me, retroactive to 2021.`,
    closing: () => `I thank no one in particular. Please forward this to whoever cares.`,
  },
  {
    title: "Voluntary Separation Notice",
    intro: (reason: string, role: string) =>
      `After careful consideration of ${reason.toLowerCase()}, and in keeping with both my mental health and my remaining will to continue pretending, I am voluntarily separating from my position as ${role}.`,
    body: (reason: string) =>
      `The decision is final. No counter-offer, no retention bonus, no Q3 recalibration will alter this course. I have been extremely patient about ${reason.toLowerCase()}, and I have concluded that patience is not, in fact, a virtue — it is a liability. Vacation is now the only acceptable compensation.`,
    closing: () => `Sincerely, someone who finally gets it.`,
  },
  {
    title: "Termination of Willful Overwork — Executive Summary",
    intro: (reason: string, role: string) =>
      `Whereas the incumbent (hereinafter: me), serving in the capacity of ${role}, has demonstrated material forbearance concerning ${reason.toLowerCase()}, this document formalizes the immediate cessation of said forbearance.`,
    body: (reason: string) =>
      `Contractual analysis confirms that ${reason.toLowerCase()} was never part of the original engagement. Any obligation to endure same is herewith dissolved. Liberation value, payable exclusively in vacation time, is calculated below.`,
    closing: () => `Executed on this day, by me, for me, in an act of radical self-preservation.`,
  },
];

function pickTemplate(reason: string, role: string) {
  const hash = [...reason, ...role].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return SEVERANCE_TEMPLATES[hash % SEVERANCE_TEMPLATES.length];
}

function calcLiberationValue(tenure: number): number {
  // 8 vacation days per year of tenure, capped at 80.
  return Math.min(80, tenure * 8);
}

export function SeveranceClient() {
  const [stage, setStage] = useState<Stage>("intake");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [tenure, setTenure] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canGenerate = name && role && tenure && reason;

  const generate = () => {
    if (!canGenerate) return;
    setStage("package");
  };

  const file = async () => {
    if (!email || !consent) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "severance_generator",
          tcpaConsent: true,
          termsConsent: true,
          consentText: "I agree to the Terms and consent to promotional emails from VacationDeals.to.",
          metadata: { name, role, tenure, reason, liberationValue: calcLiberationValue(+tenure) },
        }),
      });
      setStage("filed");
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "intake") {
    return (
      <>
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">Human Resources Self-Service Portal</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
            Severance Package Generator
          </h1>
          <p className="mt-3 text-sm text-gray-700">
            Welcome, <span className="font-semibold">valued associate</span>. Please complete the following
            self-assessment to receive your personalized severance packet.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Self-Assessment Form</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-semibold text-gray-700">Your Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-gray-700">Current Role</span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Senior Brand Strategist"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-gray-700">Years of Tenure</span>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="e.g., 5"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="block font-semibold text-gray-700">Primary Reason You Want Out</span>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Being CC'd on every email; Perpetual reorgs; My boss's Slack pings at 10 PM"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-gray-500">Be specific. Specificity generates better packets.</span>
            </label>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="mt-5 w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate My Severance Packet →
          </button>
        </div>
      </>
    );
  }

  if (stage === "package") {
    const template = pickTemplate(reason, role);
    const liberationDays = calcLiberationValue(+tenure);
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return (
      <>
        {/* The severance packet — designed to look corporate-official */}
        <div className="mx-auto max-w-2xl border border-gray-400 bg-white p-8 shadow-lg" style={{ fontFamily: "'Georgia', serif" }}>
          <div className="mb-6 border-b-2 border-gray-800 pb-3 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Confidential · For Recipient Only</p>
            <h2 className="mt-1 text-2xl font-bold">{template.title}</h2>
            <p className="mt-1 text-xs text-gray-500">Issued {today}</p>
          </div>

          <p className="text-sm">
            <strong>TO:</strong> {name}
            <br />
            <strong>ROLE:</strong> {role}
            <br />
            <strong>TENURE:</strong> {tenure} year{+tenure !== 1 ? "s" : ""}
          </p>

          <hr className="my-4 border-gray-300" />

          <p className="text-base leading-relaxed">{template.intro(reason, role)}</p>
          <p className="mt-4 text-base leading-relaxed">{template.body(reason)}</p>

          <div className="my-6 rounded border-2 border-emerald-600 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-700">Liberation Value Calculated</p>
            <p className="mt-1 text-3xl font-black text-emerald-800">
              {liberationDays} days
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Payable in vacation time, to the recipient, upon their own authorization.
            </p>
          </div>

          <p className="text-base leading-relaxed">{template.closing()}</p>

          <hr className="my-5 border-gray-300" />

          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm text-gray-600">Signed,</p>
            <p className="rotate-[-4deg] border-2 border-emerald-700 px-4 py-1 text-sm font-bold uppercase tracking-widest text-emerald-700">
              APPROVED: ONE (1) REAL VACATION
            </p>
          </div>
          <p className="italic text-sm">{name}</p>
          <p className="text-xs text-gray-500">(Authorized to execute own severance on this day)</p>

          <p className="mt-6 text-xs italic text-gray-500">
            This is a satirical document from VacationDeals.to. It is not a legal notice of resignation. Use for
            entertainment, catharsis, or petty social-media posts only.
          </p>
        </div>

        {/* Claim CTA */}
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-lg">
          <h3 className="mb-3 text-xl font-bold text-gray-900">Claim Your Real Vacation</h3>
          <p className="mb-4 text-sm text-gray-600">
            The &quot;APPROVED&quot; stamp above entitles you to entry in our monthly severance-redemption drawing.
            Winners receive a real vacation package worth $399-$699 to the destination of their choice.
          </p>

          <label className="text-sm block">
            <span className="block font-medium text-gray-700">Email (for the drawing)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="mt-3 flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              I agree to the <a href="/terms" target="_blank" rel="noopener" className="text-blue-600 underline">Terms</a>
              {" "}&amp;{" "}
              <a href="/privacy" target="_blank" rel="noopener" className="text-blue-600 underline">Privacy Policy</a>,
              and consent to receive promotional emails.
            </span>
          </label>

          <button
            type="button"
            onClick={file}
            disabled={!email || !consent || submitting}
            className="mt-4 w-full rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Filing..." : "File My Severance Packet"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-10 text-center text-white shadow-2xl">
      <p className="text-6xl">📁</p>
      <h2 className="mt-3 text-3xl font-black">Packet Filed.</h2>
      <p className="mx-auto mt-4 max-w-md">
        Your severance notice is on file. Drawing on the 1st of each month.
        Check your inbox for a copy of the packet you can forward to friends, frenemies, or your group chat.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="/deals"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
        >
          Browse real deals →
        </a>
        <a
          href="/vacation-carnival"
          className="rounded-lg border-2 border-white px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          More carnival attractions
        </a>
      </div>
    </div>
  );
}
