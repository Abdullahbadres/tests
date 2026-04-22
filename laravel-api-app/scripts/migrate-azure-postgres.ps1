#Requires -Version 5.1
# Run Laravel migrate + seed against Azure PostgreSQL Flexible via Docker (pgsql driver).
# Reads password (and other vars) from ..\.azure\test-deploy-secrets.local.txt

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$secrets = Join-Path $repoRoot ".azure\test-deploy-secrets.local.txt"
if (-not (Test-Path $secrets)) { throw "Not found: $secrets" }

$pgPass = ""
$pgServer = ""
$acrName = ""
Get-Content $secrets | ForEach-Object {
  if ($_ -match '^POSTGRES_PASSWORD=(.+)$') { $pgPass = $Matches[1].Trim() }
  if ($_ -match '^POSTGRES_SERVER=(.+)$') { $pgServer = $Matches[1].Trim() }
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
}
if (-not $pgPass) { throw 'POSTGRES_PASSWORD= line missing in secrets file' }
if (-not $pgServer) { throw 'POSTGRES_SERVER= line missing (short hostname without .postgres...)' }
if (-not $acrName) { throw 'ACR_NAME= line missing in secrets file' }

$hostFqdn = "${pgServer}.postgres.database.azure.com"
$image = "${acrName}.azurecr.io/test-api:v1"
$appDir = Join-Path $repoRoot "laravel-api-app"

$envFile = [System.IO.Path]::GetTempFileName()
$lines = @(
  "DB_CONNECTION=pgsql"
  "DB_HOST=$hostFqdn"
  "DB_PORT=5432"
  "DB_DATABASE=laravel"
  "DB_USERNAME=pgadmin"
  "DB_PASSWORD=$pgPass"
  "DB_SSLMODE=require"
)
[System.IO.File]::WriteAllLines($envFile, $lines, [System.Text.UTF8Encoding]::new($false))

try {
  Write-Host "Migrating to $hostFqdn ..."
  docker run --rm `
    -v "${appDir}:/var/www/html" `
    -w /var/www/html `
    --env-file $envFile `
    $image `
    sh -c "php artisan migrate --force && php artisan db:seed --force"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Migrate + seed finished (SuperAdminSeeder: superadmin@mail.com)."
}
finally {
  Remove-Item -LiteralPath $envFile -Force -ErrorAction SilentlyContinue
}
