import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCart, type Listing } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { vnd } from "@/lib/format";

export const Route = createFileRoute("/gio-hang")({
  head: () => ({
    meta: [
      { title: "Giỏ hàng – Trọ Đà Nẵng" },
      { name: "description", content: "Danh sách phòng trọ, nhà, chung cư bạn đã lưu." },
      { property: "og:title", content: "Giỏ hàng – Trọ Đà Nẵng" },
      { property: "og:description", content: "Các căn bạn yêu thích tại Đà Nẵng." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, signIn } = useAuth();
  const cart = useCart(user?.id);
  if (!user) return <div className="p-16 text-center"><p className="mb-4">Đăng nhập để xem giỏ hàng.</p><Button onClick={signIn}>Đăng nhập Gmail</Button></div>;
  const items = (cart.data ?? []).map((c) => c.listings as unknown as Listing).filter(Boolean);
  const available = items.filter((l) => l.status === "available");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">Giỏ hàng của bạn</h1>
      <p className="mt-1 text-muted-foreground">{items.length} căn đã lưu · {available.length} còn trống{available.length > 0 && ` · giá từ ${vnd(Math.min(...available.map((l) => l.price)))}`}</p>
      {items.length === 0 ? (
        <div className="mt-10 text-center"><Link to="/" className="text-primary underline">Khám phá phòng trọ</Link></div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => <ListingCard key={l.id} l={l} inCart onToggleCart={() => cart.toggle(l.id)} />)}
        </div>
      )}
    </div>
  );
}
