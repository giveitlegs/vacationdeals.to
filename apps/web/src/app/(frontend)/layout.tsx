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
      {/* Top leaderboard — only one banner above-the-fold. Container has no
          extra padding so when empty it collapses to zero. AdSlot is
          self-sizing — when no banner is active, renders nothing. */}
      <div className="flex justify-center">
        <AdSlot position="header" width={970} height={90} />
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
        {/* Mid-content slot — 728x90 below the main content but above the
            footer. Two-tier monetization without crowding above-the-fold. */}
        <div className="mt-10 flex justify-center">
          <AdSlot position="hero" width={728} height={90} />
        </div>
      </main>
      <Footer />
      <ExtensionBanner />
    </>
  );
}
