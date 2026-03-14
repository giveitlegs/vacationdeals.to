import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["postgres", "drizzle-orm", "payload", "@payloadcms/next", "@payloadcms/db-postgres"],
};

export default nextConfig;
