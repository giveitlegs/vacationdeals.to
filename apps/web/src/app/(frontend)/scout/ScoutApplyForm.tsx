"use client";

import { useState } from "react";

interface BrandOption {
  slug: string;
  name: string;
}

interface Props {
  brands: BrandOption[];
}

export function ScoutApplyForm({ brands }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: true } | { error: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const checked = brands
      .map((b) => b.slug)
      .filter((slug) => fd.get(`brand_${slug}`) === "on");
    const milesRaw = fd.get("willingToTravelMiles");
    const miles =
      typeof milesRaw === "string" && milesRaw.length > 0 ? parseInt(milesRaw, 10) : undefined;
    const body = {
      name: (fd.get("name") as string) || "",
      email: (fd.get("email") as string) || "",
      phone: (fd.get("phone") as string) || undefined,
      cityState: (fd.get("cityState") as string) || undefined,
      willingToTravelMiles: Number.isFinite(miles) ? miles : undefined,
      brandsExperienced: checked,
      whyInterested: (fd.get("whyInterested") as string) || undefined,
    };
    try {
      const res = await fetch("/api/scout/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setResult({ ok: true });
        (e.target as HTMLFormElement).reset();
      } else {
        setResult({ error: json.error ?? "Something went wrong." });
      }
    } catch {
      setResult({ error: "Network error. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (result && "ok" in result) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 ring-1 ring-emerald-200">
        <h2 className="text-2xl font-bold text-emerald-900">You're on the list.</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-900">
          We'll reach out within a few days. The first cohort of scouts gets first crack at the
          highest-priority pitches — we'll match you to brands by your location and the experience
          you flagged.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-4 rounded-full border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Submit another →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {result && "error" in result && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          {result.error}
        </div>
      )}

      <Section title="About you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input type="text" name="name" required maxLength={255} className={fieldStyle} />
          </Field>
          <Field label="Email" required>
            <input type="email" name="email" required maxLength={255} className={fieldStyle} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" hint="Optional. Easier for fast logistics.">
            <input type="tel" name="phone" maxLength={50} className={fieldStyle} />
          </Field>
          <Field label="Home city/state" hint="So we match pitches you can actually reach.">
            <input type="text" name="cityState" maxLength={100} className={fieldStyle} placeholder="e.g. Atlanta, GA" />
          </Field>
        </div>
        <Field label="How far would you travel?" hint="Vacpacks usually require travel to the property. Be honest.">
          <input
            type="number"
            name="willingToTravelMiles"
            min={0}
            max={5000}
            className={fieldStyle}
            placeholder="e.g. 300"
          />
        </Field>
      </Section>

      <Section title="Brand experience">
        <p className="mb-3 text-sm text-gray-600">
          Check any brands whose pitches you've already attended. We deprioritize matching you to
          ones you've already done — variety = better intelligence.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {brands.map((b) => (
            <label
              key={b.slug}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-indigo-400"
            >
              <input
                type="checkbox"
                name={`brand_${b.slug}`}
                className="h-4 w-4 rounded border-gray-300"
              />
              {b.name}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Why are you interested?">
        <Field label="Anything you want us to know" hint="Optional. Why does this appeal to you? Any constraints?">
          <textarea
            name="whyInterested"
            rows={5}
            maxLength={4000}
            className={fieldStyle}
            placeholder="Free vacations, side income, hate timeshare salespeople..."
          />
        </Field>
      </Section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Apply to the Scout Network"}
      </button>
      <p className="text-center text-xs text-gray-500">
        We'll never spam you. We'll never share your info. We'll reach out personally before
        anything happens.
      </p>
    </form>
  );
}

const fieldStyle =
  "w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <legend className="px-2 text-sm font-bold uppercase tracking-wider text-gray-700">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
