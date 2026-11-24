import { describe, expect, it } from "vitest";
import rainfallHistory from "@/data/danang-rainfall-history.json";
import { DISTRICTS } from "@/lib/format";
import {
  SCHOOL_AREAS,
  summarizeDistrictAskingPrices,
  summarizeSchoolAreaAskingPrices,
} from "@/lib/market";
import { buildLocalDolphinReply } from "@/routes/api/chat";

describe("Historical rainfall dataset (2020-2025)", () => {
  it("covers all 7 Da Nang districts with 2020-2025 annual and rainy season metrics", () => {
    expect(rainfallHistory.districts).toHaveLength(7);
    const names = rainfallHistory.districts.map((d) => d.district);
    expect(names).toEqual(DISTRICTS);

    for (const district of rainfallHistory.districts) {
      expect(district.years.map((y) => y.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
      for (const year of district.years) {
        expect(year.totalMm).toBeGreaterThanOrEqual(year.rainySeasonMm);
        expect(year.maxDayMm).toBeGreaterThan(0);
        expect(year.heavyDays).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("Market asking price summary", () => {
  const sampleListings = [
    {
      district: "Liên Chiểu",
      deal: "rent",
      price: 2_200_000,
      status: "available",
      lat: 16.0738,
      lng: 108.1499,
    },
    {
      district: "Liên Chiểu",
      deal: "rent",
      price: 1_800_000,
      status: "available",
      lat: 16.0612,
      lng: 108.1702,
    },
    {
      district: "Thanh Khê",
      deal: "rent",
      price: 1_500_000,
      status: "rented",
      lat: 16.066,
      lng: 108.1885,
    },
    {
      district: "Cẩm Lệ",
      deal: "sale",
      price: 4_900_000_000,
      status: "available",
      lat: 16.001,
      lng: 108.219,
    },
  ];

  it("separates rent and sale averages and excludes rented listings", () => {
    const districts = summarizeDistrictAskingPrices(sampleListings);
    const lienChieu = districts.find((d) => d.district === "Liên Chiểu");
    const camLe = districts.find((d) => d.district === "Cẩm Lệ");
    const thanhKhe = districts.find((d) => d.district === "Thanh Khê");

    expect(lienChieu?.rent).toEqual({
      average: 2_000_000,
      count: 2,
      minimum: 1_800_000,
      maximum: 2_200_000,
    });
    expect(lienChieu?.sale.average).toBeNull();
    expect(camLe?.sale.average).toBe(4_900_000_000);
    expect(camLe?.rent.average).toBeNull();
    expect(thanhKhe).toBeUndefined();
  });

  it("summarizes active rental listings within 3 km around the 4 universities", () => {
    const schools = summarizeSchoolAreaAskingPrices(sampleListings, 3);
    expect(schools.map((s) => s.school)).toEqual(SCHOOL_AREAS.map((s) => s.name));
    const bachKhoa = schools.find((s) => s.school === "ĐH Bách khoa Đà Nẵng");
    expect(bachKhoa?.count).toBe(2);
    expect(bachKhoa?.average).toBe(2_000_000);
  });
});

describe("Chatbot Cá Heo local fallback", () => {
  it("provides warm, accurate guidance for flood and price questions", () => {
    const floodReply = buildLocalDolphinReply("Khu nào ít ngập mùa mưa?");
    expect(floodReply).toContain("Cá Heo");
    expect(floodReply).toContain("Sơn Trà");
    expect(floodReply).toContain("14/10/2022");

    const priceReply = buildLocalDolphinReply("Giá trọ gần ĐH Bách khoa bao nhiêu?");
    expect(priceReply).toContain("ĐH Bách khoa");
    expect(priceReply).toContain("triệu/tháng");
  });
});
