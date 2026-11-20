# Đảo Đèn Lồng (Lantern Island) — Phase 3 (Contract v1.2)

> **Dự án**: Game 3D góc nhìn thứ ba theo quy trình AI SDLC.
> **Học viên**: Võ Lê Hải Đăng (K5-L3A-Day12-VoLeHaiDang-03577)
> **Tag nộp**: `phase-3`
> **Test Contract Version**: `v1.2`

---

## 1. Hướng dẫn Cài đặt & Khởi chạy (Chỉ 3 lệnh)

```bash
# Lệnh 1: Cài đặt dependencies
npm install

# Lệnh 2: Chạy kiểm thử tự động Headless theo Test Contract v1.2 (8/8 PASS)
npm test

# Lệnh 3: Chơi game 3D trực quan trên trình duyệt
npm run dev
```

---

## 2. Hướng dẫn Điều khiển (Controls v1.2)

- **W / A / S / D** hoặc **Phím Mũi tên**: Di chuyển nhân vật Mây.
- **Shift**: **Lướt (Dash)** với tốc độ 14.0 m/s trong 0.2s.
- **Space**: **Nhảy (Jump)** với vận tốc 7.0 m/s.
- **E**:
  - Tại đèn chưa sáng: Nạp đom đóm để thắp sáng (lần đầu cần 10, thắp lại chỉ cần 5).
  - Tại đèn đang sáng: **Châm dầu (Refuel)** bù cho phần nhiên liệu hao hụt (1 đom đóm = 10 fuel).
- **Q**: Kích hoạt **Tỏa Sáng (Pulse)** bán kính 5.0m (tốn 3 đom đóm) làm choáng Bóng Mực và nhận +15 điểm nếu trúng Bóng Mực đang hút dầu.
- **Esc / P**: Tạm dừng game.

---

## 3. Change Request Phase 3 (TICKET-03 — "Đèn cạn dầu")

1. **Nhiên liệu Đèn (Fuel System)**: Đèn sáng bị hao $1.0\text{ fuel/s}$. Khi $\text{fuel} \le 0$, đèn tắt và phát sự kiện `lantern_out`.
2. **Bóng Mực hút dầu (Drain)**: Đèn có $\text{fuel} < 30$ bị mất vùng an toàn. Bóng Mực wander sẽ tiến tới hút $5\text{ fuel/s}$, phát sự kiện `fuel_drain`.
3. **Thắp lại giảm chi phí**: Đèn từng sáng (`ever_lit: true`) chỉ tốn **5 đom đóm** để thắp lại (thay vì 10).
4. **Luật Thắng Mới (`dawn_survived`)**: Không còn thắng sớm khi thắp hết đèn! Người chơi phải bảo vệ hòn đảo tới Bình minh và duy trì $\ge 60\%$ số đèn đang sáng.
5. **Xem chi tiết quyết định thiết kế**: [ADR Phase 3](docs/notes/phase-3-adr.md) và [Changelog Breaking Changes](CHANGELOG.md).

---

## 4. Tài liệu & Bằng chứng SDLC

- [ADR Quyết định Thiết kế Phase 3](docs/notes/phase-3-adr.md)
- [Changelog Breaking Changes Phase 3](CHANGELOG.md)
- [Bằng chứng kiểm chứng Phase 3 (8/8 Test PASS)](docs/proof/phase-3-proof.md)
- [Giả định kỹ thuật Phase 3](docs/notes/phase-3-assumptions.md)
- [Nhật ký sử dụng AI & Token](docs/notes/ai-usage-log.md)
- [Tài liệu Harness AI AGENTS.md](AGENTS.md)
- [CREDITS.md](CREDITS.md)
