import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, MapPin, MessageCircle, Phone, Star, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useListing, useCart, imageUrl } from "@/lib/listings";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panorama360 } from "@/components/Panorama360";
import { CostEstimator } from "@/components/CostEstimator";
import { ClientMap } from "@/components/ClientMap";
import { ClientNearby } from "@/components/ClientNearby";
import { ViewingBooking } from "@/components/ViewingBooking";
import { WeatherPanel } from "@/components/WeatherPanel";
import { FloodBadge } from "@/components/FloodBadge";
import { DEAL_LABEL, KIND_LABEL, vnd } from "@/lib/format";
import { floodRiskAt, FLOOD_LABEL } from "@/lib/flood";

export const Route = createFileRoute("/phong/$id")({
  head: () => ({
    meta: [
      { title: "Chi tiết phòng – DaNang PadFinder" },
      { name: "description", content: "Xem ảnh, 360°, đánh giá, chi phí và mức độ ngập của căn phòng tại Đà Nẵng." },
      { property: "og:title", content: "Chi tiết phòng – DaNang PadFinder" },
      { property: "og:description", content: "Xem 360°, đánh giá người thuê cũ và cảnh báo ngập." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: l, isLoading } = useListing(id);
  const { user, signIn } = useAuth();
  const cart = useCart(user?.id);
  const qc = useQueryClient();
  const [img, setImg] = useState(0);

  if (isLoading) return <div className="mx-auto max-w-6xl p-8"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></div>;
  if (!l) return <div className="p-16 text-center">Không tìm thấy tin đăng. <Link to="/" className="text-primary underline">Về trang chủ</Link></div>;

  const risk = floodRiskAt(l.lat, l.lng);
  const rented = l.status !== "available";
  const isOwner = user?.id === l.owner_id;

  const book = async () => {
    if (!user) return signIn();
    const { data, error } = await supabase.rpc("book_listing", { _listing_id: l.id });
    if (error || !data) return toast.error("Không thể đặt – có thể đã có người thuê.");
    toast.success(l.deal === "sale" ? "Đặt mua thành công!" : "Đặt thuê thành công! Chủ nhà sẽ liên hệ bạn.");
    qc.invalidateQueries({ queryKey: ["listing", id] });
    qc.invalidateQueries({ queryKey: ["listings"] });
  };

  const toggleStatus = async () => {
    await supabase.from("listings").update({ status: rented ? "available" : "rented", rented_by: null }).eq("id", l.id);
    qc.invalidateQueries({ queryKey: ["listing", id] });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={imageUrl(l.images[img])} alt={l.title} width={1024} height={768} className={`aspect-[4/3] w-full object-cover ${rented ? "grayscale" : ""}`} />
            {rented && <div className="absolute inset-0 grid place-items-center bg-ink/50 text-3xl font-bold uppercase text-ink-foreground">{l.deal === "sale" ? "Đã bán" : "Hết phòng"}</div>}
          </div>
          {l.images.length > 1 && (
            <div className="flex gap-2">{l.images.map((s, i) => <button key={s} onClick={() => setImg(i)}><img src={s} alt="" className="h-16 w-24 rounded-lg object-cover" /></button>)}</div>
          )}
        </div>
        <aside className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">{KIND_LABEL[l.kind]} · {DEAL_LABEL[l.deal]}</div>
          <h1 className="text-3xl font-bold">{l.title}</h1>
          <div className="flex items-center gap-1 text-sm"><MapPin className="size-4" />{l.address}, {l.district}</div>
          <div className="text-3xl font-bold text-primary">{vnd(l.price)}{l.deal === "rent" && <span className="text-base font-normal text-muted-foreground">/tháng</span>}</div>
          <FloodBadge level={risk.level} title={FLOOD_LABEL[risk.level]} />
          {risk.zone && <p className="text-xs text-muted-foreground">{risk.zone.note}</p>}
          {isOwner ? (
            <Button className="w-full" variant="outline" onClick={toggleStatus}>{rented ? "Mở lại tin (còn trống)" : "Đánh dấu đã hết phòng"}</Button>
          ) : (
            <Button className="w-full" variant="coral" size="lg" disabled={rented} onClick={book}>{rented ? "Đã có người đặt" : l.deal === "sale" ? "Đặt mua" : "Đặt thuê ngay"}</Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => (user ? cart.toggle(l.id) : signIn())}>
              <Heart className={cart.ids.has(l.id) ? "fill-coral text-coral" : ""} />{cart.ids.has(l.id) ? "Trong giỏ" : "Thêm giỏ"}
            </Button>
            {l.owner_id && !isOwner ? (
              <Button variant="secondary" asChild><Link to="/tin-nhan" search={{ to: l.owner_id, listing: l.id }}><MessageCircle />Nhắn tin</Link></Button>
            ) : l.contact_phone ? (
              <Button variant="secondary" asChild><a href={`tel:${l.contact_phone.replace(/\s/g, "")}`}><Phone />Gọi</a></Button>
            ) : null}
          </div>
          {l.notes && <div className="flex gap-2 rounded-xl bg-muted p-3 text-sm"><AlertTriangle className="size-4 shrink-0 text-warn" />{l.notes}</div>}
        </aside>
      </div>

      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Mô tả</h2>
        <p className="text-muted-foreground">{l.description}</p>
        <p className="text-sm">Diện tích: <b>{l.area_m2}m²</b></p>
      </section>

      {l.panorama_url && (
        <section className="space-y-3"><h2 className="text-2xl font-bold">Xem toàn cảnh 360°</h2><Panorama360 src={l.panorama_url} /></section>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Vị trí chính xác, tiện ích & đường đi</h2>
        <ClientNearby lat={l.lat} lng={l.lng} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ViewingBooking l={l} />
        <WeatherPanel lat={l.lat} lng={l.lng} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {l.deal === "rent" ? <CostEstimator l={l} /> : <div />}
        <div><h3 className="mb-3 text-xl font-bold">Vùng ngập quanh nhà</h3><ClientMap listings={[l]} center={[l.lat, l.lng]} zoom={15} height={360} /></div>
      </div>

      <Reviews listingId={l.id} />
    </div>
  );
}

function Reviews({ listingId }: { listingId: string }) {
  const { user, signIn } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["reviews", listingId],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("listing_id", listingId).order("created_at", { ascending: false })).data ?? [],
  });
  const avg = data.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;
  const submit = async () => {
    if (!user) return signIn();
    if (!comment.trim()) return;
    const { error } = await supabase.from("reviews").insert({ listing_id: listingId, user_id: user.id, rating, comment, author_name: user.user_metadata?.["full_name"] ?? "Người thuê" });
    if (error) return toast.error("Không gửi được đánh giá");
    setComment("");
    qc.invalidateQueries({ queryKey: ["reviews", listingId] });
  };
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Đánh giá từ người thuê cũ {data.length > 0 && <span className="text-base font-normal text-muted-foreground">· {avg.toFixed(1)}★ ({data.length})</span>}</h2>
      <div className="space-y-2 rounded-2xl border bg-card p-4">
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} sao`}><Star className={`size-5 ${n <= rating ? "fill-warn text-warn" : "text-muted-foreground"}`} /></button>)}</div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm: chủ nhà, an ninh, ngập nước…" />
        <Button onClick={submit}>Gửi đánh giá</Button>
      </div>
      {data.map((r) => (
        <div key={r.id} className="rounded-2xl border p-4">
          <div className="flex items-center justify-between"><b>{r.author_name}</b><span className="text-warn">{"★".repeat(r.rating)}<span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span></span></div>
          <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
        </div>
      ))}
    </section>
  );
}
