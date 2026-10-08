import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { matchScore, type RoommateLike } from "@/lib/roommate";
import { DISTRICTS, vnd } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/o-ghep")({
  head: () => ({
    meta: [
      { title: "Tìm bạn ở ghép – Trọ Đà Nẵng" },
      { name: "description", content: "Gợi ý bạn ở ghép hợp nhau theo khu vực, ngân sách và thói quen sinh hoạt." },
      { property: "og:title", content: "Tìm bạn ở ghép thông minh – Đà Nẵng" },
      { property: "og:description", content: "Ghép đôi bạn cùng phòng theo điểm tương thích." },
    ],
  }),
  component: Roommates,
});

function Roommates() {
  const [me, setMe] = useState<RoommateLike>({ gender: "nu", budget: 2000000, district: "Liên Chiểu", occupation: "sinh_vien", sleep: "som", clean: 4, smoking: false, pets: false });
  const { data = [] } = useQuery({ queryKey: ["roommates"], queryFn: async () => (await supabase.from("roommate_profiles").select("*")).data ?? [] });
  const ranked = data.map((p) => ({ p, s: matchScore(me, p) })).sort((a, b) => b.s - a.s);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">Tìm bạn ở ghép thông minh</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div><Label>Khu vực</Label><Select value={me.district} onValueChange={(v) => setMe({ ...me, district: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Ngân sách (đ)</Label><Input type="number" value={me.budget} onChange={(e) => setMe({ ...me, budget: Number(e.target.value) || 0 })} /></div>
          <div><Label>Giờ ngủ</Label><Select value={me.sleep} onValueChange={(v) => setMe({ ...me, sleep: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="som">Ngủ sớm</SelectItem><SelectItem value="binh_thuong">Bình thường</SelectItem><SelectItem value="muon">Cú đêm</SelectItem></SelectContent></Select></div>
          <div><Label>Mức gọn gàng (1–5)</Label><Input type="number" min={1} max={5} value={me.clean} onChange={(e) => setMe({ ...me, clean: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={me.smoking} onCheckedChange={(v) => setMe({ ...me, smoking: v })} />Hút thuốc</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={me.pets} onCheckedChange={(v) => setMe({ ...me, pets: v })} />Nuôi thú cưng</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ranked.map(({ p, s }) => (
            <div key={p.user_id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between"><b className="text-lg">{p.display_name}, {p.age}</b><span className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">{s}% hợp</span></div>
              <div className="text-sm text-muted-foreground">{p.district} · ngân sách {vnd(p.budget)}</div>
              <p className="mt-2 text-sm">{p.bio}</p>
              {p.contact && <div className="mt-2 text-sm font-medium text-primary">{p.contact}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
