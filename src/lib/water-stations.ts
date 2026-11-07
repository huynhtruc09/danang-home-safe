import data from "@/data/danang-water-stations.json";

export const WATER_STATIONS = data;
export type WaterStation = (typeof WATER_STATIONS)[number];

// The export does not include units, measurement times or the station-type legend.
// Never turn raw readings into flood levels without those definitions.
export function stationReading(station: WaterStation) {
  return Object.is(station.depth, -0) ? "0" : String(station.depth);
}

export function filterWaterStations(query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  const search = normalize(query.trim());
  return WATER_STATIONS.filter((station) => normalize(`${station.name} ${station.address} ${station.district} ${station.code}`).includes(search));
}