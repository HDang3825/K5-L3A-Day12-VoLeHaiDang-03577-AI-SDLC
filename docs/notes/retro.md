# Báo cáo Retrospective (Retro) — Dự án "Đảo Đèn Lồng"

> **Dự án**: Game 3D góc nhìn thứ ba "Đảo Đèn Lồng" (Lantern Island)
> **Quy trình**: AI Software Development Life Cycle (AI SDLC)
> **Học viên**: Võ Lê Hải Đăng (K5-L3A-Day12-VoLeHaiDang-03577)
> **Bản phát hành**: Release `v1.0.0` (Tag `phase-4`)

---

## 1. Đánh giá Tổng hợp 4 Phase

| Phase | Trọng tâm | Thách thức chính | Giải pháp & Kết quả |
|---|---|---|---|
| **Phase 1** (PRD-0) | Dựng nền tảng Core Engine tách biệt Renderer; thiết lập Headless Test Contract v1.0. | Yêu cầu tổng quát, có tính mơ hồ có chủ đích; phải đảm bảo tính tất định 100%. | Phân tách triệt để Core logic (TypeScript thuần, không DOM/GPU) và Three.js Web view. Áp dụng thuật toán PRNG Mulberry32. **Pass 5/5 test**. |
| **Phase 2** (Ticket-02) | Đồng bộ số liệu chuẩn, mở rộng 3 Đêm, thêm cơ chế Lướt (Dash), Nhảy (Jump), Kẻ địch Gió Lạc (Drifter), Bùa Gió (Charm). | Khối lượng tính năng lớn; nhiều trạng thái AI mới; nguy cơ phá vỡ regression test của Phase 1. | Thiết kế State Machine chặt chẽ (`spawning/wander/chase/recoil/stunned`); mô-đun hóa lệnh gọi Claude cho từng method logic. **Pass 8/8 test**. |
| **Phase 3** (Ticket-03) | Change Request cốt lõi: Đèn cạn dầu, Bóng Mực hút dầu, bãi bỏ thắng sớm, luật thắng mới `dawn_survived`. | Phá vỡ tương thích (Breaking changes) hàng loạt luật cũ; test cũ bị đỏ do thay đổi mục tiêu game. | Soạn thảo ADR giải thích quyết định thiết kế; cập nhật test có lý do; áp dụng hệ thống trừ dầu chính xác theo tick. **Pass 8/8 test**. |
| **Phase 4** (Ticket-04) | Hoàn thiện phát hành: Chế độ Benchmark (200 Shades, 100 motes), Soak test (10 đêm), Bảng xếp hạng, Release v1.0.0. | Đo đạc hiệu năng nghiêm ngặt; kiểm soát rò rỉ bộ nhớ RSS chạy lâu dài. | Xây dựng CLI benchmark và soak test tự động; tối ưu bộ nhớ. Đạt **avg_fps > 60**, **crashes = 0**, **mem_end <= 1.2 * mem_start**. |

---

## 2. Điều gì Hiệu quả và Không Hiệu quả khi làm việc với AI

### A. Điều hiệu quả (What Worked Well)
1. **Phân rã bài toán nhỏ (Task Decomposition)**: Thay vì yêu cầu AI viết toàn bộ 1 file 800 dòng cùng lúc, việc chia nhỏ thành các method cụ thể (`updatePlayerMovement`, `updateDrifters`, `updateFuelAndDraining`) giúp AI sinh code chính xác tuyệt đối và không bao giờ bị cắt cụt do giới hạn token.
2. **Quy trình Test-Driven Prompting**: Gửi kèm tiêu chí kiểm thử (Acceptance Criteria) và công thức số học vào prompt giúp AI bám sát spec, hạn chế tối đa việc bịa đặt (hallucination).
3. **Phân vai Multi-Agent rõ ràng**: Coordinator (Antigravity) điều phối & chạy kiểm thử, còn Coder (Claude qua OpenRouter) tập trung viết logic. Hai bên kiểm tra chéo lẫn nhau.

### B. Điều không hiệu quả (What Didn't Work)
1. **Prompt gộp nguyên văn ticket dài**: Gửi toàn bộ văn bản ticket dài hơn 4000 tokens vào một prompt khiến AI tốn nhiều token vô ích và phản hồi dễ bị trễ hoặc rỗng do chạm trần completion tokens.
2. **Bắt AI đoán format ngầm**: Khi không cung cấp interface TypeScript hoặc tên hàm cụ thể, AI thường tự bịa ra các helper function không tồn tại.

---

## 3. Những lần AI sai và Cách phát hiện & Khắc phục

1. **Lỗi đứt dòng JSON & Markdown Fence**:
   - *Biểu hiện*: Script trích xuất code nhận kết quả 0 bytes.
   - *Nguyên nhân*: Claude bọc code trong nhiều block ```ts kèm văn bản giải thích.
   - *Khắc phục*: Nâng cấp parser regex quét toàn bộ phản hồi và lấy block code dài nhất.
2. **Lỗi sai số làm tròn khi châm dầu (Refuel)**:
   - *Biểu hiện*: Test châm dầu kỳ vọng tiêu thụ 2 motes nhưng lại bị tiêu thụ 3 motes.
   - *Nguyên nhân*: Do tick hao hụt $1/60$ chạy trước lệnh châm dầu, khiến 20 fuel thiếu biến thành 20.016, hàm `Math.ceil` làm tròn lên 3 motes.
   - *Khắc phục*: Thêm hàm làm tròn `round1` trước khi tính số motes cần châm.
3. **Lỗi Drifter bay mất trước khi Pulse**:
   - *Biểu hiện*: Test Tỏa Sáng ép Drifter nhả đom đóm bị fail vì không phát event `drifter_drop`.
   - *Nguyên nhân*: Test chạy 60 ticks khiến Drifter bay xa 8m (vượt quá bán kính 5m của Pulse).
   - *Khắc phục*: Tinh chỉnh thời điểm kích hoạt Pulse ở cự ly hợp lý (trong bán kính 5m).

---

## 4. Đánh giá Harness AI & Quản lý Token

- **Harness hữu ích nhất**:
  - `AGENTS.md`: Định hình luật chơi cố định và bảng lệnh kiểm thử nhanh.
  - Script pipeline tự động kết nối OpenRouter API với model `anthropic/claude-sonnet-5.5`.
  - Bộ kiểm thử tự động `npm test` với `node:test` và `tsx` cho phản hồi tức thì trong < 300ms.
- **Thống kê Token & Chi phí**:
  - Tổng Prompt Tokens: **~15.500 tokens**
  - Tổng Completion Tokens: **~12.200 tokens**
  - Tổng chi phí thực tế: **~$0.134** (Tiết kiệm hơn 70% so với dự toán thông thường nhờ chiến lược chia nhỏ ngữ cảnh).

---

## 5. Nếu làm lại từ đầu thì sẽ thay đổi gì?
1. Thiết lập sẵn các interface dữ liệu (Types) và file JSON Contract chuẩn trước khi prompt AI viết code logic.
2. Xây dựng bộ test scenario mẫu từ phút đầu tiên để AI có thể tự chạy và tự sửa lỗi trong sandbox.
3. Chuẩn hóa cơ chế fixed-timestep integer math (đơn vị ticks/milli-units) để loại bỏ hoàn toàn sai số dấu phẩy động giữa các môi trường.
