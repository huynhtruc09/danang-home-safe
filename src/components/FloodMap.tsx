import { MapContainer, TileLayer, Circle, Marker, Popup, LayersControl, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FLOOD_ZONES, FLOOD_LABEL, floodRiskAt } from "@/lib/flood";
import type { Listing } from "@/lib/listings";
import { vnd } from "@/lib/format";
import { LocateControl } from "./LocateControl";
import { pinIcon } from "./mapPin";
import { WaterStationMarkers } from "./WaterStationMarkers";

const HEX = { safe: "#2f9e5b", warn: "#e8900c", danger: "#d63a2a" } as const;

export default function FloodMap({ listings = [], height = 520, center = [16.055, 108.2] as [number, number], zoom = 13, showWaterStations = false, selectedStationId }: {
  listings?: Listing[]; height?: number; center?: [number, number]; zoom?: number; showWaterStations?: boolean; selectedStationId?: string;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height, width: "100%", borderRadius: 16 }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Bản đồ đường phố">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Vệ tinh">
          <TileLayer attribution="Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.BaseLayer>
        {showWaterStations && <LayersControl.Overlay checked name="Trạm mưa ngập Đà Nẵng (file nhập)">
          <LayerGroup><WaterStationMarkers selectedId={selectedStationId} /></LayerGroup>
        </LayersControl.Overlay>}
        <LayersControl.Overlay checked name="Vùng nguy cơ ngập lịch sử (ước lượng)">
          <LayerGroup>
            {FLOOD_ZONES.map((z) => (
              <Circle key={z.name} center={z.center} radius={z.radius}
                pathOptions={{ color: HEX[z.level], fillColor: HEX[z.level], fillOpacity: 0.28, weight: 1.5 }}>
                <Popup><b>{z.name}</b> ({z.district})<br />{FLOOD_LABEL[z.level]}<br /><i>{z.note}</i></Popup>
              </Circle>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Nhà / phòng cho thuê">
          <LayerGroup>
            {listings.map((l) => {
              const r = floodRiskAt(l.lat, l.lng);
              return (
                <Marker key={l.id} position={[l.lat, l.lng]} icon={pinIcon(l.status === "available" ? "#1f5f7a" : "#777", 26)}
                  zIndexOffset={l.status === "available" ? 1000 : 0}>
                  <Popup>
                    <b>{l.title}</b><br />{vnd(l.price)} · {l.status === "available" ? "Còn trống" : "Hết phòng"}<br />
                    {FLOOD_LABEL[r.level]}<br /><a href={`/phong/${l.id}`}>Xem chi tiết →</a>
                  </Popup>
                </Marker>
              );
            })}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
      <LocateControl />
    </MapContainer>
  );
}
