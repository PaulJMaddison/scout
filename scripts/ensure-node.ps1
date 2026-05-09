[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RepoRoot
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$requiredNodeVersion = 'v22.20.0'

function Get-LocalNodeInstallDirectory {
    $architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
    $platformSuffix = switch ($architecture) {
        'x64' { 'win-x64' }
        'arm64' { 'win-arm64' }
        default { throw "Unsupported Windows architecture '$architecture' for the bundled Node.js bootstrap." }
    }

    return Join-Path $RepoRoot ".node\node-$requiredNodeVersion-$platformSuffix"
}

function Test-NodeMeetsRequirement {
    param([Parameter(Mandatory = $true)][string]$NodePath)

    if (-not (Test-Path $NodePath)) {
        return $false
    }

    try {
        $installedVersion = (& $NodePath --version 2>$null).Trim()
    }
    catch {
        return $false
    }

    return [Version]$installedVersion.TrimStart('v') -ge [Version]$requiredNodeVersion.TrimStart('v')
}

function Install-LocalNode {
    $installRoot = Join-Path $RepoRoot '.node'
    $runtimeDirectory = Join-Path $RepoRoot '.demo-runtime'
    if (-not (Test-Path $runtimeDirectory)) {
        New-Item -ItemType Directory -Path $runtimeDirectory | Out-Null
    }

    $installDirectory = Get-LocalNodeInstallDirectory
    $archiveName = Split-Path -Leaf $installDirectory
    $archivePath = Join-Path $runtimeDirectory "$archiveName.zip"
    $downloadUri = "https://nodejs.org/dist/$requiredNodeVersion/$archiveName.zip"

    Write-Host ">> Downloading Node.js $requiredNodeVersion" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadUri -OutFile $archivePath

    if (Test-Path $installRoot) {
        Remove-Item -LiteralPath $installRoot -Recurse -Force
    }

    New-Item -ItemType Directory -Path $installRoot | Out-Null
    Write-Host ">> Installing Node.js $requiredNodeVersion into $installRoot" -ForegroundColor Cyan
    Expand-Archive -LiteralPath $archivePath -DestinationPath $installRoot -Force

    $nodePath = Join-Path $installDirectory 'node.exe'
    if (-not (Test-NodeMeetsRequirement -NodePath $nodePath)) {
        throw "The local Node.js installation did not produce a compatible runtime at '$nodePath'."
    }

    return $installDirectory
}

$localNodeDirectory = Get-LocalNodeInstallDirectory
$localNodePath = Join-Path $localNodeDirectory 'node.exe'
$localNpmPath = Join-Path $localNodeDirectory 'npm.cmd'
if ((Test-NodeMeetsRequirement -NodePath $localNodePath) -and (Test-Path $localNpmPath)) {
    return $localNodeDirectory
}

$globalNode = Get-Command node -ErrorAction SilentlyContinue
$globalNpm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($globalNode -and $globalNpm -and (Test-NodeMeetsRequirement -NodePath $globalNode.Source)) {
    return Split-Path -Parent $globalNode.Source
}

return (Install-LocalNode)
