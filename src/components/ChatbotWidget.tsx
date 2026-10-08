import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Xin chào! Mình là **Cá Heo** 🐬. Bạn muốn tìm trọ khu nào ở Đà Nẵng?" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(1) }) });
      if (!res.ok || !res.body) throw new Error(res.status === 402 ? "Hết lượt AI miễn phí, vui lòng thử lại sau." : "Trợ lý đang bận, thử lại sau nhé.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
      if (!acc) setMsgs([...next, { role: "assistant", content: "Xin lỗi, mình chưa trả lời được câu này." }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Mở chatbot" className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-coral text-coral-foreground shadow-soft">
          <Bot className="size-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <Bot className="size-5" /><b className="flex-1">Trợ lý Cá Heo</b>
            <button onClick={() => setOpen(false)} aria-label="Đóng"><X className="size-4" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-8 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground" : "mr-6 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4"}>
                {m.role === "assistant" ? (m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="animate-pulse text-muted-foreground">Đang suy nghĩ…</span>) : m.content}
              </div>
            ))}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t p-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về trọ, giá, khu ngập…" />
            <Button type="submit" size="icon" disabled={busy}><Send /></Button>
          </form>
        </div>
      )}
    </>
  );
}
