import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { estimateMonthlyCost, vnd } from "@/lib/format";
import type { Listing } from "@/lib/listings";

export function CostEstimator({ l }: { l: Listing }) {
  const [kwh, setKwh] = useState(120);
  const [people, setPeople] = useState(1);
  const [vehicles, setVehicles] = useState(1);
  const [other, setOther] = useState(0);
  const r = estimateMonthlyCost({
    rent: l.price, electricityPrice: l.electricity_price, kwh, waterPrice: l.water_price, people,
    internet: l.internet_price, parking: l.parking_price, vehicles, other,
  });
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const rows = [
    ["Tiền thuê", l.price], [`Điện (${l.electricity_price.toLocaleString("vi-VN")}đ/kWh)`, r.electricity],
    ["Nước", r.water], ["Internet", l.internet_price], ["Gửi xe", r.parking], ["Khác", other],
  ] as const;
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <h3 className="text-xl font-bold">Ước tính chi phí hằng tháng</h3>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Điện dùng (kWh)</Label><Input type="number" value={kwh} onChange={(e) => setKwh(num(e.target.value))} /></div>
        <div><Label>Số người ở</Label><Input type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, num(e.target.value)))} /></div>
        <div><Label>Số xe</Label><Input type="number" value={vehicles} onChange={(e) => setVehicles(num(e.target.value))} /></div>
        <div><Label>Chi phí khác (đ)</Label><Input type="number" value={other} onChange={(e) => setOther(num(e.target.value))} /></div>
      </div>
      <ul className="space-y-1 text-sm">
        {rows.map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v.toLocaleString("vi-VN")}đ</span></li>)}
      </ul>
      <div className="flex items-end justify-between border-t pt-3">
        <div><div className="text-sm text-muted-foreground">Tổng / tháng</div><div className="text-2xl font-bold text-primary">{r.total.toLocaleString("vi-VN")}đ</div></div>
        {people > 1 && <div className="text-right text-sm">Mỗi người<br /><b>{vnd(r.perPerson)}</b></div>}
      </div>
    </div>
  );
}
