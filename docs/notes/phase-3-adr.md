# Architectural Decision Record (ADR) — Phase 3: Change Request "Đèn cạn dầu"

## 1. Bối cảnh & Vấn đề (Context)
- Trong Phase 1 & 2, người chơi chỉ cần gom đom đóm thắp sáng toàn bộ Đèn Lồng Lớn là game kết thúc thắng ngay lập tức (`all_lit`).
- Kết quả Playtest cho thấy người chơi giỏi kết thúc ván chỉ trong ~2 phút, dẫn đến sự thiếu hụt căng thẳng và thử thách ở nửa sau của Đêm.
- Khách hàng yêu cầu một sự thay đổi luật cốt lõi (Change Request - TICKET-03): Đèn đã thắp có thể cạn dầu và tắt; mục tiêu chuyển từ "thắp hết để thắng sớm" sang **"quản lý nhiên liệu và duy trì ánh sáng của đảo tới bình minh"**.

## 2. Quyết định Kiến trúc & Thiết kế (Decisions)

### A. Hệ thống Nhiên liệu Đèn (Lantern Fuel State Machine)
- **Mô hình trạng thái mới**:
  - Đèn có thuộc tính `fuel: number` (0 đến 100). Khi thắp lần đầu hoặc thắp lại, `fuel = 100`.
  - Hao hụt tự nhiên $1.0\text{ fuel/giây}$ ($1/60$ mỗi tick).
  - Khi $0 < \text{fuel} < 30$: Mất vùng an toàn 6m.
  - Khi $\text{fuel} \le 0$: Chuyển trạng thái sang TẮT (`lit: false`), phát sự kiện `lantern_out`, ghi nhớ cờ `ever_lit = true`.
- **Thắp lại (Relighting) vs Châm dầu (Refueling)**:
  - Đèn đang sáng: Bấm tương tác để **châm dầu** (tốn 1 đom đóm cho mỗi 10 fuel thiếu), phát sự kiện `refuel`.
  - Đèn đã tắt nhưng từng sáng (`ever_lit: true`): Chỉ cần **5 đom đóm** để thắp lại (thay vì 10 đom đóm như ban đầu). Phát sự kiện `lantern_lit { relight: true }`.

### B. Hành vi Kẻ địch mới: Bóng Mực Hút Dầu (Shade Drain State)
- Thêm trạng thái `drain` vào State Machine của Bóng Mực.
- Khi ở trạng thái `wander`, Bóng Mực tự động tìm kiếm đèn sáng có `fuel < 30` gần nhất.
- Khi tiếp cận trong bán kính $\le 2.0\text{m}$, Bóng Mực chuyển sang trạng thái `drain`, đứng yên và rút $5\text{ fuel/giây}$ (cộng dồn nếu nhiều con).
- Nếu người chơi dùng Tỏa Sáng (Pulse) trúng Bóng Mực đang drain, nó bị choáng và người chơi nhận được **+15 điểm** (thay vì +5 điểm thông thường).

### C. Luật Thắng Mới: Sống sót đến Bình Minh (`dawn_survived`)
- **Loại bỏ hoàn toàn cơ chế thắng sớm** (`all_lit`). Thắp đủ 100% đèn vẫn phải tiếp tục bảo vệ và duy trì đèn sáng.
- Tại tick kết thúc Đêm (Bình minh):
  - Người chơi còn sống (`flames > 0`) và số đèn đang sáng $\ge \lceil 0.6 \times \text{tổng số đèn} \rceil$ (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7) $\rightarrow$ **Thắng** với lý do `dawn_survived`.
  - Nếu số đèn đang sáng $< 60\%$ $\rightarrow$ **Thua** với lý do `dawn`.
  - Hết Ngọn Lửa ở bất kỳ thời điểm nào $\rightarrow$ **Thua ngay** với lý do `no_flames`.

## 3. Hệ quả & Tương thích (Consequences)
- Các bài test kiểm tra điều kiện "thắp hết đèn thì thắng sớm" của Phase 1 & 2 đã bị bãi bỏ hoặc cập nhật sang kịch bản sống sót đến bình minh.
- Snapshot mở rộng: Đèn có thêm `fuel`, `ever_lit`, `relit_count`; Player có thêm `capacity`.
- Headless Simulation giữ nguyên tính tất định 100% và tốc độ siêu nhanh (vài mili-giây cho hàng nghìn tick).
