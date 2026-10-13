import { useQuery } from "@tanstack/react-query";
import { CloudRain, Sun, Thermometer, Wind, AlertTriangle } from "lucide-react";

const SEASONS = [
  { name: "Xuân (T1–T3)", temp: "20–26°C", note: "Mát, mưa phùn nhẹ, ít ngập." },
  { name: "Hạ (T4–T8)", temp: "28–36°C", note: "Nắng nóng, khô; cần phòng có điều hòa, tiền điện cao." },
  { name: "Thu (T9–T11)", temp: "24–30°C", note: "Mùa mưa bão, nguy cơ ngập cao nhất (đỉnh T10–T11)." },
  { name: "Đông (T12)", temp: "19–24°C", note: "Mưa lạnh, gió mùa Đông Bắc, ẩm." },
];

type Wx = {
  current: { temperature_2m: number; precipitation: number; wind_speed_10m: number; weather_code: number };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] };
  hourly: { precipitation: number[] };
};

export function floodAlert(next24mm: number) {
  if (next24mm >= 100) return { level: "danger" as const, text: `Mưa rất lớn ${next24mm.toFixed(0)}mm/24h – nguy cơ ngập cao ở vùng đỏ, hạn chế di chuyển.` };
  if (next24mm >= 50) return { level: "warn" as const, text: `Mưa lớn ${next24mm.toFixed(0)}mm/24h – có thể ngập cục bộ ở kiệt trũng.` };
  return { level: "safe" as const, text: `Lượng mưa ${next24mm.toFixed(0)}mm/24h – chưa có nguy cơ ngập.` };
}

export function WeatherPanel({ lat = 16.054, lng = 108.202 }: { lat?: number; lng?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["wx", lat.toFixed(2), lng.toFixed(2)],
    refetchInterval: 15 * 60_000,
    queryFn: async (): Promise<Wx> =>
      (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&hourly=precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5&timezone=Asia%2FBangkok`)).json(),
  });
  const next24 = data ? data.hourly.precipitation.slice(new Date().getHours(), new Date().getHours() + 24).reduce((a, b) => a + b, 0) : 0;
  const alert = floodAlert(next24);
  const tone = { safe: "border-safe bg-safe/10", warn: "border-warn bg-warn/10", danger: "border-danger bg-danger/10" }[alert.level];
  const month = new Date().getMonth();
  const season = month < 3 ? 0 : month < 8 ? 1 : month < 11 ? 2 : 3;

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <h3 className="text-xl font-bold">Thời tiết & cảnh báo ngập thời gian thực</h3>
      {isLoading || !data ? <div className="h-24 animate-pulse rounded-xl bg-muted" /> : (
        <>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1"><Thermometer className="size-4" />{data.current.temperature_2m.toFixed(0)}°C</span>
            <span className="flex items-center gap-1"><CloudRain className="size-4" />{data.current.precipitation}mm hiện tại</span>
            <span className="flex items-center gap-1"><Wind className="size-4" />{data.current.wind_speed_10m.toFixed(0)} km/h</span>
          </div>
          <div className={`flex gap-2 rounded-xl border-l-4 p-3 text-sm ${tone}`}><AlertTriangle className="size-4 shrink-0" />{alert.text}</div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {data.daily.time.map((t, i) => (
              <div key={t} className="rounded-lg bg-muted p-2">
                <div className="font-semibold">{new Date(t).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" })}</div>
                {data.daily.precipitation_sum[i]! > 5 ? <CloudRain className="mx-auto my-1 size-4" /> : <Sun className="mx-auto my-1 size-4" />}
                <div>{data.daily.temperature_2m_min[i]!.toFixed(0)}–{data.daily.temperature_2m_max[i]!.toFixed(0)}°</div>
                <div className="text-muted-foreground">{data.daily.precipitation_sum[i]!.toFixed(0)}mm</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Khí hậu 4 mùa Đà Nẵng</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEASONS.map((s, i) => (
            <div key={s.name} className={`rounded-xl border p-2 text-xs ${i === season ? "border-primary bg-primary/5" : ""}`}>
              <b>{s.name}</b> · {s.temp}{i === season && " · hiện tại"}<div className="text-muted-foreground">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Dữ liệu dự báo từ Open-Meteo, tự cập nhật mỗi 15 phút.</p>
    </section>
  );
}
