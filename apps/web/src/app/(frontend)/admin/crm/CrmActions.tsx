"use client";

import { useState, useTransition } from "react";

const LIFECYCLES = ["new", "engaged", "customer", "dormant"];
const STATUSES = ["active", "unsubscribed", "bounced", "spam"];

function currentParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URL(window.location.href).searchParams;
}

export function CrmToolbar({ q, status, lifecycle }: { q: string; status: string; lifecycle: string }) {
  const [search, setSearch] = useState(q);
  const [st, setSt] = useState(status);
  const [lc, setLc] = useState(lifecycle);
  const [includeUnsub, setIncludeUnsub] = useState(false);

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (st) p.set("status", st);
    if (lc) p.set("lifecycle", lc);
    window.location.href = `/admin/crm${p.toString() ? `?${p}` : ""}`;
  };

  const exportCsv = () => {
    const p = currentParams();
    if (includeUnsub) p.set("includeUnsub", "1");
    window.location.href = `/api/admin/crm/export?${p.toString()}`;
  };

  return (
    <form onSubmit={apply} className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search email, phone, name, source…"
        className="min-w-[220px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <select value={st} onChange={(e) => setSt(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={lc} onChange={(e) => setLc(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
        <option value="">All stages</option>
        {LIFECYCLES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
        Filter
      </button>
      <label className="flex items-center gap-1 text-xs text-gray-500">
        <input type="checkbox" checked={includeUnsub} onChange={(e) => setIncludeUnsub(e.target.checked)} />
        incl. unsubscribed in export
      </label>
      <button type="button" onClick={exportCsv} className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
        Export CSV
      </button>
    </form>
  );
}

async function post(action: string, id: number, value?: string) {
  await fetch("/api/admin/crm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, id, value }),
  });
}

export function LifecycleSelect({ id, value }: { id: number; value: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={value}
      disabled={pending}
      onChange={(e) => start(async () => { await post("lifecycle", id, e.target.value); })}
      className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs disabled:opacity-50"
    >
      {LIFECYCLES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export function NotesCell({ id, value }: { id: number; value: string }) {
  const [notes, setNotes] = useState(value || "");
  const [saved, setSaved] = useState<"idle" | "saving" | "ok">("idle");
  const save = () => {
    if (notes === (value || "")) return;
    setSaved("saving");
    post("notes", id, notes).then(() => {
      setSaved("ok");
      setTimeout(() => setSaved("idle"), 1500);
    });
  };
  return (
    <div className="flex items-center gap-1">
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="add note…"
        className="w-full rounded border border-gray-200 px-1 py-0.5 text-xs"
      />
      {saved === "saving" && <span className="text-[10px] text-gray-400">…</span>}
      {saved === "ok" && <span className="text-[10px] text-emerald-600">✓</span>}
    </div>
  );
}

export function StatusButton({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const isUnsub = status === "unsubscribed";
  const onClick = () => {
    const action = isUnsub ? "reactivate" : "unsubscribe";
    if (!isUnsub && !confirm("Mark this lead unsubscribed? (Their consent audit record is kept.)")) return;
    start(async () => { await post(action, id); window.location.reload(); });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`text-xs hover:underline disabled:opacity-50 ${isUnsub ? "text-emerald-600" : "text-red-600"}`}
    >
      {pending ? "…" : isUnsub ? "Reactivate" : "Unsubscribe"}
    </button>
  );
}
