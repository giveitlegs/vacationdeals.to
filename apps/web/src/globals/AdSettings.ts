import type { GlobalConfig } from "payload";

export const AdSettings: GlobalConfig = {
  slug: "ad-settings",
  admin: {
    group: "Settings",
  },
  fields: [
    {
      name: "headerAdEnabled",
      type: "checkbox",
      label: "Show Header Ad Banner",
      defaultValue: false,
    },
    {
      name: "sidebarAdEnabled",
      type: "checkbox",
      label: "Show Sidebar Ads",
      defaultValue: false,
    },
    {
      name: "inlineAdFrequency",
      type: "number",
      label: "Show inline ad every N deals (0 = disabled)",
      defaultValue: 0,
      min: 0,
    },
    {
      name: "footerAdEnabled",
      type: "checkbox",
      label: "Show Footer Ad Banner",
      defaultValue: false,
    },
  ],
};
