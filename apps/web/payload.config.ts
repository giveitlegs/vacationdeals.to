import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { DealsCollection } from "./src/collections/Deals.js";
import { BrandsCollection } from "./src/collections/Brands.js";
import { DestinationsCollection } from "./src/collections/Destinations.js";
import { SourcesCollection } from "./src/collections/Sources.js";
import { AdBannersCollection } from "./src/collections/AdBanners.js";
import { UsersCollection } from "./src/collections/Users.js";
import { SiteSettings } from "./src/globals/SiteSettings.js";
import { AdSettings } from "./src/globals/AdSettings.js";

export default buildConfig({
  admin: {
    user: "users",
    meta: {
      titleSuffix: "— VacationDeals.to Admin",
    },
  },
  collections: [
    UsersCollection,
    DealsCollection,
    BrandsCollection,
    DestinationsCollection,
    SourcesCollection,
    AdBannersCollection,
  ],
  globals: [SiteSettings, AdSettings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  typescript: {
    outputFile: "./src/payload-types.ts",
  },
  secret: process.env.PAYLOAD_SECRET || "vacationdeals-dev-secret-change-me",
});
