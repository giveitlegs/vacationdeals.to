import type { CollectionConfig } from "payload";

export const DestinationsCollection: CollectionConfig = {
  slug: "destinations",
  admin: {
    useAsTitle: "city",
  },
  fields: [
    { name: "city", type: "text", required: true },
    { name: "state", type: "text" },
    { name: "region", type: "text" },
    { name: "country", type: "text", defaultValue: "US" },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "imageUrl", type: "text" },
    {
      type: "row",
      fields: [
        { name: "latitude", type: "number", admin: { width: "50%" } },
        { name: "longitude", type: "number", admin: { width: "50%" } },
      ],
    },
  ],
};
