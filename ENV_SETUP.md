# Environment Setup (Single File Policy)

## One environment file per project folder

- Frontend: `frontend/.env`
- Backend: `laravel-api-app/.env`

## Local defaults

- Frontend URL: `http://localhost:3000`
- Backend URL: **`http://localhost:8082`** (sangat disarankan; lihat bagian 401 di bawah)

## Required local values

### Frontend (`frontend/.env`)

- `NEXT_PUBLIC_API_URL=http://localhost:8082` (**jangan campur** `localhost` di browser dengan `127.0.0.1` di URL API — lihat troubleshooting 401)
- `NEXT_PUBLIC_APP_NAME="AI Sales Page Generator"`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Backend (`laravel-api-app/.env`)

- `APP_URL=http://localhost:8082` (harus sama host dengan `NEXT_PUBLIC_API_URL`)
- `FRONTEND_URL=http://localhost:3000,http://localhost:3001` (comma-separated; used for CORS allowed origins)
- `SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,localhost:3001,127.0.0.1:3001`

## Troubleshooting: 401 Unauthorized pada `/api/user` atau `/api/sales-pages`

Artinya Laravel **tidak melihat sesi login** (cookie tidak valid atau tidak ikut terkirim). Bukan bug di kode dashboard — **sesi Sanctum** untuk SPA harus konsisten.

### Penyebab umum

1. **Campur `localhost` dan `127.0.0.1`**  
   Buka app di `http://localhost:3000` tetapi `NEXT_PUBLIC_API_URL=http://127.0.0.1:8082` (atau sebaliknya). Browser memperlakukan itu sebagai **host berbeda**; cookie sesi API sering **tidak** ikut pada request ke origin yang lain → **401**.  
   **Perbaikan:** satu skema saja — misalnya **semua** pakai `localhost`: `NEXT_PUBLIC_API_URL=http://localhost:8082`, `APP_URL=http://localhost:8082`, jalankan `php artisan serve --host=localhost --port=8082`, dan buka frontend di `http://localhost:3000`. Atau **semua** `127.0.0.1` (termasuk tab browser ke `http://127.0.0.1:3000`).

2. **Sesi habis / server API di-restart** (tergantung `SESSION_DRIVER`) — login ulang di `/login`.

3. **Database session** — jika `SESSION_DRIVER=database`, pastikan migrasi sudah jalan dan tabel `sessions` ada.

4. **Cookie `Secure` di HTTP** — jangan set `SESSION_SECURE_COOKIE=true` jika masih `http://` lokal.

### Setelah mengubah `.env`

Restart **`php artisan serve`** dan dev server Next.js (`npm run dev`). Di browser: **logout** (jika ada) atau hapus cookie untuk `localhost` / `127.0.0.1`, lalu **login lagi**.

## Troubleshooting: CORS + 500 on API

If the browser shows **CORS blocked** and **500** on `http://127.0.0.1:8082/api/...`, the usual cause is **PHP crashing** (e.g. missing **mbstring**) so Laravel never sends `Access-Control-Allow-Origin`. Fix PHP first, not CORS.

1. In a terminal: `php -m` and confirm **mbstring**, **openssl**, **pdo_sqlite** appear.
2. If **mbstring** is missing: enable `extension=mbstring` in the **same** `php.ini` used by `php --ini`, then restart `php artisan serve`.
3. Start the API with `laravel-api-app\serve-dev.bat` (checks extensions before `artisan serve`).

## Akun register / login

Jika API pernah error 500 atau database SQLite diganti/di-migrate ulang, user lama bisa hilang. Daftar ulang setelah backend jalan tanpa error; pastikan `database/database.sqlite` tidak terhapus jika ingin data tetap ada.
