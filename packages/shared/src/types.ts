export interface Deal {
  id: number;
  brandId: number | null;
  destinationId: number | null;
  sourceId: number | null;
  title: string;
  slug: string;
  price: string;
  originalPrice: string | null;
  durationNights: number;
  durationDays: number;
  description: string | null;
  resortName: string | null;
  url: string;
  imageUrl: string | null;
  inclusions: string | null;
  requirements: string | null;
  presentationMinutes: number | null;
  travelWindow: string | null;
  savingsPercent: number | null;
  isActive: boolean;
  scrapedAt: Date;
  expiresAt: Date | null;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  type: string;
  description: string | null;
}

export interface Destination {
  id: number;
  city: string;
  state: string | null;
  region: string | null;
  country: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl: string | null;
}

export interface Source {
  id: number;
  name: string;
  baseUrl: string;
  scraperKey: string;
  lastScrapedAt: Date | null;
  status: string;
  dealCount: number | null;
}

export interface ScrapedDeal {
  title: string;
  price: number;
  originalPrice?: number;
  durationNights: number;
  durationDays: number;
  description?: string;
  resortName?: string;
  url: string;
  imageUrl?: string;
  inclusions?: string[];
  requirements?: string[];
  presentationMinutes?: number;
  travelWindow?: string;
  savingsPercent?: number;
  city: string;
  state?: string;
  country?: string;
  brandSlug: string;
}

export interface DealFilters {
  city?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  durationNights?: number;
  sortBy?: "price" | "duration" | "savings" | "newest";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
