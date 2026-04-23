import type { Metadata } from "next";
import Link from "next/link";
import { BloodOathClient } from "./BloodOathClient";

export const metadata: Metadata = {
  title: "Resort Roulette: Blood Oath Edition | Vacation Carnival",
  description: "One spin alone. Swear a blood oath with a friend, get another. The referral mechanic that actually cares if you follow through.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/blood-oath" },
};

export default function BloodOathPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Blood Oath Roulette</li>
        </ol>
      </nav>

      <BloodOathClient />
    </div>
  );
}
