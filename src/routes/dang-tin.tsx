import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISTRICTS, KIND_LABEL } from "@/lib/format";
import { ClientPicker } from "@/components/ClientPicker";

export const Route = createFileRoute("/dang-tin")({
  head: () => ({
    meta: [
      { title: "Đăng tin cho thuê / bán – Trọ Đà Nẵng" },
      { name: "description", content: "Đăng ảnh, mô tả, giá và lưu ý để cho thuê hoặc bán nhà tại Đà Nẵng." },
      { property: "og:title", content: "Đăng tin – Trọ Đà Nẵng" },
      { property: "og:description", content: "Đăng phòng trọ, nhà, chung cư lên Trọ Đà Nẵng." },
    ],
  }),
  component: PostPage,
});

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function PostPage() {
  const { user, roles, signIn } = useAuth();
  const nav = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [pano, setPano] = useState<File | null>(null);
  const [pos, setPos] = useState<[number, number]>([16.0544, 108.2022]);
  const [f, setF] = useState({ title: "", description: "", kind: "tro", deal: "rent", price: "", area: "20", district: "Hải Châu", address: "", notes: "", electricity: "3500", water: "100000", internet: "100000", parking: "0", phone: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  if (!user) return <div className="p-16 text-center"><Button onClick={signIn}>Đăng nhập Gmail để đăng tin</Button></div>;
  if (!roles.includes("landlord")) return <div className="p-16 text-center">Bạn cần chọn vai trò <b>Người bán / cho thuê</b>. <Link to="/tai-khoan" className="text-primary underline">Chọn vai trò</Link></div>;

  const upload = async (file: File) => {
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file);
    if (error) throw error;
    const { data, error: e2 } = await supabase.storage.from("listing-images").createSignedUrl(path, TEN_YEARS);
    if (e2) throw e2;
    return data.signedUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title || !f.price || !f.address || files.length === 0) { toast.error("Nhập tiêu đề, giá, địa chỉ và ít nhất 1 ảnh"); return; }
    setBusy(true);
    try {
      const images = await Promise.all(files.map(upload));
      const panorama_url = pano ? await upload(pano) : null;
      const { data, error } = await supabase.from("listings").insert({
        owner_id: user.id, title: f.title, description: f.description, kind: f.kind, deal: f.deal, price: Number(f.price),
        area_m2: Number(f.area), district: f.district, address: f.address, lat: pos[0], lng: pos[1], images, panorama_url,
        notes: f.notes, electricity_price: Number(f.electricity), water_price: Number(f.water), internet_price: Number(f.internet),
        parking_price: Number(f.parking), contact_phone: f.phone,
      }).select("id").single();
      if (error) throw error;
      toast.success("Đăng tin thành công!");
      nav({ to: "/phong/$id", params: { id: data.id } });
    } catch (err) {
      toast.error("Đăng tin thất bại: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-bold">Đăng tin cho thuê / bán</h1>
      <div className="space-y-2">
        <Label>Hình ảnh (tối đa 8)</Label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-card p-8 text-muted-foreground">
          <ImagePlus className="size-8" />Chọn ảnh phòng
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 8))} />
        </label>
        {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map((file) => <img key={file.name} src={URL.createObjectURL(file)} alt="" className="h-20 w-28 rounded-lg object-cover" />)}</div>}
      </div>
      <div className="space-y-1"><Label>Ảnh toàn cảnh 360° (tùy chọn, dạng ảnh panorama ngang)</Label><Input type="file" accept="image/*" onChange={(e) => setPano(e.target.files?.[0] ?? null)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Tiêu đề</Label><Input value={f.title} onChange={(e) => set("title")(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Chú thích / mô tả</Label><Textarea value={f.description} onChange={(e) => set("description")(e.target.value)} /></div>
        <div><Label>Loại</Label>
          <Select value={f.kind} onValueChange={set("kind")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(KIND_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Hình thức</Label>
          <Select value={f.deal} onValueChange={set("deal")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rent">Cho thuê</SelectItem><SelectItem value="sale">Bán</SelectItem></SelectContent></Select></div>
        <div><Label>{f.deal === "rent" ? "Giá thuê / tháng (đ)" : "Giá bán (đ)"}</Label><Input type="number" value={f.price} onChange={(e) => set("price")(e.target.value)} /></div>
        <div><Label>Diện tích (m²)</Label><Input type="number" value={f.area} onChange={(e) => set("area")(e.target.value)} /></div>
        <div><Label>Quận</Label>
          <Select value={f.district} onValueChange={set("district")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Địa chỉ</Label><Input value={f.address} onChange={(e) => set("address")(e.target.value)} /></div>
        <div><Label>Giá điện (đ/kWh)</Label><Input type="number" value={f.electricity} onChange={(e) => set("electricity")(e.target.value)} /></div>
        <div><Label>Nước (đ/người/tháng)</Label><Input type="number" value={f.water} onChange={(e) => set("water")(e.target.value)} /></div>
        <div><Label>Internet (đ/tháng)</Label><Input type="number" value={f.internet} onChange={(e) => set("internet")(e.target.value)} /></div>
        <div><Label>Gửi xe (đ/xe/tháng)</Label><Input type="number" value={f.parking} onChange={(e) => set("parking")(e.target.value)} /></div>
        <div><Label>Số điện thoại liên hệ</Label><Input value={f.phone} onChange={(e) => set("phone")(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Lưu ý (cọc, giờ giấc, ngập nước…)</Label><Textarea value={f.notes} onChange={(e) => set("notes")(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Bấm lên bản đồ để chọn vị trí</Label><ClientPicker value={pos} onChange={setPos} /></div>
      <Button type="submit" size="lg" variant="coral" disabled={busy}>{busy ? "Đang đăng…" : "Đăng tin"}</Button>
    </form>
  );
}
