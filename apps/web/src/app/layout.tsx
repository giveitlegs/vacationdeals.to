import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VacationDeals.to — Best Vacation Deals from Top Resorts",
    template: "%s | VacationDeals.to",
  },
  description:
    "Vacation deals from top resorts starting at $59. Compare resort deals, hotel deals, and getaway packages from Westgate, Hilton, Marriott, Wyndham, and more.",
  metadataBase: new URL("https://vacationdeals.to"),
  openGraph: {
    siteName: "VacationDeals.to",
    type: "website",
    images: [{ url: "https://vacationdeals.to/og-image.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://vacationdeals.to/og-image.svg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
