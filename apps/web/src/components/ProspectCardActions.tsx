"use client";

import { useState } from "react";

interface Props {
  previewUrl: string;
  brandName: string;
  brandSlug: string;
}

export function ProspectCardActions({ previewUrl, brandName, brandSlug }: Props) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: prompt
      window.prompt("Copy this URL:", previewUrl);
    }
  };

  // Pre-built mailto with the standard pitch
  const subject = `${brandName} — branded placement on VacationDeals.to`;
  const body = `Hi —

We're sending a meaningful amount of traffic to your brand from VacationDeals.to. To show you what a branded placement would look like, I had our team mock up a banner specifically for ${brandName}.

It's only visible via this unique link (won't show to anyone else):
${previewUrl}

Two-line pitch:
  • Header banner above the fold, all 36 brands and 80+ destinations on the site
  • First month free if we hit a fit. Standard rate: \$2,500/mo header, \$1,500/mo hero

Worth a 15-min call?

—`;
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copyUrl}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {copied ? "✓ Copied" : "Copy URL"}
      </button>
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Open preview ↗
      </a>
      <a
        href={mailto}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
      >
        Open pitch email →
      </a>
      <a
        href={`/admin/prospects/${brandSlug}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
      >
        Research dossier
      </a>
    </div>
  );
}
