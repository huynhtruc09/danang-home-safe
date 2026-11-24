import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import hero from "@/assets/hero-danang.jpg";
import { useListings, useCart } from "@/lib/listings";
import { useAuth } from "@/lib/auth";
import { ListingCard } from "@/components/ListingCard";
import { ClientMap } from "@/components/ClientMap";
import { MarketPriceSummary } from "@/components/MarketPriceSummary";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DISTRICTS, KIND_LABEL } from "@/lib/format";
import { floodRiskAt } from "@/lib/flood";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DaNang PadFinder – Phòng trọ, nhà, chung cư & bản đồ ngập" },
      {
        name: "description",
        content:
          "Tổng hợp phòng trọ, nhà, chung cư cho thuê và bán tại Đà Nẵng, xem 360°, đánh giá thật, cảnh báo ngập mùa mưa.",
      },
      { property: "og:title", content: "DaNang PadFinder – Tìm nhà an toàn mùa mưa" },
      {
        property: "og:description",
        content: "Phòng trọ, chung cư Đà Nẵng kèm lớp bản đồ vùng xanh / cam / đỏ ngập lụt.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data = [], isLoading, lastSyncedAt } = useListings();
  const { user, signIn } = useAuth();
  const cart = useCart(user?.id);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("all");
  const [kind, setKind] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlySafe, setOnlySafe] = useState(false);

  const list = useMemo(
    () =>
      data.filter(
        (l) =>
          (district === "all" || l.district === district) &&
          (kind === "all" || l.kind === kind) &&
          (!onlyAvailable || l.status === "available") &&
          (!onlySafe || floodRiskAt(l.lat, l.lng).level !== "danger") &&
          (!q || `${l.title} ${l.address}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, district, kind, onlyAvailable, onlySafe, q],
  );

  return (
    <div>
      <section className="relative h-[460px] overflow-hidden">
        <img
          src={hero}
          alt="Đà Nẵng về đêm"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-sea-fade" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 text-ink-foreground">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-6xl">
            Tìm chỗ ở Đà Nẵng, khô ráo cả mùa mưa.
          </h1>
          <p className="mt-3 max-w-xl text-lg opacity-90">
            Phòng trọ, nhà, chung cư thật – kèm bản đồ cảnh báo ngập từng kiệt.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-background p-2 text-foreground">
            <Search className="ml-2 size-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tên đường, kiệt, khu vực…"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Quận" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả quận</SelectItem>
              {DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
            Chỉ còn trống
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={onlySafe} onCheckedChange={setOnlySafe} />
            Tránh vùng ngập đỏ
          </label>
          <span className="ml-auto text-sm text-muted-foreground">{list.length} kết quả</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-5 sm:grid-cols-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            {list.map((l) => (
              <ListingCard
                key={l.id}
                l={l}
                inCart={cart.ids.has(l.id)}
                onToggleCart={user ? () => cart.toggle(l.id) : () => signIn()}
              />
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ClientMap listings={list} height={560} />
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1">
                <i className="size-3 rounded-full bg-safe" />
                Vùng xanh an toàn
              </span>
              <span className="flex items-center gap-1">
                <i className="size-3 rounded-full bg-warn" />
                Vùng cam
              </span>
              <span className="flex items-center gap-1">
                <i className="size-3 rounded-full bg-danger" />
                Vùng đỏ
              </span>
            </div>
          </div>
        </div>

        <MarketPriceSummary
          listings={data}
          lastSyncedAt={lastSyncedAt}
          selectedDistrict={district}
          onSelectDistrict={setDistrict}
        />
      </section>
    </div>
  );
}
