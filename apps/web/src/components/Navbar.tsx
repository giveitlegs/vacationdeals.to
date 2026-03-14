import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-blue-600">
          VacationDeals.to
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/deals"
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            All Deals
          </Link>
          <Link
            href="/destinations"
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Destinations
          </Link>
          <Link
            href="/brands"
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Brands
          </Link>
        </div>
      </div>
    </nav>
  );
}
