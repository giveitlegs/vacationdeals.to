// Curated Unsplash photo IDs for each destination
// These are hand-picked for quality tourism/travel imagery
const DESTINATION_IMAGES: Record<string, { unsplashId: string; credit: string }> = {
  orlando: { unsplashId: "hCU4fimRW-c", credit: "Benjamin Voros" },
  "las-vegas": { unsplashId: "MldQeWmF2_g", credit: "Julian Paefgen" },
  cancun: { unsplashId: "3PeSjpLVtLg", credit: "Marv Watson" },
  gatlinburg: { unsplashId: "tGBRQw52Thw", credit: "Ken Cheung" },
  "myrtle-beach": { unsplashId: "wfBXqO64JNc", credit: "Lance Asper" },
  branson: { unsplashId: "9gz3wfHr65U", credit: "Jonathan Petersson" },
  williamsburg: { unsplashId: "jAebodq7oxk", credit: "David Vives" },
  "cocoa-beach": { unsplashId: "YI_9SivVt_s", credit: "Sean O." },
  "hilton-head": { unsplashId: "Siuwr3uCir0", credit: "Cristina Gottardi" },
  "park-city": { unsplashId: "Y4fKN-RlMV4", credit: "Jeremy Bishop" },
  "daytona-beach": { unsplashId: "mBHuEkka5wM", credit: "Vidar Nordli-Mathisen" },
  "cabo": { unsplashId: "xr-y6FPhsjI", credit: "Jezael Melgoza" },
  "puerto-vallarta": { unsplashId: "1rBg5YSi00c", credit: "Roberto Nickson" },
  "punta-cana": { unsplashId: "rQPJc0bLpSE", credit: "Humphrey Muleba" },
  "key-west": { unsplashId: "Nm70URdtf3c", credit: "Karsten Winegeart" },
  sedona: { unsplashId: "tmSMmGOkIXs", credit: "Jonny Gios" },
  galveston: { unsplashId: "bGdiuIyN3Rs", credit: "Silas Baisch" },
  "lake-tahoe": { unsplashId: "YI_9SivVt_s", credit: "Sean O." },
  "new-york-city": { unsplashId: "aaBSOypzIyg", credit: "Lerone Pieters" },
  "san-diego": { unsplashId: "Do6yoytec5E", credit: "Venti Views" },
};

// Gradient fallbacks when no image is available
const DESTINATION_GRADIENTS: Record<string, string> = {
  orlando: "from-blue-400 to-cyan-300",
  "las-vegas": "from-amber-400 to-orange-500",
  cancun: "from-teal-400 to-emerald-300",
  gatlinburg: "from-green-500 to-emerald-600",
  "myrtle-beach": "from-sky-400 to-blue-500",
  branson: "from-rose-400 to-pink-500",
  williamsburg: "from-violet-400 to-purple-500",
  "cocoa-beach": "from-cyan-400 to-blue-500",
  "hilton-head": "from-lime-400 to-green-500",
  "park-city": "from-slate-400 to-blue-600",
  "daytona-beach": "from-indigo-400 to-blue-500",
  cabo: "from-emerald-400 to-teal-500",
  "puerto-vallarta": "from-orange-400 to-red-500",
  "punta-cana": "from-teal-300 to-cyan-500",
  "key-west": "from-yellow-300 to-orange-400",
  sedona: "from-red-400 to-orange-600",
  galveston: "from-blue-300 to-indigo-400",
  "lake-tahoe": "from-blue-500 to-indigo-600",
  "new-york-city": "from-gray-500 to-slate-700",
  "san-diego": "from-sky-300 to-blue-500",
};

export function getDestinationImageUrl(slug: string, width = 800, height = 600): string {
  const img = DESTINATION_IMAGES[slug];
  if (img) {
    return `https://images.unsplash.com/photo-${img.unsplashId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
  }
  return "";
}

export function getDestinationGradient(slug: string): string {
  return DESTINATION_GRADIENTS[slug] || "from-gray-400 to-gray-600";
}

export function getDestinationCredit(slug: string): string | null {
  const img = DESTINATION_IMAGES[slug];
  return img ? img.credit : null;
}

// Brand logo colors for generating consistent brand card backgrounds
export const BRAND_COLORS: Record<string, string> = {
  westgate: "from-blue-500 to-blue-700",
  hgv: "from-sky-500 to-indigo-600",
  bluegreen: "from-teal-400 to-green-600",
  wyndham: "from-blue-400 to-cyan-500",
  "holiday-inn": "from-green-500 to-emerald-600",
  hyatt: "from-amber-400 to-orange-500",
  marriott: "from-red-500 to-rose-700",
  "capital-vacations": "from-violet-500 to-purple-700",
  bookvip: "from-emerald-500 to-teal-600",
  getawaydealz: "from-yellow-400 to-amber-500",
  vacationvip: "from-indigo-400 to-blue-600",
  bestvacationdealz: "from-pink-400 to-rose-500",
  "monster-vacations": "from-green-400 to-lime-500",
  mrg: "from-orange-500 to-red-600",
  "westgate-events": "from-purple-500 to-indigo-600",
};

export function getBrandGradient(slug: string): string {
  return BRAND_COLORS[slug] || "from-gray-400 to-gray-600";
}
