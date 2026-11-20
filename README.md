# Đảo Đèn Lồng (Lantern Island) — Phase 2 (Contract v1.1)

> **Dự án**: Game 3D góc nhìn thứ ba theo quy trình AI SDLC.
> **Học viên**: Võ Lê Hải Đăng (K5-L3A-Day12-VoLeHaiDang-03577)
> **Tag nộp**: `phase-2`
> **Test Contract Version**: `v1.1`

---

## 1. Hướng dẫn Cài đặt & Khởi chạy (Chỉ 3 lệnh)

```bash
# Lệnh 1: Cài đặt dependencies
npm install

# Lệnh 2: Chạy kiểm thử tự động Headless theo Test Contract v1.1 (8/8 PASS)
npm test

# Lệnh 3: Chơi game 3D trực quan trên trình duyệt
npm run dev
```

---

## 2. Hướng dẫn Điều khiển (Controls v1.1)

- **W / A / S / D** hoặc **Phím Mũi tên**: Di chuyển nhân vật Mây.
- **Shift** (hoặc nút Lướt): **Lướt (Dash)** với tốc độ 14.0 m/s trong 0.2s, hồi chiêu 1.5s (0s hồi chiêu khi có Bùa Gió).
- **Space**: **Nhảy (Jump)** với vận tốc 7.0 m/s, rơi tự do với gia tốc trọng lực $-20\text{ m/s}^2$.
- **E**: Nạp đom đóm vào Đèn Lồng Lớn khi đứng gần (bán kính $\le 2.0\text{ m}$).
- **Q**: Kích hoạt **Tỏa Sáng (Pulse)** bán kính 5.0m (tốn 3 đom đóm, hồi chiêu 3s) làm choáng Bóng Mực và ép Gió Lạc nhả đom đóm.
- **Esc / P**: Tạm dừng game (Pause/Resume).

---

## 3. Chế độ Headless & Test Contract v1.1

Chạy mô phỏng Headless cực nhanh (**1000 ticks trong ~3ms**, full 21.600 ticks trong $\ll 30\text{s}$) với tính **tất định 100%**:

```bash
# Đêm 1: Đảo Bến (5 đèn)
npm run headless -- --seed 42 --night 1 --ticks 300 --out output_n1.jsonl --snapshot-every 10

# Đêm 2: Đảo Cau (2 đảo nối bằng cầu tre, 6 đèn, Bùa Gió C1)
npm run headless -- --seed 42 --night 2 --ticks 300 --out output_n2.jsonl --snapshot-every 10

# Đêm 3: Đảo Chuông (3 tầng, dốc, gió mạnh, 7 đèn, Bùa Gió C1 & C2)
npm run headless -- --seed 42 --night 3 --ticks 300 --out output_n3.jsonl --snapshot-every 10
```

---

## 4. Các tính năng mới của Phase 2 (Ticket-02)

1. **Chuẩn hóa thông số**: Tốc độ 6.0 m/s, nhảy 7.0 m/s, trọng lực -20 m/s², lướt 14.0 m/s, rơi vực $Y < -10$ hồi sinh tại gốc tọa độ.
2. **Kẻ địch mới: Gió Lạc (Drifter)**: Bay 7.0 m/s, săn lùng Mây khi mang $\ge 5$ đom đóm, cướp tối đa 3 đom đóm rồi bỏ trốn. Bị Tỏa Sáng đánh trúng sẽ thả rơi đom đóm tại chỗ.
3. **Bùa Gió (Charm)**: Nhặt bùa tăng tốc độ lên 7.2 m/s và Lướt không hồi chiêu trong 600 ticks.
4. **Vùng an toàn 6.0m**: Đèn sáng tạo vùng an toàn đẩy Bóng Mực ra mép ngoài 6.0m.
5. **Thứ tự 12 bước trong tick**: Chuẩn hóa từ đọc input, đếm ngược, di chuyển, nhặt, đèn, vùng an toàn, tỏa sáng, AI di chuyển, va chạm, sinh thực thể, xét thắng/thua, ghi snapshot.

---

## 5. Tài liệu & Bằng chứng SDLC

- [Bằng chứng kiểm chứng Phase 2 (8/8 Test PASS)](docs/proof/phase-2-proof.md)
- [Giả định kỹ thuật Phase 2](docs/notes/phase-2-assumptions.md)
- [Nhật ký sử dụng AI & Token](docs/notes/ai-usage-log.md)
- [Tài liệu Harness AI AGENTS.md](AGENTS.md)
- [CREDITS.md](CREDITS.md)
