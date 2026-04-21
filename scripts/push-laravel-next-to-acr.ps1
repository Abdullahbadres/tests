#Requires -Version 5.1
#
# === ISOLASI DARI PROYEK PPIS (penting) ===
# - Container Apps test-backend / test-frontend di RG `test` telah DIHAPUS dari Azure
#   supaya tidak lagi memakai Managed Environment milik RG PPIS.
# - Proyek baru "test" yang independen: Azure Container Instances (ACI) `test-fe-be-pg`
#   (lihat infra/aci/test-isolated-stack.bicep) — tanpa resource di RG PPIS.
#
# Skrip ini sengaja tidak lagi menjalankan `az containerapp update` ke app apa pun.
# Untuk image Laravel/Next ke stack ACI, gunakan redeploy Bicep / `az container` setelah Anda
# menyesuaikan template multi-container (atau buat ACA environment BARU setelah kuota diizinkan).

$ErrorActionPreference = "Stop"

Write-Host @"

[BERHENTI] Skrip dinonaktifkan: tidak ada lagi Container Apps test-backend / test-frontend
(agar proyek baru tidak bergantung pada environment ACA di RG PPIS).

Stack terpisah saat ini: ACI — RG `test`, container group `test-fe-be-pg`
(definisi: infra/aci/test-isolated-stack.bicep).

"@ -ForegroundColor Yellow

exit 2
