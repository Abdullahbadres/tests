#Requires -Version 5.1
# Terapkan image ACR ke ACI (RG test). Tidak menyentuh PPIS.
# Prasyarat: docker push untuk test-api:v1 dan test-web:v1; az login;
#             .azure/test-deploy-secrets.local.txt (ACR_NAME, POSTGRES_PASSWORD, ACI_DNS_LABEL, POSTGRES_SERVER)
#             + laravel-api-app/.env (APP_KEY).

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$secretsPath = Join-Path $root ".azure\test-deploy-secrets.local.txt"
$envPath = Join-Path $root "laravel-api-app\.env"
$bicep = Join-Path $root "infra\aci\test-isolated-stack.bicep"

if (-not (Test-Path $secretsPath)) { throw "Tidak ada: $secretsPath" }
if (-not (Test-Path $envPath)) { throw "Tidak ada: $envPath" }
if (-not (Test-Path $bicep)) { throw "Tidak ada: $bicep" }

$acrName = ""
$pgPass = ""
$dns = ""
$pgServer = ""
Get-Content $secretsPath | ForEach-Object {
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
  if ($_ -match '^POSTGRES_PASSWORD=(.+)$') { $pgPass = $Matches[1].Trim() }
  if ($_ -match '^ACI_DNS_LABEL=(.+)$') { $dns = $Matches[1].Trim() }
  if ($_ -match '^POSTGRES_SERVER=(.+)$') { $pgServer = $Matches[1].Trim() }
}
if (-not $acrName -or -not $pgPass -or -not $dns -or -not $pgServer) {
  throw "ACR_NAME / POSTGRES_PASSWORD / ACI_DNS_LABEL / POSTGRES_SERVER harus ada di secrets file"
}
$pgFqdn = "${pgServer}.postgres.database.azure.com"

$appKey = ""
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^APP_KEY=(.+)$') { $appKey = $Matches[1].Trim().Trim('"') }
}
if (-not $appKey) { throw 'APP_KEY tidak ditemukan di laravel-api-app\.env' }

$loginServer = "${acrName}.azurecr.io"
$acrUser = az acr credential show -n $acrName -g test --query username -o tsv
$acrPass = az acr credential show -n $acrName -g test --query "passwords[0].value" -o tsv

$backendImage = "${loginServer}/test-api:v1"
$frontendImage = "${loginServer}/test-web:v1"

$paramObj = [ordered]@{
  dnsNameLabel         = @{ value = $dns }
  managedPostgresFqdn  = @{ value = $pgFqdn }
  useAcr               = @{ value = $true }
  acrLoginServer     = @{ value = $loginServer }
  acrUsername        = @{ value = $acrUser }
  acrPassword        = @{ value = $acrPass }
  backendImage       = @{ value = $backendImage }
  frontendImage      = @{ value = $frontendImage }
  laravelDbPassword  = @{ value = $pgPass }
  laravelAppKey      = @{ value = $appKey }
}
$armParams = @{
  '$schema'        = 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#'
  contentVersion   = '1.0.0.0'
  parameters       = $paramObj
}
$tmp = [System.IO.Path]::GetTempFileName() + '.json'
($armParams | ConvertTo-Json -Depth 10) | Set-Content -Path $tmp -Encoding utf8

$dep = 'aci-acr-' + (Get-Date -Format 'yyyyMMddHHmmss')
Write-Host "Deploying $dep ..."
Write-Host "  backend:  $backendImage"
Write-Host "  frontend: $frontendImage"

try {
  az deployment group create --resource-group test --name $dep --template-file $bicep --parameters "@$tmp" --verbose
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}

Write-Host "`nSelesai."
Write-Host "  API:  http://${dns}.southeastasia.azurecontainer.io:8080/"
Write-Host "  Web:  http://${dns}.southeastasia.azurecontainer.io/"
