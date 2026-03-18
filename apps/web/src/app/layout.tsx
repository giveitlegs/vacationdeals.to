import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

// ── Analytics & Tracking IDs (set via env vars or hardcode here) ──
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

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
  alternates: {
    types: {
      "application/rss+xml": "https://vacationdeals.to/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}

        {/* Google Analytics (gtag.js) */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}

        {/* ClickRank SEO Script — add your script below */}
        {/* CUSTOM_HEAD_SCRIPTS: Add any custom <script> tags here */}
        {process.env.NEXT_PUBLIC_CUSTOM_HEAD_SCRIPT && (
          <div dangerouslySetInnerHTML={{ __html: process.env.NEXT_PUBLIC_CUSTOM_HEAD_SCRIPT }} />
        )}
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {/* GTM noscript fallback */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
