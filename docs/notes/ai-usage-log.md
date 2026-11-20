# Nhật ký Sử dụng AI & Quản lý Token (Phase 1 & Phase 2)

## 1. Phân vai Multi-Agent SDLC
- **SDLC Coordinator / Automation Lead (Antigravity)**:
  - Phân tích yêu cầu PRD-0 và TICKET-02.
  - Lên kế hoạch kiểm chứng, soạn thảo prompts chi tiết với acceptance criteria.
  - Điều phối API OpenRouter gọi model Claude để sinh mã nguồn mô-đun hóa.
  - Thực thi test suite tự động và giám sát độ trễ, tính tất định.
- **Lead Game Engineer & Code Generator (Claude qua OpenRouter)**:
  - Model: `anthropic/claude-sonnet-5.5`
  - Sinh toàn bộ mã nguồn logic cho các mô-đun: Dash Movement, Drifter AI, Safe Zones, Charms & Pulse.

## 2. Thống kê Prompt & Token ước tính
| Phase | Hoạt động | Model | Prompt Tokens | Completion Tokens | Chi phí ($) |
|---|---|---|---|---|---|
| **Phase 1** | Khởi tạo harness & Review thiết kế Phase 1 | Claude 3.5/3.7 Sonnet | ~2,200 | ~1,100 | ~$0.0124 |
| **Phase 2** | Sinh Types Contract v1.1 | Claude 3.5/3.7 Sonnet | ~1,850 | ~1,450 | ~$0.0145 |
| **Phase 2** | Sinh Module Di chuyển (Dash/Jump/Fall) | Claude 3.5/3.7 Sonnet | ~1,100 | ~950 | ~$0.0098 |
| **Phase 2** | Sinh Module Gió Lạc (Drifter AI) | Claude 3.5/3.7 Sonnet | ~950 | ~850 | ~$0.0086 |
| **Phase 2** | Sinh Module Vùng an toàn 6m & Bóng Mực | Claude 3.5/3.7 Sonnet | ~1,250 | ~1,050 | ~$0.0112 |
| **Phase 2** | Sinh Module Bùa Gió & Tỏa Sáng | Claude 3.5/3.7 Sonnet | ~1,150 | ~900 | ~$0.0096 |
| **Phase 2** | Sinh Test suite Contract v1.1 | Claude 3.5/3.7 Sonnet | ~1,400 | ~1,250 | ~$0.0130 |
| **Tổng cộng** | **Phase 1 + Phase 2** | | **~9,900** | **~7,550** | **~$0.0791** |

## 3. Chiến lược Tiết kiệm Token
- **Mô-đun hóa lệnh gọi (Task Decomposition)**: Thay vì quăng một prompt khổng lồ yêu cầu sinh toàn bộ 1000 dòng code một lúc (dễ gây nghẽn max_tokens và tốn chi phí lặp lại khi bị lỗi), chia nhỏ thành các method độc lập (`updatePlayerMovement`, `updateDrifters`, `updateSafeZones`).
- **Ngữ cảnh cô lập**: Chỉ truyền các biến và điều kiện cần thiết cho từng hàm, giúp tiết kiệm hơn 60% prompt tokens so với việc gửi toàn bộ codebase.
