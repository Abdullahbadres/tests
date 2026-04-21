# AI Sales Page Generator API - Deployment Notes

## Prasyarat Lokal

1. Install PHP 8.2+
2. Install Composer 2+
3. Jalankan:
   - `composer create-project laravel/laravel .`
   - `composer require laravel/sanctum openai-php/laravel`
   - `php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"`
   - `php artisan queue:table`
   - `php artisan migrate`

## Struktur Endpoint

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`
- `GET /api/sales-pages`
- `POST /api/sales-pages`
- `GET /api/sales-pages/{id}`
- `DELETE /api/sales-pages/{id}`
- `POST /api/sales-pages/{id}/generate`
- `PUT /api/sales-pages/{id}/regenerate-section`
- `GET /api/sales-pages/{id}/export`
- `PATCH /api/sales-pages/{id}/template`

## Railway

1. Push repo ke GitHub.
2. Railway -> New Project -> Deploy from GitHub.
3. Add MySQL plugin.
4. Isi env sesuai `.env.example`.
5. Start command:
   - `php artisan serve --host=0.0.0.0 --port=$PORT`
6. Procfile/worker command:
   - `php artisan queue:work --daemon`
7. Jalankan migration:
   - `php artisan migrate --force`

## Integrasi dengan Vercel Frontend

Set nilai berikut di Railway:

- `FRONTEND_URL=https://your-app.vercel.app`
- `SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app,localhost:3000`
- `SESSION_DOMAIN=.vercel.app`
