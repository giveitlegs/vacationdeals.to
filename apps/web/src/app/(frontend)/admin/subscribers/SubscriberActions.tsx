"use client";

import { useState, useTransition } from "react";

export function SubscriberToolbar() {
  const [search, setSearch] = useState("");

  const exportCsv = () => {
    const qs = search ? `?q=${encodeURIComponent(search)}&format=csv` : "?format=csv";
    window.location.href = `/api/admin/subscribers${qs}`;
  };

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("q", search);
    else url.searchParams.delete("q");
    window.location.href = url.toString();
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <form onSubmit={onSearchSubmit} className="flex flex-1 gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, phone, name, source..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
          Search
        </button>
      </form>
      <button
        type="button"
        onClick={exportCsv}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Export CSV
      </button>
    </div>
  );
}

export function UnsubscribeButton({ email }: { email: string }) {
  const [pending, start] = useTransition();

  const onClick = () => {
    if (!confirm(`Unsubscribe ${email}? This removes them from all mailing lists.`)) return;
    start(async () => {
      await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", email }),
      });
      window.location.reload();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "..." : "Unsubscribe"}
    </button>
  );
}
