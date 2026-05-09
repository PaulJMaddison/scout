[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RepoRoot
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Get-RequiredSdkVersion {
    $globalJsonPath = Join-Path $RepoRoot 'global.json'
    if (-not (Test-Path $globalJsonPath)) {
        throw "Could not find '$globalJsonPath'."
    }

    $globalJson = Get-Content -LiteralPath $globalJsonPath -Raw | ConvertFrom-Json
    if (-not $globalJson.sdk.version) {
        throw "The SDK version was not found in '$globalJsonPath'."
    }

    return [string]$globalJson.sdk.version
}

function Test-DotnetMeetsRequirement {
    param(
        [Parameter(Mandatory = $true)][string]$DotnetPath,
        [Parameter(Mandatory = $true)][string]$RequiredVersion
    )

    if (-not (Test-Path $DotnetPath)) {
        return $false
    }

    try {
        $installedSdks = & $DotnetPath --list-sdks 2>$null
    }
    catch {
        return $false
    }

    $required = [Version]$RequiredVersion
    foreach ($line in $installedSdks) {
        if ($line -match '^(?<version>\d+\.\d+\.\d+)') {
            $installed = [Version]$Matches['version']
            if ($installed.Major -eq $required.Major -and $installed.Minor -eq $required.Minor -and $installed -ge $required) {
                return $true
            }
        }
    }

    return $false
}

function Install-LocalDotnetSdk {
    param([Parameter(Mandatory = $true)][string]$RequiredVersion)

    $installDirectory = Join-Path $RepoRoot '.dotnet'
    $runtimeDirectory = Join-Path $RepoRoot '.demo-runtime'
    if (-not (Test-Path $runtimeDirectory)) {
        New-Item -ItemType Directory -Path $runtimeDirectory | Out-Null
    }

    $installScriptPath = Join-Path $runtimeDirectory 'dotnet-install.ps1'
    Write-Host ">> Downloading .NET SDK installer for $RequiredVersion" -ForegroundColor Cyan
    Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile $installScriptPath

    Write-Host ">> Installing .NET SDK $RequiredVersion into $installDirectory" -ForegroundColor Cyan
    & powershell -NoProfile -ExecutionPolicy Bypass -File $installScriptPath -Version $RequiredVersion -InstallDir $installDirectory -NoPath | Out-Null

    $localDotnet = Join-Path $installDirectory 'dotnet.exe'
    if (-not (Test-DotnetMeetsRequirement -DotnetPath $localDotnet -RequiredVersion $RequiredVersion)) {
        throw "The local .NET SDK installation did not produce a compatible SDK at '$localDotnet'."
    }

    return $localDotnet
}

$requiredVersion = Get-RequiredSdkVersion
$localDotnet = Join-Path $RepoRoot '.dotnet\dotnet.exe'
if (Test-DotnetMeetsRequirement -DotnetPath $localDotnet -RequiredVersion $requiredVersion) {
    return $localDotnet
}

$globalDotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if ($globalDotnet -and (Test-DotnetMeetsRequirement -DotnetPath $globalDotnet.Source -RequiredVersion $requiredVersion)) {
    return $globalDotnet.Source
}

return (Install-LocalDotnetSdk -RequiredVersion $requiredVersion)
