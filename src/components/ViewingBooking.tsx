import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Listing } from "@/lib/listings";

const STATUS = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", cancelled: "Đã huỷ" } as Record<string, string>;

export function ViewingBooking({ l }: { l: Listing }) {
  const { user, signIn } = useAuth();
  const qc = useQueryClient();
  const isOwner = user?.id === l.owner_id;
  const [when, setWhen] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["viewings", l.id, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("viewings").select("*").eq("listing_id", l.id).order("scheduled_at")).data ?? [],
  });

  const book = async () => {
    if (!user) return signIn();
    if (!when || new Date(when) < new Date()) return toast.error("Chọn thời gian trong tương lai");
    const { error } = await supabase.from("viewings").insert({ listing_id: l.id, owner_id: l.owner_id, renter_id: user.id, scheduled_at: new Date(when).toISOString(), phone, note });
    if (error) return toast.error("Không đặt được lịch");
    toast.success("Đã gửi lịch xem nhà cho chủ nhà");
    setWhen(""); setNote("");
    qc.invalidateQueries({ queryKey: ["viewings", l.id] });
  };
  const setStatus = async (id: string, status: string) => {
    await supabase.from("viewings").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["viewings", l.id] });
  };
  const tel = l.contact_phone?.replace(/\s/g, "");

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <h3 className="text-xl font-bold">Liên hệ nhanh & đặt lịch xem nhà</h3>
      <div className="flex flex-wrap gap-2">
        {tel && <Button variant="secondary" asChild><a href={`tel:${tel}`}><Phone />Gọi chủ nhà</a></Button>}
        {tel && <Button variant="outline" asChild><a href={`https://zalo.me/${tel}`} target="_blank" rel="noreferrer">Zalo</a></Button>}
        {l.owner_id && !isOwner && <Button variant="outline" asChild><Link to="/tin-nhan" search={{ to: l.owner_id, listing: l.id }}><MessageCircle />Nhắn trong web</Link></Button>}
      </div>
      {!isOwner && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Thời gian xem nhà" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="SĐT của bạn" />
          <Textarea className="sm:col-span-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (số người, câu hỏi…)" />
          <Button className="sm:col-span-2" onClick={book}><CalendarDays />Đặt lịch xem nhà</Button>
        </div>
      )}
      {data.length > 0 && (
        <ul className="space-y-2 text-sm">
          {data.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-2">
              <b>{new Date(v.scheduled_at).toLocaleString("vi-VN")}</b>
              {v.phone && <span>· {v.phone}</span>}
              {v.note && <span className="text-muted-foreground">· {v.note}</span>}
              <span className="ml-auto text-xs">{STATUS[v.status]}</span>
              {isOwner && v.status === "pending" && <Button size="sm" onClick={() => setStatus(v.id, "confirmed")}>Xác nhận</Button>}
              {v.status !== "cancelled" && <Button size="sm" variant="ghost" onClick={() => setStatus(v.id, "cancelled")}>Huỷ</Button>}
            </li>
          ))}
        </ul>
      )}
      <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-safe" />Trao đổi an toàn: không chuyển cọc trước khi xem nhà, giữ tin nhắn trong web làm bằng chứng, hợp đồng ghi rõ giá điện nước.</p>
    </section>
  );
}
