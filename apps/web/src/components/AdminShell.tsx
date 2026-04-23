import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "\u{1F4CA}" },
  { href: "/admin/deals", label: "Deals", icon: "\u{1F3E8}" },
  { href: "/admin/brands", label: "Brands", icon: "\u{1F3F7}️" },
  { href: "/admin/banners", label: "Ad Banners", icon: "\u{1F4E2}" },
  { href: "/admin/roulette", label: "Roulette", icon: "\u{1F3B0}" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "\u{1F4E7}" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "\u{1F4EC}" },
  { href: "/admin/scrapers", label: "Scrapers", icon: "\u{1F577}️" },
  { href: "/admin/sublanders", label: "Sublanders", icon: "\u{1F3D9}️" },
  { href: "/admin/cwv", label: "Core Web Vitals", icon: "\u{1F4C8}" },
];

export async function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="-mx-4 -my-8 flex min-h-screen bg-gray-50 sm:-mx-6 lg:-mx-8">
      <aside className="sticky top-0 h-screen w-60 shrink-0 border-r border-gray-200 bg-white p-4">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-lg font-black text-blue-600">VacationDeals</span>
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">ADMIN</span>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600">
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
          <p className="font-semibold text-gray-700">{admin.name || admin.email}</p>
          <p className="text-gray-400">{admin.role}</p>
          <form action="/api/admin/auth/logout" method="POST" className="mt-2">
            <button type="submit" className="text-xs text-red-600 hover:underline">Log out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
