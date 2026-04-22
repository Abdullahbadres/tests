# Environment setup (one file per app)

## One env file per project folder

- Frontend: `frontend/.env` or `.env.local`
- Backend: `laravel-api-app/.env`

## Local defaults

- Frontend URL: `http://localhost:3000`
- Backend URL: **`http://localhost:8082`** (recommended; see 401 section below)

## Required local values

### Frontend (`frontend/.env` or `.env.local`)

- `NEXT_PUBLIC_API_URL=http://localhost:8082` — **do not mix** `localhost` in the browser with `127.0.0.1` in the API URL (see 401 troubleshooting).
- `NEXT_PUBLIC_APP_NAME="AI Sales Page Generator"`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Backend (`laravel-api-app/.env`)

- `APP_URL=http://localhost:8082` (same host style as `NEXT_PUBLIC_API_URL`)
- `FRONTEND_URL=http://localhost:3000,http://localhost:3001` (comma-separated; used for CORS allowed origins)
- `SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,localhost:3001,127.0.0.1:3001`

## Troubleshooting: 401 on `/api/user` or `/api/sales-pages`

Laravel is **not seeing a logged-in session** (cookie missing or not sent). This is usually **Sanctum SPA** host consistency, not a dashboard bug.

### Common causes

1. **Mixing `localhost` and `127.0.0.1`**  
   You open the app at `http://localhost:3000` but set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8082` (or the reverse). The browser treats those as **different hosts**; session cookies often **do not** attach to the other origin → **401**.  
   **Fix:** pick one style everywhere — e.g. all **`localhost`**: `NEXT_PUBLIC_API_URL=http://localhost:8082`, `APP_URL=http://localhost:8082`, run `php artisan serve --host=localhost --port=8082`, open the app at `http://localhost:3000`. Or use **`127.0.0.1` everywhere**, including the browser tab.

2. **Session expired / API restarted** — log in again at `/login`.

3. **`SESSION_DRIVER=database`** — ensure migrations ran and the `sessions` table exists.

4. **`Secure` cookies over HTTP** — do not set `SESSION_SECURE_COOKIE=true` while using plain `http://` locally.

### After changing `.env`

Restart **`php artisan serve`** and the Next dev server (`npm run dev`). In the browser, **log out** (if possible) or clear cookies for `localhost` / `127.0.0.1`, then **log in again**.

## Troubleshooting: CORS + 500 on the API

If the browser shows **CORS blocked** and **500** on `http://127.0.0.1:8082/api/...`, the usual cause is **PHP crashing** (e.g. missing **mbstring**) so Laravel never sends `Access-Control-Allow-Origin`. Fix PHP first, not CORS.

1. Run `php -m` and confirm **mbstring**, **openssl**, **pdo_sqlite** (or your DB driver) are listed.
2. If **mbstring** is missing: enable `extension=mbstring` in the **same** `php.ini` as `php --ini`, then restart `php artisan serve`.
3. You can start the API with `laravel-api-app\serve-dev.bat` (checks extensions before `artisan serve`).

## Registration / login data

If the API returned 500 before or SQLite was recreated, old users may be gone. Register again after the API runs cleanly; keep `database/database.sqlite` if you want to preserve local data.
