import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExtensionBanner } from "@/components/ExtensionBanner";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
      <ExtensionBanner />
    </>
  );
}
