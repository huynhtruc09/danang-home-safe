import data from "@/data/danang-water-stations.json";

export const WATER_STATIONS = data;
export type WaterStation = (typeof WATER_STATIONS)[number] & { measuredAt?: string | null };

// The export does not include units, measurement times or the station-type legend.
// Never turn raw readings into flood levels without those definitions.
export function stationReading(station: WaterStation) {
  return Object.is(station.depth, -0) ? "0" : String(station.depth);
}

export function stationMeasuredAt(station: WaterStation) {
  if (!station.measuredAt) return "Không có trong file nguồn";
  const measuredAt = new Date(station.measuredAt);
  if (Number.isNaN(measuredAt.getTime())) return "Không có trong file nguồn";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(measuredAt);
}

export function filterWaterStations(query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
  const search = normalize(query.trim());
  return WATER_STATIONS.filter((station) => normalize(`${station.name} ${station.address} ${station.district} ${station.code}`).includes(search));
}
