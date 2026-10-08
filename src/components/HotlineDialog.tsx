import { Phone, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

const NATIONAL = [
  { name: "Công an (khẩn cấp)", phone: "113" },
  { name: "Cứu hỏa – cứu nạn", phone: "114" },
  { name: "Cấp cứu y tế", phone: "115" },
];

// Số điện thoại trực ban công an quận: dữ liệu tham khảo, cần xác minh lại trước khi phát hành.
const DISTRICT_POLICE = [
  { name: "Công an quận Hải Châu", phone: "0236 3821 335" },
  { name: "Công an quận Thanh Khê", phone: "0236 3759 199" },
  { name: "Công an quận Sơn Trà", phone: "0236 3831 360" },
  { name: "Công an quận Ngũ Hành Sơn", phone: "0236 3836 265" },
  { name: "Công an quận Liên Chiểu", phone: "0236 3842 152" },
  { name: "Công an quận Cẩm Lệ", phone: "0236 3675 113" },
  { name: "Công an huyện Hòa Vang", phone: "0236 3846 113" },
];

export function HotlineDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm"><Siren />Hotline</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đường dây nóng Đà Nẵng</DialogTitle>
          <DialogDescription>Gặp sự cố an ninh, lừa đảo khi thuê nhà? Gọi ngay.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {NATIONAL.map((n) => (
            <a key={n.phone} href={`tel:${n.phone}`} className="rounded-xl bg-destructive p-3 text-center text-destructive-foreground">
              <div className="text-2xl font-bold">{n.phone}</div>
              <div className="text-xs">{n.name}</div>
            </a>
          ))}
        </div>
        <ul className="divide-y rounded-xl border">
          {DISTRICT_POLICE.map((d) => (
            <li key={d.name} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{d.name}</span>
              <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 font-medium text-primary"><Phone className="size-3.5" />{d.phone}</a>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
