"use client";

import { useState, useTransition } from "react";

export function SublanderToggle({
  citySlug,
  modifierSlug,
  initialEnabled,
}: {
  citySlug: string;
  modifierSlug: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, start] = useTransition();

  const onClick = () => {
    const next = !enabled;
    setEnabled(next);
    start(async () => {
      try {
        const res = await fetch("/api/admin/sublanders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citySlug, modifierSlug, action: "toggle_enable" }),
        });
        if (!res.ok) setEnabled(!next);
      } catch {
        setEnabled(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={`Toggle ${modifierSlug} for ${citySlug}`}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
        enabled ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
