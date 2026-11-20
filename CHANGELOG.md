# Changelog — Breaking Changes (Phase 3)

Tất cả các thay đổi phá vỡ tương thích (Breaking Changes) và cập nhật luật chơi theo **TICKET-03 (Contract v1.2)**:

---

## 1. Thay đổi Phá vỡ Tương thích (Breaking Changes)

### [BREAKING 01] Loại bỏ Thắng Sớm (`all_lit`)
- **Cũ (v1.0 & v1.1)**: Khi toàn bộ đèn sáng (`all_lit`), ván chơi kết thúc thắng ngay lập tức.
- **Mới (v1.2)**: Không còn kết thúc sớm. Người chơi phải sống sót đến khi hết giờ (Bình minh).
- **Lý do kết thúc mới**: `dawn_survived` (thắng khi $\ge 60\%$ số đèn đang sáng lúc hết giờ).
- **Tác động kiểm thử**: Các test cũ kỳ vọng ván chơi dừng ngay khi đèn cuối cùng được thắp sáng đã được cập nhật sang kiểm tra trạng thái duy trì đến tick bình minh.

### [BREAKING 02] Đèn Đã Sáng Vẫn Tiêu Hao Nhiên Liệu & Có Thể Tắt
- **Cũ**: Đèn đã sáng thì sáng mãi mãi, không nhận thêm đom đóm.
- **Mới**: Đèn hao hụt $1.0\text{ fuel/s}$. Khi $\text{fuel} \le 0$, đèn tắt, phát sự kiện `lantern_out`. Đèn đang sáng nhận thêm đom đóm để châm dầu (1 đom đóm = 10 fuel), phát sự kiện `refuel`.
- **Tác động kiểm thử**: Đèn không còn là bất biến sau khi thắp; test cần theo dõi `fuel` và `lantern_out`.

### [BREAKING 03] Vùng An Toàn Phụ Thuộc Vào Mức Nhiên Liệu
- **Cũ**: Mọi đèn đã thắp đều duy trì vùng an toàn bán kính 6.0m ngăn cản tuyệt đối Bóng Mực.
- **Mới**: Đèn có $\text{fuel} < 30$ bị **mất vùng an toàn**. Bóng Mực có thể tiếp cận và hút dầu (`drain`).
- **Tác động kiểm thử**: Test vùng an toàn phải đảm bảo đèn có $\text{fuel} \ge 30$.

### [BREAKING 04] Chi Phí Thắp Lại Giảm Còn 5 Đom Đóm
- **Cũ**: Chi phí thắp đèn luôn là 10 đom đóm.
- **Mới**: Đèn từng sáng (`ever_lit: true`) chỉ tốn 5 đom đóm để thắp lại (`relight_cost = 5`). Sự kiện `lantern_lit` bổ sung trường `relight: boolean`.

### [BREAKING 05] Thay Thế Toàn Bộ Công Thức Điểm Số
- **Cũ**: Điểm thời gian thừa, điểm thắp đèn cũ.
- **Mới**:
  - +5 điểm mỗi đom đóm nạp (thắp mới, thắp lại, châm dầu).
  - +100 điểm thắp lần đầu, +40 điểm thắp lại.
  - +5 điểm làm choáng Bóng Mực thường, +15 điểm nếu làm choáng Bóng Mực đang hút dầu (`drain`).
  - Điểm bình minh (chỉ khi thắng): +50 + $\lfloor \text{fuel} \rfloor$ mỗi đèn đang sáng; +50 mỗi Ngọn Lửa còn lại. Bỏ thưởng thời gian thừa.

---

## 2. Các Trường Bổ Sung Trong Test Contract v1.2
- `game.contract.json`: Thêm `fuel_max: 100`, `fuel_decay_per_s: 1.0`, `fuel_per_mote: 10`, `relight_cost: 5`, `win_ratio: 0.6`, `drain_per_s: 5`, `low_fuel_threshold: 30`, `capacity_max: 20`.
- Thời lượng Đêm mới: Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s.
- Sự kiện mới: `refuel`, `lantern_out`, `fuel_drain`.
