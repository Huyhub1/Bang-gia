# 🦖 ARK Mobile — Bảng Giá Dino

Web bảng giá chính thức cho server ARK Mobile. Deploy lên **Vercel** miễn phí.

---

## 🚀 Hướng Dẫn Deploy Lên Vercel

### Bước 1 — Cài đặt & chạy local

```bash
cd banggia
npm install
npm run dev
# Mở: http://localhost:3000
# Admin: http://localhost:3000/admin  (mật khẩu: arkserver2024)
```

### Bước 2 — Đổi mật khẩu Admin

Mở file `.env.local` và thay đổi:
```
ADMIN_PASSWORD=mat-khau-moi-cua-ban
ADMIN_SECRET=chuoi-bi-mat-bat-ky
NEXT_PUBLIC_SERVER_NAME=Tên Server Của Bạn
NEXT_PUBLIC_SERVER_DISCORD=https://discord.gg/link-discord
```

### Bước 3 — Push lên GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/ten-ban/ark-banggia.git
git push -u origin main
```

### Bước 4 — Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com) → **New Project** → Import repo
2. Trong **Environment Variables**, thêm:
   - `ADMIN_PASSWORD` = mật khẩu admin
   - `ADMIN_SECRET`   = chuỗi bí mật bất kỳ
   - `NEXT_PUBLIC_SERVER_NAME`    = tên server
   - `NEXT_PUBLIC_SERVER_DISCORD` = link discord
   - `NEXT_PUBLIC_SERVER_CONTACT` = thông tin liên hệ
3. Click **Deploy** → Done!

### Bước 5 — Bật Lưu Data Vĩnh Viễn (Vercel KV)

> ⚠️ **Quan trọng:** Không có KV, data sẽ reset sau mỗi lần deploy!

1. Vào **Vercel Dashboard** → tab **Storage**
2. Click **Create Database** → chọn **KV**
3. Tên: `ark-banggia-kv` → Create
4. Tab **`.env.local`** → Copy 2 biến: `KV_REST_API_URL` và `KV_REST_API_TOKEN`
5. Thêm 2 biến này vào **Environment Variables** của project
6. **Redeploy** project

---

## 📋 Tính Năng

### Trang Chủ (Public)
- Hiển thị bảng giá Dino dạng thẻ (card grid)
- Lọc theo loại: Ăn thịt, Ăn cỏ, Bay, Dưới nước, Boss, Hỗ trợ
- Tìm kiếm theo tên
- Hiển thị trạng thái: Còn hàng / Hết hàng
- Dino nổi bật (featured) hiển thị banner HOT

### Trang Admin (`/admin`)
- Đăng nhập bảo mật bằng mật khẩu
- Dashboard thống kê (tổng dino, còn hàng, hết hàng, nổi bật)
- **Thêm dino mới**: nhập tên, loại, level, giá, đơn vị, ảnh (URL), mô tả
- **Xem trước ảnh** real-time ngay khi nhập URL
- **Sửa dino** qua modal popup
- **Xoá dino** có xác nhận
- **Bật/tắt còn hàng** ngay trên bảng (toggle switch)
- Tìm kiếm trong danh sách

---

## 🗂️ Cấu Trúc File

```
banggia/
├── src/
│   ├── lib/
│   │   ├── storage.js      ← Xử lý lưu data (KV hoặc memory)
│   │   └── auth.js         ← Xác thực admin
│   └── app/
│       ├── layout.jsx      ← Root layout + fonts + SEO
│       ├── page.jsx        ← Trang bảng giá (public)
│       ├── globals.css     ← Toàn bộ CSS
│       ├── admin/
│       │   └── page.jsx    ← Trang admin (protected)
│       └── api/
│           ├── auth/route.js           ← POST login
│           ├── dinos/route.js          ← GET all, POST new
│           └── dinos/[id]/route.js     ← PUT, DELETE
├── .env.local              ← Biến môi trường (KHÔNG push lên git!)
├── vercel.json             ← Cấu hình Vercel
└── package.json
```

---

## 💡 Mẹo Sử Dụng

**Link ảnh dino**: Lấy từ [ARK Wiki](https://ark.wiki.gg/wiki/ARK_Survival_Evolved_Wiki) hoặc Google Images, chuột phải → Copy image address.

**Đơn vị tiền**: Có sẵn: Element, Element Shard, Crystal, Gold Coin, Diamond, Amber.

**Level**: Để trống nếu không cần hiển thị level.
