import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FLOOD_ZONES } from "@/lib/flood";
import { LocateControl } from "./LocateControl";
import { pinIcon } from "./mapPin";

const HEX = { safe: "#2f9e5b", warn: "#e8900c", danger: "#d63a2a" } as const;

function Click({ onChange }: { onChange: (p: [number, number]) => void }) {
  useMapEvents({
    click: (e: { latlng: { lat: number; lng: number } }) => onChange([e.latlng.lat, e.latlng.lng]),
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (p: [number, number]) => void;
}) {
  return (
    <MapContainer center={value} zoom={13} style={{ height: 360, borderRadius: 16 }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Bản đồ đường phố (CARTO)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Bản đồ OpenStreetMap gốc">
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            referrerPolicy="origin"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Vệ tinh">
          <TileLayer
            attribution="Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {FLOOD_ZONES.map((z) => (
        <Circle
          key={z.name}
          center={z.center}
          radius={z.radius}
          pathOptions={{ color: HEX[z.level], fillOpacity: 0.2, weight: 1 }}
        />
      ))}
      <Marker
        position={value}
        icon={pinIcon("#e06a3c", 32)}
        draggable
        eventHandlers={{
          drag: (e) => {
            const p = (e.target as { getLatLng(): { lat: number; lng: number } }).getLatLng();
            onChange([p.lat, p.lng]);
          },
        }}
      />
      <Click onChange={onChange} />
      <LocateControl />
    </MapContainer>
  );
}
