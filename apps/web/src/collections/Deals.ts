import type { CollectionConfig } from "payload";

export const DealsCollection: CollectionConfig = {
  slug: "deals",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "price", "durationNights", "isActive"],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, admin: { position: "sidebar" } },
    { name: "price", type: "number", required: true, min: 0 },
    { name: "originalPrice", type: "number", min: 0 },
    {
      type: "row",
      fields: [
        { name: "durationNights", type: "number", required: true, min: 1, admin: { width: "50%" } },
        { name: "durationDays", type: "number", required: true, min: 1, admin: { width: "50%" } },
      ],
    },
    { name: "description", type: "textarea" },
    { name: "resortName", type: "text" },
    { name: "url", type: "text", required: true },
    { name: "imageUrl", type: "text" },
    {
      name: "inclusions",
      type: "array",
      fields: [{ name: "item", type: "text" }],
    },
    {
      name: "requirements",
      type: "array",
      fields: [{ name: "item", type: "text" }],
    },
    { name: "presentationMinutes", type: "number" },
    { name: "travelWindow", type: "text" },
    { name: "savingsPercent", type: "number" },
    { name: "isActive", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
    { name: "brandSlug", type: "text", admin: { position: "sidebar" } },
    { name: "destinationSlug", type: "text", admin: { position: "sidebar" } },
    { name: "sourceKey", type: "text", admin: { position: "sidebar" } },
    { name: "scrapedAt", type: "date", admin: { position: "sidebar" } },
    { name: "expiresAt", type: "date", admin: { position: "sidebar" } },
  ],
};
