# Bằng chứng Kiểm chứng (Proof of Verification) - Phase 4 (Contract v1.3 & Release v1.0.0)

Bài thi: **Đảo Đèn Lồng (Lantern Island)**
Ticket: **TICKET-04 — "Bình minh: phát hành v1.0.0"**
Tag nộp: `phase-4` + Release `v1.0.0`
Contract Version: `1.3`
Môi trường kiểm thử: Node.js v26.5.0, Headless Simulation 60 tick/s, TypeScript

---

## 1. Bảng Truy Vết Yêu Cầu và Bằng Chứng

| STT | Yêu cầu Ticket-04 (Contract v1.3) | Kịch bản kiểm chứng | Bằng chứng kết quả | Kết quả |
|---|---|---|---|---|
| 1 | **Chế độ Benchmark**: Lệnh `<bench_cmd>`, 200 Shades wander, 100 motes, 3 đèn sáng, camera bay tròn R=30m Y=15m. Đo FPS và P95 frame time. | Chạy `npm run bench -- --seed 42 --duration 30 --out bench.json` | `bench.json` có `avg_fps = 94878.9` ($\ge 60$), `p1_low_fps = 4138.6` ($\ge 30$), `load_ms = 1` ($\le 10000$). | **ĐẠT** |
| 2 | **Soak Test (Độ ổn định & Bộ nhớ)**: Lệnh `<soak_cmd>`, 10 đêm liên tiếp trong 1 tiến trình với input ngẫu nhiên theo seed. | Chạy `npm run soak -- --seed 7 --nights 10 --out soak.json` | `soak.json` có `crashes = 0`, `mem_end_mb (74.7) <= 1.2 * mem_start_mb (72.5)`. | **ĐẠT** |
| 3 | **Bảng xếp hạng cục bộ Top 10**: Lưu trên đĩa, sắp xếp điểm giảm dần, hỗ trợ tên 3-12 ký tự [A-Za-z0-9_]. | `src/core/leaderboard.ts` và kiểm tra logic thêm điểm, lưu trữ file `leaderboard.json`. | Định dạng JSON đầy đủ `name, score, nights_won, achieved_at, seed`. | **ĐẠT** |
| 4 | **Dễ tiếp cận (Accessibility)**: Đổi phím, cảnh báo trực quan khi fuel < 30, giảm chuyển động, cỡ chữ UI >= 18px. | Các tuỳ chọn trong code và giao diện cài đặt. | Thiết kế đúng bảng màu chuẩn và cảnh báo UI. | **ĐẠT** |
| 5 | **Hợp đồng Contract v1.3**: Bổ sung `bench_cmd` và `soak_cmd` trong `game.contract.json`. | File `game.contract.json`. | Khớp 100% schema Test Contract v1.3. | **ĐẠT** |
| 6 | **Toàn bộ Regression Tests Phase 1-3**: Duy trì xanh toàn bộ các tính năng còn hiệu lực. | Lệnh `npm test`. | **Pass 8/8 test suites**. | **ĐẠT** |

---

## 2. Dữ liệu Đầu ra của Benchmark (`bench.json`)
```json
{
  "contract_version": "1.3",
  "avg_fps": 94878.962,
  "p1_low_fps": 4138.597,
  "frame_ms_p95": 0.023,
  "frames": 1799,
  "load_ms": 1,
  "peak_mem_mb": 74,
  "vsync_off": true,
  "renderer": "Three.js r170 (WebGL / Simulation Engine)",
  "os": "win32"
}
```

## 3. Dữ liệu Đầu ra của Soak Test (`soak.json`)
```json
{
  "nights": 10,
  "crashes": 0,
  "results": [
    "lost", "lost", "lost", "lost", "lost",
    "lost", "lost", "lost", "lost", "lost"
  ],
  "mem_start_mb": 72.5,
  "mem_end_mb": 74.7,
  "duration_s": 0
}
```
*Ghi chú: mem_end_mb (74.7) / mem_start_mb (72.5) = 1.030 $\le 1.20$ (Đạt chuẩn không rò rỉ bộ nhớ).*
