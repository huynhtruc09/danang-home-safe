import { useState } from "react";
import { DISTRICTS } from "@/lib/format";
import history from "@/data/danang-rainfall-history.json";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const records = history.districts;
type DistrictRainfall = (typeof records)[number];

function annualValue(value: number) {
  return `${value.toLocaleString("vi-VN")} mm`;
}

export function HistoricalRainfall() {
  const [district, setDistrict] = useState("Liên Chiểu");
  const selected: DistrictRainfall | undefined = records.find((record) => record.district === district);

  return (
    <section className="mt-10 border-t pt-8" aria-labelledby="rainfall-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Tổng hợp 2020–2025</p>
          <h2 id="rainfall-title" className="mt-1 text-3xl font-bold">Lịch sử mưa theo khu vực</h2>
        </div>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-48" aria-label="Chọn quận, huyện xem lịch sử mưa"><SelectValue /></SelectTrigger>
          <SelectContent>{DISTRICTS.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selected ? <>
        <p className="mt-3 text-sm text-muted-foreground">Khu vực đại diện: {selected.district} · tọa độ lưới {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}. Chọn quận khác để so sánh dữ liệu.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="sr-only">Lượng mưa lịch sử từng năm tại {selected.district}</caption>
            <thead className="border-b text-muted-foreground"><tr>
              <th scope="col" className="py-3 pr-4 font-medium">Năm</th>
              <th scope="col" className="py-3 pr-4 font-medium">Cả năm</th>
              <th scope="col" className="py-3 pr-4 font-medium">Mùa mưa (T9–T12)</th>
              <th scope="col" className="py-3 pr-4 font-medium">Ngày mưa lớn nhất</th>
              <th scope="col" className="py-3 font-medium">Ngày mưa ≥50 mm</th>
            </tr></thead>
            <tbody className="divide-y">{selected.years.map((year) => <tr key={year.year}>
              <th scope="row" className="py-3 pr-4 font-semibold">{year.year}</th>
              <td className="py-3 pr-4">{annualValue(year.totalMm)}</td>
              <td className="py-3 pr-4">{annualValue(year.rainySeasonMm)}</td>
              <td className="py-3 pr-4">{annualValue(year.maxDayMm)} <span className="text-muted-foreground">· {year.maxDay}</span></td>
              <td className="py-3">{year.heavyDays} ngày</td>
            </tr>)}</tbody>
          </table>
        </div>
      </> : <p className="mt-4 text-sm text-muted-foreground">Chưa có dữ liệu cho khu vực này.</p>}

      <p className="mt-4 max-w-4xl text-xs leading-relaxed text-muted-foreground">Nguồn: Open-Meteo Historical Weather API, dữ liệu tái phân tích ERA5 theo ô lưới khoảng 25 km, tổng hợp tại điểm đại diện mỗi quận/huyện; không phải số đo tại từng phường hoặc trạm địa phương. “Ngày mưa ≥50 mm” là số ngày theo lượng mưa ngày của ô lưới. Số liệu mưa không xác nhận tình trạng hay độ sâu ngập; vùng ngập lịch sử được trình bày riêng bên dưới.</p>
    </section>
  );
}