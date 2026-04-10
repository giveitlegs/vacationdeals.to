import type { Metadata } from "next";
import { AdminRouletteClient } from "./AdminRouletteClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Roulette Control",
  robots: { index: false, follow: false },
};

export default function AdminRoulettePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Resort Roulette Admin</h1>
      <p className="mb-6 text-sm text-gray-600">
        Control which deals appear in Resort Roulette. Increase weight to make deals appear more often.
        Feature deals to guarantee they appear in every spin. Exclude deals to hide them entirely.
      </p>
      <AdminRouletteClient />
    </div>
  );
}
