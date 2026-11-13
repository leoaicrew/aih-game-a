# Đợt 2 (AIH-24) — Sửa "nhoè + tối" + audio

## Nguyên nhân gốc (đã xác định bằng đo, không đoán)
1. **TỐI:** (a) bảng màu gốc gần đen (`#0b1020`, tile `#24314d`); (b) **lỗi thứ tự vẽ** — `addGradientBackground()` (gradient tối) được add **sau** ảnh nền SVG sáng, nên gradient đục phủ kín nền → màn hình tối.
2. **NHOÈ:** 11 tile SVG nhúng sẵn chữ số + 2 filter `feDropShadow` (blur) + mảng gloss trắng; khi 128px co xuống ô 74px thì filter blur làm mờ, lại cộng thêm nhãn số engine vẽ đè → trùng số/nhoè.
3. **AUDIO "u u":** nhạc tự sinh dùng 3 osc triangle dài 0.62s chồng nhau + bell, tạo tiếng ù đục.

## Đã sửa
- Bảng màu sáng: nền `#4f7fd6 → #8fd0ef` (daylight sky), tile 2..2048 gradient tươi, vẫn giữ accent cyan `#22d3ee` + gold `#ffd45e`.
- Sửa thứ tự vẽ: gradient làm lớp dự phòng **trước**, ảnh nền SVG sáng **sau**.
- Tile dựng lại: viền sắc 3px, bỏ toàn bộ filter blur, bỏ chữ số nhúng trong SVG (engine vẽ số duy nhất). Load ở 2x (256px) cho màn retina.
- Nhạc: thay drone bằng arpeggio pluck ngắn (marimba/bell, C–Am–F–G), mỗi nốt tự tắt, không chồng thành ù.

## Số đo trước/sau (dựng lại board 480x800 bằng rasterizer resvg, không phải ảnh chụp trình duyệt)
| Chỉ số | Trước | Sau | Thay đổi |
|---|---|---|---|
| Độ sáng TB (avg luminance) | 0.054 | 0.302 | +5.6x |
| Tương phản (RMS contrast) | 0.104 | 0.181 | +75% |
| Độ sắc nét (edge gradient, proxy cho blur) | 0.0106 | 0.0309 | +2.9x |
| Blur filter trong tile SVG | 2/tile | 0 | -100% |

Ảnh: `board-before.png`, `board-after.png`.

> **Chưa kiểm chứng:** thẩm mỹ bằng mắt người và ảnh chụp trình duyệt thật (môi trường này thiếu lib hệ thống để chạy headless Chromium). Số đo là từ rasterizer SVG + dựng board tĩnh; cần Chủ tịch/QA mở link nhìn xác nhận.

## Ràng buộc giữ nguyên
- 53/53 test pass (cập nhật UI01/UI02/UI03 theo bảng màu mới + thêm test chống blur filter & số nhúng).
- Scale.FIT 480x800, 0đ, asset CC0/tự tạo, không bật kiếm tiền.
