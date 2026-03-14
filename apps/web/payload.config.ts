import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { DealsCollection } from "./src/collections/Deals";
import { BrandsCollection } from "./src/collections/Brands";
import { DestinationsCollection } from "./src/collections/Destinations";
import { SourcesCollection } from "./src/collections/Sources";
import { AdBannersCollection } from "./src/collections/AdBanners";
import { UsersCollection } from "./src/collections/Users";
import { SiteSettings } from "./src/globals/SiteSettings";
import { AdSettings } from "./src/globals/AdSettings";

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
