#Requires -Version 5.1
<#
  Deploy Azure Container Apps (env + backend Laravel + frontend Next.js).
  Run AFTER: az login
  Build and push images to ACR (or another registry) first.

  Example:
    .\scripts\deploy-container-apps.ps1 `
      -ResourceGroup "rg-aisales" `
      -NamePrefix "aisales" `
      -BackendImage "myregistry.azurecr.io/aisales-api:v1" `
      -FrontendImage "myregistry.azurecr.io/aisales-web:v1" `
      -SqlServerFqdn "myserver.database.windows.net" `
      -SqlDatabaseName "laraveldb" `
      -SqlAdminUsername "sqladmin" `
      -SqlAdminPassword (Read-Host -AsSecureString) `
      -AppKey "base64:...." `
      -AcrLoginServer "myregistry.azurecr.io" `
      -AcrUsername "myregistry" `
      -AcrPassword (Read-Host -AsSecureString)
#>
param(
  [Parameter(Mandatory = $true)][string]$ResourceGroup,
  [Parameter(Mandatory = $true)][string]$NamePrefix,
  [Parameter(Mandatory = $true)][string]$BackendImage,
  [Parameter(Mandatory = $true)][string]$FrontendImage,
  [Parameter(Mandatory = $true)][string]$SqlServerFqdn,
  [Parameter(Mandatory = $true)][string]$SqlDatabaseName,
  [Parameter(Mandatory = $true)][string]$SqlAdminUsername,
  [Parameter(Mandatory = $true)][SecureString]$SqlAdminPassword,
  [Parameter(Mandatory = $true)][string]$AppKey,
  [string]$OpenAiApiKey = "",
  [string]$AcrLoginServer = "",
  [string]$AcrUsername = "",
  [SecureString]$AcrPassword = $null,
  [string]$Location = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$bicep = Join-Path $root "infra\container-apps\main.bicep"

if (-not (Test-Path $bicep)) { Write-Error "Not found: $bicep" }

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword)
$plainSql = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

$plainAcr = ""
if ($AcrPassword -and $AcrLoginServer) {
  $BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AcrPassword)
  $plainAcr = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)
}

if (-not $Location) { $Location = "eastus" }
az group create --name $ResourceGroup --location $Location | Out-Null

$params = @(
  "--resource-group", $ResourceGroup,
  "--template-file", $bicep,
  "--parameters",
  "namePrefix=$NamePrefix",
  "backendImage=$BackendImage",
  "frontendImage=$FrontendImage",
  "sqlServerFqdn=$SqlServerFqdn",
  "sqlDatabaseName=$SqlDatabaseName",
  "sqlAdminUsername=$SqlAdminUsername",
  "sqlAdminPassword=$plainSql",
  "appKey=$AppKey",
  "openAiApiKey=$OpenAiApiKey"
)

if ($AcrLoginServer -and $AcrUsername -and $plainAcr) {
  $params += @(
    "acrLoginServer=$AcrLoginServer",
    "acrUsername=$AcrUsername",
    "acrPassword=$plainAcr"
  )
}

az deployment group create @params --verbose

Write-Host "`nDone. Check deployment output for backendUrl / frontendUrl."
Write-Host "Run migrations: az containerapp exec ... or from your machine to Azure SQL after the firewall allows your IP."
