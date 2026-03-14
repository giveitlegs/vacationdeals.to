import type { CollectionConfig } from "payload";

export const AdBannersCollection: CollectionConfig = {
  slug: "ad-banners",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "position",
      type: "select",
      required: true,
      options: [
        { label: "Header", value: "header" },
        { label: "Sidebar", value: "sidebar" },
        { label: "Inline (between deals)", value: "inline" },
        { label: "Footer", value: "footer" },
      ],
    },
    { name: "htmlContent", type: "code", admin: { language: "html" } },
    { name: "imageUrl", type: "text" },
    { name: "linkUrl", type: "text" },
    { name: "isActive", type: "checkbox", defaultValue: true },
    { name: "sortOrder", type: "number", defaultValue: 0 },
  ],
};
