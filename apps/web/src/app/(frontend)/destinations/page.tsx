import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vacation Destinations",
  description:
    "Browse vacation package deals by destination. Orlando, Las Vegas, Cancun, Gatlinburg, and 50+ more cities.",
};

export default function DestinationsPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Destinations</h1>
      <p className="text-gray-500">
        Destination grid will be populated from the database.
      </p>
    </div>
  );
}
