import type { Metadata } from "next";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const brandName = brand.replace(/-/g, " ");
  return {
    title: `${brandName} Vacation Packages`,
    description: `Browse all vacation package deals from ${brandName}. Compare prices, durations, and destinations.`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold capitalize">
        {brand.replace(/-/g, " ")} Packages
      </h1>
      <p className="text-gray-500">
        Deals from this brand will be populated from the database.
      </p>
    </div>
  );
}
