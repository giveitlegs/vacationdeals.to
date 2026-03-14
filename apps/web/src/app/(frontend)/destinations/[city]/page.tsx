import type { Metadata } from "next";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = city.replace(/-/g, " ");
  return {
    title: `Vacation Packages in ${cityName}`,
    description: `Find the best vacation package deals in ${cityName}. Compare prices from top timeshare resorts.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold capitalize">
        Vacation Packages in {city.replace(/-/g, " ")}
      </h1>
      <p className="text-gray-500">
        Deals for this destination will be populated from the database.
      </p>
    </div>
  );
}
