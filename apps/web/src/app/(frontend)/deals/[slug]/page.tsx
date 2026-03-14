import type { Metadata } from "next";

interface DealPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Deal: ${slug.replace(/-/g, " ")}`,
  };
}

export default async function DealPage({ params }: DealPageProps) {
  const { slug } = await params;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold capitalize">
        {slug.replace(/-/g, " ")}
      </h1>
      <p className="text-gray-500">
        Individual deal page — will show full details, pricing, inclusions,
        and booking link.
      </p>
    </div>
  );
}
