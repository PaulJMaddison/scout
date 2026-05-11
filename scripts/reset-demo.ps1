[CmdletBinding()]
param(
    [switch]$KeepVolumes,
    [switch]$SkipRecreate
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$demoDataDirectory = Join-Path $repoRoot '.demo-data'
$demoRuntimeDirectory = Join-Path $repoRoot '.demo-runtime'

function Stop-TrackedProcess {
    param([Parameter(Mandatory = $true)][string]$PidFile)

    if (-not (Test-Path $PidFile)) {
        return
    }

    $pidValue = Get-Content -LiteralPath $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ([int]::TryParse($pidValue, [ref]$null)) {
        try {
            Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
        }
        catch {
        }
    }

    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
}

function Test-DockerAvailable {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        return $false
    }

    try {
        & $docker.Source version | Out-Null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Stop-RepoProcessByPattern {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Pattern
    )

    $escapedPattern = [Regex]::Escape($Pattern)
    $processes = Get-CimInstance Win32_Process -Filter "Name = '$Name'" |
        Where-Object { $_.CommandLine -match $escapedPattern }

    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
        }
        catch {
        }
    }
}

if (Test-Path $demoRuntimeDirectory) {
    Stop-TrackedProcess -PidFile (Join-Path $demoRuntimeDirectory 'api.pid')
    Stop-TrackedProcess -PidFile (Join-Path $demoRuntimeDirectory 'web.pid')
    Remove-Item -LiteralPath $demoRuntimeDirectory -Recurse -Force -ErrorAction SilentlyContinue
}

Stop-RepoProcessByPattern -Name 'node.exe' -Pattern (Join-Path $repoRoot 'apps\web')
Stop-RepoProcessByPattern -Name 'dotnet.exe' -Pattern (Join-Path $repoRoot 'src\ContextLayer.Api')
Stop-RepoProcessByPattern -Name 'dotnet.exe' -Pattern 'ContextLayer.Api'
Stop-RepoProcessByPattern -Name 'ContextLayer.Api.exe' -Pattern 'ContextLayer.Api'
Start-Sleep -Milliseconds 500

if (Test-DockerAvailable) {
    Push-Location $repoRoot
    try {
        if ($KeepVolumes) {
            Write-Host '>> docker compose down --remove-orphans' -ForegroundColor Cyan
            docker compose down --remove-orphans
        }
        else {
            Write-Host '>> docker compose down --remove-orphans -v' -ForegroundColor Cyan
            docker compose down --remove-orphans -v
        }
    }
    finally {
        Pop-Location
    }
}

if (-not $KeepVolumes -and (Test-Path $demoDataDirectory)) {
    Remove-Item -LiteralPath $demoDataDirectory -Recurse -Force
}

if (-not $SkipRecreate) {
    & (Join-Path $PSScriptRoot 'setup-demo.ps1')
}
