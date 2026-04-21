#Requires -Version 5.1
# Migrasi ke Azure PostgreSQL Flexible via Docker (driver pgsql).
# Password dari ..\.azure\test-deploy-secrets.local.txt

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$secrets = Join-Path $repoRoot ".azure\test-deploy-secrets.local.txt"
if (-not (Test-Path $secrets)) { throw "Tidak ditemukan: $secrets" }

$pgPass = ""
$pgServer = ""
$acrName = ""
Get-Content $secrets | ForEach-Object {
  if ($_ -match '^POSTGRES_PASSWORD=(.+)$') { $pgPass = $Matches[1].Trim() }
  if ($_ -match '^POSTGRES_SERVER=(.+)$') { $pgServer = $Matches[1].Trim() }
  if ($_ -match '^ACR_NAME=(.+)$') { $acrName = $Matches[1].Trim() }
}
if (-not $pgPass) { throw 'Baris POSTGRES_PASSWORD= tidak ada di secrets file' }
if (-not $pgServer) { throw 'Baris POSTGRES_SERVER= (nama host tanpa .postgres...) tidak ada di secrets file' }
if (-not $acrName) { throw 'Baris ACR_NAME= tidak ada di secrets file' }

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
  Write-Host "Migrasi ke $hostFqdn ..."
  docker run --rm `
    -v "${appDir}:/var/www/html" `
    -w /var/www/html `
    --env-file $envFile `
    $image `
    php artisan migrate --force
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Migrasi selesai."
}
finally {
  Remove-Item -LiteralPath $envFile -Force -ErrorAction SilentlyContinue
}
