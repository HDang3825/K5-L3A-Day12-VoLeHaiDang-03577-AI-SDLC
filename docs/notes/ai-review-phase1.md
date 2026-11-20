# Nhận xét đánh giá chính thức Phase 1: Đảo Đèn Lồng

**Người review:** Lead Game Architect
**Quyết định:** ✅ **PHÊ DUYỆT CÓ ĐIỀU KIỆN (Conditional Approve)**

Nhận xét này dựa trên bản tóm tắt hồ sơ, tôi chưa đối chiếu trực tiếp mã nguồn hay file JSONL thực tế. Các điều kiện bên dưới cần đóng trong sprint đầu Phase 2, không chặn việc khởi động Phase 2.

---

## 1. Điểm mạnh

**Kiến trúc**
- Tách Core (`src/core/game.ts`) khỏi Renderer (`src/web/main.ts`) là quyết định nền tảng đúng. Nó cho phép chạy headless, test tự động, replay và sau này là server-authoritative hoặc kiểm tra anti-cheat.
- Core chạy 60 tick/s cố định với mulberry32 là lựa chọn nhỏ gọn, nhanh và dễ tái lập.
- `game.contract.json` đưa tuning ra khỏi code, nên designer chỉnh cân bằng không cần đụng logic.

**Contract và tooling**
- CLI có đủ cờ (`--seed`, `--night`, `--scenario`, `--inputs`, `--ticks`, `--out`, `--snapshot-every`), đủ để dựng regression suite và CI.
- Định dạng JSONL có snapshot định kỳ, event rõ ràng và record `end` làm dấu kết thúc. Dạng này dễ diff, dễ stream và dễ parse.
- Quy ước làm tròn 3 chữ số và khoảng cách trên mặt phẳng XZ được chốt sớm, tránh tranh cãi về sau.

---

## 2. Rủi ro và khoảng trống cần xử lý

### A. Determinism: "byte-identical 2 lần" chưa đủ
Hai lần chạy cùng máy, cùng process không chứng minh được determinism thật. Cần kiểm tra thêm:
1. **Cross-platform / cross-runtime:** Node với Chrome (V8) với Safari (JSC). `Math.sin/cos/atan2/pow` không được đảm bảo cho kết quả giống nhau từng bit giữa các engine. Nếu core dùng lượng giác cho hướng đi hoặc knockback thì đây là rủi ro thật.
2. **Làm tròn chỉ ở đầu ra hay cả trong state?** Làm tròn ở output là đúng. Nếu state nội bộ cũng bị làm tròn thì sai lệch tích lũy. Cần xác nhận state nội bộ giữ full precision, còn làm tròn chỉ áp dụng khi serialize.
3. **Thứ tự duyệt thực thể:** Mọi vòng lặp (Shade, mote, lantern) phải theo thứ tự ổn định, tức là theo ID hoặc mảng, không theo `Map`/`Set` có thể bị đổi khi thêm hoặc xóa. Thứ tự xử lý event cùng tick cũng phải được chốt.
4. **Không rò rỉ nguồn không xác định:** `Math.random`, `Date.now`, `performance.now` phải bị cấm trong `src/core`. Nên thêm lint rule `no-restricted-globals`/`no-restricted-properties`, và test tĩnh hoặc grep trong CI.
5. **Thứ tự key trong JSON** phải ổn định, không dựa vào thứ tự chèn ngẫu nhiên.

### B. Độ phủ test mới chỉ ở mức "happy path"
3 test pass là tốt nhưng chưa đủ để gọi Phase 1 là đã khóa contract. Contract liệt kê các event `player_hit` và `game_over` và tham số `safe_radius = 4.0m`, nhưng hồ sơ không có test nào cho chúng:
- **Safe radius:** Shade có bị chặn hoặc bị đẩy khi vào vùng 4m quanh đèn đã thắp không? Test ở biên (3.999 / 4.0 / 4.001).
- **player_hit → game_over:** chuỗi từ bị đánh đến thua và record `end` có đúng không.
- **Biên pickup/interact:** 1.5m và 2.5m, kiểm tra `<` hay `<=`, vì sai lệch này rất hay gây lỗi tái lập.
- **Pulse:** cooldown, bán kính 5.0m ở biên, pulse khi không có Shade nào trong tầm, và knockback bị chặn bởi biên đảo (đẩy 4m ra ngoài map thì xử lý ra sao).
- **Input hợp lệ/không hợp lệ:** file `--inputs` thiếu tick, tick trùng, input sau `--ticks`.
- **Test chuyển đêm** (`--night`) với các giá trị khác 1.

