export const BRAND_TYPES = {
  DIRECT: "direct",
  BROKER: "broker",
} as const;

export const DEAL_DURATIONS = [
  { nights: 2, days: 3, label: "3 Days / 2 Nights" },
  { nights: 3, days: 4, label: "4 Days / 3 Nights" },
  { nights: 4, days: 5, label: "5 Days / 4 Nights" },
  { nights: 6, days: 7, label: "7 Days / 6 Nights" },
] as const;

export const PRICE_RANGES = [
  { min: 0, max: 99, label: "Under $100" },
  { min: 100, max: 199, label: "$100 - $199" },
  { min: 200, max: 299, label: "$200 - $299" },
  { min: 300, max: 499, label: "$300 - $499" },
  { min: 500, max: Infinity, label: "$500+" },
] as const;

export const REGIONS = [
  "Southeast",
  "Northeast",
  "Midwest",
  "South",
  "West",
  "Mid-Atlantic",
  "Mexico",
  "Caribbean",
] as const;

export const AD_POSITIONS = [
  "header",
  "sidebar",
  "inline",
  "footer",
] as const;

export const SCRAPER_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  ERROR: "error",
} as const;

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
