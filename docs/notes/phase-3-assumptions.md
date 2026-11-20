# Giả định Kỹ thuật & Tiêu chí Nghiệm thu - Phase 3 (Ticket-03)

## 1. Hệ thống Nhiên liệu Đèn
- Đèn có dung lượng tối đa 100 fuel.
- Hao hụt: $1.0\text{ fuel/giây}$ ($1/60$ mỗi tick).
- Châm dầu: Khi bấm tương tác tại đèn đang sáng, $used = \min(carried, \lceil (100 - fuel) / 10 \rceil)$. Mỗi đom đóm tăng 10 fuel. Đèn đầy dầu không nhận thêm.
- Tắt đèn: Khi $fuel \le 0$, đèn tắt, $deposited = 0$, phát sự kiện `lantern_out`, ghi nhận cờ `ever_lit = true`.
- Thắp lại: Đèn có `ever_lit = true` chỉ tốn 5 đom đóm để thắp lại (thay vì 10).

## 2. Bóng Mực Hút Dầu (Drain)
- Khi $fuel < 30$, đèn bị mất vùng an toàn 6m.
- Bóng Mực ở trạng thái `wander` sẽ ưu tiên di chuyển tới đèn sáng có $fuel < 30$ gần nhất.
- Khi khoảng cách $XZ \le 2.0\text{m}$, Bóng Mực chuyển trạng thái sang `drain`, đứng yên và rút $5\text{ fuel/giây}$.
- Phát sự kiện `fuel_drain` mỗi 60 ticks liên tục khi đang hút.
- Bị Tỏa Sáng trúng khi đang drain: chuyển `stunned`, thưởng +15 điểm.

## 3. Luật Thắng Mới
- Không còn thắng sớm khi thắp hết đèn.
- Người chơi phải duy trì ánh sáng của hòn đảo đến khi hết giờ (Bình minh).
- Điều kiện thắng: Mây còn sống và số đèn đang sáng $\ge \lceil 0.6 \times \text{tổng số đèn} \rceil$ (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7) $\rightarrow$ phát sự kiện `game_over` với `reason: "dawn_survived"`.
- Điều kiện thua: Hết Ngọn Lửa (`no_flames`) hoặc hết giờ mà $< 60\%$ đèn sáng (`dawn`).
