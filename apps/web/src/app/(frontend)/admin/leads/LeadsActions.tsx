"use client";

import { useState, useTransition } from "react";

const STATUSES = ["new", "contacted", "replied", "closed"];

async function post(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return { ok: res.ok && data.ok !== false, error: data.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function LeadsToolbar({ q, channel, status, channels }: {
  q: string; channel: string; status: string; channels: string[];
}) {
  const [search, setSearch] = useState(q);
  const [ch, setCh] = useState(channel);
  const [st, setSt] = useState(status);
  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (ch) p.set("channel", ch);
    if (st) p.set("status", st);
    window.location.href = `/admin/leads${p.toString() ? `?${p}` : ""}`;
  };
  return (
    <form onSubmit={apply} className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search email, lander, source…"
        className="min-w-[220px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <select value={ch} onChange={(e) => setCh(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
        <option value="">All channels</option>
        {channels.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={st} onChange={(e) => setSt(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
        Filter
      </button>
    </form>
  );
}

export function StatusSelect({ id, value }: { id: number; value: string }) {
  const [pending, start] = useTransition();
  const [val, setVal] = useState(value);
  return (
    <select
      value={val}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        setVal(v);
        start(async () => { await post({ action: "status", id, value: v }); });
      }}
      className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs disabled:opacity-50"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export function ReplyButton({ id, email }: { id: number; email: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Re: your VacationDeals.to request");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    if (!subject.trim() || !body.trim() || sending) return;
    setSending(true);
    setErr("");
    const r = await post({ action: "reply", id, subject, body });
    setSending(false);
    if (r.ok) { setOpen(false); window.location.reload(); }
    else setErr(r.error || "Send failed");
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700">
        Reply
      </button>
      {open && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 p-4" onClick={() => !sending && setOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-bold text-gray-900">Reply to {email}</h3>
            <p className="mb-4 text-xs text-gray-500">Sends from contact@vacationdeals.to · logged to this lead&apos;s thread · status → replied.</p>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            <label className="mb-1 block text-xs font-semibold text-gray-600">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write your reply…" className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            {err && <p className="mb-2 text-xs text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={sending} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={send} disabled={sending || !subject.trim() || !body.trim()} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {sending ? "Sending…" : "Send reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
