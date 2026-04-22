# AI Sales Page Generator — setup after clone

This repository contains a **Next.js** frontend (`frontend/`), a **Laravel** API (`laravel-api-app/`), **Azure** infrastructure (Bicep + PowerShell), and scripts to deploy to **Azure Container Instances (ACI)** with **Azure Database for PostgreSQL Flexible**.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `frontend/` | Next.js app (`standalone` output for Docker) |
| `laravel-api-app/` | Laravel API; `Dockerfile.postgres` for Azure PostgreSQL |
| `infra/aci/test-isolated-stack.bicep` | ACI group: backend `:8080`, frontend `:3000`, resource group `test` |
| `infra/container-apps/test-isolated-apps.bicep` | Optional Container Apps stack (separate managed environment) |
| `scripts/` | Build/push images, deploy ACI, full reset, etc. |
| `.azure/deployment-plan.md` | Architecture and deployment notes |

---

## After `git clone` — local setup

### Prerequisites

- **Node.js 20+** and **npm**
- **PHP 8.3+** and **Composer** (for Laravel without Docker)
- **Docker Desktop** (for image builds and the Azure DB migration script)
- **Azure CLI** (`az`) for cloud deploy

### 1. Laravel backend

```powershell
cd laravel-api-app
copy .env.example .env   # if present; otherwise create .env
composer install
php artisan key:generate
php artisan migrate
```

Point `.env` at your local database (SQLite / MySQL / Postgres, etc.).

### 2. Next.js frontend

```powershell
cd frontend
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to your API (e.g. `http://localhost:8000`).

### 3. Do **not** commit secrets

- `laravel-api-app/.env`, `frontend/.env.local`
- `.azure/test-deploy-secrets.local.txt` (Azure / DB / ACR credentials)

Example **lines** for `.azure/test-deploy-secrets.local.txt` (create manually):

```env
ACR_NAME=yourregistryname
POSTGRES_PASSWORD=***
POSTGRES_SERVER=shortServerNameWithoutSuffix
ACI_DNS_LABEL=yourAciDnsLabel
```

`POSTGRES_SERVER` is the hostname **before** `.postgres.database.azure.com` (see Azure Portal → PostgreSQL server).

---

## Build images for Azure

- **Backend:** `scripts/build-push-backend-acr.ps1` — builds `test-api:v1` from `Dockerfile.postgres`, `linux/amd64`.
- **Frontend:** `scripts/build-push-frontend-acr.ps1` — builds `test-web:v1` (or `FRONTEND_IMAGE_TAG` in secrets) with `NEXT_PUBLIC_API_URL` pointing at the public API URL, e.g. `http://<ACI_DNS_LABEL>.southeastasia.azurecontainer.io:8080`.

Before push: `az login`, `az acr login -n <ACR_NAME>`.

---

## Deploy to Azure (ACI) — primary path

The stack runs in resource group **`test`**.

```powershell
cd <repo-root>
powershell -ExecutionPolicy Bypass -File scripts\deploy-aci-from-acr.ps1
```

Requires: images `test-api:v1` and `test-web:<tag>` in ACR; `laravel-api-app\.env` contains `APP_KEY`; secrets file under `.azure\`.

**URLs after deploy**

- **Web (Next):** `http://<ACI_DNS_LABEL>.southeastasia.azurecontainer.io:3000/`
- **API (Laravel):** `http://<ACI_DNS_LABEL>.southeastasia.azurecontainer.io:8080/`

The frontend uses **port 3000** (not 80): the Node process runs as a non-root user and cannot bind to port 80 on Linux.

---

## Azure database — migrate and seed

On a machine with Docker (uses the API image from ACR + PostgreSQL env vars):

```powershell
powershell -ExecutionPolicy Bypass -File laravel-api-app\scripts\migrate-azure-postgres.ps1
```

This runs `php artisan migrate --force` and `php artisan db:seed --force` (including `SuperAdminSeeder`).

Default seeded admin (change in `database/seeders/SuperAdminSeeder.php` if needed):

| Field | Value |
|-------|--------|
| Email | `superadmin@mail.com` |
| Password | `administratorSuper.0` |

---

## PowerShell scripts (quick reference)

| Script | Purpose |
|--------|---------|
| `scripts/deploy-aci-from-acr.ps1` | Deploy / update ACI from ACR images |
| `scripts/build-push-backend-acr.ps1` | Build and push `test-api:v1` |
| `scripts/build-push-frontend-acr.ps1` | Build and push `test-web` |
| `scripts/rebuild-frontend-aci-only.ps1` | Rebuild frontend image and redeploy ACI |
| `scripts/full-reset-and-redeploy-test.ps1` | Remove ACI group (and optionally ACR repos), rebuild, redeploy |
| `scripts/deploy-container-apps-test.ps1` | Deploy optional Container Apps template (may fail if subscription allows only one environment) |
| `laravel-api-app/scripts/migrate-azure-postgres.ps1` | Migrate + seed against Azure PostgreSQL |

---

## Optional: Azure Container Apps

`infra/container-apps/test-isolated-apps.bicep` and `scripts/deploy-container-apps-test.ps1` provision a **new** managed environment in RG `test`. Some subscriptions allow only **one** Container Apps environment; deployment can fail until quota is raised or an existing environment is removed.

---

## Authentication (Sanctum + cookies)

- Backend env must set `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` to the SPA origin (`http://<fqdn>:3000`). The ACI template sets these.
- For HTTP, `SESSION_SECURE_COOKIE=false` is set in the ACI template.
- `401` on `/api/login` usually means wrong credentials for the **Azure** database the API uses, or the user row is missing — run migrate + seed above.

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Site unreachable / connection reset | Open **`:3000`** for the web app; in Azure Portal confirm `test-frontend` is **Running** |
| Nginx welcome page | Rebuild `test-web` from `frontend/Dockerfile`, push, redeploy |
| Login 401 | Verify users in Azure PostgreSQL; run seed; confirm session / HTTP vs HTTPS settings |

More detail: **`.azure/deployment-plan.md`** and **`ENV_SETUP.md`** (local env + 401 tips).

---

## License & contributors

Update as appropriate for your team.
