import type { CollectionConfig } from "payload";

export const SourcesCollection: CollectionConfig = {
  slug: "sources",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "baseUrl", type: "text", required: true },
    { name: "scraperKey", type: "text", required: true, unique: true },
    { name: "lastScrapedAt", type: "date" },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Error", value: "error" },
      ],
      defaultValue: "active",
    },
    { name: "dealCount", type: "number", defaultValue: 0 },
  ],
};
