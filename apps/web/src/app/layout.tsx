import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VacationDeals.to — Best Vacation Package Deals",
    template: "%s | VacationDeals.to",
  },
  description:
    "Find the best vacation package deals from top timeshare resorts. Compare prices across Westgate, Hilton, Marriott, Wyndham, and more.",
  metadataBase: new URL("https://vacationdeals.to"),
  openGraph: {
    siteName: "VacationDeals.to",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
