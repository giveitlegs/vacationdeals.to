import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Vacation Package Deals",
  description:
    "Browse all vacation package deals from top timeshare resorts. Filter by destination, brand, price, and duration.",
};

export default function DealsPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">All Vacation Deals</h1>
      <p className="text-gray-500">
        Deal listings with filters will be populated once scrapers are running
        and the database is connected.
      </p>
    </div>
  );
}
