import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { RotateCcw, Send, Sparkles, X } from "lucide-react";
import mascot from "@/assets/ca-heo-mascot.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGE: Msg = {
  role: "assistant",
  content:
    "Chào bạn! Mình là **Cá Heo** 🐬 – thổ địa tìm trọ Đà Nẵng của bạn đây. Bạn đang tìm phòng khô ráo mùa mưa, khảo giá gần trường hay tìm bạn ở ghép hợp gu? Cứ hỏi mình nha!",
};

const QUICK_PROMPTS = [
  "Khu nào ở Đà Nẵng ít ngập mùa mưa?",
  "Giá trọ sinh viên gần ĐH Bách khoa, Kinh tế?",
  "Kinh nghiệm đặt cọc thuê phòng an toàn?",
];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      end.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs, open]);

  const sendText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const payloadMessages = history.slice(1).filter((m) => m.content.trim().length > 0);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(
          res.status === 402
            ? "Cá Heo tạm hết lượt kết nối AI hôm nay rồi 🐬. Bạn thử lại sau ít phút hoặc tra bảng giá & bản đồ ngập ngay trên trang nhé!"
            : "Sóng biển hơi yếu nên Cá Heo chưa bắt kịp câu hỏi 🌊. Bạn bấm gửi lại giúp mình nha!",
        );
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: acc }]);
      }
      acc += dec.decode();
      if (acc.trim()) {
        setMsgs([...history, { role: "assistant", content: acc }]);
      } else {
        setMsgs([
          ...history,
          {
            role: "assistant",
            content:
              "Mình hơi ngẩn ngơ chút xíu 🐬, bạn hỏi lại chi tiết hơn về quận hoặc mức giá bạn mong muốn nhé!",
          },
        ]);
      }
    } catch (e) {
      setMsgs([
        ...history,
        {
          role: "assistant",
          content: (e as Error).message || "Cá Heo đang bận chút xíu, bạn thử lại sau nhé!",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const resetChat = () => {
    if (busy) return;
    setMsgs([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Mở chatbot Cá Heo"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-coral py-2 pl-2 pr-4 text-coral-foreground shadow-soft transition hover:scale-105"
        >
          <img
            src={mascot}
            alt="Cá Heo"
            width={40}
            height={40}
            className="size-10 rounded-full bg-background/90 object-cover p-0.5"
          />
          <span className="text-left text-xs leading-tight">
            <b className="block text-sm">Hỏi Cá Heo 🐬</b>
            <span className="opacity-90">Tư vấn trọ & mùa mưa</span>
          </span>
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý Cá Heo"
          className="fixed bottom-5 right-5 z-50 flex h-[34rem] w-[23rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft"
        >
          <div className="flex items-center gap-2.5 bg-primary px-4 py-3 text-primary-foreground">
            <img
              src={mascot}
              alt="Cá Heo"
              width={36}
              height={36}
              className="size-9 rounded-full bg-background/90 object-cover p-0.5"
            />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm">Trợ lý Cá Heo 🐬</b>
              <span className="block truncate text-xs opacity-85">
                Thổ địa tìm trọ & tránh ngập Đà Nẵng
              </span>
            </div>
            <button
              type="button"
              onClick={resetChat}
              disabled={busy}
              title="Bắt đầu cuộc trò chuyện mới"
              aria-label="Làm mới cuộc trò chuyện"
              className="rounded-lg p-1.5 opacity-85 transition hover:bg-primary-foreground/15 hover:opacity-100 disabled:opacity-40"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="rounded-lg p-1.5 opacity-85 transition hover:bg-primary-foreground/15 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-primary-foreground"
                    : "mr-4 rounded-2xl rounded-bl-sm border bg-muted/50 px-3.5 py-2.5 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4"
                }
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="size-3.5 animate-spin text-primary" />
                      <span className="animate-pulse">Cá Heo đang lặn tìm thông tin…</span>
                    </span>
                  )
                ) : (
                  m.content
                )}
              </div>
            ))}

            {msgs.length === 1 && !busy && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Gợi ý câu hỏi nhanh:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendText(prompt)}
                      className="rounded-xl border bg-background px-2.5 py-1.5 text-left text-xs text-foreground transition hover:border-primary hover:bg-secondary"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={end} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendText(input);
            }}
            className="flex gap-2 border-t bg-background p-2.5"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi Cá Heo về trọ, giá, khu ngập…"
              aria-label="Tin nhắn gửi Cá Heo"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !input.trim()}
              aria-label="Gửi tin nhắn"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
