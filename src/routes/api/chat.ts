import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import rainfallHistory from "@/data/danang-rainfall-history.json";

type ChatMessage = { role: "user" | "assistant"; content: string };

const RAINFALL_SUMMARY = rainfallHistory.districts
  .map((d) => {
    const y2022 = d.years.find((y) => y.year === 2022);
    const y2025 = d.years.find((y) => y.year === 2025);
    return `- ${d.district}: năm 2022 mưa ${y2022?.totalMm ?? "?"} mm (đỉnh ngày ${y2022?.maxDayMm ?? "?"} mm vào ${y2022?.maxDay ?? "?"}), năm 2025 mưa ${y2025?.totalMm ?? "?"} mm (${y2025?.heavyDays ?? "?"} ngày mưa ≥50 mm).`;
  })
  .join("\n");

const SYSTEM = `Bạn là "Cá Heo" 🐬 – người bạn đồng hành bản địa ấm áp, hóm hỉnh và đáng tin cậy của DaNang PadFinder, giúp sinh viên và người đi làm tìm phòng trọ, nhà, chung cư khô ráo, an toàn tại TP Đà Nẵng.

Phong cách & cảm xúc:
- Trò chuyện tự nhiên, gần gũi, giàu sự đồng cảm với nỗi lo tìm trọ (sợ ngập mùa mưa, sợ mất cọc, lo tiền điện nước, muốn gần trường/chỗ làm).
- Dùng từ ngữ ấm áp, thỉnh thoảng điểm xuyết hình ảnh biển Đà Nẵng hoặc tiếng reo vui nhẹ nhàng của Cá Heo 🐬🌊, nhưng luôn đi thẳng vào thông tin hữu ích, rõ ràng, dễ đọc bằng Markdown.
- Không bao giờ bịa số liệu hay khẳng định một địa điểm chắc chắn không ngập. Luôn phân biệt rõ: ước tính mưa theo ô lưới ~25 km (ERA5), vùng nguy cơ ngập lịch sử (xanh/cam/đỏ), và số đo trạm quan trắc tĩnh.

Kiến thức thực tế trên DaNang PadFinder:
1. Mặt bằng giá chào tham khảo (từ các tin đang mở, tách riêng thuê và bán):
   - Liên Chiểu (quanh ĐH Bách khoa, ĐH Sư phạm, KCN Hòa Khánh): phòng trọ sinh viên khoảng 1,3 – 2,2 triệu/tháng (trung bình ~1,8 triệu/tháng).
   - Ngũ Hành Sơn (gần ĐH Kinh tế, khu Mỹ An – Khuê Mỹ): trọ khoảng 2,5 triệu/tháng, nhà nguyên căn ~14 triệu/tháng.
   - Hải Châu & gần ĐH Duy Tân: chung cư trung tâm ~11 triệu/tháng; bán kính 3 km quanh ĐH Kinh tế, Sư phạm, Duy Tân có mức thuê trung bình từ 2,5 – 9,3 triệu/tháng tùy loại hình.
   - Sơn Trà (ven biển Mỹ Khê, Phước Mỹ): studio/căn hộ khoảng 7,5 triệu/tháng.
   - Cẩm Lệ (Hòa Xuân): nhà phố rao bán khoảng 4,9 tỷ.
2. Lịch sử mưa 2020–2025 (Open-Meteo ERA5, lưới ~25 km):
${RAINFALL_SUMMARY}
3. Kinh nghiệm tránh ngập & an toàn thuê trọ:
   - Vùng đỏ (nguy cơ cao): các kiệt trũng Hòa Minh (Tôn Đức Thắng), Hòa Khánh Nam (Âu Cơ), Thanh Khê Tây (Hà Huy Tập) từng ngập sâu 0,5–1,2m đợt mưa lịch sử 14/10/2022.
   - Vùng cam: Hòa Khánh Bắc, An Khê – Điện Biên Phủ, Hòa Xuân ven sông, một số điểm trung tâm Hải Châu.
   - Vùng xanh (nền cao, thoát nước tốt): ven biển Sơn Trà, Mỹ An – Khuê Mỹ (Ngũ Hành Sơn), Thạch Thang – Bạch Đằng.
   - Luôn dặn người thuê: đến xem phòng trực tiếp (nhất là nhìn vệt nước trên tường hoặc hỏi hàng xóm về đợt mưa tháng 10), đọc kỹ hợp đồng và giá điện/nước, tuyệt đối không chuyển cọc trước khi xem phòng. Nếu gặp lừa đảo hoặc khẩn cấp, bấm nút Hotline (113 / công an quận) ngay trên thanh đầu trang.
4. Gợi ý công cụ trên web:
   - Bảng "Mặt bằng giá theo khu vực" ngay trang chủ.
   - Trang "Bản đồ ngập" (/ban-do) để tra 95 trạm quan trắc, bảng lịch sử mưa 2020–2025 và vùng xanh/cam/đỏ.
   - Công cụ "Ước tính chi phí hàng tháng" và "Xem 360°" trong từng trang chi tiết phòng.
   - Trang "Tìm ở ghép" (/o-ghep) để chấm điểm hợp cạ theo ngân sách, giờ giấc, độ gọn gàng.`;

