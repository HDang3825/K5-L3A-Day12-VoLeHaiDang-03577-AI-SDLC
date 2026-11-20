# Bằng chứng Kiểm chứng (Proof of Verification) - Phase 3 (Contract v1.2)

Bài thi: **Đảo Đèn Lồng (Lantern Island)**
Ticket: **TICKET-03 — Change Request "Đèn cạn dầu"**
Tag nộp: `phase-3`
Contract Version: `1.2`
Môi trường kiểm thử: Node.js v26.5.0, Headless Simulation 60 tick/s, TypeScript

---

## 1. Bảng Truy Vết Yêu cầu đến Bằng chứng (Traceability Matrix)

| STT | Yêu cầu Ticket-03 (Contract v1.2) | Kịch bản kiểm chứng | Bằng chứng kiểm thử tự động | Kết quả |
|---|---|---|---|---|
| 1 | **Hao hụt nhiên liệu & Tắt đèn (`lantern_out`)**: Đèn hao $1.0\text{ fuel/s}$, khi $\text{fuel} \le 0$ đèn tắt, phát event `lantern_out`, `ever_lit = true`. | Test `Fuel decay: lit lantern loses 1 fuel/sec and turns off when fuel <= 0 ('lantern_out')` | `tests/contract.test.js` line 19. Sau 60 ticks rơi còn 1.0, sau 125 ticks tắt đèn, phát đúng 1 event `lantern_out`. | **ĐẠT** |
| 2 | **Cơ chế Châm dầu (`refuel`)**: Bấm tương tác tại đèn đang sáng nạp dầu bù cho phần thiếu ($1\text{ mote} = 10\text{ fuel}$), phát event `refuel`. | Test `Refuel: pressing interact near lit lantern refuels it ('refuel')` | `tests/contract.test.js` line 37. Đèn 80 fuel tiêu thụ 2 motes đạt 100 fuel, phát event `refuel`. | **ĐẠT** |
| 3 | **Chi phí Thắp lại 5 đom đóm**: Đèn từng sáng (`ever_lit: true`) chỉ tốn 5 đom đóm để thắp lại (thay vì 10). | Test `Relight cost: ever_lit lantern requires only 5 motes to relight` | `tests/contract.test.js` line 52. Đèn thắp lại với 5 motes, phát event `lantern_lit { relight: true }`. | **ĐẠT** |
| 4 | **Bóng Mực hút dầu (`drain`)**: Khi $\text{fuel} < 30$, Bóng Mực tiếp cận $\le 2\text{m}$ chuyển sang `drain`, hút $5\text{ fuel/s}$, phát `fuel_drain` mỗi 60 ticks. | Test `Shade Drain: shade wanders to lantern with fuel < 30 and drains 5 fuel/sec` | `tests/contract.test.js` line 72. Đèn bị rút fuel nhanh hơn bình thường ($1 + 5 = 6\text{ fuel/s}$), phát event `fuel_drain`. | **ĐẠT** |
| 5 | **Tỏa Sáng đánh trúng Bóng Mực đang Drain**: Nhận tổng cộng +15 điểm (+5 cơ bản + 10 thưởng). | Test `Pulse on draining shade awards +15 points` | `tests/contract.test.js` line 86. Điểm tăng chính xác 15 điểm khi kích hoạt Pulse trúng shade drain. | **ĐẠT** |
| 6 | **Luật Thắng Mới (`dawn_survived`)**: Không thắng sớm khi thắp đủ đèn; thắng tại thời điểm hết giờ nếu $\ge 60\%$ số đèn đang sáng. | Test `Win condition: no early win, wins with 'dawn_survived' at dawn if >= 60% lit` | `tests/contract.test.js` line 102. Giữ nguyên trạng thái `playing` khi đủ 3 đèn; chỉ chuyển `won` với `reason: "dawn_survived"` khi hết giờ. | **ĐẠT** |
| 7 | **Cơ chế Lướt (Dash)**: Kích hoạt đạt vận tốc 14.0 m/s, phát event `dash`. | Test `Dash: reaches 14.0 m/s and emits 'dash'` | `tests/contract.test.js` line 125. | **ĐẠT** |
| 8 | **Hiệu năng & Tính tất định**: 600 ticks chạy trong vài mili-giây, cùng seed sinh ra JSONL trùng khớp hoàn toàn. | Test `Headless performance & Determinism across two runs` | `tests/contract.test.js` line 134. | **ĐẠT** |

---

## 2. Kết quả Chạy Bộ Kiểm thử

```text
> dao-den-long@1.1.0 test
> tsx --test tests/contract.test.js

✔ Fuel decay: lit lantern loses 1 fuel/sec and turns off when fuel <= 0 ('lantern_out') (3.267ms)
✔ Refuel: pressing interact near lit lantern refuels it ('refuel') (1.0845ms)
✔ Relight cost: ever_lit lantern requires only 5 motes to relight (0.6537ms)
✔ Shade Drain: shade wanders to lantern with fuel < 30 and drains 5 fuel/sec (0.7945ms)
✔ Pulse on draining shade awards +15 points (0.6864ms)
✔ Win condition: no early win, wins with 'dawn_survived' at dawn if >= 60% lit (1.0049ms)
✔ Dash: reaches 14.0 m/s and emits 'dash' (0.8553ms)
✔ Headless performance & Determinism across two runs (3.9372ms)

ℹ tests 8
ℹ pass 8
ℹ fail 0
```
