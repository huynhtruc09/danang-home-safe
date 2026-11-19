import type { Listing } from "@/lib/listings";
import { summarizeDistrictAskingPrices, summarizeSchoolAreaAskingPrices } from "@/lib/market";
import { vnd } from "@/lib/format";

function PriceCell({ average, count, deal }: { average: number | null; count: number; deal: "rent" | "sale" }) {
  return average === null ? (
    <span className="text-muted-foreground">Chưa có tin</span>
  ) : (
    <span className="block font-semibold">
      {vnd(average)}{deal === "rent" ? "/tháng" : ""}
      <span className="block text-xs font-normal text-muted-foreground">{count} tin đang mở</span>
    </span>
  );
}

export function MarketPriceSummary({ listings }: { listings: Listing[] }) {
  const districts = summarizeDistrictAskingPrices(listings);
  const schools = summarizeSchoolAreaAskingPrices(listings);
  const totalActive = listings.filter((listing) => listing.status === "available").length;

  return (
    <section className="mt-12 border-t pt-8" aria-labelledby="market-prices-title">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">Tham khảo từ tin đang mở</p>
        <h2 id="market-prices-title" className="mt-1 text-3xl font-bold">Mặt bằng giá theo khu vực</h2>
        <p className="mt-2 text-sm text-muted-foreground">Tính từ {totalActive} tin còn đăng trên PadFinder; giá bán và giá thuê được tính riêng. Đây là giá chào, không phải giá giao dịch.</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">Giá chào trung bình theo quận, huyện Đà Nẵng</caption>
          <thead className="border-b text-muted-foreground">
            <tr><th scope="col" className="py-3 pr-4 font-medium">Quận, huyện</th><th scope="col" className="py-3 pr-4 font-medium">Thuê</th><th scope="col" className="py-3 font-medium">Bán</th></tr>
          </thead>
          <tbody className="divide-y">
            {districts.map((row) => <tr key={row.district}>
              <th scope="row" className="py-3 pr-4 font-semibold">{row.district}</th>
              <td className="py-3 pr-4"><PriceCell average={row.rent.average} count={row.rent.count} deal="rent" /></td>
              <td className="py-3"><PriceCell average={row.sale.average} count={row.sale.count} deal="sale" /></td>
            </tr>)}
            {districts.length === 0 && <tr><td colSpan={3} className="py-5 text-muted-foreground">Chưa có tin đang mở để tính giá.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold">Tin thuê gần trường đại học</h3>
        <p className="mt-1 text-sm text-muted-foreground">Trong bán kính 3 km quanh từng cơ sở; chỉ tính tin thuê đang mở.</p>
        <ul className="mt-3 grid gap-x-8 divide-y md:grid-cols-2 md:divide-y-0">
          {schools.map((row) => <li key={row.school} className="flex min-h-16 items-center justify-between gap-4 border-b py-3">
            <span className="font-medium">{row.school}</span>
            <span className="shrink-0 text-right text-sm">{row.average === null ? <span className="text-muted-foreground">Chưa có tin</span> : <><b>{vnd(row.average)}/tháng</b><span className="block text-xs text-muted-foreground">{row.count} tin · thấp–cao {vnd(row.minimum ?? 0)}–{vnd(row.maximum ?? 0)}</span></>}</span>
          </li>)}
        </ul>
      </div>
    </section>
  );
}