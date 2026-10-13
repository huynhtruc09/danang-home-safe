import { createFileRoute } from "@tanstack/react-router";
import { useListings } from "@/lib/listings";
import { ClientMap } from "@/components/ClientMap";
import { FLOOD_ZONES, FLOOD_LABEL } from "@/lib/flood";
import { FloodBadge } from "@/components/FloodBadge";
import { WeatherPanel } from "@/components/WeatherPanel";

export const Route = createFileRoute("/ban-do")({
  head: () => ({
    meta: [
      { title: "Bản đồ cảnh báo ngập lụt Đà Nẵng – DaNang PadFinder" },
      { name: "description", content: "Lớp bản đồ vùng xanh an toàn, vùng cam/đỏ có nguy cơ ngập tại Liên Chiểu, Thanh Khê và các quận Đà Nẵng." },
      { property: "og:title", content: "Bản đồ ngập lụt mùa mưa Đà Nẵng" },
      { property: "og:description", content: "Vùng xanh – cam – đỏ dựa trên các đợt mưa bão lớn." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data = [] } = useListings();
  const order = { danger: 0, warn: 1, safe: 2 } as const;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold">Bản đồ cảnh báo ngập lụt mùa mưa</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Dựa trên dữ liệu các đợt mưa bão lớn (lũ 10/2022, bão Noru 2022, lũ 2020). Bật/tắt lớp bản đồ ở góc phải.</p>
      <div className="mt-6"><WeatherPanel /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ClientMap listings={data} height={640} />
        <ul className="space-y-2">
          {[...FLOOD_ZONES].sort((a, b) => order[a.level] - order[b.level]).map((z) => (
            <li key={z.name} className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between gap-2"><b className="text-sm">{z.name}</b><FloodBadge level={z.level} compact title={FLOOD_LABEL[z.level]} /></div>
              <div className="text-xs text-muted-foreground">{z.district} · {z.note}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
