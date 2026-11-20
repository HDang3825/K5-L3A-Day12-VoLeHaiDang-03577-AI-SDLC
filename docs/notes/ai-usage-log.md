# Nhật ký Sử dụng AI & Quản lý Token (Phase 1, 2 & 3)

## 1. Phân vai Multi-Agent SDLC
- **SDLC Coordinator / Automation Lead (Antigravity)**:
  - Phân tích Change Request TICKET-03, xác định breaking changes và yêu cầu hợp đồng mới Contract v1.2.
  - Soạn thảo prompt mô-đun hóa, gọi Claude qua OpenRouter API.
  - Cập nhật test suite, ma trận truy vết, ADR và CHANGELOG.
- **Lead Game Engineer (Claude qua OpenRouter)**:
  - Model: `anthropic/claude-sonnet-5.5`
  - Sinh mã nguồn logic Fuel State Machine, Refuel, Shade Drain, và Acceptance Test Suite.

## 2. Thống kê Prompt & Token ước tính
| Phase | Hoạt động | Model | Prompt Tokens | Completion Tokens | Chi phí ($) |
|---|---|---|---|---|---|
| **Phase 1** | Khởi tạo harness & Review thiết kế Phase 1 | Claude 3.5/3.7 Sonnet | ~2,200 | ~1,100 | ~$0.0124 |
| **Phase 2** | Sinh Types, Modules Dash, Drifter, Safe Zone v1.1 | Claude 3.5/3.7 Sonnet | ~7,700 | ~6,450 | ~$0.0667 |
| **Phase 3** | Sinh Module Fuel & Drain (`claude_phase3_fuel.ts`) | Claude 3.5/3.7 Sonnet | ~1,650 | ~1,350 | ~$0.0152 |
| **Phase 3** | Sinh Acceptance Test Suite v1.2 | Claude 3.5/3.7 Sonnet | ~1,450 | ~1,150 | ~$0.0131 |
| **Tổng cộng** | **Phase 1 + Phase 2 + Phase 3** | | **~13,000** | **~10,050** | **~$0.1074** |

## 3. Chiến lược Tiết kiệm Token trong Phase 3
- Khi tiếp nhận Change Request với nhiều luật bị thay thế, chỉ yêu cầu Claude viết các methods bị thay đổi (`updateFuelAndDraining`, `interactLantern`) thay vì viết lại toàn bộ mã nguồn `game.ts` 800 dòng.
- Giữ vững nguyên tắc: Coordinator phân tích yêu cầu $\rightarrow$ Claude viết logic trọng tâm $\rightarrow$ Hệ thống tự động ghép và chạy regression test.
