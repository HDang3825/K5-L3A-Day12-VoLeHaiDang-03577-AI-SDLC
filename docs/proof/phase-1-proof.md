# Bằng chứng Kiểm chứng (Proof of Verification) - Phase 1

Bài thi: **Đảo Đèn Lồng**
Tag: `phase-1`
Môi trường kiểm thử: Node.js v26.5.0, Headless Simulation 60 tick/s, Three.js v0.170.0

---

## Bảng truy vết yêu cầu đến bằng chứng (Traceability Matrix)

| STT | Yêu cầu PRD-0 & Contract v1.0 | Kịch bản kiểm chứng | File Bằng chứng / Output | Kết quả |
|---|---|---|---|---|
| 1 | **Nhặt đom đóm (Pickup)**: Đến gần trong bán kính $\le 1.5\text{m}$, tăng `carried`, phát event `mote_picked` | `scenario_pickup_deposit.json` (3 đom đóm tại Z=3, 4, 5). Di chuyển Z+ | `tests/output/out_pickup_deposit.jsonl` (3 sự kiện `mote_picked`, carried tăng từ 1 đến 3) | **ĐẠT** |
| 2 | **Nạp đom đóm & Thắp đèn (Deposit & Lit)**: Nhấn `interact` trong bán kính $\le 2.5\text{m}$ quanh đèn $L1$. Khi đủ 3 đom đóm đèn sáng | `inputs_pickup_deposit.json` (nhấn interact tại tick 90 tại vị trí đèn L1) | `tests/output/out_pickup_deposit.jsonl` (sự kiện `deposit` amount=3 và `lantern_lit` L1) | **ĐẠT** |
| 3 | **Tỏa sáng xua Bóng Mực (Pulse)**: Tốn 1 đom đóm, làm choáng Bóng Mực trong bán kính $5.0\text{m}$, đẩy lùi $4\text{m}$ | `scenario_pulse_stun.json` (Shade S1 tại [0, 0, 4]). Nhấn pulse tại tick 0 | `tests/output/out_pulse.jsonl` (sự kiện `pulse` với `stunned_ids: ["S1"]`, trạng thái S1 chuyển `stunned`) | **ĐẠT** |
| 4 | **Tính tất định (Determinism)**: Cùng `--seed 9999`, cùng scenario và inputs phải sinh output JSONL giống nhau 100% | Chạy lệnh headless 2 lần độc lập sinh ra `out_det_1.jsonl` và `out_det_2.jsonl` | Test tự động so khớp `content1 === content2` | **ĐẠT** |
| 5 | **Định dạng Snapshot & End**: Bắt đầu bằng snapshot tick 0, snapshot mỗi 10 tick, kết thúc bằng record `end` | Kiểm tra cấu trúc các dòng JSONL | Tọa độ làm tròn 3 chữ số thập phân, đầy đủ trường theo Test Contract v1.0 | **ĐẠT** |
| 6 | **Game 3D Playable (Đêm 1)**: Người chơi Mây, nón lá, nhặt đom đóm, nạp 5 đèn, camera 3D bám theo, HUD đầy đủ | Chạy `npm run dev` mở trình duyệt | WebGL 3D render mượt mà, chơi được đầy đủ vòng thắng/thua | **ĐẠT** |

---

## Lệnh kiểm tra lại bằng chứng ở tag `phase-1`
```bash
git checkout phase-1
npm install
npm test
```
*Tất cả 3 bài test hợp đồng đều PASS.*
