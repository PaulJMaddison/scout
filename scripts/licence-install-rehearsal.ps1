[CmdletBinding()]
param(
    [string]$LicencePath = ".local\licences\pilot.ucl-licence.json",
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedLicencePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $LicencePath))

if (-not $resolvedLicencePath.StartsWith($repoRoot.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Licence rehearsal path must stay inside the public repo .local area, or pass an explicit protected local path after review."
}

if (-not (Test-Path $resolvedLicencePath)) {
    Write-Host "No local licence file found at $resolvedLicencePath"
    Write-Host "Download a development licence from the cloud portal, then place it here outside git."
    Write-Host "Cloud doc: C:\universalcontextlayer-cloud\docs\licence-download-to-data-plane.md"
    if ($CheckOnly) { exit 1 }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $resolvedLicencePath) | Out-Null
    Write-Host "Directory created. Licence file still needs to be downloaded manually."
    exit 0
}

Write-Host "Licence file exists outside tracked source: $resolvedLicencePath"
Write-Host "Set these environment values before starting the public data plane:"
Write-Host "Licence__Mode=Licensed"
Write-Host "Licence__FilePath=$resolvedLicencePath"
Write-Host "Then verify: GET /api/v1/licence/status"
Write-Host "If the public reader rejects the cloud-generated envelope, record the schema mismatch before the first customer install."
