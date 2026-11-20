# Đảo Đèn Lồng (Lantern Island) — Phase 1

> **Dự án**: Game 3D góc nhìn thứ ba theo quy trình AI SDLC.
> **Học viên**: Võ Lê Hải Đăng (K5-L3A-Day12-VoLeHaiDang-03577)
> **Tag nộp**: `phase-1`
> **Video Demo**: *(Đang cập nhật trước hạn chót Phase 4)*

---

## 1. Hướng dẫn Cài đặt & Khởi chạy (Chỉ 3 lệnh)

Dự án chạy tốt trên mọi nền tảng (macOS, Linux, Windows):

```bash
# Lệnh 1: Cài đặt dependencies
npm install

# Lệnh 2: Chạy kiểm thử tự động Headless theo Test Contract v1.0
npm test

# Lệnh 3: Mở game 3D trực quan trên trình duyệt
npm run dev
```

---

## 2. Hướng dẫn Điều khiển (Controls)

- **W / A / S / D** hoặc **Phím Mũi tên**: Di chuyển nhân vật Mây.
- **E**: Nạp đom đóm vào Đèn Lồng Lớn khi đứng gần (bán kính $\le 2.5\text{m}$).
- **Space** hoặc **Q**: Kích hoạt **Tỏa Sáng (Pulse)** để xua đuổi và làm choáng Bóng Mực (tốn 1 đom đóm).
- **Mục tiêu**: Gom đom đóm rải rác trên đảo, né tránh Bóng Mực và nạp đủ ánh sáng để thắp cả 5 Đèn Lồng Lớn.

---

## 3. Chế độ Headless & Test Contract v1.0

Hệ thống chấm điểm tự động có thể chạy chế độ headless qua CLI với tính **tất định 100%** (deterministic):

```bash
npm run headless -- --seed 42 --night 1 --ticks 180 --out output.jsonl --snapshot-every 10
```

- **Hồ sơ cấu hình**: `game.contract.json` tại thư mục gốc.
- **Tuning parameters**:
  - `player_speed`: 6.0 m/s
  - `carry_capacity`: 5 đom đóm
  - `lantern_cost`: 3 đom đóm / đèn
  - `lantern_count_night1`: 5 đèn lồng
  - `pickup_radius`: 1.5 m
  - `interact_radius`: 2.5 m
  - `pulse_cost`: 1 đom đóm
  - `pulse_radius`: 5.0 m
  - `pulse_stun_s`: 3.0 s
  - `pulse_push_m`: 4.0 m
  - `safe_radius`: 4.0 m quanh đèn đã thắp sáng
  - `shade_speed`: 3.5 m/s, `shade_hit_radius`: 1.2 m
- **Điểm số**:
  - Nhặt đom đóm: +10đ
  - Thắp đèn lồng: +100đ
  - Làm choáng bóng mực: +20đ
  - Thắng màn: cộng thêm `time_left_s * 2` + `flames * 50`.

---

## 4. Sáng tạo của tôi (My Creativity - Hạng mục F Rubric)

Dựa trên tinh thần tự do sáng tạo không phá vỡ hợp đồng của PRD-0:
1. **Nón lá truyền thống & Đèn lồng mini**: Mây được tạo hình 3D với chiếc nón lá vàng ấm, đeo một chiếc đèn lồng nhỏ phát sáng cạnh người như ngọn hải đăng di động.
2. **Sóng xung kích Tỏa Sáng (Pulse Shockwave)**: Khi nhấn phím Tỏa Sáng, một vòng sóng ánh sáng vàng kim (`Pulse Ring`) lan rộng từ chân Mây đẩy lùi Bóng Mực.
3. **Hiệu ứng đom đóm lơ lửng (Floating Bobbing)**: Đom đóm nhấp nháy phát sáng vàng ấm và dao động nhịp nhàng theo phương thẳng đứng.
4. **Không khí Đêm Cổ Tích**: Bầu trời đêm sâu thẳm với lớp sương mù tím đen mờ ảo (`FogExp2`), ánh sáng vàng cam ấm đối lập với sắc tím ma mị của Bóng Mực.
5. **Kiến trúc cô lập tuyệt đối**: Toàn bộ hiệu ứng hình ảnh Three.js được tách biệt trong `src/web/`, hoàn toàn **không ảnh hưởng** đến đầu ra JSONL của chế độ Headless.

---

## 5. Tài liệu & Bằng chứng SDLC

- [Giả định kỹ thuật Phase 1](docs/notes/phase-1-assumptions.md)
- [Bằng chứng kiểm chứng Phase 1](docs/proof/phase-1-proof.md)
- [Nhật ký sử dụng AI & Token](docs/notes/ai-usage-log.md)
- [Biên bản Review của Claude AI](docs/notes/ai-review-phase1.md)
- [Tài liệu Harness AI](AGENTS.md)
- [Bản quyền & Tín chỉ](CREDITS.md)
