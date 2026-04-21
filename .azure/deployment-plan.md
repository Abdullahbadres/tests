# Deployment plan — AI Sales (frontend + backend + database)

**Status:** Ready for Validation  
**Mode:** MODIFY  
**Target utama:** **Azure Container Apps** (satu environment, dua aplikasi: Next.js + Laravel) + **Azure SQL** (sudah ada di subscription Anda)

## Ringkasan arsitektur

| Komponen | Path repo | Image Docker | Catatan |
|----------|------------|---------------|---------|
| Backend API | `laravel-api-app/` | `Dockerfile.aca` | PHP 8.3 + `pdo_sqlsrv` + MySQL ext; `PORT` 8080; `DB_CONNECTION=sqlsrv` |
| Frontend | `frontend/` | `Dockerfile` | Next.js **standalone**; `NEXT_PUBLIC_API_URL` idealnya di-set saat **docker build** (`--build-arg`) |
| Database | — | — | **Azure SQL** (parameter `sqlServerFqdn`, dll.). Bukan container di ACA. |

Infra-as-code: `infra/container-apps/main.bicep`  
Skrip bantu: `scripts/deploy-container-apps.ps1`

## Prasyarat

1. `az login` + subscription yang benar  
2. **Azure Container Registry** (disarankan) — push image backend & frontend  
3. **Azure SQL**: firewall mengizinkan akses dari Container Apps (sering pakai opsi *Allow Azure services* pada SQL, atau aturan firewall ke subnet/outbound—sesuaikan kebijakan Anda)  
4. **Build-arg frontend**: setelah Anda tahu URL API publik, build image web dengan:

   `docker build --build-arg NEXT_PUBLIC_API_URL=https://<prefix>-api.<defaultDomain> -t <acr>/web:v1 --platform linux/amd64 frontend`

   URL `https://<prefix>-api.<...>` bisa Anda duga dari output deployment (`defaultDomain`) + nama app `namePrefix-api`, atau dari output `backendUrl` setelah deploy pertama.

## Deploy infra (PowerShell)

```powershell
cd "C:\Users\F36\Documents\test"
.\scripts\deploy-container-apps.ps1 `
  -ResourceGroup "rg-aisales" `
  -NamePrefix "aisales" `
  -BackendImage "YOURACR.azurecr.io/aisales-api:v1" `
  -FrontendImage "YOURACR.azurecr.io/aisales-web:v1" `
  -SqlServerFqdn "YOURSERVER.database.windows.net" `
  -SqlDatabaseName "YOURDB" `
  -SqlAdminUsername "YOURUSER" `
  -SqlAdminPassword (Read-Host -AsSecureString) `
  -AppKey "base64:..." `
  -AcrLoginServer "YOURACR.azurecr.io" `
  -AcrUsername "YOURACR" `
  -AcrPassword (Read-Host -AsSecureString)
```

Parameter `-OpenAiApiKey` opsional (string biasa di skrip; untuk produksi pertimbangkan Key Vault + secretRef nanti).

## Setelah deploy

1. `az deployment group show` / Portal → lihat **output** `backendUrl`, `frontendUrl`  
2. Migrasi: dari mesin yang boleh ke SQL jalankan `php artisan migrate --force`, atau gunakan **revision command** / job sekali jalan  
3. Pastikan `config/cors.php` mengizinkan origin frontend ACA  
4. Jika browser masih memanggil API salah: **rebuild image frontend** dengan `--build-arg NEXT_PUBLIC_API_URL=...` lalu push tag baru + update revision image

## Catatan App Service (lama)

File `infra/azure-laravel-webapp.bicep` + `laravel-api-app/scripts/azure-quick-deploy.ps1` tetap ada untuk opsi **App Service** PHP; tidak wajib dipakai jika Anda full ACA.

## Jika database Anda MySQL (bukan Azure SQL)

Ubah env di `main.bicep` (atau override lewat Portal) menjadi `DB_CONNECTION=mysql` dan host/user Azure MySQL; image backend bisa pakai `Dockerfile` lama yang ada `pdo_pgsql` atau sesuaikan `Dockerfile.aca` (sudah ada `pdo_mysql`).

---

## Kebijakan isolasi dari proyek PPIS (wajib dipahami)

- **Tidak ada** frontend/backend/database/API proyek **baru** (`test`) yang boleh bergantung pada resource di **RG PPIS** atau Managed Environment ACA milik PPIS.
- Container Apps **`test-backend`** dan **`test-frontend`** di RG `test` (yang sebelumnya memakai environment PPIS) telah **dihapus** dari Azure agar tidak lagi berbagi environment dengan PPIS.
- Stack proyek **baru** yang independen: **Azure Container Instances (ACI)** — resource group **`test`**, container group **`test-fe-be-pg`**, definisi `infra/aci/test-isolated-stack.bicep`. **Dua** container: **`test-backend`**, **`test-frontend`** (image dari ACR Anda). **Database persisten**: **Azure Database for PostgreSQL Flexible** di RG `test` — **bukan** Postgres di dalam ACI. Nama server tidak di-hardcode di repo; isi **`POSTGRES_SERVER`** (nama pendek) + **`POSTGRES_PASSWORD`** + **`ACR_NAME`** + **`ACI_DNS_LABEL`** di `.azure/test-deploy-secrets.local.txt`; skrip deploy mengisi parameter `managedPostgresFqdn` saat `az deployment`.
- Skrip `scripts/push-laravel-next-to-acr.ps1` **dinonaktifkan** (exit 2) agar tidak ada yang tidak sengaja men-deploy ke Container Apps lama.

**ACI singkat:** satu IP/DNS publik untuk grup; port **80** → frontend, **8080** → backend. **Database:** FQDN = `{POSTGRES_SERVER}.postgres.database.azure.com`, `DB_SSLMODE=require`, user/db `laravel` / `pgadmin` — password di secrets file (`POSTGRES_PASSWORD`).
