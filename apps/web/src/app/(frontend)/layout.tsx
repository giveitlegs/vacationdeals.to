import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExtensionBanner } from "@/components/ExtensionBanner";
import { DealTicker } from "@/components/DealTicker";
import { AdSlot } from "@/components/AdSlot";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DealTicker />
      <Navbar />
      {/* Top leaderboard slot — 970x90 standard. Renders nothing if no
          banner is active, so doesn't reserve space when empty. */}
      <div className="mx-auto flex max-w-7xl justify-center px-4 pt-2 sm:px-6 lg:px-8">
        <AdSlot position="header" width={970} height={90} />
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero slot — 728x90 above-the-fold leaderboard, separate from
            the very-top header slot for two-tier monetization. */}
        <div className="mb-6 flex justify-center">
          <AdSlot position="hero" width={728} height={90} />
        </div>
        {children}
        {/* Footer slot — 728x90 below content */}
        <div className="mt-12 flex justify-center">
          <AdSlot position="footer" width={728} height={90} />
        </div>
      </main>
      <Footer />
      <ExtensionBanner />
    </>
  );
}
