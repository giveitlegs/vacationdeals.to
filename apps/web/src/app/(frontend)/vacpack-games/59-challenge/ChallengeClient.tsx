"use client";

import { useState } from "react";
import { LeadGenPopup } from "@/components/LeadGenPopup";

interface Submission {
  name: string;
  email: string;
  destination: string;
  vacpackBrand: string;
  vacpackCost: string;
  foodCost: string;
  activitiesCost: string;
  transportCost: string;
  nights: string;
  story: string;
  instagramHandle: string;
  photoUrl: string;
  consent: boolean;
}

const EMPTY: Submission = {
  name: "",
  email: "",
  destination: "",
  vacpackBrand: "",
  vacpackCost: "",
  foodCost: "",
  activitiesCost: "",
  transportCost: "",
  nights: "3",
  story: "",
  instagramHandle: "",
  photoUrl: "",
  consent: false,
};

const EXAMPLE_SUBMISSIONS = [
  {
    name: "Sarah M.",
    destination: "Orlando, FL",
    brand: "Westgate",
    total: 178,
    story: "Drove from Atlanta. $59 vacpack, $40 gas, $50 groceries, $29 Universal CityWalk. Pool all day.",
    initials: "SM",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    name: "Derek P.",
    destination: "Las Vegas, NV",
    brand: "Wyndham",
    total: 195,
    story: "$99 vacpack, $20 Megabus, $45 food court + buffet, $31 happy hour drinks. Fountains = free.",
    initials: "DP",
    gradient: "from-red-400 to-pink-500",
  },
  {
    name: "The Ramirez Family (4)",
    destination: "Daytona Beach, FL",
    brand: "Hilton",
    total: 199,
    story: "$89 vacpack, beach = free, Walmart lunches, one nice dinner. Kids lost their minds at the pier.",
    initials: "TR",
    gradient: "from-emerald-400 to-teal-500",
  },
];

export function ChallengeClient() {
  const [form, setForm] = useState<Submission>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total =
    (+form.vacpackCost || 0) + (+form.foodCost || 0) + (+form.activitiesCost || 0) + (+form.transportCost || 0);
  const underLimit = total > 0 && total <= 200;
  const overLimit = total > 200;

  const update = <K extends keyof Submission>(k: K, v: Submission[K]) => setForm({ ...form, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          source: "59_challenge_submission",
          tcpaConsent: form.consent,
          termsConsent: form.consent,
          consentText: "I agree to the Terms & Conditions and consent to promotional emails. I confirm photos and details are my own.",
          metadata: {
            name: form.name,
            destination: form.destination,
            vacpack_brand: form.vacpackBrand,
            total_cost: total,
            nights: form.nights,
            story: form.story,
            instagram: form.instagramHandle,
            photo_url: form.photoUrl,
          },
        }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-10 text-center text-white shadow-2xl">
        <p className="text-6xl">🎉</p>
        <h2 className="mt-3 text-3xl font-black">Submission received!</h2>
        <p className="mx-auto mt-3 max-w-md">
          We&apos;ll review your ${total} trip within 48 hours. If approved, you&apos;ll be on the public vote board.
          Monthly winner announced on the 1st.
        </p>
      </div>
    );
  }

  return (
    <>
      <LeadGenPopup
        id="59-challenge-scroll"
        timeDelayMs={0}
        scrollPercent={0.6}
        exitIntent
        headline="Not Ready to Submit?"
        subheadline="Get the $59 Challenge starter kit: a 10-page PDF with budget templates + top 5 cheapest current vacpacks."
        ctaText="Send Me the Kit"
        source="59_challenge_starter"
      />

      {/* Past winners gallery */}
      <div className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">Recent submissions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {EXAMPLE_SUBMISSIONS.map((s) => (
            <div key={s.name} className={`rounded-xl bg-gradient-to-br ${s.gradient} p-4 text-white shadow-md`}>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                  {s.initials}
                </div>
                <div>
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="text-xs opacity-90">{s.destination}</p>
                </div>
              </div>
              <p className="mt-2 text-2xl font-black">${s.total}</p>
              <p className="mt-1 text-xs opacity-95">{s.story}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider opacity-80">via {s.brand}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Submission form */}
      <form onSubmit={submit} className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Submit your $59 Challenge</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" value={form.name} onChange={(v) => update("name", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <Field label="Destination" value={form.destination} onChange={(v) => update("destination", v)} required placeholder="e.g., Orlando, FL" />
          <Field label="VacPack brand" value={form.vacpackBrand} onChange={(v) => update("vacpackBrand", v)} placeholder="Westgate, Wyndham, etc." />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="VacPack $" type="number" value={form.vacpackCost} onChange={(v) => update("vacpackCost", v)} placeholder="59" />
          <Field label="Food $" type="number" value={form.foodCost} onChange={(v) => update("foodCost", v)} placeholder="40" />
          <Field label="Activities $" type="number" value={form.activitiesCost} onChange={(v) => update("activitiesCost", v)} placeholder="30" />
          <Field label="Transport $" type="number" value={form.transportCost} onChange={(v) => update("transportCost", v)} placeholder="50" />
        </div>

        {total > 0 && (
          <div className={`mt-4 rounded-lg p-4 text-center font-bold ${
            underLimit ? "bg-emerald-100 text-emerald-800" : overLimit ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
          }`}>
            Total: ${total} {underLimit && "✓ Under $200"} {overLimit && "⚠ Over $200 — doesn't qualify"}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Your story (1-2 sentences)</label>
          <textarea
            value={form.story}
            onChange={(e) => update("story", e.target.value)}
            rows={3}
            placeholder="What made this trip special? Any money-saving hacks?"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            required
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Instagram (optional)" value={form.instagramHandle} onChange={(v) => update("instagramHandle", v)} placeholder="@yourhandle" />
          <Field label="Photo URL (Imgur/Instagram post)" value={form.photoUrl} onChange={(v) => update("photoUrl", v)} placeholder="https://..." />
        </div>

        <label className="mt-5 flex items-start gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            These are my own photos &amp; numbers. I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener" className="text-blue-600 underline">Terms</a>{" "}
            and consent to promotional emails. VacationDeals.to may feature my submission on the site and social.
          </span>
        </label>

        <button
          type="submit"
          disabled={!underLimit || !form.consent || !form.name || !form.email || submitting}
          className="mt-5 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-sm font-bold text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit My $59 Challenge"}
        </button>

        {!underLimit && total > 0 && (
          <p className="mt-2 text-center text-xs text-red-600">Trim costs under $200 to qualify</p>
        )}
      </form>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}
