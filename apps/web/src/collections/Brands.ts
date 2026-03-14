import type { CollectionConfig } from "payload";

export const BrandsCollection: CollectionConfig = {
  slug: "brands",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "logoUrl", type: "text" },
    { name: "website", type: "text" },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Direct (Brand-owned)", value: "direct" },
        { label: "Broker (Third-party)", value: "broker" },
      ],
      defaultValue: "broker",
    },
    { name: "description", type: "textarea" },
  ],
};
