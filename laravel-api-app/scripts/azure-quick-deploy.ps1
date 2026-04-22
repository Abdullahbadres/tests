#Requires -Version 5.1
<#
  Quick deploy: resource group + Linux PHP 8.2 App Service for the Laravel API.
  Run AFTER: az login

  Example:
    .\scripts\azure-quick-deploy.ps1 -ResourceGroup "rg-aisales-api" -Location "southeastasia" -AppName "aisales-api-unique123"
#>
param(
  [Parameter(Mandatory = $true)][string]$ResourceGroup,
  [Parameter(Mandatory = $true)][string]$Location,
  [Parameter(Mandatory = $true)][string]$AppName,
  [ValidateSet('B1', 'S1', 'P1v2')][string]$Sku = 'B1'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$bicep = Join-Path $root 'infra\azure-laravel-webapp.bicep'

if (-not (Test-Path $bicep)) {
  Write-Error "Bicep file not found: $bicep"
}

az group create --name $ResourceGroup --location $Location | Out-Null

az deployment group create `
  --resource-group $ResourceGroup `
  --template-file $bicep `
  --parameters appName=$AppName sku=$Sku location=$Location `
  --verbose

Write-Host "`nDone. Azure Portal -> Web App -> Configuration -> Application settings"
Write-Host "Set: APP_KEY, APP_URL=https://$AppName.azurewebsites.net, DB_*, SANCTUM_STATEFUL_DOMAINS, FRONTEND_URL, OPENAI_*"
Write-Host "Then deploy Laravel (ZIP to wwwroot or CI/CD) and set the document root to /public if needed."
