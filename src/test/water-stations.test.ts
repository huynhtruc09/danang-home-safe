import { describe, expect, it } from "vitest";
import { WATER_STATIONS, filterWaterStations, stationMeasuredAt, stationReading } from "@/lib/water-stations";

describe("Uploaded Da Nang station snapshot", () => {
  it("preserves all 95 stations and unique identifiers", () => {
    expect(WATER_STATIONS).toHaveLength(95);
    expect(new Set(WATER_STATIONS.map((station) => station.id)).size).toBe(95);
  });
  it("preserves the uploaded coordinates and raw reading without interpreting river levels", () => {
    expect(WATER_STATIONS.find((station) => station.code === "431001")).toMatchObject({ latitude: 16.119722, longitude: 107.984444, depth: 9.59 });
  });
  it("preserves negative readings", () => {
    const station = WATER_STATIONS.find((row) => row.code === "431051");
    expect(station).toBeDefined();
    if (!station) return;
    expect(stationReading(station)).toBe("-0.09");
  });
  it("does not invent a measurement time absent from the imported snapshot", () => {
    const station = WATER_STATIONS[0];
    expect(station).toBeDefined();
    if (!station) return;
    expect(stationMeasuredAt(station)).toBe("Không có trong file nguồn");
  });
  it("finds a station by accent-insensitive place name and code", () => {
    expect(filterWaterStations("truong dinh").map((station) => station.code)).toContain("431002");
    expect(filterWaterStations("431001").map((station) => station.name)).toEqual(["Cầu Tà Lang - Giàn Bí"]);
    expect(filterWaterStations("nonexistent-station")).toEqual([]);
  });
});