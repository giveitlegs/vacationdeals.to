import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Browse vacation deals from top resorts.",
};

const popularDestinations = [
  { name: "Orlando", slug: "orlando" },
  { name: "Las Vegas", slug: "las-vegas" },
  { name: "Cancun", slug: "cancun" },
  { name: "Gatlinburg", slug: "gatlinburg" },
  { name: "Myrtle Beach", slug: "myrtle-beach" },
  { name: "Branson", slug: "branson" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple nav bar for the 404 page (outside the frontend layout) */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <svg
              className="h-8 w-8 shrink-0"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M24 4C15.163 4 8 11.163 8 20c0 11 16 26 16 26s16-15 16-26c0-8.837-7.163-16-16-16z"
                fill="#2563EB"
              />
              <circle cx="24" cy="17.5" r="6.5" fill="#FBBF24" />
              <path
                d="M14 22h20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 25c2-1.2 4-1.2 6 0s4 1.2 6 0"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="flex items-baseline gap-0">
              <span className="text-xl font-bold tracking-tight text-blue-600">
                Vacation
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Deals
              </span>
              <span className="ml-0.5 text-sm font-semibold text-gray-400">
                .to
              </span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        {/* 404 graphic */}
        <div className="mb-8">
          <p className="text-8xl font-bold text-blue-600 sm:text-9xl">404</p>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mb-8 max-w-md text-gray-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved, removed, or the URL might be incorrect.
        </p>

        {/* Search prompt */}
        <div className="mb-12 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Go to Homepage
          </Link>
          <Link
            href="/deals"
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            Browse All Deals
          </Link>
        </div>

        {/* Popular destinations */}
        <div className="w-full max-w-xl">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Popular Destinations
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularDestinations.map((dest) => (
              <Link
                key={dest.slug}
                href={`/${dest.slug}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
              >
                {dest.name}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
