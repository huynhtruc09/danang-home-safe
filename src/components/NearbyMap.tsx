import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, LayersControl, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LocateControl } from "./LocateControl";
import { pinIcon } from "./mapPin";

type Poi = { id: number; lat: number; lng: number; name: string; cat: string };
const CATS: Record<string, { label: string; color: string; q: string }> = {
  school: { label: "Trường học", color: "#2563eb", q: '["amenity"~"school|university|college|kindergarten"]' },
  market: { label: "Chợ", color: "#e8900c", q: '["amenity"="marketplace"]' },
  supermarket: { label: "Siêu thị", color: "#9333ea", q: '["shop"~"supermarket|convenience|mall"]' },
  health: { label: "Bệnh viện / phòng khám", color: "#d63a2a", q: '["amenity"~"hospital|clinic|pharmacy"]' },
  bus: { label: "Trạm xe buýt", color: "#0d9488", q: '["highway"="bus_stop"]' },
};
const DESTS = [
  { name: "Cầu Rồng", p: [16.0612, 108.2272] },
  { name: "Sân bay Đà Nẵng", p: [16.0439, 108.1994] },
  { name: "ĐH Bách Khoa", p: [16.0738, 108.1499] },
  { name: "Biển Mỹ Khê", p: [16.0614, 108.2468] },
  { name: "Chợ Hàn", p: [16.0683, 108.2241] },
] as const;

function dist(a: [number, number], b: [number, number]) {
  const R = 6371, dLat = ((b[0] - a[0]) * Math.PI) / 180, dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function NearbyMap({ lat, lng }: { lat: number; lng: number }) {
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dest, setDest] = useState<number | null>(null);
  const [route, setRoute] = useState<{ line: [number, number][]; km: number; min: number } | null>(null);

  useEffect(() => {
    const parts = Object.entries(CATS).map(([, c]) => `node${c.q}(around:1500,${lat},${lng});way${c.q}(around:1500,${lat},${lng});`).join("");
    const q = `[out:json][timeout:20];(${parts});out center 150;`;
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q) })
      .then((r) => r.json())
      .then((j: { elements: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] }) => {
        setPois(j.elements.flatMap((e) => {
          const t = e.tags ?? {};
          const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
          if (la == null || lo == null) return [];
          const cat = t["highway"] === "bus_stop" ? "bus" : t["amenity"] === "marketplace" ? "market" : t["shop"] ? "supermarket" : /hospital|clinic|pharmacy/.test(t["amenity"] ?? "") ? "health" : "school";
          return [{ id: e.id, lat: la, lng: lo, cat, name: t["name"] ?? CATS[cat]!.label }];
        }));
      })
      .catch(() => setPois([]))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  useEffect(() => {
    if (dest == null) return setRoute(null);
    const d = DESTS[dest]!.p;
    fetch(`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${d[1]},${d[0]}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((j: { routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }) => {
        const r = j.routes?.[0];
        if (r) setRoute({ line: r.geometry.coordinates.map(([x, y]) => [y, x]), km: r.distance / 1000, min: r.duration / 60 });
      })
      .catch(() => setRoute(null));
  }, [dest, lat, lng]);

  const nearest = useMemo(() => Object.keys(CATS).map((k) => {
    const list = pois.filter((p) => p.cat === k).map((p) => ({ ...p, d: dist([lat, lng], [p.lat, p.lng]) })).sort((a, b) => a.d - b.d);
    return { k, count: list.length, top: list[0] };
  }), [pois, lat, lng]);

  return (
    <div className="space-y-3">
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: 420, borderRadius: 16 }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Bản đồ đường phố">
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Vệ tinh">
            <TileLayer attribution="Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name="Giao thông công cộng">
            <TileLayer attribution="ÖPNVKarte" url="https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png" opacity={0.7} />
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Tiện ích xung quanh">
            <LayerGroup>
              {pois.map((p) => (
                <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: "#fff", weight: 1, fillColor: CATS[p.cat]!.color, fillOpacity: 1 }}>
                  <Popup><b>{p.name}</b><br />{CATS[p.cat]!.label} · {(dist([lat, lng], [p.lat, p.lng]) * 1000).toFixed(0)}m</Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <Marker position={[lat, lng]} icon={pinIcon("#e06a3c", 34)}><Popup><b>Vị trí chính xác của nhà</b><br />{lat.toFixed(5)}, {lng.toFixed(5)}</Popup></Marker>
        {route && <Polyline positions={route.line} pathOptions={{ color: "#1f5f7a", weight: 5 }} />}
        <LocateControl />
      </MapContainer>
      <div className="text-xs text-muted-foreground">Tọa độ: {lat.toFixed(5)}, {lng.toFixed(5)} · <a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}>Mở chỉ đường trên Google Maps</a></div>
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium">Đường đi tới:</span>
        {DESTS.map((d, i) => (
          <button key={d.name} onClick={() => setDest(dest === i ? null : i)} className={`rounded-full border px-3 py-1 text-xs ${dest === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{d.name}</button>
        ))}
      </div>
      {route && <p className="text-sm">🛵 {route.km.toFixed(1)} km · khoảng {Math.round(route.min)} phút (giờ cao điểm có thể lâu hơn 1,5×)</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {nearest.map(({ k, count, top }) => (
          <div key={k} className="rounded-xl border bg-card p-2 text-xs">
            <div className="flex items-center gap-1 font-semibold"><i className="size-2.5 rounded-full" style={{ background: CATS[k]!.color }} />{CATS[k]!.label}</div>
            {loading ? <span className="text-muted-foreground">Đang tải…</span> : top ? <span className="text-muted-foreground">{count} nơi · gần nhất {top.name} ({(top.d * 1000).toFixed(0)}m)</span> : <span className="text-muted-foreground">Không có trong 1,5km</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
