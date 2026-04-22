#Requires -Version 5.1
# Build Next.js (standalone) from frontend/ and push to ACR in RG `test`.
# Ensures test-web:* is your app image — nginx in the browser means wrong image or not built from this repo.
#
# Prerequisites: Docker Desktop, az login, az acr login -n <acr>
# Secrets: .azure/test-deploy-secrets.local.txt — ACR_NAME, ACI_DNS_LABEL (for NEXT_PUBLIC_API_URL)
# Optional: FRONTEND_IMAGE_TAG=v2 (default v1)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$secretsPath = Join-Path $root ".azure\test-deploy-secrets.local.txt"
$frontendDir = Join-Path $root "frontend"

if (-not (Test-Path $secretsPath)) { throw "Missing: $secretsPath" }
if (-not (Test-Path $frontendDir)) { throw "Missing folder: $frontendDir" }

$acrName = ""
$dns = ""
$tag = "v1"
Get-Content $secretsPath | ForEach-Object {
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
  if ($_ -match '^ACI_DNS_LABEL=(.+)$') { $dns = $Matches[1].Trim() }
  if ($_ -match '^FRONTEND_IMAGE_TAG=(.+)$') { $tag = $Matches[1].Trim() }
}
if (-not $acrName -or -not $dns) { throw "ACR_NAME and ACI_DNS_LABEL required in secrets file" }

$apiPublic = "http://${dns}.southeastasia.azurecontainer.io:8080"
$loginServer = "${acrName}.azurecr.io"
$image = "${loginServer}/test-web:${tag}"

Write-Host "Build arg NEXT_PUBLIC_API_URL = $apiPublic"
Write-Host "Image target: $image"
Write-Host "Platform: linux/amd64 (required for Azure ACI)"

az acr login -n $acrName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location $frontendDir
try {
  docker build `
    --platform linux/amd64 `
    --build-arg "NEXT_PUBLIC_API_URL=$apiPublic" `
    -t $image `
    -f Dockerfile `
    .
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  docker push $image
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}

Write-Host "`nPush complete. Run ACI deploy (image tag must match deploy script)."
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\deploy-aci-from-acr.ps1"
