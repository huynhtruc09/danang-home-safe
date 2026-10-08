export interface RoommateLike {
  gender: string;
  budget: number;
  district: string;
  occupation: string;
  sleep: string;
  clean: number;
  smoking: boolean;
  pets: boolean;
}

/** Điểm hợp nhau 0–100 giữa hai người tìm ở ghép. */
export function matchScore(a: RoommateLike, b: RoommateLike) {
  let s = 0;
  if (a.district === b.district) s += 25;
  const diff = Math.abs(a.budget - b.budget) / Math.max(a.budget, b.budget, 1);
  s += Math.round(20 * Math.max(0, 1 - diff * 2));
  if (a.sleep === b.sleep) s += 15;
  s += Math.round(15 * (1 - Math.abs(a.clean - b.clean) / 4));
  if (a.smoking === b.smoking) s += 10;
  if (a.pets === b.pets) s += 5;
  if (a.occupation === b.occupation) s += 5;
  if (a.gender === b.gender) s += 5;
  return Math.min(100, s);
}
