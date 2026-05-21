[CmdletBinding()]
param(
    [string]$EnterpriseRepo = "C:\scout-enterprise",
    [string]$CloudRepo = "C:\scout-cloud",
    [switch]$BuildMissing,
    [switch]$SkipEnterpriseConnectorSmoke
)

$ErrorActionPreference = "Stop"
$publicRepo = Resolve-Path (Join-Path $PSScriptRoot "..")

function Require-Path {
    param([string]$Path, [string]$Purpose)
    if (-not (Test-Path $Path)) {
        throw "Missing $Purpose`: $Path"
    }
    Write-Host "OK: $Purpose"
}

function Invoke-Step {
    param([scriptblock]$Block, [string]$Name)
    Write-Host ""
    Write-Host "== $Name =="
    & $Block
}

Invoke-Step {
    Require-Path (Join-Path $publicRepo "docs\paid-pilot-end-to-end-rehearsal.md") "public paid-pilot rehearsal doc"
    Require-Path (Join-Path $publicRepo "docs\commercial-readiness-summary.md") "public readiness summary"
    Require-Path (Join-Path $publicRepo "scripts\check-production-env.ps1") "public production env check"
    Require-Path (Join-Path $publicRepo "scripts\m2m-and-webhook-smoke.ps1") "public M2M/webhook smoke"
    Require-Path (Join-Path $publicRepo "scripts\licence-install-rehearsal.ps1") "public licence install rehearsal"
} "Public repo checks"

Invoke-Step {
    Require-Path (Join-Path $CloudRepo "apps\cloud-portal\package.json") "cloud portal package"
    Require-Path (Join-Path $CloudRepo "scripts\live-hosting-preflight.ps1") "cloud live-hosting preflight"
    Require-Path (Join-Path $CloudRepo "scripts\apply-cloud-migrations.ps1") "cloud migration script"
    Require-Path (Join-Path $CloudRepo "docs\cloud-portal-hosting-topology.md") "cloud portal topology doc"
    Require-Path (Join-Path $CloudRepo "docs\cloud-portal-auth.md") "cloud portal auth doc"
    Require-Path (Join-Path $CloudRepo "docs\licence-download-to-data-plane.md") "cloud licence download doc"
    $cloudDist = Join-Path $CloudRepo "apps\cloud-portal\dist"
    if (-not (Test-Path $cloudDist) -and $BuildMissing) {
        Push-Location (Join-Path $CloudRepo "apps\cloud-portal")
        npm install
        npm run build
        Pop-Location
    }
    Require-Path $cloudDist "cloud portal production build folder"
} "Cloud repo checks"

Invoke-Step {
    Require-Path (Join-Path $EnterpriseRepo "docs\postgres-disposable-proof.md") "enterprise disposable Postgres proof"
    Require-Path (Join-Path $EnterpriseRepo "scripts\connector-smoke-test.ps1") "enterprise connector smoke script"
    Require-Path (Join-Path $EnterpriseRepo "scripts\start-postgres-proof.ps1") "enterprise Postgres proof script"
    Require-Path (Join-Path $EnterpriseRepo "scripts\package-enterprise-preview.ps1") "enterprise package dry-run script"
    if (-not $SkipEnterpriseConnectorSmoke) {
        & (Join-Path $EnterpriseRepo "scripts\connector-smoke-test.ps1") -Provider postgres -ConfigPath (Join-Path $EnterpriseRepo "samples\postgres\connector-proof.config.json") -SelectorName CustomerContextRollup
    }
} "Enterprise repo checks"

Invoke-Step {
    $requiredDocs = @(
        (Join-Path $publicRepo "docs\paid-pilot-end-to-end-rehearsal.md"),
        (Join-Path $CloudRepo "docs\cloud-portal.md"),
        (Join-Path $CloudRepo "docs\package-entitlement-flow.md"),
        (Join-Path $CloudRepo "docs\support-data-redaction.md"),
        (Join-Path $CloudRepo "docs\operations-readiness-evidence-template.md"),
        (Join-Path $EnterpriseRepo "docs\postgres-disposable-proof.md"),
        (Join-Path $EnterpriseRepo "docs\private-package-distribution.md"),
        (Join-Path $EnterpriseRepo "docs\support-bundle-redaction.md")
    )
    foreach ($doc in $requiredDocs) {
        Require-Path $doc "flow document"
    }
} "Lead to support flow docs"

Write-Host ""
Write-Host "Manual steps still required:"
Write-Host "- real hosting, domains, DNS, TLS, reverse proxy, and HSTS validation"
Write-Host "- real managed PostgreSQL target, backup owner, and restore evidence"
Write-Host "- real secret-store references for JWT, licence signing, SMTP, billing, and lead challenges"
Write-Host "- solicitor review of privacy, cookie/event consent, terms, pilot agreement, and data-processing assumptions"
Write-Host "- first customer-approved connector endpoint, vault reference, and acceptance checklist"
Write-Host "- real private package feed/object storage registration and signed download URLs if self-download is promised"
Write-Host ""
Write-Host "Paid-pilot local rehearsal checks completed. Nothing was pushed, published, released, or hosted."
