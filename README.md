# Văn Khoai — Portfolio Cinematic / Final Candidate (2026-11-04)

Website cá nhân hoàn thiện dựa trên concept Trục Sáng Tạo, không dùng framework hoặc bước build.

## Nội dung
1. Giới thiệu cá nhân và 3D trục xoắn điều khiển theo vị trí cuộn.
2. Kỹ thuật phần mềm, trải nghiệm sản phẩm, AI và tự động hóa.
3. FinLux và KT ADB Tool dùng ảnh giao diện thực tế (ảnh do chủ sở hữu cung cấp).
4. Smart Document Assistant và AI Meeting Assistant với minh họa được ghi rõ.
5. Sáu repository khác, tất cả liên kết public đã đối chiếu với GitHub.
6. Cách làm việc, liên hệ Email / GitHub và footer.

## Hiệu ứng
- Một lớp sky ngày/đêm cố định chạy xuyên suốt toàn trang, được điều khiển bằng normalized scroll tiến độ.
- 3D xoắn dựa trên Canvas, mảng polygon xếp theo chiều sâu, hạt sao và ánh sáng chạy quanh trục.
- Chuyển cảnh nội dung có cross-fade không tạo khoảng rỗng.
- Có chế độ giảm chuyển động; ảnh dự án zoom trong lightbox, hỗ trợ Escape.
- Trên màn hình nhỏ: layout 1 cột và ảnh thật không bị cắt.

## Chạy
Mở trực tiếp `index.html` bằng Chrome/Edge, hoặc từ thư mục project:

```sh
python -m http.server 8080
```

Mở `http://localhost:8080`. Không có dependencies cần cài. Font online có fallback tiếng Việt.

## Triển khai
Thư mục root của GitHub Pages dùng index.html, css/style.css, js/main.js và assets/*.webp.
Giữ nhánh `main` làm bản production, merge Pull Request sau khi đã xem thử.

## Ghi chú
Đừng xem hai minh họa cho Smart Document/AI Meeting như screenshot thật. Những hình ảnh dự án ở `assets/` là ảnh sản phẩm đã cung cấp và có thể thay khi cập nhật UI.