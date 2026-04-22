#Requires -Version 5.1
# Build Laravel (Dockerfile.postgres) and push to ACR in RG `test`.
# Prerequisites: Docker Desktop, az login, az acr login
# Secrets: .azure/test-deploy-secrets.local.txt — ACR_NAME

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$secretsPath = Join-Path $root ".azure\test-deploy-secrets.local.txt"
$apiDir = Join-Path $root "laravel-api-app"

if (-not (Test-Path $secretsPath)) { throw "Missing: $secretsPath" }
if (-not (Test-Path $apiDir)) { throw "Missing: $apiDir" }

$acrName = ""
Get-Content $secretsPath | ForEach-Object {
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
}
if (-not $acrName) { throw "ACR_NAME required in secrets file" }

$loginServer = "${acrName}.azurecr.io"
$image = "${loginServer}/test-api:v1"

Write-Host "Image target: $image"
Write-Host "Platform: linux/amd64"

az acr login -n $acrName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location $apiDir
try {
  docker build --platform linux/amd64 -f Dockerfile.postgres -t $image .
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  docker push $image
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}

Write-Host "Backend push complete."
