/**
 * DB-backed overrides for sublander pages.
 *
 * The canonical modifier/city config lives in @vacationdeals/shared
 * (packages/shared/src/sublanders.ts). The `sublanders` DB table lets admin
 * toggle visibility or override copy per (city, modifier) pair without redeploy.
 *
 * Hot path: called once per sublander page render. Cached at the ISR layer.
 */

import type { MODIFIERS as ModifiersMap } from "@vacationdeals/shared";

type ModifierSlug = keyof typeof ModifiersMap;

export interface SublanderOverride {
  isEnabled: boolean;
  customIntroHtml: string | null;
  customMetaTitle: string | null;
  customMetaDescription: string | null;
  sortOrder: number;
}

const DEFAULT: SublanderOverride = {
  isEnabled: true,
  customIntroHtml: null,
  customMetaTitle: null,
  customMetaDescription: null,
  sortOrder: 0,
};

export async function getSublanderOverride(
  citySlug: string,
  modifierSlug: string,
): Promise<SublanderOverride> {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { and, eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(schema.sublanders)
      .where(
        and(
          eq(schema.sublanders.citySlug, citySlug),
          eq(schema.sublanders.modifierSlug, modifierSlug),
        ),
      )
      .limit(1);

    if (rows.length === 0) return DEFAULT;
    const row = rows[0];
    return {
      isEnabled: row.isEnabled,
      customIntroHtml: row.customIntroHtml,
      customMetaTitle: row.customMetaTitle,
      customMetaDescription: row.customMetaDescription,
      sortOrder: row.sortOrder,
    };
  } catch {
    return DEFAULT;
  }
}

/** Returns a map of `citySlug-modifierSlug` -> override for a batch of pairs. */
export async function getSublanderOverridesBatch(
  citySlug: string,
): Promise<Record<string, SublanderOverride>> {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(schema.sublanders)
      .where(eq(schema.sublanders.citySlug, citySlug));

    const out: Record<string, SublanderOverride> = {};
    for (const r of rows) {
      out[r.modifierSlug] = {
        isEnabled: r.isEnabled,
        customIntroHtml: r.customIntroHtml,
        customMetaTitle: r.customMetaTitle,
        customMetaDescription: r.customMetaDescription,
        sortOrder: r.sortOrder,
      };
    }
    return out;
  } catch {
    return {};
  }
}
