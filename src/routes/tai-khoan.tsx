import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";

export const Route = createFileRoute("/tai-khoan")({
  head: () => ({
    meta: [
      { title: "Tài khoản & vai trò – DaNang PadFinder" },
      { name: "description", content: "Chọn vai trò người cho thuê/bán hoặc người thuê và quản lý tin đăng." },
      { property: "og:title", content: "Tài khoản – DaNang PadFinder" },
      { property: "og:description", content: "Chọn vai trò và quản lý tin đăng của bạn." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, roles, refreshRoles, signIn } = useAuth();
  const { data: mine = [] } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("listings").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  if (!user) return <div className="p-16 text-center"><Button onClick={signIn}>Đăng nhập Gmail</Button></div>;

  const toggle = async (role: "landlord" | "tenant") => {
    const { error } = roles.includes(role)
      ? await supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error) { toast.error("Không cập nhật được vai trò"); return; }
    await refreshRoles();
  };
  const opts = [
    { role: "tenant" as const, icon: KeyRound, title: "Người thuê / mua", desc: "Tìm phòng, lưu giỏ hàng, đặt thuê, tìm bạn ở ghép." },
    { role: "landlord" as const, icon: Home, title: "Người bán / cho thuê", desc: "Đăng ảnh, mô tả, giá và quản lý trạng thái phòng." },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-4xl font-bold">Xin chào, {user.user_metadata?.["full_name"] ?? user.email}</h1>
        <p className="mt-1 text-muted-foreground">Chọn vai trò của bạn – có thể chọn cả hai.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {opts.map((o) => {
          const on = roles.includes(o.role);
          return (
            <button key={o.role} onClick={() => toggle(o.role)}
              className={`rounded-2xl border-2 p-6 text-left transition ${on ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"}`}>
              <o.icon className="mb-3 size-8 text-primary" />
              <div className="text-lg font-semibold">{o.title}</div>
              <div className="text-sm text-muted-foreground">{o.desc}</div>
              <div className="mt-3 text-sm font-medium">{on ? "✓ Đã chọn" : "Chọn vai trò này"}</div>
            </button>
          );
        })}
      </div>
      {roles.includes("landlord") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Tin đăng của tôi</h2><Button asChild variant="coral"><Link to="/dang-tin">+ Đăng tin mới</Link></Button></div>
          {mine.length === 0 ? <p className="text-muted-foreground">Chưa có tin đăng nào.</p> : (
            <div className="grid gap-4 sm:grid-cols-2">{mine.map((l) => <ListingCard key={l.id} l={l} />)}</div>
          )}
        </section>
      )}
    </div>
  );
}
