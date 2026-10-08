import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Ruler, View } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/lib/listings";
import { imageUrl } from "@/lib/listings";
import { DEAL_LABEL, KIND_LABEL, vnd } from "@/lib/format";
import { floodRiskAt, FLOOD_LABEL } from "@/lib/flood";
import { FloodBadge } from "./FloodBadge";

export function ListingCard({ l, inCart, onToggleCart }: { l: Listing; inCart?: boolean; onToggleCart?: () => void }) {
  const rented = l.status !== "available";
  const risk = floodRiskAt(l.lat, l.lng);
  return (
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to="/phong/$id" params={{ id: l.id }}>
          <img src={imageUrl(l.images[0])} alt={l.title} loading="lazy" width={1024} height={768}
            className={`size-full object-cover transition duration-500 group-hover:scale-105 ${rented ? "grayscale" : ""}`} />
        </Link>
        {rented && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/55">
            <span className="rotate-[-8deg] rounded-lg border-2 border-ink-foreground px-4 py-1 text-xl font-bold uppercase text-ink-foreground">
              {l.deal === "sale" ? "Đã bán" : "Hết phòng"}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">{KIND_LABEL[l.kind]} · {DEAL_LABEL[l.deal]}</span>
          {l.panorama_url && <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground"><View className="size-3" />360°</span>}
        </div>
        {onToggleCart && (
          <button onClick={() => { onToggleCart(); toast.success(inCart ? "Đã bỏ khỏi giỏ" : "Đã thêm vào giỏ"); }}
            aria-label="Thêm vào giỏ" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/90">
            <Heart className={`size-4 ${inCart ? "fill-coral text-coral" : ""}`} />
          </button>
        )}
      </div>
      <Link to="/phong/$id" params={{ id: l.id }} className="block space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-sans text-base font-semibold">{l.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{l.district} · <Ruler className="size-3.5" />{l.area_m2}m²</div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{vnd(l.price)}{l.deal === "rent" && <span className="text-sm font-normal text-muted-foreground">/tháng</span>}</span>
          <FloodBadge level={risk.level} title={FLOOD_LABEL[risk.level]} compact />
        </div>
      </Link>
    </div>
  );
}
