import { permanentRedirect } from "next/navigation";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

// Redirect old /destinations/[city] URLs to the SEO-friendly /[city] route (301)
export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params;
  permanentRedirect(`/${city}`);
}
