import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VacationDeals.to — Best Vacation Package Deals from Top Resorts",
  description:
    "Compare vacation packages from Westgate, Hilton Grand Vacations, Marriott, Wyndham, and more. Deals starting at $59. 3-night and 4-night packages to Orlando, Las Vegas, Cancun, and 50+ destinations.",
};

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          The Best Vacation Package Deals
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Compare deals from top timeshare resorts — all in one place. Packages
          starting at $59 for 3-night stays at premium resorts.
        </p>
      </section>

      {/* Search/Filter Bar Placeholder */}
      <section className="mb-8">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
          Filter bar: City / Brand / Price / Duration (coming soon)
        </div>
      </section>

      {/* Featured Deals Grid Placeholder */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold">Featured Deals</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 h-40 rounded-lg bg-gray-100" />
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-100" />
              <div className="mb-4 h-4 w-1/2 rounded bg-gray-100" />
              <div className="h-8 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations Placeholder */}
      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-semibold">Popular Destinations</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {["Orlando", "Las Vegas", "Cancun", "Gatlinburg", "Myrtle Beach"].map(
            (city) => (
              <div
                key={city}
                className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <div className="mb-2 h-20 rounded-lg bg-gray-100" />
                <span className="font-medium">{city}</span>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Popular Brands Placeholder */}
      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-semibold">Browse by Brand</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            "Westgate Resorts",
            "Hilton Grand Vacations",
            "Marriott Vacation Club",
            "Club Wyndham",
            "Holiday Inn Club",
            "Bluegreen Vacations",
            "BookVIP",
            "Hyatt Vacation Club",
          ].map((brand) => (
            <div
              key={brand}
              className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-colors hover:border-blue-300"
            >
              <span className="text-sm font-medium">{brand}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
