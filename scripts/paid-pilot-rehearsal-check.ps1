[CmdletBinding()]
param(
    [string]$EnterpriseRepo = "C:\universalcontextlayer-enterprise",
    [string]$CloudRepo = "C:\universalcontextlayer-cloud",
    [switch]$SkipEnterpriseConnectorSmoke
)

$ErrorActionPreference = "Stop"
$publicRepo = Resolve-Path (Join-Path $PSScriptRoot "..")

function Require-Path {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        throw "Required rehearsal path is missing: $Path"
    }
}

function Invoke-RepoScript {
    param([string]$Repo, [string]$Script, [string[]]$Arguments = @())
    $path = Join-Path $Repo $Script
    Require-Path $path
    & $path @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Script failed: $path"
    }
}

Write-Host "Paid pilot end-to-end local rehearsal check"
Write-Host "Public repo: $publicRepo"
Write-Host "Enterprise repo: $EnterpriseRepo"
Write-Host "Cloud repo: $CloudRepo"

Require-Path (Join-Path $publicRepo "docs\paid-pilot-end-to-end-rehearsal.md")
Require-Path (Join-Path $publicRepo "docs\commercial-readiness-summary.md")
Require-Path (Join-Path $publicRepo "scripts\check-release-alignment.ps1")
Require-Path (Join-Path $publicRepo "scripts\check-production-env.ps1")

Require-Path (Join-Path $EnterpriseRepo "docs\live-connector-proof-pack.md")
Require-Path (Join-Path $EnterpriseRepo "scripts\connector-smoke-test.ps1")
Require-Path (Join-Path $EnterpriseRepo "scripts\check-package-readiness.ps1")

Require-Path (Join-Path $CloudRepo "docs\live-hosting-preflight.md")
Require-Path (Join-Path $CloudRepo "scripts\check-cloud-production-env.ps1")
Require-Path (Join-Path $CloudRepo "scripts\live-hosting-preflight.ps1")

Invoke-RepoScript $publicRepo "scripts\check-release-alignment.ps1"
Invoke-RepoScript $EnterpriseRepo "scripts\check-release-alignment.ps1"
Invoke-RepoScript $CloudRepo "scripts\check-release-alignment.ps1"

if (-not $SkipEnterpriseConnectorSmoke) {
    $connectorSmoke = Join-Path $EnterpriseRepo "scripts\connector-smoke-test.ps1"
    Require-Path $connectorSmoke
    & $connectorSmoke -Provider postgres -ConfigPath (Join-Path $EnterpriseRepo "docs\examples\postgresql-connector.config.json")
    & $connectorSmoke -Provider sqlserver -ConfigPath (Join-Path $EnterpriseRepo "docs\examples\sql-server-connector.config.json")
}

Write-Host "Manual/live blockers still expected:"
Write-Host "- real hosting, domains, DNS, TLS, payment credentials, licence signing keys, and customer connector endpoints are not configured by this rehearsal"
Write-Host "- real cloud account/licence/data-plane registration requires a local running cloud API or next-week hosting"
Write-Host "- real SQL/PostgreSQL connector preview requires customer-approved endpoint and vault reference"
Write-Host "- No raw operational data is sent to cloud; this rehearsal uses aggregate/support metadata boundaries only"
Write-Host "Paid pilot rehearsal check completed without publishing, pushing, releasing, or configuring production."
