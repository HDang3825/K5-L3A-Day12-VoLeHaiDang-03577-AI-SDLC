# Đảo Đèn Lồng (Lantern Island) — Bản Phát Hành v1.0.0

> **Dự án**: Game 3D góc nhìn thứ ba phát triển qua 4 Phase theo quy trình AI SDLC.
> **Học viên**: Võ Lê Hải Đăng (K5-L3A-Day12-VoLeHaiDang-03577)
> **Tag nộp**: `phase-4` | **Release**: `v1.0.0`
> **Test Contract Version**: `v1.3`
> **Video Demo**: [Xem Video Demo (.mp4)](https://github.com/dao-den-long/releases/tag/v1.0.0) *(đính kèm tại Release v1.0.0)*

---

## 1. Hướng Dẫn Cài Đặt & Chạy Game (Tối đa 3 Lệnh)

Dự án hỗ trợ đa nền tảng (macOS, Linux, Windows), chạy mượt mà trên máy tính sạch:

```bash
# Lệnh 1: Cài đặt toàn bộ thư viện dependencies
npm install

# Lệnh 2: Chạy kiểm thử tự động Headless theo Test Contract v1.3 (8/8 PASS)
npm test

# Lệnh 3: Khởi chạy game 3D trực quan trên trình duyệt
npm run dev
```

---

## 2. Hướng Dẫn Điều Khiển (Controls v1.3)

| Phím bấm | Hành động | Mô tả |
|---|---|---|
| **W / A / S / D** hoặc **Mũi tên** | Di chuyển | Tốc độ chạy chuẩn $6.0\text{ m/s}$ ($7.2\text{ m/s}$ khi có Bùa Gió). |
| **Shift** | **Lướt (Dash)** | Tốc độ $14.0\text{ m/s}$ trong $0.2\text{s}$, hồi chiêu $1.5\text{s}$ (hồi chiêu $0\text{s}$ khi có Bùa Gió). |
| **Space** | **Nhảy (Jump)** | Vận tốc nhảy $7.0\text{ m/s}$, gia tốc trọng lực $-20\text{ m/s}^2$. |
| **E** | **Tương tác / Nạp / Châm dầu** | - Tại đèn chưa sáng: Nạp đom đóm để thắp sáng (lần đầu cần 10, thắp lại cần 5).<br>- Tại đèn đang sáng: **Châm dầu (Refuel)** bù cho phần hao hụt ($1\text{ mote} = 10\text{ fuel}$). |
| **Q** | **Tỏa Sáng (Pulse)** | Tốn 3 đom đóm (hồi chiêu 3s), bán kính 5m: Làm choáng Bóng Mực $2\text{s}$, đẩy lùi 4m; ép Gió Lạc nhả đom đóm đã cướp; nhận +15 điểm nếu trúng Bóng Mực đang hút dầu. |
| **Esc / P** | **Tạm dừng (Pause)** | Dừng toàn bộ logic game, hiển thị menu tạm dừng. |

---

## 3. Các Lệnh Đo Đạc & Kiểm Tra Tự Động (Contract v1.3)

### A. Chế độ Headless Simulation
Mô phỏng 60 tick/giây thuần túy, tính toán tất định 100%, xuất file JSONL:
```bash
npm run headless -- --seed 42 --night 1 --ticks 300 --out output.jsonl --snapshot-every 10
```

### B. Chế độ Benchmark Hiệu Năng
Đo FPS, 1% Low FPS, P95 frame time trên cảnh chuẩn (200 Bóng Mực, 100 đom đóm, 3 đèn sáng, camera bay tròn):
```bash
npm run bench -- --seed 42 --duration 30 --out bench.json
```
- **Kết quả đo thực tế**: `avg_fps = 94,878` (vượt xa ngưỡng $\ge 60$), `p1_low_fps = 4,138` ($\ge 30$), `load_ms = 1` ($\le 10,000$).

### C. Chế độ Soak Test Chạy Lâu Dài
Chạy liên tiếp 10 Đêm trong cùng một tiến trình, kiểm tra tính ổn định và rò rỉ bộ nhớ RSS:
```bash
npm run soak -- --seed 7 --nights 10 --out soak.json
```
- **Kết quả đo thực tế**: `crashes = 0`, `mem_end_mb (74.7) <= 1.2 * mem_start_mb (72.5)` (Đạt chuẩn không rò rỉ bộ nhớ).

---

## 4. Tổng Kết Toàn Bộ Hồ Sơ Dự Án (SDLC Artifacts)

- [Báo cáo Retrospective (Tổng kết 4 Phase & Đánh giá AI)](docs/notes/retro.md)
- [Changelog Toàn bộ 4 Phase (Gồm Breaking Changes)](CHANGELOG.md)
- [ADR Quyết định Thiết kế Phase 3 (Mô hình Nhiên liệu & Luật Thắng)](docs/notes/phase-3-adr.md)
- [Bằng chứng Kiểm chứng Phase 4 (v1.3 & v1.0.0)](docs/proof/phase-4-proof.md)
- [Bằng chứng Kiểm chứng Phase 3 (v1.2)](docs/proof/phase-3-proof.md)
- [Bằng chứng Kiểm chứng Phase 2 (v1.1)](docs/proof/phase-2-proof.md)
- [Bằng chứng Kiểm chứng Phase 1 (v1.0)](docs/proof/phase-1-proof.md)
- [Nhật ký Dùng AI & Quản lý Token](docs/notes/ai-usage-log.md)
- [Tài liệu Harness AI AGENTS.md](AGENTS.md)
- [CREDITS.md](CREDITS.md) | [LICENSE](LICENSE)
