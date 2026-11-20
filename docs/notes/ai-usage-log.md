# Nhật ký Sử dụng AI & Quản lý Token (Phase 1)

## 1. Phân vai Multi-Agent SDLC
- **SDLC Coordinator / Automation Lead (Antigravity)**:
  - Phân tích yêu cầu PRD-0 và Test Contract v1.0.
  - Thiết kế kiến trúc phân tách Core Simulation và Three.js Renderer.
  - Thiết lập kịch bản kiểm thử tự động, runner headless CLI và CI tests.
- **Lead Game Architect & Reviewer (Claude qua OpenRouter)**:
  - Model: `anthropic/claude-sonnet-5.5`
  - Thẩm định tiêu chí chấp nhận (Acceptance Criteria), rà soát tính tất định (Determinism), phê duyệt thiết kế Phase 1.

## 2. Thống kê Prompt & Token ước tính (Phase 1)
| STT | Hoạt động | Model | Prompt Tokens (ước tính) | Completion Tokens (ước tính) | Tổng chi phí ước tính ($) |
|---|---|---|---|---|---|
| 1 | Khởi tạo harness & test connection | Claude 3.5/3.7 Sonnet | ~150 | ~100 | $0.0007 |
| 2 | Rà soát kiến trúc & Tiêu chí Test Contract | Claude 3.5/3.7 Sonnet | ~850 | ~350 | $0.0042 |
| 3 | Thẩm định & Phê duyệt Phase 1 | Claude 3.5/3.7 Sonnet | ~1,200 | ~650 | $0.0075 |
| **Tổng** | **Phase 1** | | **~2,200** | **~1,100** | **~$0.0124** |

## 3. Chiến lược Tiết kiệm Token & Tối ưu Ngữ cảnh
- **Không nhồi nhét mã nguồn thừa**: Chỉ chuyển giao cấu trúc state, tuning params và hợp đồng sự kiện cho Claude review.
- **Tập trung vào kiểm chứng thực tế**: Thay vì để AI sinh code lặp đi lặp lại không kiểm chứng, xây dựng sẵn harness headless và kiểm tra tất định bằng máy đo tự động trước khi xin phê duyệt.
