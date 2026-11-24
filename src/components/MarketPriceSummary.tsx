import { Activity, GraduationCap, ShieldCheck } from "lucide-react";
import type { Listing } from "@/lib/listings";
import {
  summarizeDistrictAskingPrices,
  summarizeSchoolAreaAskingPrices,
  type AskingPriceSummary,
} from "@/lib/market";
import { vnd } from "@/lib/format";

function PriceCell({ summary, deal }: { summary: AskingPriceSummary; deal: "rent" | "sale" }) {
  if (summary.average === null) {
    return <span className="text-muted-foreground">Chưa có tin đang mở</span>;
  }

  const suffix = deal === "rent" ? "/tháng" : "";
  const hasRange =
    summary.minimum !== null && summary.maximum !== null && summary.minimum !== summary.maximum;

  return (
    <div className="space-y-0.5">
      <span className="block font-semibold text-foreground">
        {vnd(summary.average)}
        {suffix}
      </span>
      <span className="block text-xs text-muted-foreground">
        {summary.count} tin đang mở
        {hasRange ? ` · ${vnd(summary.minimum!)} – ${vnd(summary.maximum!)}` : ""}
      </span>
      {summary.averagePerM2 !== null && deal === "rent" && (
        <span className="block text-xs text-primary">~{vnd(summary.averagePerM2)}/m²/tháng</span>
      )}
    </div>
  );
}

export function MarketPriceSummary({
  listings,
  lastSyncedAt,
  selectedDistrict,
  onSelectDistrict,
}: {
  listings: Listing[];
  lastSyncedAt?: Date | undefined;
  selectedDistrict?: string | undefined;
  onSelectDistrict?: ((district: string) => void) | undefined;
}) {
  const districts = summarizeDistrictAskingPrices(listings, true);
  const schools = summarizeSchoolAreaAskingPrices(listings);
  const totalActive = listings.filter((listing) => listing.status === "available").length;
  const syncText = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <section
      className="mt-10 rounded-3xl border bg-card p-6 shadow-soft sm:p-8"
      aria-labelledby="market-prices-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-safe" />
            </span>
            Cập nhật Realtime theo từng khu vực
            {syncText && <span className="font-normal opacity-80">· đồng bộ lúc {syncText}</span>}
          </div>
          <h2 id="market-prices-title" className="mt-2 text-2xl font-bold sm:text-3xl">
            Bảng giá phòng tham khảo theo khu vực
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tự động tổng hợp trực tiếp từ <b>{totalActive} tin đang mở</b> trên hệ thống để sinh
            viên nắm rõ mặt bằng giá thực tế trước khi đi xem phòng, tránh mất công tới tận nơi hoặc
            bị hét giá cao hơn mặt bằng chung. Giá thuê trọ sinh viên, tổng mặt bằng thuê và giá bán
            được tách riêng.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border bg-background px-3.5 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-safe" />
          <span>Có khoảng giá Thấp – Cao &amp; đơn giá/m² để đối chiếu</span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[740px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Bảng giá phòng trọ và nhà ở cập nhật realtime theo quận, huyện Đà Nẵng
          </caption>
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th scope="col" className="py-3 pl-3 pr-4 font-medium">
                Quận, huyện
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Phòng trọ sinh viên (Thuê)
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Tất cả loại hình thuê (Trọ, căn hộ, nhà)
              </th>
              <th scope="col" className="py-3 pr-3 font-medium">
                Nhà / căn hộ rao bán
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {districts.map((row) => {
              const isSelected = selectedDistrict === row.district;
              return (
                <tr
                  key={row.district}
                  className={`transition ${isSelected ? "bg-secondary/40" : "hover:bg-muted/30"}`}
                >
                  <th scope="row" className="py-3.5 pl-3 pr-4 font-semibold">
                    {onSelectDistrict ? (
                      <button
                        type="button"
                        onClick={() => onSelectDistrict(isSelected ? "all" : row.district)}
                        className="inline-flex items-center gap-1.5 text-left hover:text-primary hover:underline"
                        title={`Lọc danh sách phòng tại ${row.district}`}
                      >
                        <span>{row.district}</span>
                        {isSelected && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                            Đang lọc
                          </span>
                        )}
                      </button>
                    ) : (
                      row.district
                    )}
                  </th>
                  <td className="py-3.5 pr-4">
                    <PriceCell summary={row.studentRoomRent} deal="rent" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <PriceCell summary={row.rent} deal="rent" />
                  </td>
                  <td className="py-3.5 pr-3">
                    <PriceCell summary={row.sale} deal="sale" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-t pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
              <GraduationCap className="size-5 text-primary" />
              Mặt bằng giá thuê quanh các trường Đại học (bán kính 3 km)
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Dành cho tân sinh viên khảo giá nhanh quanh trường trước khi đặt lịch hẹn xem phòng.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="size-3.5 text-primary" />
            Tự động tính lại ngay khi có tin mới hoặc phòng vừa được đặt
          </span>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {schools.map((row) => (
            <li
              key={row.school}
              className="flex flex-col justify-between rounded-2xl border bg-background p-4"
            >
              <div>
                <span className="text-xs font-medium text-muted-foreground">{row.district}</span>
                <div className="mt-0.5 font-semibold text-foreground">{row.school}</div>
              </div>
              <div className="mt-3 border-t pt-2.5 text-sm">
                {row.average === null ? (
                  <span className="text-muted-foreground">Chưa có tin thuê trong 3 km</span>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted-foreground">TB khu vực:</span>
                      <b className="text-base text-primary">{vnd(row.average)}/tháng</b>
                    </div>
                    {row.studentRoomAverage !== null && (
                      <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">Riêng phòng trọ SV:</span>
                        <span className="font-semibold text-foreground">
                          {vnd(row.studentRoomAverage)}/tháng ({row.studentRoomCount} phòng)
                        </span>
                      </div>
                    )}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Tổng {row.count} tin · biên độ {vnd(row.minimum ?? 0)} –{" "}
                      {vnd(row.maximum ?? 0)}
                    </span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
