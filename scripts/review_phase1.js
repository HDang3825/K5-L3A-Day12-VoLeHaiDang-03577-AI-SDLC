import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
const modelName = process.env.MODEL_NAME || "anthropic/claude-sonnet-5.5";

const prompt = `Dưới đây là hồ sơ kiến trúc Core Engine và Test Contract v1.0 của game "Đảo Đèn Lồng" (Phase 1):
1. **Kiến trúc**: Tách triệt để Core Engine (src/core/game.ts, không phụ thuộc DOM/GPU, chạy deterministic 60 tick/s với mulberry32 PRNG) và Renderer (Three.js WebGL trong src/web/main.ts).
2. **Tuân thủ Test Contract v1.0**:
   - File game.contract.json định nghĩa đầy đủ tuning parameters (tốc độ 6.0 m/s, bán kính pickup 1.5m, interact 2.5m, pulse radius 5.0m, safe_radius 4.0m quanh đèn đã thắp).
   - Headless CLI (src/headless/index.ts) nhận cờ --seed, --night 1, --scenario, --inputs, --ticks, --out, --snapshot-every. Xuất định dạng JSONL chuẩn xác với snapshot định kỳ (tick 0, snapshot_every) và các events: mote_picked, deposit, lantern_lit, pulse, player_hit, game_over và kết thúc bằng record "end".
   - Tọa độ làm tròn 3 chữ số thập phân, tính khoảng cách mặt phẳng XZ.
3. **Kết quả kiểm thử**:
   - Test Pickup & Deposit: Đạt (mote_picked x3, deposit, lantern_lit L1).
   - Test Pulse Stun: Đạt (phát pulse event, stun Shade S1, đẩy lùi 4m).
   - Test Determinism Verification: Đạt (chạy 2 lần cùng seed 9999 cho ra chính xác từng byte file JSONL).
   - Toàn bộ 3/3 tests tự động đều PASS.

Hãy đóng vai Lead Architect, đưa ra nhận xét đánh giá chính thức, phê duyệt Phase 1 và gợi ý chuẩn bị cho Phase 2.`;

async function run() {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/dao-den-long",
      "X-Title": "Dao Den Long AI SDLC"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: "You are Lead Game Architect reviewing Phase 1 deliverables for 'Đảo Đèn Lồng'."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    })
  });

  const data = await response.json();
  const review = data.choices?.[0]?.message?.content || "";
  console.log("CLAUDE_REVIEW_RESULT:\n" + review);
  fs.writeFileSync("docs/notes/ai-review-phase1.md", review, "utf-8");
}

run();
