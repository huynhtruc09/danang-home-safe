import { useEffect, useRef } from "react";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import { CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { WATER_STATIONS, stationReading } from "@/lib/water-stations";

function Station({ station, selected }: { station: (typeof WATER_STATIONS)[number]; selected: boolean }) {
  const map = useMap();
  const marker = useRef<LeafletCircleMarker | null>(null);
  useEffect(() => {
    if (!selected) return;
    map.flyTo([station.latitude, station.longitude], 16, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    marker.current?.openPopup();
  }, [selected, station, map]);
  return (
    <CircleMarker ref={marker} center={[station.latitude, station.longitude]} radius={selected ? 10 : 7}
      pathOptions={{ className: "water-station-marker", weight: selected ? 3 : 2, fillOpacity: 0.9 }}>
      <Tooltip>{station.name}</Tooltip>
      <Popup>
        <strong>{station.name}</strong><br />
        Mã trạm: {station.code}<br />{station.address}<br />
        {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}<br />
        <strong>Số đo gốc (depth): {stationReading(station)}</strong><br />
        <small>Chưa xác minh đơn vị, loại trạm và thời điểm đo. Không dùng số đo này để kết luận mức ngập.</small><br />
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`} target="_blank" rel="noopener noreferrer">Chỉ đường đến trạm →</a>
      </Popup>
    </CircleMarker>
  );
}

export function WaterStationMarkers({ selectedId }: { selectedId?: string }) {
  return WATER_STATIONS.map((station) => <Station key={station.id} station={station} selected={station.id === selectedId} />);
}