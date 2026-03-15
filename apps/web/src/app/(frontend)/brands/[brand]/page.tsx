import { permanentRedirect } from "next/navigation";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

// Redirect old /brands/[brand] URLs to the SEO-friendly /[brand] route (301)
export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  permanentRedirect(`/${brand}`);
}
