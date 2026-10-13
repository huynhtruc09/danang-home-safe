import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { id: string; sender_id: string; receiver_id: string; content: string; listing_id: string | null };

export const Route = createFileRoute("/tin-nhan")({
  validateSearch: (s: Record<string, unknown>): { to?: string; listing?: string } => ({
    ...(typeof s["to"] === "string" ? { to: s["to"] } : {}),
    ...(typeof s["listing"] === "string" ? { listing: s["listing"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Tin nhắn – DaNang PadFinder" },
      { name: "description", content: "Trò chuyện trực tiếp với người cho thuê hoặc người bán." },
      { property: "og:title", content: "Tin nhắn – DaNang PadFinder" },
      { property: "og:description", content: "Nhắn tin với chủ nhà." },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const { user, signIn } = useAuth();
  const search = Route.useSearch();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [peer, setPeer] = useState<string | undefined>(search.to);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("messages").select("*").order("created_at").then(({ data }) => setMsgs(data ?? []));
    const ch = supabase.channel("inbox").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => setMsgs((m) => [...m, p.new as Msg])).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!user) return <div className="p-16 text-center"><Button onClick={signIn}>Đăng nhập Gmail</Button></div>;
  const peers = Array.from(new Set(msgs.map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id)).concat(search.to ? [search.to] : [])));
  const thread = msgs.filter((m) => m.sender_id === peer || m.receiver_id === peer);
  const send = async () => {
    if (!peer || !text.trim()) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: peer, content: text.trim(), listing_id: search.listing ?? null });
    setText("");
  };
  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 md:grid-cols-[220px_1fr]">
      <ul className="space-y-1">{peers.map((p, i) => <li key={p}><button onClick={() => setPeer(p)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${p === peer ? "bg-secondary" : "hover:bg-muted"}`}>Cuộc trò chuyện {i + 1}</button></li>)}</ul>
      <div className="flex h-[60vh] flex-col rounded-2xl border bg-card">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {!peer && <p className="text-muted-foreground">Chọn cuộc trò chuyện.</p>}
          {thread.map((m) => <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>{m.content}</div>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t p-2"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn…" disabled={!peer} /><Button type="submit" disabled={!peer}>Gửi</Button></form>
      </div>
    </div>
  );
}
