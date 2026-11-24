import { DISTRICTS } from "@/lib/format";
import type { Listing } from "@/lib/listings";

export const SCHOOL_AREAS = [
  { name: "ĐH Bách khoa Đà Nẵng", district: "Liên Chiểu", lat: 16.0738, lng: 108.1499 },
  { name: "ĐH Kinh tế Đà Nẵng", district: "Ngũ Hành Sơn", lat: 16.0475, lng: 108.2196 },
  { name: "ĐH Sư phạm Đà Nẵng", district: "Liên Chiểu", lat: 16.0733, lng: 108.2231 },
  { name: "ĐH Duy Tân", district: "Hải Châu", lat: 16.0615, lng: 108.2134 },
] as const;

export interface AskingPriceSummary {
  average: number | null;
  count: number;
  minimum: number | null;
  maximum: number | null;
  averagePerM2: number | null;
}

export interface DistrictMarketSummary {
  district: string;
  rent: AskingPriceSummary;
  studentRoomRent: AskingPriceSummary;
  sale: AskingPriceSummary;
}

export interface SchoolMarketSummary extends AskingPriceSummary {
  school: string;
  district: string;
  radiusKm: number;
  studentRoomAverage: number | null;
  studentRoomCount: number;
}

type MarketListingInput = Pick<Listing, "district" | "deal" | "price" | "status"> & {
  kind?: string | undefined;
  area_m2?: number | undefined;
};

type PriceAreaItem = {
  price: number;
  area_m2?: number | undefined;
};

function summarize(items: PriceAreaItem[]): AskingPriceSummary {
  if (items.length === 0) {
    return { average: null, count: 0, minimum: null, maximum: null, averagePerM2: null };
  }
  const prices = items.map((item) => item.price);
  const withArea = items.filter((item) => typeof item.area_m2 === "number" && item.area_m2 > 0);
  const averagePerM2 =
    withArea.length > 0
      ? Math.round(
          withArea.reduce((sum, item) => sum + item.price / (item.area_m2 as number), 0) /
            withArea.length,
        )
      : null;

  return {
    average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    count: prices.length,
    minimum: Math.min(...prices),
    maximum: Math.max(...prices),
    averagePerM2,
  };
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function summarizeDistrictAskingPrices(
  listings: MarketListingInput[],
  includeAllDistricts = false,
): DistrictMarketSummary[] {
  const districts = new Map<
    string,
    {
      rent: PriceAreaItem[];
      studentRoomRent: PriceAreaItem[];
      sale: PriceAreaItem[];
    }
  >();

  if (includeAllDistricts) {
    for (const name of DISTRICTS) {
      districts.set(name, { rent: [], studentRoomRent: [], sale: [] });
    }
  }

  for (const listing of listings) {
    if (listing.status !== "available" || (listing.deal !== "rent" && listing.deal !== "sale")) {
      continue;
    }
    const entry = districts.get(listing.district) ?? {
      rent: [],
      studentRoomRent: [],
      sale: [],
    };
    const item = { price: listing.price, area_m2: listing.area_m2 };
    entry[listing.deal].push(item);
    if (listing.deal === "rent" && (!listing.kind || listing.kind === "tro")) {
      entry.studentRoomRent.push(item);
    }
    districts.set(listing.district, entry);
  }

  const entries = [...districts.entries()];
  if (!includeAllDistricts) {
    entries.sort(([left], [right]) => left.localeCompare(right, "vi"));
  }

  return entries.map(([district, group]) => ({
    district,
    rent: summarize(group.rent),
    studentRoomRent: summarize(group.studentRoomRent),
    sale: summarize(group.sale),
  }));
}

export function summarizeSchoolAreaAskingPrices(
  listings: (Pick<Listing, "lat" | "lng" | "deal" | "price" | "status"> & {
    kind?: string | undefined;
    area_m2?: number | undefined;
  })[],
  radiusKm = 3,
): SchoolMarketSummary[] {
  return SCHOOL_AREAS.map((school) => {
    const nearbyRentals = listings
      .filter((listing) => listing.status === "available" && listing.deal === "rent")
      .filter(
        (listing) => distanceKm(school.lat, school.lng, listing.lat, listing.lng) <= radiusKm,
      );

    const allItems = nearbyRentals.map((l) => ({ price: l.price, area_m2: l.area_m2 }));
    const studentRooms = nearbyRentals
      .filter((l) => !l.kind || l.kind === "tro")
      .map((l) => ({ price: l.price, area_m2: l.area_m2 }));
    const studentSummary = summarize(studentRooms);

    return {
      school: school.name,
      district: school.district,
      radiusKm,
      ...summarize(allItems),
      studentRoomAverage: studentSummary.average,
      studentRoomCount: studentSummary.count,
    };
  });
}
