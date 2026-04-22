import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { getCurrentAdmin } from "@/lib/admin/auth";
import {
  PRIORITY_CITIES,
  CITY_SUBLANDERS,
  MODIFIERS,
  TOTAL_SUBLANDERS,
} from "@vacationdeals/shared";
import { getSublanderOverridesBatch } from "@/lib/sublander-overrides";
import { SublanderToggle } from "./SublanderToggle";

export const dynamic = "force-dynamic";

export default async function SublandersAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  // Fetch overrides per city
  const overridesByCity: Record<string, Record<string, Awaited<ReturnType<typeof getSublanderOverridesBatch>>[string]>> = {};
  for (const city of PRIORITY_CITIES) {
    overridesByCity[city] = await getSublanderOverridesBatch(city);
  }

  const prettyCity = (slug: string) => slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

  return (
    <AdminShell title="Sublanders">
      <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <p><strong>{TOTAL_SUBLANDERS}</strong> sublanders configured across <strong>{PRIORITY_CITIES.length}</strong> cities. Toggle to enable/disable on the live site. Changes apply immediately (ISR revalidated).</p>
        <p className="mt-2 text-xs opacity-80">URL pattern: <code>/{"{citySlug}"}-{"{modifierSlug}"}</code>. Example: <code>/orlando-for-families</code>.</p>
      </div>

      {PRIORITY_CITIES.map((citySlug) => {
        const mods = (CITY_SUBLANDERS[citySlug] || []).map((s) => MODIFIERS[s]).filter(Boolean);
        const overrides = overridesByCity[citySlug] || {};
        return (
          <section key={citySlug} className="mb-10">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{prettyCity(citySlug)}</h2>
              <Link href={`/${citySlug}`} target="_blank" className="text-xs text-blue-600 hover:underline">view parent →</Link>
              <span className="text-xs text-gray-500">{mods.length} modifiers</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Modifier</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">URL</th>
                    <th className="px-4 py-3 text-center">Enabled</th>
                    <th className="px-4 py-3 text-center">Custom copy</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mods.map((m) => {
                    const ov = overrides[m.slug];
                    const isEnabled = ov ? ov.isEnabled : true;
                    const hasCopy = !!ov && (ov.customIntroHtml || ov.customMetaTitle || ov.customMetaDescription);
                    const url = `/${citySlug}-${m.slug}`;
                    return (
                      <tr key={m.slug} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{m.label}</td>
                        <td className="px-4 py-2.5 text-xs uppercase tracking-wider text-gray-500">{m.type}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">
                          <Link href={url} target="_blank" className="text-blue-600 hover:underline">{url}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <SublanderToggle citySlug={citySlug} modifierSlug={m.slug} initialEnabled={isEnabled} />
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs">
                          {hasCopy ? <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">override</span> : <span className="text-gray-400">default</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link href={`/admin/sublanders/${citySlug}/${m.slug}`} className="text-xs font-medium text-blue-600 hover:underline">edit →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </AdminShell>
  );
}

