import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — VacationDeals.to",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Middleware handles auth gating for /admin/* routes (except /admin/login).
// This layout is a pass-through wrapper — individual pages render their own chrome.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
