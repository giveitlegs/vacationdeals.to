"use client";

import { useState } from "react";

interface BrandOption {
  slug: string;
  name: string;
}

interface Props {
  brands: BrandOption[];
}

export function PitchSubmitForm({ brands }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: true; id: number } | { error: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const splitMulti = (raw: FormDataEntryValue | null): string[] =>
      typeof raw === "string"
        ? raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const num = (raw: FormDataEntryValue | null): number | undefined => {
      const n = typeof raw === "string" ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };
    const body = {
      brandSlug: (fd.get("brandSlug") as string) || undefined,
      locationCity: (fd.get("locationCity") as string) || undefined,
      resortName: (fd.get("resortName") as string) || undefined,
      attendedAt: (fd.get("attendedAt") as string) || undefined,
      durationMinutes: num(fd.get("durationMinutes")),
      pressureLevel: num(fd.get("pressureLevel")),
      presenterCount: num(fd.get("presenterCount")),
      managersBroughtIn: num(fd.get("managersBroughtIn")),
      closingOffer: (fd.get("closingOffer") as string) || undefined,
      pricesQuoted: splitMulti(fd.get("pricesQuoted")),
      notableQuotes: splitMulti(fd.get("notableQuotes")),
      story: (fd.get("story") as string) || "",
      didTheyBuy: fd.get("didTheyBuy") === "on",
      submitterEmail: (fd.get("submitterEmail") as string) || undefined,
    };
    try {
      const res = await fetch("/api/pitch-diaries/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; id?: number; error?: string };
      if (res.ok && json.ok) {
        setResult({ ok: true, id: json.id ?? 0 });
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
        <h2 className="text-2xl font-bold text-emerald-900">Submitted — thank you.</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-900">
          Your diary is queued for moderation (we review for personally identifying info before
          publishing). It'll appear at <code className="rounded bg-white px-1.5 py-0.5 text-xs">/pitch-diaries/{result.id}</code> once approved, usually within a day.
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

      <Section title="Where + when">
        <Field label="Which brand?" hint="Pick the closest match — or leave blank if it's not listed.">
          <select name="brandSlug" className={fieldStyle}>
            <option value="">— select brand —</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input type="text" name="locationCity" maxLength={100} className={fieldStyle} placeholder="e.g. Orlando" />
          </Field>
          <Field label="Resort name">
            <input type="text" name="resortName" maxLength={255} className={fieldStyle} placeholder="optional" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="When did you attend?">
            <input type="date" name="attendedAt" className={fieldStyle} />
          </Field>
          <Field label="How long was the pitch (minutes)?">
            <input type="number" name="durationMinutes" min={0} max={600} className={fieldStyle} placeholder="e.g. 120" />
          </Field>
        </div>
      </Section>

      <Section title="What happened">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pressure level (1-10)">
            <input type="number" name="pressureLevel" min={1} max={10} className={fieldStyle} placeholder="7" />
          </Field>
          <Field label="# of presenters">
            <input type="number" name="presenterCount" min={0} max={20} className={fieldStyle} placeholder="2" />
          </Field>
          <Field label="# of 'managers' brought in">
            <input type="number" name="managersBroughtIn" min={0} max={20} className={fieldStyle} placeholder="3" />
          </Field>
        </div>
        <Field label="Closing offer they landed on">
          <input type="text" name="closingOffer" maxLength={5000} className={fieldStyle} placeholder="e.g. $14,995 down + 9.9% / 10 yr" />
        </Field>
        <Field label="Every price they quoted (one per line)" hint="Help us track the price-ladder math. Include the openers and the discounts.">
          <textarea name="pricesQuoted" rows={3} className={fieldStyle} placeholder={"$67,900 (retail)\n$29,900 (today only)\n$14,995 (final)"} />
        </Field>
        <Field label="Notable quotes (one per line)" hint="The exact lines that stood out — pressure tactics, closing scripts, anything memorable.">
          <textarea name="notableQuotes" rows={4} className={fieldStyle} placeholder={"“If you walk out that door, this number disappears.”"} />
        </Field>
      </Section>

      <Section title="The story (required)">
        <Field label="Tell us what happened, start to finish" hint="80+ characters. Don't include names of presenters or any personal info — we may redact it on review.">
          <textarea
            name="story"
            rows={10}
            required
            minLength={80}
            maxLength={8000}
            className={fieldStyle}
            placeholder="We arrived at 9am for breakfast. They split couples up at 9:45..."
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <input type="checkbox" name="didTheyBuy" className="h-4 w-4 rounded border-gray-300" /> Yes, we ended up buying
        </label>
      </Section>

      <Section title="Optional contact (we won't publish it)">
        <Field label="Email" hint="Only if you want us to follow up with questions. Never published or shared.">
          <input type="email" name="submitterEmail" maxLength={255} className={fieldStyle} placeholder="you@example.com" />
        </Field>
      </Section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit my pitch story"}
      </button>
    </form>
  );
}

const fieldStyle =
  "w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

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
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
