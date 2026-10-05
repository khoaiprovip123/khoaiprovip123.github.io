# VK — Digital Atelier (Bilingual)

Bright, modern, bilingual personal portfolio for **Van Khoai / @khoaiprovip123**.

## Features
- Vietnamese / English language switch with localStorage persistence.
- Bright editorial design with distinct art direction per project.
- Smooth scrolling via Lenis and scroll-linked motion via GSAP ScrollTrigger.
- Per-project transitions: phone fan, desktop console perspective, document fragments, audio waveform / transcript scene.
- Responsive and `prefers-reduced-motion` aware.
- GitHub Pages ready; no build step required.

## Featured projects
- FinLux
- KT ADB Tool Pro
- Smart Document Assistant
- AI Meeting Assistant

## Run locally
```bash
python -m http.server 8080
```
Open `http://localhost:8080`.

## Deploy to GitHub Pages
Upload the files to the root of a public repository, then enable GitHub Pages from the repository settings.

## Transition Edition

Bản này giữ nguyên layout và nội dung của **VK Digital Atelier — Bilingual** và chỉ tăng cường motion/transition:

- Hero reveal có depth + blur nhẹ.
- Chuyển cảnh giữa các project theo 4 phong cách khác nhau: warm light, technical lens, page-light, aurora wave.
- Ambient light đổi màu theo project đang xem.
- Project title dùng clip reveal, visual dùng blur-to-focus + parallax.
- Scene index line, feature cards, repo list, About và Contact đều có motion riêng.
- Active navigation tự cập nhật theo section.
- Chuyển ngôn ngữ VI/EN dùng View Transition API khi trình duyệt hỗ trợ.
- Giữ `prefers-reduced-motion` để giảm animation khi người dùng yêu cầu.
