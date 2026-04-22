#Requires -Version 5.1
#
# Legacy placeholder — this script is intentionally disabled.
# Use the ACI flow instead:
#   - infra/aci/test-isolated-stack.bicep
#   - scripts/deploy-aci-from-acr.ps1
#   - scripts/build-push-backend-acr.ps1
#   - scripts/build-push-frontend-acr.ps1
#
# Optional Container Apps path (may hit subscription quota):
#   - infra/container-apps/test-isolated-apps.bicep
#   - scripts/deploy-container-apps-test.ps1

$ErrorActionPreference = "Stop"

Write-Host @"

[STOP] This legacy script is disabled.

Use resource group `test` and ACI:
  - infra/aci/test-isolated-stack.bicep + scripts/deploy-aci-from-acr.ps1

Optional Container Apps:
  - infra/container-apps/test-isolated-apps.bicep + scripts/deploy-container-apps-test.ps1

"@ -ForegroundColor Yellow

exit 2
