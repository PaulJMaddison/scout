[CmdletBinding()]
param(
    [string]$LicencePath = ".local\licences\pilot.ucl-licence.json",
    [string]$BaseUrl = "http://localhost:5198",
    [string]$TenantSlug = "demo",
    [string]$AdminEmail = "admin@contextlayer.local",
    [string]$AdminPassword = "DemoAdmin123!",
    [switch]$SkipEndpointCheck,
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
Write-Host "Licence__PublicKeyPem=<cloud licence public verification key, supplied from a secret/config store>"

if ($SkipEndpointCheck) {
    Write-Host "Endpoint verification skipped by request."
    exit 0
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        $Body = $null,
        [hashtable]$Headers = @{}
    )

    $parameters = @{
        Method = $Method
        Uri = $Url
        Headers = $Headers
        ContentType = "application/json"
    }
    if ($null -ne $Body) {
        $parameters.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
    }
    Invoke-RestMethod @parameters
}

try {
    Invoke-RestMethod "$BaseUrl/api/v1/health" | Out-Null
} catch {
    Write-Host "Backend is not reachable at $BaseUrl."
    Write-Host "Start it with:"
    Write-Host "  `$env:Licence__Mode='Licensed'; `$env:Licence__FilePath='$resolvedLicencePath'; dotnet run --project .\src\ContextLayer.Api\ContextLayer.Api.csproj --urls $BaseUrl"
    exit 2
}

$login = Invoke-Json POST "$BaseUrl/api/auth/login" @{
    tenantSlug = $TenantSlug
    email = $AdminEmail
    password = $AdminPassword
}
$status = Invoke-Json GET "$BaseUrl/api/v1/licence/status?tenantSlug=$TenantSlug" $null @{ Authorization = "Bearer $($login.accessToken)" }

Write-Host "Licence status endpoint responded."
Write-Host "Mode: $($status.mode)"
Write-Host "Status: $($status.status)"
Write-Host "Plan: $($status.plan)"
Write-Host "Valid: $($status.isValid)"
Write-Host "Source: $($status.source)"
if ($status.warnings.Count -gt 0) {
    Write-Host "Warnings: $($status.warnings -join '; ')"
}
