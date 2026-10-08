import { MapContainer, TileLayer, CircleMarker, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FLOOD_ZONES } from "@/lib/flood";

const HEX = { safe: "#2f9e5b", warn: "#e8900c", danger: "#d63a2a" } as const;

function Click({ onChange }: { onChange: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onChange([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export default function LocationPicker({ value, onChange }: { value: [number, number]; onChange: (p: [number, number]) => void }) {
  return (
    <MapContainer center={value} zoom={13} style={{ height: 360, borderRadius: 16 }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {FLOOD_ZONES.map((z) => <Circle key={z.name} center={z.center} radius={z.radius} pathOptions={{ color: HEX[z.level], fillOpacity: 0.2, weight: 1 }} />)}
      <CircleMarker center={value} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#e06a3c", fillOpacity: 1 }} />
      <Click onChange={onChange} />
    </MapContainer>
  );
}
