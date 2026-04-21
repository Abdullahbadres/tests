# Vercel Environment Variables (Frontend)

Set these keys in **Vercel -> Project Settings -> Environment Variables** for your `frontend` app.

## Production

- `NEXT_PUBLIC_API_URL` = `https://YOUR-LARAVEL-DOMAIN`
- `NEXT_PUBLIC_APP_NAME` = `AI Sales Page Generator`
- `NEXT_PUBLIC_APP_URL` = `https://YOUR-VERCEL-DOMAIN`

## Preview (recommended same as production unless needed)

- `NEXT_PUBLIC_API_URL` = `https://YOUR-LARAVEL-DOMAIN`
- `NEXT_PUBLIC_APP_NAME` = `AI Sales Page Generator`
- `NEXT_PUBLIC_APP_URL` = `https://YOUR-VERCEL-DOMAIN`

## Development (optional in Vercel)

- `NEXT_PUBLIC_API_URL` = `http://127.0.0.1:8082`
- `NEXT_PUBLIC_APP_NAME` = `AI Sales Page Generator`
- `NEXT_PUBLIC_APP_URL` = `http://localhost:3000`

## Notes

- Replace `YOUR-LARAVEL-DOMAIN` with your deployed Laravel API URL (Railway/Render).
- Replace `YOUR-VERCEL-DOMAIN` with your frontend domain, e.g. `your-app.vercel.app`.
- After updating vars, redeploy Vercel project.

## Backend values you must also update (Laravel `.env`)

When frontend is on Vercel, set these in `laravel-api-app/.env` on your backend host:

- `FRONTEND_URL=https://YOUR-VERCEL-DOMAIN`
- `SANCTUM_STATEFUL_DOMAINS=YOUR-VERCEL-DOMAIN,localhost:3000,127.0.0.1:3000,localhost:3001,127.0.0.1:3001`
- `SESSION_DOMAIN=.vercel.app` (for production on Vercel domain)
