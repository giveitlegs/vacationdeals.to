"use client";

import { useState, useTransition } from "react";

interface BannerRow {
  id: number;
  name: string;
  position: string;
  linkUrl: string | null;
  isActive: boolean;
}

export function BannerActions({ banner }: { banner: BannerRow }) {
  const [pending, start] = useTransition();
  const [active, setActive] = useState(banner.isActive);

  const toggle = () => {
    const next = !active;
    setActive(next);
    start(async () => {
      try {
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle_active", id: banner.id }),
        });
        if (!res.ok) setActive(!next);
      } catch { setActive(!next); }
    });
  };

  const del = () => {
    if (!confirm(`Delete banner "${banner.name}"?`)) return;
    start(async () => {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: banner.id }),
      });
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`rounded px-2 py-1 text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
      >
        {active ? "Active" : "Inactive"}
      </button>
      <button
        type="button"
        onClick={del}
        disabled={pending}
        className="text-xs text-red-600 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}

export function BannerCreateForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      setError(null);
      try {
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            name: data.get("name"),
            position: data.get("position"),
            imageUrl: data.get("imageUrl") || null,
            linkUrl: data.get("linkUrl") || null,
            htmlContent: data.get("htmlContent") || null,
            isActive: data.get("isActive") === "on",
          }),
        });
        if (!res.ok) { setError("Create failed"); return; }
        window.location.reload();
      } catch { setError("Network error"); }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        + New Banner
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 font-semibold text-gray-900">New Ad Banner</h3>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Name</span>
          <input name="name" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Position</span>
          <select name="position" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
            <option value="header">Header</option>
            <option value="sidebar">Sidebar</option>
            <option value="inline">Inline</option>
            <option value="footer">Footer</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block font-medium text-gray-700">Image URL (optional)</span>
          <input name="imageUrl" type="url" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block font-medium text-gray-700">Link URL</span>
          <input name="linkUrl" type="url" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block font-medium text-gray-700">Custom HTML (optional, overrides image)</span>
          <textarea name="htmlContent" rows={3} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs" />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
          <span>Active on publish</span>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Creating..." : "Create Banner"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
