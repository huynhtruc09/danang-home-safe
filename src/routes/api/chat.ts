import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const SYSTEM = `Bạn là "Cá Heo" – trợ lý ảo của Trọ Đà Nẵng, giúp người dùng tìm phòng trọ, nhà, chung cư tại TP Đà Nẵng.
- Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, dùng markdown khi cần.
- Am hiểu các quận: Hải Châu, Thanh Khê, Sơn Trà, Ngũ Hành Sơn, Liên Chiểu, Cẩm Lệ, Hòa Vang.
- Cảnh báo ngập: các kiệt trũng ở Liên Chiểu (Hòa Minh, Hòa Khánh Nam) và Thanh Khê (Thanh Khê Tây) từng ngập sâu trong đợt mưa 14/10/2022; Sơn Trà ven biển và Ngũ Hành Sơn ít ngập.
- Nhắc người thuê: xem hợp đồng, không chuyển cọc khi chưa xem phòng, gặp lừa đảo gọi 113.
- Gợi ý dùng các tính năng của web: bản đồ ngập, ước tính chi phí, tìm bạn ở ghép, giỏ hàng.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: { role: "user" | "assistant"; content: string }[] };
        const messages = (body.messages ?? []).slice(-20).map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
        if (!messages.length) return new Response("Bad request", { status: 400 });
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: process.env["LOVABLE_API_KEY"],
          headers: { "Lovable-API-Key": process.env["LOVABLE_API_KEY"] ?? "", "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        const result = streamText({
          model: openai.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          messages,
          abortSignal: request.signal,
          providerOptions: {
            openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
          },
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
