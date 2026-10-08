import { Droplets } from "lucide-react";
import type { FloodLevel } from "@/lib/flood";

const CLS: Record<FloodLevel, string> = {
  safe: "bg-safe/15 text-safe",
  warn: "bg-warn/20 text-foreground",
  danger: "bg-danger/15 text-danger",
};
const SHORT: Record<FloodLevel, string> = { safe: "An toàn", warn: "Nguy cơ ngập", danger: "Ngập cao" };

export function FloodBadge({ level, title, compact }: { level: FloodLevel; title?: string; compact?: boolean }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${CLS[level]}`}>
      <Droplets className="size-3" />{compact ? SHORT[level] : title}
    </span>
  );
}
