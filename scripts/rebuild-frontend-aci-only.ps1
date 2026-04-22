#Requires -Version 5.1
# Rebuild and push the Next.js frontend image to ACR, then redeploy ACI for the test stack.
# Only touches resource group `test`.
#
# ACI note: frontend and backend share one container group (test-fe-be-pg).
# There is no API to delete only the frontend — the template update refreshes the group (same backend image unless you rebuild test-api too).
#
# Order: build-push-frontend-acr.ps1 -> deploy-aci-from-acr.ps1 (nonce forces image re-pull).

param(
  [switch] $DeleteLocalImage,
  [switch] $DeleteAciGroupFirst
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
$img = "${loginServer}/test-web:${tag}"

if ($DeleteLocalImage) {
  Write-Host "Removing local image (if any): $img"
  docker rmi $img -f 2>$null
}

if ($DeleteAciGroupFirst) {
  Write-Host "Deleting ACI group test-fe-be-pg in RG test (API will be down briefly)..."
  az container delete --resource-group test --name test-fe-be-pg --yes
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "=== 1/2 Build & push frontend to ACR ==="
& (Join-Path $here "build-push-frontend-acr.ps1")
if (-not $?) { exit 1 }

Write-Host "=== 2/2 Deploy ACI (RG test only) ==="
& (Join-Path $here "deploy-aci-from-acr.ps1")
if (-not $?) { exit 1 }

Write-Host "`nDone. Open the web URL (incognito if old cache)."
