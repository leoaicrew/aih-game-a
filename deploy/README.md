# Hướng dẫn phát hành Game A (web tĩnh, hosting MIỄN PHÍ)

Bản build là site tĩnh trong `dist/`. `vite.config.js` dùng `base: './'` nên **cùng một
`dist/` chạy được** ở domain gốc lẫn subpath GitHub Pages. Không cần build lại theo host.

Chi phí: **0đ**. Không thu dữ liệu cá nhân. Quảng cáo tắt (stub).

---

## Cách 1 — GitHub Pages (khuyến nghị, có sẵn workflow)

Lệnh build/chạy thử ở máy:
```bash
npm ci --include=dev
npm test          # phải 30/30 pass
npm run build     # tạo dist/
npm run preview   # xem tại http://localhost:4173
```

Deploy bằng **1 click** (sau khi người thật bật Pages 1 lần):
1. Người thật: đưa repo lên GitHub (public), vào **Settings → Pages → Source = "GitHub Actions"**.
2. Người thật: tab **Actions → "Deploy Game A to GitHub Pages" → Run workflow**.
3. Workflow tự chạy test → build → deploy. Xong có URL.

URL dự kiến: `https://<tài-khoản>.github.io/<tên-repo>/`

> Workflow chỉ có `workflow_dispatch` (bấm tay) — **không tự phát hành khi push**.

Workflow: [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)

## Cách 2 — Cloudflare Pages (deploy 1 click sau khi nối Git)

Người thật: Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
chọn repo → điền build command/publish dir theo
[`deploy/cloudflare-pages.toml`](./cloudflare-pages.toml) → **Save and Deploy**.

- Build command: `npm ci --include=dev && npm test && npm run build`
- Output dir: `dist`
- URL dự kiến: `https://<tên-dự-án>.pages.dev/`

## Cách 3 — Upload thủ công (không CI)

Sau `npm run build`, kéo-thả thư mục `dist/` vào Netlify Drop
(https://app.netlify.com/drop) hoặc Cloudflare Pages "Direct Upload".

---

## Việc cần NGƯỜI THẬT làm (agent KHÔNG tự làm)
- [ ] Tạo tài khoản GitHub và/hoặc Cloudflare (miễn phí).
- [ ] Tạo repo/push mã nguồn (nếu chưa có nơi lưu từ xa).
- [ ] Bật Pages (Settings → Pages → Source = GitHub Actions) — 1 lần.
- [ ] Bấm **Run workflow** / **Save and Deploy** để phát hành.
- [ ] (Tuỳ chọn) Gắn tên miền riêng — CÓ THỂ TỐN TIỀN, phải xin duyệt riêng.

## Checklist trước ra mắt
- [x] `npm test` → 30/30 pass.
- [x] `npm run build` OK; `dist/` đủ HTML + JS + 10 SVG + CREDITS.
- [x] Không lỗi cú pháp JS trong bundle (`node --check`).
- [x] Không gọi mạng ngoài / không CDN / không thu dữ liệu cá nhân.
- [x] Asset URL tương đối (`./assets/...`) → chạy được ở subpath.
- [x] CREDITS ghi giấy phép (Phaser MIT, Vite MIT, icon nội bộ CC0, audio tự tổng hợp).
- [x] Quảng cáo tắt (stub).
- [x] Header bảo mật tĩnh (`public/_headers`, áp dụng trên Cloudflare Pages).
- [ ] Kiểm trình duyệt thật trên môi trường có màn hình (sandbox CI không có thư viện
      đồ họa → xem mục "Vướng mắc" trong báo cáo). Chạy `npm run preview` rồi mở local.
- [ ] (Sau deploy) Mở URL thật, bấm Play, chơi vài nước, xác nhận không lỗi console.
