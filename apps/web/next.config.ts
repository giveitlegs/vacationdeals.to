import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.westgatereservations.com" },
      { protocol: "https", hostname: "*.westgateresorts.com" },
      { protocol: "https", hostname: "*.bookvip.com" },
      { protocol: "https", hostname: "*.hiltongrandvacations.com" },
      { protocol: "https", hostname: "*.marriottvacationclubs.com" },
      { protocol: "https", hostname: "*.wyndhamdestinations.com" },
      { protocol: "https", hostname: "*.spinnakerresorts.com" },
      { protocol: "https", hostname: "*.staypromo.com" },
      { protocol: "https", hostname: "*.mrgvacationpackages.com" },
      { protocol: "https", hostname: "*.getawaydealz.com" },
      { protocol: "https", hostname: "*.vacationvillagedeals.com" },
    ],
  },
  serverExternalPackages: ["postgres", "drizzle-orm", "payload", "@payloadcms/next", "@payloadcms/db-postgres"],
};

export default nextConfig;
