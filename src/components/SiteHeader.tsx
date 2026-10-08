import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Map, Users, PlusCircle, LogOut, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/listings";
import { HotlineDialog } from "./HotlineDialog";

export function SiteHeader() {
  const { user, roles, signIn, signOut } = useAuth();
  const { ids } = useCart(user?.id);
  const nav = "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground";
  const active = { className: "bg-secondary text-secondary-foreground" };
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Waves className="size-5" /></span>
          <span className="font-display text-xl font-bold">Trọ Đà Nẵng</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <Link to="/ban-do" className={nav} activeProps={active}><Map className="size-4" />Bản đồ ngập</Link>
          <Link to="/o-ghep" className={nav} activeProps={active}><Users className="size-4" />Tìm ở ghép</Link>
          {roles.includes("landlord") && <Link to="/dang-tin" className={nav} activeProps={active}><PlusCircle className="size-4" />Đăng tin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <HotlineDialog />
          {user ? (
            <>
              <Link to="/tin-nhan" className={nav} aria-label="Tin nhắn"><MessageCircle className="size-4" /></Link>
              <Link to="/gio-hang" className={`${nav} relative`} aria-label="Giỏ hàng">
                <Heart className="size-4" />
                {ids.size > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-coral text-[10px] text-coral-foreground">{ids.size}</span>}
              </Link>
              <Link to="/tai-khoan" className="hidden text-sm font-medium sm:block">{user.user_metadata?.["full_name"] ?? user.email}</Link>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Đăng xuất"><LogOut /></Button>
            </>
          ) : (
            <Button onClick={signIn}>Đăng nhập Gmail</Button>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        <Link to="/ban-do" className={nav}><Map className="size-4" />Bản đồ</Link>
        <Link to="/o-ghep" className={nav}><Users className="size-4" />Ở ghép</Link>
        {roles.includes("landlord") && <Link to="/dang-tin" className={nav}><PlusCircle className="size-4" />Đăng tin</Link>}
      </nav>
    </header>
  );
}
