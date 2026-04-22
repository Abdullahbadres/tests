#Requires -Version 5.1
# Remove the test stack from local Docker + Azure (RG `test` only), then rebuild and redeploy ACI.
# Does NOT delete: PostgreSQL Flexible server, ACR registry resource (only optional image repositories).
#
# Removes:
#   - ACI container group: test-fe-be-pg (Azure)
#   - (Optional) test-api & test-web repositories in your test ACR
#   - Local Docker images pointing at your test ACR
#
# Then: build backend + frontend, push to ACR, run deploy-aci-from-acr.ps1

param(
  [switch] $SkipDeleteAcrRepositories
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$root = Split-Path $here -Parent
$secretsPath = Join-Path $root ".azure\test-deploy-secrets.local.txt"

if (-not (Test-Path $secretsPath)) { throw "Missing: $secretsPath" }

$acrName = ""
$tag = "v1"
Get-Content $secretsPath | ForEach-Object {
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
  if ($_ -match '^FRONTEND_IMAGE_TAG=(.+)$') { $tag = $Matches[1].Trim() }
}
if (-not $acrName) { throw "ACR_NAME required in secrets file" }

$loginServer = "${acrName}.azurecr.io"
$imgApi = "${loginServer}/test-api:v1"
$imgWeb = "${loginServer}/test-web:${tag}"

Write-Host "=== 1. Azure: delete ACI container group (test-fe-be-pg, RG test) ==="
az container show -g test -n test-fe-be-pg -o none 2>$null
if ($LASTEXITCODE -eq 0) {
  az container delete --resource-group test --name test-fe-be-pg --yes
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Container group deleted."
} else {
  Write-Host "No test-fe-be-pg (already deleted or never created)."
}

if (-not $SkipDeleteAcrRepositories) {
  Write-Host "=== 2. Azure: delete test-api & test-web repositories in ACR $acrName ==="
  az acr repository delete -n $acrName --repository test-api -y 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "  (test-api missing or delete skipped — continuing)" }
  az acr repository delete -n $acrName --repository test-web -y 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "  (test-web missing or delete skipped — continuing)" }
  Write-Host "ACR repositories cleared (will be repopulated on push)."
} else {
  Write-Host "=== 2. Skipping ACR repository delete (-SkipDeleteAcrRepositories) ==="
}

Write-Host "=== 3. Local Docker: remove test-api / test-web images (if any) ==="
docker rmi $imgApi -f 2>$null
docker rmi $imgWeb -f 2>$null
docker image prune -f 2>$null
Write-Host "Done (ignore 'No such image' errors)."

Write-Host "=== 4. Build & push backend ==="
& (Join-Path $here "build-push-backend-acr.ps1")
if (-not $?) { exit 1 }

Write-Host "=== 5. Build & push frontend ==="
& (Join-Path $here "build-push-frontend-acr.ps1")
if (-not $?) { exit 1 }

Write-Host "=== 6. Deploy ACI (RG test) ==="
& (Join-Path $here "deploy-aci-from-acr.ps1")
if (-not $?) { exit 1 }

Write-Host ""
Write-Host "Full reset complete. PostgreSQL Flexible and ACR registry still exist; DB data not dropped."
Write-Host "Migrate DB if needed: laravel-api-app\scripts\migrate-azure-postgres.ps1"