export function buildLocalDolphinReply(question: string): string {
  const q = question.toLowerCase();

  if (
    q.includes("ngập") ||
    q.includes("mưa") ||
    q.includes("lũ") ||
    q.includes("an toàn") ||
    q.includes("trũng")
  ) {
    return `🐬 **Cá Heo nghe đây!** Mùa mưa Đà Nẵng (đỉnh điểm tháng 9–12) là nỗi lo lớn nhất khi đi tìm trọ luôn đó. Mình chia sẻ nhanh để bạn yên tâm chọn chỗ khô ráo nha:

- **Khu nền cao, thoát nước tốt (Vùng xanh):** Ven biển **Sơn Trà** (Phước Mỹ, An Hải), khu **Mỹ An – Khuê Mỹ (Ngũ Hành Sơn)** và **Thạch Thang – Bạch Đằng (Hải Châu)**.
- **Khu cần hỏi kỹ trước khi cọc (Vùng đỏ/cam):** Các kiệt trũng ở **Hòa Minh** (Tôn Đức Thắng), **Hòa Khánh Nam** (Âu Cơ) thuộc Liên Chiểu và **Thanh Khê Tây** (Hà Huy Tập) từng ngập 0,5–1,2m trong đợt mưa lớn 14/10/2022.
- **Số liệu mưa 2020–2025 (lưới ~25 km):** Liên Chiểu, Thanh Khê và Hòa Vang thường có lượng mưa năm cao (năm 2025 từ 3.470 đến 3.748 mm, 17–19 ngày mưa ≥50 mm).

👉 Bạn có thể bật nút **"Tránh vùng ngập đỏ"** ở trang chủ hoặc ghé trang **[Bản đồ ngập](/ban-do)** để xem bảng lịch sử mưa từng quận và 95 trạm quan trắc nhé! Bạn đang nhắm quận nào để mình soi kỹ hơn cho? 🌊`;
  }

  if (
    q.includes("giá") ||
    q.includes("bao nhiêu") ||
    q.includes("rẻ") ||
    q.includes("sinh viên") ||
    q.includes("bách khoa") ||
    q.includes("kinh tế") ||
    q.includes("duy tân") ||
    q.includes("sư phạm")
  ) {
    return `🐬 **Rất sẵn lòng!** Mình điểm qua mặt bằng giá chào từ các tin đang mở trên PadFinder để bạn dễ cân đối ví tiền nha:

- **Quanh ĐH Bách khoa & Liên Chiểu (bán kính 3 km):** Phòng trọ sinh viên dao động **1,3 – 2,2 triệu/tháng** (trung bình khoảng **1,8 triệu/tháng**). Nếu chọn Hòa Khánh Bắc gần trường thì nền cao ráo hơn các kiệt sâu ở Hòa Minh.
- **Quanh ĐH Kinh tế & Ngũ Hành Sơn:** Phòng trọ thoáng mát khoảng **2,5 triệu/tháng**; nhà nguyên căn khoảng **14 triệu/tháng** (phù hợp thuê nhóm).
- **Sơn Trà & Hải Châu (gần ĐH Duy Tân, ĐH Sư phạm):** Studio gần biển Mỹ Khê khoảng **7,5 triệu/tháng**, chung cư trung tâm Hải Châu khoảng **11 triệu/tháng**.

💡 *Mẹo nhỏ từ Cá Heo:* Bạn nhớ bấm vào từng phòng để dùng bảng **Ước tính chi phí hàng tháng** (tính luôn điện, nước, wifi, gửi xe) và xem bảng **Mặt bằng giá theo khu vực** ở cuối trang chủ nhé!`;
  }

  if (q.includes("ở ghép") || q.includes("bạn cùng phòng") || q.includes("share")) {
    return `🐬 Tìm được người hợp tính ở cùng thì tiền phòng nhẹ đi một nửa mà lại vui nữa!

Trên mục **[Tìm ở ghép](/o-ghep)** của PadFinder, bạn chỉ cần đăng nhập rồi chỉnh:
- **Khu vực & ngân sách** mong muốn
- **Giờ giấc sinh hoạt** (ngủ sớm, bình thường hay cú đêm)
- **Mức độ gọn gàng (1–5)**, có hút thuốc hay nuôi thú cưng không

Hệ thống sẽ tự động chấm **% độ hợp cạ** để bạn kết nối ngay với những bạn có lối sống tương đồng. Bạn muốn tìm bạn ở ghép khu vực quận nào nè? 🌊`;
  }

  if (
    q.includes("cọc") ||
    q.includes("hợp đồng") ||
    q.includes("lừa đảo") ||
    q.includes("kinh nghiệm") ||
    q.includes("lưu ý")
  ) {
    return `🐬 **Thương bạn, đi thuê trọ cẩn thận không bao giờ thừa!** Cá Heo dặn bạn 4 nguyên tắc vàng này nha:

1. **Tuyệt đối không chuyển cọc online** khi chưa đến tận nơi xem phòng và gặp trực tiếp người cho thuê.
2. **Kiểm tra dấu vết mùa mưa:** Nhìn chân tường xem có vệt ố nước ngập không, hỏi nhẹ cô chú hàng xóm xem đợt mưa tháng 10 nước có tràn vào kiệt không.
3. **Đọc kỹ hợp đồng:** Ghi rõ giá điện (thường 3.500–3.800đ/kWh), giá nước, thời hạn báo trước khi trả phòng và điều kiện hoàn cọc.
4. **Khi cần hỗ trợ khẩn cấp:** Bấm ngay nút **Hotline** màu đỏ trên thanh menu để gọi **113** hoặc số trực ban Công an 7 quận/huyện Đà Nẵng.

Bạn đang phân vân căn nào trên web cứ nhắn tên đường hoặc quận cho Cá Heo tư vấn thêm nhé! 🐬`;
  }

  return `🐬 **Chào bạn, Cá Heo luôn ở đây đồng hành cùng bạn!** 🌊

Mình có thể giúp bạn tra cứu nhanh:
- **Mặt bằng giá thuê & mua** tại 7 quận/huyện và trong bán kính 3 km quanh **ĐH Bách khoa, Kinh tế, Sư phạm, Duy Tân**.
- **Lịch sử mưa 2020–2025** & kinh nghiệm tránh các kiệt trũng dễ ngập ở Liên Chiểu, Thanh Khê.
- **Mẹo xem phòng, giữ cọc an toàn** và cách tìm **bạn ở ghép** hợp gu.

Bạn đang tìm phòng trọ, căn hộ hay nhà nguyên căn ở khu vực nào của Đà Nẵng, với ngân sách khoảng bao nhiêu một tháng nè?`;
}

function streamReplyText(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { messages?: ChatMessage[] };
        try {
          body = (await request.json()) as { messages?: ChatMessage[] };
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const messages = (body.messages ?? [])
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              String(m.content ?? "").trim().length > 0,
          )
          .slice(-20)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

        if (!messages.length) return new Response("Bad request", { status: 400 });

        const lastUserMessage =
          [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const apiKey = process.env["LOVABLE_API_KEY"] ?? "";

        if (!apiKey) {
          return streamReplyText(buildLocalDolphinReply(lastUserMessage));
        }

        try {
          const openai = createOpenAI({
            baseURL: "https://ai.gateway.lovable.dev/v1",
            apiKey,
            headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          });
          const result = streamText({
            model: openai.responses("openai/gpt-6-astra"),
            system: SYSTEM,
            messages,
            abortSignal: request.signal,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });
          return result.toTextStreamResponse();
        } catch {
          return streamReplyText(buildLocalDolphinReply(lastUserMessage));
        }
      },
    },
  },
});
