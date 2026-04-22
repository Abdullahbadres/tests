# Deployment plan — AI Sales (frontend + backend + database)

**Primary path today:** **Azure Container Instances (ACI)** in resource group **`test`**, with **Azure Database for PostgreSQL Flexible**.

---

## Architecture (ACI)

| Component | Repo path | Docker image | Notes |
|-----------|-----------|--------------|--------|
| Backend API | `laravel-api-app/` | `Dockerfile.postgres` | PHP 8.3 + `pdo_pgsql`; `PORT` 8080; `DB_CONNECTION=pgsql` |
| Frontend | `frontend/` | `Dockerfile` | Next.js **standalone**; set `NEXT_PUBLIC_API_URL` at **docker build** (`--build-arg`) |
| Database | — | — | **Azure PostgreSQL Flexible** (managed). Not Postgres inside ACI |

IaC: `infra/aci/test-isolated-stack.bicep`  
Deploy: `scripts/deploy-aci-from-acr.ps1`

---

## Secrets (local only — do not commit)

Create **`.azure/test-deploy-secrets.local.txt`** (one variable per line):

- `ACR_NAME` — Azure Container Registry name in RG `test`
- `POSTGRES_PASSWORD` — PostgreSQL admin password
- `POSTGRES_SERVER` — short server name (without `.postgres.database.azure.com`)
- `ACI_DNS_LABEL` — DNS label for the ACI public FQDN

The deploy script derives `managedPostgresFqdn` from `POSTGRES_SERVER`.

---

## Prerequisites

1. `az login` and the correct subscription  
2. **Azure Container Registry** — push `test-api:v1` and `test-web:<tag>`  
3. **PostgreSQL firewall** — allow access from ACI / your IP as needed (often a temporary `0.0.0.0` rule for dev; tighten for production)  
4. **Frontend build-arg:** after you know the public API URL, build the web image with:

   `docker build --build-arg NEXT_PUBLIC_API_URL=http://<ACI_DNS_LABEL>.southeastasia.azurecontainer.io:8080 -t <acr>.azurecr.io/test-web:v1 --platform linux/amd64 frontend`

---

## Deploy ACI (PowerShell)

```powershell
cd <repo-root>
powershell -ExecutionPolicy Bypass -File scripts\deploy-aci-from-acr.ps1
```

Requires `laravel-api-app\.env` with `APP_KEY` and the secrets file above.

**Public URLs**

- API: `http://<ACI_DNS_LABEL>.southeastasia.azurecontainer.io:8080/`
- Web: `http://<ACI_DNS_LABEL>.southeastasia.azurecontainer.io:3000/` (frontend listens on **3000**)

---

## After deploy

1. In Azure Portal or `az deployment group show`, confirm the container group is **Running**.  
2. Run migrations + seed against PostgreSQL (from a machine with Docker):

   `powershell -ExecutionPolicy Bypass -File laravel-api-app\scripts\migrate-azure-postgres.ps1`

3. Ensure `config/cors.php` allows the frontend origin (`FRONTEND_URL` is set by the ACI template).  
4. If the SPA still calls the wrong API URL, **rebuild** the frontend image with the correct `--build-arg NEXT_PUBLIC_API_URL`, push, and redeploy ACI.

---

## Optional: Azure Container Apps

- `infra/container-apps/test-isolated-apps.bicep` + `scripts/deploy-container-apps-test.ps1` create a **new** managed environment in RG `test`.  
- Some subscriptions allow only **one** Container Apps environment; the deployment may fail until quota is increased.

---

## Legacy / alternate templates

- **`infra/container-apps/main.bicep`** — older ACA + **Azure SQL** pattern (`scripts/deploy-container-apps.ps1`).  
- **`infra/azure-laravel-webapp.bicep`** + **`laravel-api-app/scripts/azure-quick-deploy.ps1`** — App Service (PHP) option.

---

## Disabled script

- **`scripts/push-laravel-next-to-acr.ps1`** exits with code **2**: it is a legacy placeholder. Use **`scripts/deploy-aci-from-acr.ps1`** and the build scripts under `scripts/` instead.

---

## MySQL instead of Azure SQL (ACA template only)

If you use `main.bicep` with MySQL, change env to `DB_CONNECTION=mysql` and the Azure MySQL host/user; align the backend Dockerfile with `pdo_mysql` as needed.
