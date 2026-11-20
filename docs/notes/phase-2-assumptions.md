# Giả định Kỹ thuật & Tiêu chí Nghiệm thu - Phase 2 (Ticket-02)

## 1. Đồng bộ Số liệu chuẩn (Contract v1.1)
- **Tốc độ di chuyển**: 6.0 m/s (thường), 7.2 m/s (khi có Bùa Gió), 14.0 m/s (khi Lướt).
- **Lướt (Dash)**: Thời gian lướt 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks). Khi có Bùa Gió thì hồi chiêu 0s. Lướt trên không giữ nguyên độ cao Y.
- **Nhảy & Rơi tự do**: $v_y = 7.0\text{ m/s}$, trọng lực $-20\text{ m/s}^2$. Chỉ nhảy khi đang chạm đất (`grounded = true`).
- **Rơi khỏi đảo ($Y < -10$)**: Mất 1 Ngọn Lửa, mất toàn bộ đom đóm, chờ 60 ticks và hồi sinh tại gốc toạ độ với 90 ticks bất tử.
- **Đom đóm (Motes)**: Sức chứa tối đa 10; nhặt tự động khi $d_{XZ} \le 1.0\text{ m}$ và $|d_Y| \le 1.5\text{ m}$.
- **Đèn Lồng**: Chi phí thắp 10 đom đóm; tương tác trong bán kính $\le 2.0\text{ m}$.
- **Vùng an toàn (Safe Zone)**: Bán kính 6.0 m quanh đèn đã thắp sáng (`lit: true`).
- **Tỏa Sáng (Pulse)**: Chi phí 3 đom đóm, bán kính 5.0 m, hồi chiêu 3.0 s (180 ticks). Làm choáng Bóng Mực 120 ticks, đẩy lùi 4.0 m trong 15 ticks. Nếu trúng Gió Lạc đang chase thì chuyển flee; nếu trúng lúc flee thì thả lại đom đóm đã cướp.
- **Gió Lạc (Drifter)**: Tốc độ 7.0 m/s. Đuổi khi Mây mang $\ge 5$ đom đóm và cách $\le 15\text{ m}$. Cướp $\min(3, \text{carried})$ rồi chạy trốn (flee) 240 ticks.
- **Bùa Gió (Charm)**: Hiệu lực 600 ticks, hồi sinh sau 2700 ticks.

## 2. Thứ tự 12 bước trong 1 tick
1. Đọc input (xử lý pause trước; tạm dừng thì freeze sim_tick, snapshot state "paused").
2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi.
3. Di chuyển Mây (nhảy, lướt, trọng lực, bục nhảy, gió) và kiểm tra rơi vực $Y < -10$.
4. Nhặt đom đóm và bùa gió.
5. Tương tác với đèn lồng.
6. Cập nhật vùng an toàn 6m.
7. Tỏa Sáng.
8. Di chuyển Bóng Mực và Gió Lạc.
9. Va chạm: Gió Lạc cướp trước, sau đó Bóng Mực gây sát thương.
10. Sinh thực thể theo lịch.
11. Xét điều kiện Thắng / Thua.
12. Ghi snapshot định kỳ.
