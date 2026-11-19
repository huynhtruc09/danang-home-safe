import type { Listing } from "@/lib/listings";

export const SCHOOL_AREAS = [
  { name: "ĐH Bách khoa Đà Nẵng", lat: 16.0738, lng: 108.1499 },
  { name: "ĐH Kinh tế Đà Nẵng", lat: 16.0475, lng: 108.2196 },
  { name: "ĐH Sư phạm Đà Nẵng", lat: 16.0733, lng: 108.2231 },
  { name: "ĐH Duy Tân", lat: 16.0615, lng: 108.2134 },
] as const;

export interface AskingPriceSummary {
  average: number | null;
  count: number;
  minimum: number | null;
  maximum: number | null;
}

export interface DistrictMarketSummary {
  district: string;
  rent: AskingPriceSummary;
  sale: AskingPriceSummary;
}

export interface SchoolMarketSummary extends AskingPriceSummary {
  school: string;
  radiusKm: number;
}

function summarize(prices: number[]): AskingPriceSummary {
  if (prices.length === 0) return { average: null, count: 0, minimum: null, maximum: null };
  return {
    average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    count: prices.length,
    minimum: Math.min(...prices),
    maximum: Math.max(...prices),
  };
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function summarizeDistrictAskingPrices(listings: Pick<Listing, "district" | "deal" | "price" | "status">[]): DistrictMarketSummary[] {
  const districts = new Map<string, { rent: number[]; sale: number[] }>();
  for (const listing of listings) {
    if (listing.status !== "available" || (listing.deal !== "rent" && listing.deal !== "sale")) continue;
    const district = districts.get(listing.district) ?? { rent: [], sale: [] };
    district[listing.deal].push(listing.price);
    districts.set(listing.district, district);
  }
  return [...districts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "vi"))
    .map(([district, prices]) => ({ district, rent: summarize(prices.rent), sale: summarize(prices.sale) }));
}

export function summarizeSchoolAreaAskingPrices(
  listings: Pick<Listing, "lat" | "lng" | "deal" | "price" | "status">[],
  radiusKm = 3,
): SchoolMarketSummary[] {
  return SCHOOL_AREAS.map((school) => {
    const prices = listings
      .filter((listing) => listing.status === "available" && listing.deal === "rent")
      .filter((listing) => distanceKm(school.lat, school.lng, listing.lat, listing.lng) <= radiusKm)
      .map((listing) => listing.price);
    return { school: school.name, radiusKm, ...summarize(prices) };
  });
}