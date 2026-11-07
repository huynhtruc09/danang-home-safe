import { createFileRoute } from "@tanstack/react-router";
import { useListings } from "@/lib/listings";
import { ClientMap } from "@/components/ClientMap";
import { FLOOD_ZONES, FLOOD_LABEL } from "@/lib/flood";
import { FloodBadge } from "@/components/FloodBadge";
import { WeatherPanel } from "@/components/WeatherPanel";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WATER_STATIONS, filterWaterStations, stationReading } from "@/lib/water-stations";

export const Route = createFileRoute("/ban-do")({
  head: () => ({
    meta: [
      { title: "Bản đồ cảnh báo ngập lụt Đà Nẵng – DaNang PadFinder" },
      { name: "description", content: "Lớp bản đồ vùng xanh an toàn, vùng cam/đỏ có nguy cơ ngập tại Liên Chiểu, Thanh Khê và các quận Đà Nẵng." },
      { property: "og:title", content: "Bản đồ ngập lụt mùa mưa Đà Nẵng" },
      { property: "og:description", content: "Vùng xanh – cam – đỏ dựa trên các đợt mưa bão lớn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data = [] } = useListings();
  const [query, setQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string>();
  const stations = filterWaterStations(query);
  const order = { danger: 0, warn: 1, safe: 2 } as const;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold">Bản đồ cảnh báo ngập lụt mùa mưa</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Nguồn trạm: file bạn cung cấp từ bản đồ mưa ngập TP Đà Nẵng · {WATER_STATIONS.length} trạm. Dữ liệu tĩnh, chưa kết nối cập nhật trực tiếp.</p>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">File chưa có thời điểm đo, đơn vị của “depth” và chú giải loại trạm. Số đo tại sông, hồ không được coi là độ sâu ngập đường; số 0 không đồng nghĩa khu vực an toàn. Vùng xanh/cam/đỏ bên dưới là ước lượng lịch sử riêng biệt.</p>
      <div className="mt-6"><WeatherPanel /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ClientMap listings={data} height={640} showWaterStations selectedStationId={selectedStationId} />
        <section className="min-w-0">
          <h2 className="text-xl font-bold">Trạm quan trắc ({stations.length})</h2>
          <label className="mt-3 flex items-center gap-2 rounded-md border bg-background px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input aria-label="Tìm trạm quan trắc" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên trạm, phường, mã trạm…" className="h-10 min-w-0 w-full bg-transparent text-sm outline-none" />
          </label>
          <ul className="mt-3 max-h-[540px] overflow-y-auto divide-y">
            {stations.map((station) => <li key={station.id}>
              <Button variant="ghost" onClick={() => setSelectedStationId(station.id)} aria-pressed={selectedStationId === station.id} className="h-auto w-full items-start justify-start whitespace-normal py-3 text-left">
                <MapPin className="mt-1 shrink-0 text-primary" />
                <span className="min-w-0"><span className="block font-semibold">{station.name}</span><span className="block text-xs text-muted-foreground">{station.district} · {station.code}</span><span className="block text-xs">Số đo gốc: {stationReading(station)}</span></span>
              </Button>
            </li>)}
          </ul>
          {stations.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Không tìm thấy trạm phù hợp.</p>}
        </section>
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-2xl font-bold">Vùng nguy cơ lịch sử · Ước lượng</h2>
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {[...FLOOD_ZONES].sort((a, b) => order[a.level] - order[b.level]).map((z) => (
            <li key={z.name} className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between gap-2"><b className="text-sm">{z.name}</b><FloodBadge level={z.level} compact title={FLOOD_LABEL[z.level]} /></div>
              <div className="text-xs text-muted-foreground">{z.district} · {z.note}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