### C. Điểm cần làm rõ trong hồ sơ
- "Đẩy lùi 4m" là hằng số trong contract hay được suy ra từ kết quả test? Nếu chưa là tham số trong `game.contract.json` thì phải đưa vào (`pulse_knockback`), đừng hard-code.
- Tốc độ 6.0 m/s: đã chuẩn hóa vector chéo chưa? Nếu không, đi chéo sẽ nhanh hơn √2 lần.
- Snapshot "tick 0, snapshot_every": tick cuối có luôn có snapshot không, hay chỉ có record `end`? Cần ghi rõ trong spec.
- Contract chưa thấy version trong schema JSONL (ví dụ trường `schema_version` ở dòng đầu). Cần có trước khi dữ liệu replay bắt đầu tích lũy.

### D. Ranh giới Core / Renderer
Cần xác nhận renderer chạy fixed timestep bằng accumulator rồi nội suy hình ảnh, và **không** để frame rate ảnh hưởng đến logic. Cần có test hoặc CI check đảm bảo `src/core` không import `three`, `window` hay `document`.

---

## 3. Điều kiện phê duyệt (đóng trong sprint đầu Phase 2)

| # | Hạng mục | Tiêu chí hoàn thành |
|---|----------|---------------------|
| C1 | Lint/CI chặn nguồn không xác định trong `src/core` | Cấm `Math.random`, `Date`, `performance`, import DOM/three |
| C2 | Bổ sung test: safe_radius, player_hit → game_over, biên pickup/interact/pulse | Tối thiểu 6–8 test, có test biên |
| C3 | Golden file hash | Lưu SHA-256 của JSONL cho vài (seed, scenario), CI so sánh trên Node và ít nhất một OS khác |
| C4 | Đưa knockback và các hằng số còn hard-code vào contract | Không còn magic number trong core |
| C5 | Thêm `schema_version` và đặc tả bằng văn bản cho JSONL | Tài liệu mô tả mọi record và trường |

---

## 4. Gợi ý chuẩn bị Phase 2

1. **Replay là tính năng hạng nhất.** File `--inputs` cộng seed đã là một replay. Chuẩn hóa thành format chính thức để dùng cho debug, bug report, và sau này là ghost hay chia sẻ run.
2. **Property/fuzz testing.** Sinh input ngẫu nhiên theo seed, chạy hàng nghìn tick và kiểm tra các bất biến: không NaN, người chơi không ra ngoài map, số mote bảo toàn, không có Shade nào đứng trong safe radius.
3. **Cô lập số thực.** Nếu muốn determinism cross-runtime chặt hơn, cân nhắc bọc các hàm toán học (bảng sin/cos, hoặc fixed-point cho vị trí) hoặc ít nhất tập trung chúng vào một module `math.ts` để thay thế được sau này.
4. **Mở rộng nội dung có kiểm soát.** Khi thêm đêm 2, 3, loại Shade mới hay đèn mới, mỗi thứ phải có scenario + golden test đi kèm. Quy tắc: không thêm cơ chế nào mà không có scenario headless.
5. **Công cụ cân bằng.** Dùng headless chạy hàng loạt seed để thu số liệu như tỷ lệ thắng, thời gian thắp đèn đầu tiên, số lần bị đánh. Dựa vào đó chỉnh tuning trong contract thay vì cảm tính.
6. **Hiệu năng renderer.** Đặt ngân sách sớm cho Three.js: draw call, số đèn động (đèn lồng rất dễ gây tốn chi phí lighting, nên cân nhắc emissive + bloom hoặc light pool).
7. **Snapshot/restore state.** Cho phép tạo lại state từ snapshot để debug và để load scenario giữa chừng. Nó cũng là điểm kiểm chứng tốt rằng toàn bộ state, bao gồm cả trạng thái PRNG, đều được serialize.
8. **Quy trình thay đổi contract.** Mọi thay đổi `game.contract.json` hay schema JSONL phải tăng version và cập nhật golden file có chủ đích, không để test "tự xanh lại".

---

## 5. Kết luận

Phase 1 đã đặt đúng nền móng: core tách bạch, headless có contract rõ, và determinism được nghĩ tới ngay từ đầu. Với kiến trúc này, nhóm có thể mở rộng nội dung mà vẫn kiểm chứng được bằng máy. Tuy nhiên, "3/3 test pass" chỉ chứng minh luồng chính hoạt động, chưa chứng minh contract đã được khóa. Việc cần ưu tiên là mở rộng test biên và chứng minh determinism vượt ra ngoài một máy, một process.

**Phase 1: APPROVED (conditional, C1–C5).** Cho phép khởi động Phase 2, và C1–C5 phải đóng trước khi merge nội dung gameplay mới.