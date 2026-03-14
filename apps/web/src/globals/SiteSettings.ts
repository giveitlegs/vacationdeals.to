import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  admin: {
    group: "Settings",
  },
  fields: [
    {
      name: "siteTitle",
      type: "text",
      defaultValue: "VacationDeals.to",
    },
    {
      name: "siteDescription",
      type: "textarea",
      defaultValue: "Find the best vacation package deals from top timeshare resorts. Compare prices across Westgate, Hilton, Marriott, Wyndham, and more.",
    },
    {
      type: "group",
      name: "analytics",
      label: "Analytics & Tracking",
      fields: [
        { name: "gtmId", type: "text", label: "Google Tag Manager ID", admin: { placeholder: "GTM-XXXXXXX" } },
        { name: "gaId", type: "text", label: "Google Analytics ID", admin: { placeholder: "G-XXXXXXXXXX" } },
      ],
    },
    {
      type: "group",
      name: "monetization",
      label: "Monetization",
      fields: [
        { name: "adsenseClientId", type: "text", label: "AdSense Client ID", admin: { placeholder: "ca-pub-XXXXXXXXXX" } },
        { name: "adsenseEnabled", type: "checkbox", label: "Enable AdSense", defaultValue: false },
      ],
    },
    {
      type: "group",
      name: "seo",
      label: "Default SEO",
      fields: [
        { name: "ogImage", type: "text", label: "Default OG Image URL" },
        { name: "twitterHandle", type: "text", label: "Twitter/X Handle" },
      ],
    },
  ],
};
