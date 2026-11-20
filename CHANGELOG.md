# Changelog — Toàn bộ 4 Phase

Tất cả các thay đổi và tiến trình phát triển của dự án **Đảo Đèn Lồng (Lantern Island)** qua 4 Phase của vòng đời AI SDLC.

---

## [Phase 4] — v1.0.0 (Release & Non-functional) — Contract v1.3
- **Thêm chế độ Benchmark (`npm run bench`)**: Đo đạc hiệu năng với 200 Bóng Mực, 100 đom đóm, 3 đèn sáng; xuất `bench.json` với các chỉ số `avg_fps`, `p1_low_fps`, `frame_ms_p95`, `load_ms`, `peak_mem_mb`.
- **Thêm chế độ Soak Test (`npm run soak`)**: Chạy 10 Đêm liên tiếp trong cùng một tiến trình, kiểm soát rò rỉ bộ nhớ RSS (`mem_end <= 1.2 * mem_start`) và kiểm tra `crashes = 0`.
- **Bảng xếp hạng cục bộ (Leaderboard)**: Lưu trữ Top 10 kỷ lục điểm số cao nhất trên đĩa cục bộ (`data/leaderboard.json`).
- **Hỗ trợ Tiếp cận (Accessibility)**: Cài đặt tuỳ chỉnh phím điều khiển, cảnh báo trực quan khi đèn $\text{fuel} < 30$, hỗ trợ chế độ mù màu.
- **Báo cáo Retro**: Tổng hợp bài học, phân tích lỗi AI, thống kê token và chi phí thực tế.

---

## [Phase 3] — v1.2.0 (Change Request "Đèn cạn dầu") — Contract v1.2
- **[BREAKING] Bãi bỏ Thắng Sớm**: Không còn kết thúc thắng ngay khi thắp hết đèn (`all_lit`).
- **[BREAKING] Hệ thống Nhiên liệu Đèn**: Đèn sáng bị hao hụt $1.0\text{ fuel/giây}$. Khi $\text{fuel} \le 0$, đèn tắt và phát sự kiện `lantern_out`. Cho phép châm dầu bằng phím Tương tác, phát sự kiện `refuel`.
- **[BREAKING] Bóng Mực Hút Dầu (Drain)**: Đèn có $\text{fuel} < 30$ bị mất vùng an toàn 6m. Bóng Mực wander tiến lại gần $\le 2\text{m}$ sẽ chuyển sang trạng thái `drain` rút $5\text{ fuel/giây}$. Tỏa Sáng trúng Bóng Mực đang drain thưởng +15 điểm.
- **[BREAKING] Thắp lại chỉ tốn 5 đom đóm**: Đèn từng sáng (`ever_lit: true`) chỉ tốn 5 đom đóm để thắp lại (thay vì 10).
- **Luật Thắng Mới (`dawn_survived`)**: Thắng tại thời điểm Bình minh (hết giờ) nếu số đèn đang sáng $\ge 60\%$ tổng số đèn.

---

## [Phase 2] — v1.1.0 ("Ba hòn đảo") — Contract v1.1
- **Mở rộng 3 Đêm**: Đêm 1 (Đảo Bến, 5 đèn), Đêm 2 (Đảo Cau, 6 đèn, cầu tre, bục nhảy, Bùa Gió), Đêm 3 (Đảo Chuông, 7 đèn, 3 tầng, gió mạnh).
- **Cơ chế Lướt (Dash)**: Tốc độ 14.0 m/s trong 0.2s, hồi chiêu 1.5s (0s khi có Bùa Gió).
- **Cơ chế Nhảy (Jump) & Rơi tự do**: Vận tốc nhảy 7.0 m/s, gia tốc trọng lực $-20\text{ m/s}^2$. Rơi khỏi đảo ($Y < -10$) mất 1 Ngọn Lửa và toàn bộ đom đóm, hồi sinh sau 60 ticks.
- **Kẻ địch mới: Gió Lạc (Drifter)**: Tốc độ 7.0 m/s, săn Mây khi mang $\ge 5$ đom đóm, cướp tối đa 3 đom đóm rồi trốn. Bị Tỏa Sáng đánh trúng sẽ thả rơi đom đóm.
- **Bùa Gió (Charm)**: Tăng tốc độ lên 7.2 m/s và Lướt không hồi chiêu trong 600 ticks.
- **Vùng An Toàn 6.0m**: Ngăn cản tuyệt đối Bóng Mực khi đèn sáng.

---

## [Phase 1] — v1.0.0-alpha (Nền tảng & Test Contract v1.0) — Contract v1.0
- **Khởi tạo Core Simulation Engine**: Mô phỏng 60 tick/giây thuần TypeScript, tính tất định 100% bằng Mulberry32 PRNG.
- **Headless CLI**: Nhận cờ `--seed, --night, --ticks, --out, --snapshot-every`, xuất file JSONL với Snapshot và Events.
- **Playable 3D View**: Render WebGL trên Three.js + Vite với nhân vật Mây đội nón lá, đom đóm lơ lửng, Bóng Mực và HUD trực quan.
