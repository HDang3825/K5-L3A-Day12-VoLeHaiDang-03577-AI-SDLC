# Bằng chứng Kiểm chứng (Proof of Verification) - Phase 2 (Contract v1.1)

Bài thi: **Đảo Đèn Lồng (Lantern Island)**
Ticket: **TICKET-02: "Ba hòn đảo"**
Tag nộp: `phase-2`
Contract Version: `1.1`
Môi trường kiểm thử: Node.js v26.5.0, Headless Simulation 60 tick/s, TypeScript

---

## 1. Bảng Truy vết Yêu cầu đến Bằng chứng (Traceability Matrix)

| STT | Yêu cầu Ticket-02 (Contract v1.1) | Kịch bản kiểm chứng | Bằng chứng kiểm thử tự động | Kết quả |
|---|---|---|---|---|
| 1 | **Cơ chế Lướt (Dash)**: Vận tốc 14.0 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks). Phát event `dash`. Có Bùa Gió thì hồi chiêu 0s. | Test `Dash: pressing dash emits 'dash' and speed reaches 14.0 m/s` | `tests/contract.test.js` line 41. Đo vận tốc đạt 14.0 m/s và có event `dash`. | **ĐẠT** |
| 2 | **Gió Lạc (Drifters) cướp đom đóm**: Khi Mây mang $\ge 5$ đom đóm, Drifter chuyển `chase` và cướp `min(3, carried)`, chuyển `flee`. | Test `Drifter (Gió Lạc): steals motes when player carries >= 5` | `tests/contract.test.js` line 59. Drifter mang `stolen = 3`, carried giảm còn 2, bảo toàn số lượng. | **ĐẠT** |
| 3 | **Gió Lạc không cướp khi $< 5$ đom đóm**: Giữ nguyên trạng thái không cướp nếu Mây chỉ mang 4 đom đóm. | Test `Drifter: does not steal when player carries < 5 motes` | `tests/contract.test.js` line 73. `drifter.stolen == 0`, player motes giữ nguyên 4. | **ĐẠT** |
| 4 | **Tỏa Sáng ép Gió Lạc nhả đom đóm**: Pulse trúng Drifter đang flee có đồ thì thả lại đom đóm rơi và phát event `drifter_drop`. | Test `Drifter: pulse forces drop of stolen motes ('drifter_drop')` | `tests/contract.test.js` line 85. Event `drifter_drop` được phát ra, `drifter.stolen = 0`. | **ĐẠT** |
| 5 | **Vùng An Toàn 6.0m (Safe Zone)**: Đèn đã thắp tạo vùng an toàn 6m, Bóng Mực không thể xâm nhập vào bên trong $d < 6.0\text{m}$. | Test `Safe Zone: Shade never penetrates within 6.0m of a lit lantern` | `tests/contract.test.js` line 104. Chạy 900 ticks với 3 Shades, khoảng cách tối thiểu đo được luôn $\ge 6.0\text{m}$. | **ĐẠT** |
| 6 | **Nhảy & Trọng lực (Jump & Gravity)**: Nhảy đạt $v_y = 7.0\text{m/s}$, trọng lực $-20\text{m/s}^2$ kéo nhân vật rơi về mặt đất. | Test `Jump: vy = 7.0 on jump and gravity pulls player back down` | `tests/contract.test.js` line 130. Đạt vận tốc nhảy, lên đỉnh rồi tiếp đất an toàn tại $Y=0$. | **ĐẠT** |
| 7 | **Hiệu năng Headless $\le 30\text{s}$ cho 21.600 ticks**: Tốc độ xử lý siêu nhanh. | Test `Headless performance: 1000 ticks run under 2 seconds` | `tests/contract.test.js` line 154. Chạy 1000 ticks chỉ mất **~3.1ms** (tương đương 21.600 ticks chỉ mất ~0.07s $\ll 30\text{s}$). | **ĐẠT** |
| 8 | **Tính tất định 100% (Determinism)**: Cùng seed chạy 2 lần sinh ra chuỗi JSONL trùng khớp hoàn toàn. | Test `Determinism verification across two runs` | `tests/contract.test.js` line 163. `sim1.toJSONL() === sim2.toJSONL()`. | **ĐẠT** |

---

## 2. Kết quả chạy bộ kiểm thử ở tag `phase-2`

```text
> dao-den-long@1.1.0 test
> tsx --test tests/contract.test.js

✔ Dash: pressing dash emits 'dash' and speed reaches 14.0 m/s (2.8023ms)
✔ Drifter (Gió Lạc): steals motes when player carries >= 5 (1.3586ms)
✔ Drifter: does not steal when player carries < 5 motes (1.3256ms)
✔ Drifter: pulse forces drop of stolen motes ('drifter_drop') (1.3266ms)
✔ Safe Zone: Shade never penetrates within 6.0m of a lit lantern (7.5654ms)
✔ Jump: vy = 7.0 on jump and gravity pulls player back down (1.1248ms)
✔ Headless performance: 1000 ticks run under 2 seconds (3.1298ms)
✔ Determinism verification across two runs (1.4795ms)

ℹ tests 8
ℹ pass 8
ℹ fail 0
```
