#Requires -Version 5.1
# Deploy Laravel + Next.js to Azure Container Apps in RG `test` (new managed environment in this RG).
# After deploy you get stable HTTPS URLs — rebuild the frontend image with the same NEXT_PUBLIC_API_URL
# (axios in the browser uses build-time values; Container App env alone is not enough for the client bundle).
#
# Prerequisites: az login; test-api:v1 & test-web:v1 (or other tag) already in ACR;
#                 .azure/test-deploy-secrets.local.txt + laravel-api-app/.env (APP_KEY).
# Optional secrets: ACA_NAME_PREFIX=testca (default), FRONTEND_IMAGE_TAG=v1
#
# Quota: if creating the managed environment fails (subscription limit), request a quota increase
#        for "Container Apps" or use another region.

param(
  [switch] $SkipDocker,
  [switch] $DeleteAciAfter
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$secretsPath = Join-Path $root ".azure\test-deploy-secrets.local.txt"
$envPath = Join-Path $root "laravel-api-app\.env"
$bicep = Join-Path $root "infra\container-apps\test-isolated-apps.bicep"
$frontendDir = Join-Path $root "frontend"

if (-not (Test-Path $secretsPath)) { throw "Missing: $secretsPath" }
if (-not (Test-Path $envPath)) { throw "Missing: $envPath" }
if (-not (Test-Path $bicep)) { throw "Missing: $bicep" }

$acrName = ""
$pgPass = ""
$pgServer = ""
$namePrefix = "testca"
$frontendTag = "v1"
Get-Content $secretsPath | ForEach-Object {
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
  if ($_ -match '^POSTGRES_PASSWORD=(.+)$') { $pgPass = $Matches[1].Trim() }
  if ($_ -match '^POSTGRES_SERVER=(.+)$') { $pgServer = $Matches[1].Trim() }
  if ($_ -match '^ACA_NAME_PREFIX=(.+)$') { $namePrefix = $Matches[1].Trim() }
  if ($_ -match '^FRONTEND_IMAGE_TAG=(.+)$') { $frontendTag = $Matches[1].Trim() }
}
if (-not $acrName -or -not $pgPass -or -not $pgServer) {
  throw "Secrets file must define ACR_NAME, POSTGRES_PASSWORD, POSTGRES_SERVER"
}
$pgFqdn = "${pgServer}.postgres.database.azure.com"

$appKey = ""
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^APP_KEY=(.+)$') { $appKey = $Matches[1].Trim().Trim('"') }
}
if (-not $appKey) { throw 'APP_KEY not found in laravel-api-app\.env' }

$loginServer = "${acrName}.azurecr.io"
$acrUser = az acr credential show -n $acrName -g test --query username -o tsv
$acrPass = az acr credential show -n $acrName -g test --query "passwords[0].value" -o tsv

$backendImage = "${loginServer}/test-api:v1"
$frontendImage = "${loginServer}/test-web:${frontendTag}"

$dep = 'aca-test-' + (Get-Date -Format 'yyyyMMddHHmmss')
Write-Host "Deployment: $dep"
Write-Host "  namePrefix: $namePrefix"
Write-Host "  backend:  $backendImage"
Write-Host "  frontend: $frontendImage (will rebuild after API URL is known if Docker is available)"

$paramObj = [ordered]@{
  namePrefix           = @{ value = $namePrefix }
  managedPostgresFqdn  = @{ value = $pgFqdn }
  useAcr               = @{ value = $true }
  acrLoginServer       = @{ value = $loginServer }
  acrUsername          = @{ value = $acrUser }
  acrPassword          = @{ value = $acrPass }
  backendImage         = @{ value = $backendImage }
  frontendImage        = @{ value = $frontendImage }
  laravelDbPassword    = @{ value = $pgPass }
  laravelAppKey        = @{ value = $appKey }
}
$armParams = @{
  '$schema'      = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'
  contentVersion = '1.0.0.0'
  parameters     = $paramObj
}
$tmp = [System.IO.Path]::GetTempFileName() + '.json'
($armParams | ConvertTo-Json -Depth 10) | Set-Content -Path $tmp -Encoding utf8

az deployment group create --resource-group test --name $dep --template-file $bicep --parameters "@$tmp" --verbose
$deployExit = $LASTEXITCODE
Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
if ($deployExit -ne 0) { exit $deployExit }

$out = az deployment group show -g test -n $dep --query properties.outputs -o json | ConvertFrom-Json
$backendUrl = $out.backendUrl.value
$frontendUrl = $out.frontendUrl.value
$frontendApp = $out.frontendAppNameOut.value

Write-Host "`nContainer Apps deployment finished."
Write-Host "  Backend:  $backendUrl"
Write-Host "  Frontend: $frontendUrl"
Write-Host ""
Write-Host "Important: the Next.js client bundle needs NEXT_PUBLIC_API_URL at docker build time."
$dockerOk = (-not $SkipDocker) -and ($null -ne (Get-Command docker -ErrorAction SilentlyContinue))
if ($dockerOk) {
  Write-Host "Rebuilding frontend image with the correct API URL..."
  az acr login -n $acrName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $img = "${loginServer}/test-web:${frontendTag}"
  $prev = Get-Location
  Set-Location -LiteralPath $frontendDir
  docker build --platform linux/amd64 --build-arg "NEXT_PUBLIC_API_URL=$backendUrl" -t $img -f Dockerfile .
  if ($LASTEXITCODE -ne 0) { Set-Location $prev; exit $LASTEXITCODE }
  docker push $img
  if ($LASTEXITCODE -ne 0) { Set-Location $prev; exit $LASTEXITCODE }
  Set-Location $prev
  Write-Host "Updating frontend Container App revision..."
  az containerapp update -g test -n $frontendApp --image $img --query properties.latestRevisionName -o tsv
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Frontend updated. Open: $frontendUrl"
}

if (-not $dockerOk) {
  Write-Host "Skipping Docker — run manually from the frontend folder:"
  Write-Host ('  docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL=' + $backendUrl + ' -t ' + $loginServer + '/test-web:' + $frontendTag + ' -f Dockerfile .')
  Write-Host ('  docker push ' + $loginServer + '/test-web:' + $frontendTag)
  Write-Host ('  az containerapp update -g test -n ' + $frontendApp + ' --image ' + $loginServer + '/test-web:' + $frontendTag)
}

Write-Host ''
Write-Host 'Migrate DB if needed: laravel-api-app\scripts\migrate-azure-postgres.ps1'
Write-Host 'Optional: remove old ACI group to save cost: az container delete -g test -n test-fe-be-pg --yes'
if ($DeleteAciAfter) {
  az container delete -g test -n test-fe-be-pg --yes
}
