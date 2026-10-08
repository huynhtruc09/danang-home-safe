export const DISTRICTS = ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ", "Hòa Vang"];

export const KIND_LABEL: Record<string, string> = { tro: "Phòng trọ", nha: "Nhà nguyên căn", chung_cu: "Chung cư" };
export const DEAL_LABEL: Record<string, string> = { rent: "Cho thuê", sale: "Bán" };

export function vnd(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
  return `${n.toLocaleString("vi-VN")}đ`;
}

export interface CostInput {
  rent: number;
  electricityPrice: number;
  kwh: number;
  waterPrice: number; // per person per month
  people: number;
  internet: number;
  parking: number; // per vehicle
  vehicles: number;
  other: number;
}

export function estimateMonthlyCost(c: CostInput) {
  const electricity = c.electricityPrice * c.kwh;
  const water = c.waterPrice * c.people;
  const parking = c.parking * c.vehicles;
  const total = c.rent + electricity + water + c.internet + parking + c.other;
  return { electricity, water, parking, total, perPerson: Math.round(total / Math.max(1, c.people)) };
}
