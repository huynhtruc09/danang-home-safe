export type FloodLevel = "safe" | "warn" | "danger";

export interface FloodZone {
  name: string;
  district: string;
  level: FloodLevel;
  center: [number, number];
  radius: number; // meters
  note: string;
}

// Dữ liệu tham khảo tổng hợp từ các đợt mưa lớn (10/2022, bão Noru 9/2022, lũ 2020).
export const FLOOD_ZONES: FloodZone[] = [
  { name: "Kiệt trũng Hòa Minh", district: "Liên Chiểu", level: "danger", center: [16.0612, 108.1702], radius: 700, note: "Ngập 0,6–1,2m đợt mưa 14/10/2022, nhiều kiệt Tôn Đức Thắng bị cô lập." },
  { name: "Hòa Khánh Nam (Âu Cơ)", district: "Liên Chiểu", level: "danger", center: [16.0585, 108.1545], radius: 650, note: "Nước dồn từ KCN, ngập sâu kéo dài nhiều giờ." },
  { name: "Hòa Khánh Bắc", district: "Liên Chiểu", level: "warn", center: [16.0745, 108.1495], radius: 800, note: "Ngập cục bộ 0,2–0,4m ở các kiệt thấp khi mưa lớn." },
  { name: "Thanh Khê Tây – Hà Huy Tập", district: "Thanh Khê", level: "danger", center: [16.0660, 108.1885], radius: 600, note: "Vùng trũng, kiệt nhỏ ngập 0,5–0,8m năm 2022." },
  { name: "An Khê – Điện Biên Phủ", district: "Thanh Khê", level: "warn", center: [16.0605, 108.1950], radius: 650, note: "Ngập đường khi mưa trên 200mm/ngày." },
  { name: "Hòa Xuân ven sông", district: "Cẩm Lệ", level: "warn", center: [16.0010, 108.2190], radius: 900, note: "Chịu ảnh hưởng lũ sông Cẩm Lệ, xả hồ thượng nguồn." },
  { name: "Trung tâm Hải Châu", district: "Hải Châu", level: "warn", center: [16.0680, 108.2150], radius: 700, note: "Ngập điểm tại Ông Ích Khiêm, Lê Duẩn khi mưa lớn." },
  { name: "Ven biển Sơn Trà", district: "Sơn Trà", level: "safe", center: [16.0660, 108.2440], radius: 900, note: "Nền cao, thoát nước tốt, ít ghi nhận ngập." },
  { name: "Mỹ An – Khuê Mỹ", district: "Ngũ Hành Sơn", level: "safe", center: [16.0430, 108.2430], radius: 1000, note: "Ít ngập, chỉ đọng nước ngắn hạn." },
  { name: "Thạch Thang – Bạch Đằng", district: "Hải Châu", level: "safe", center: [16.0760, 108.2240], radius: 500, note: "Hạ tầng thoát nước tốt." },
];

export const FLOOD_LABEL: Record<FloodLevel, string> = {
  safe: "Vùng xanh an toàn",
  warn: "Vùng cam – nguy cơ ngập",
  danger: "Vùng đỏ – nguy cơ ngập cao",
};

export const FLOOD_COLOR: Record<FloodLevel, string> = {
  safe: "var(--safe)",
  warn: "var(--warn)",
  danger: "var(--danger)",
};

function distance(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function floodRiskAt(lat: number, lng: number): { level: FloodLevel; zone?: FloodZone } {
  const rank: Record<FloodLevel, number> = { danger: 3, warn: 2, safe: 1 };
  let best: FloodZone | undefined;
  for (const z of FLOOD_ZONES) {
    if (distance([lat, lng], z.center) <= z.radius) {
      if (!best || rank[z.level] > rank[best.level]) best = z;
    }
  }
  return { level: best?.level ?? "safe", zone: best };
}
