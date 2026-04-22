# AI Sales Page Generator API — deployment notes

## Local prerequisites

1. PHP 8.2+
2. Composer 2+
3. Run:
   - `composer create-project laravel/laravel .`
   - `composer require laravel/sanctum openai-php/laravel`
   - `php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"`
   - `php artisan queue:table`
   - `php artisan migrate`

## API endpoints

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

1. Push the repo to GitHub.
2. Railway → New Project → Deploy from GitHub.
3. Add the MySQL plugin.
4. Fill env vars from `.env.example`.
5. Start command:
   - `php artisan serve --host=0.0.0.0 --port=$PORT`
6. Worker / Procfile:
   - `php artisan queue:work --daemon`
7. Run migrations:
   - `php artisan migrate --force`

## Vercel frontend integration

Set these on Railway:

- `FRONTEND_URL=https://your-app.vercel.app`
- `SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app,localhost:3000`
- `SESSION_DOMAIN=.vercel.app`
