[CmdletBinding()]
param(
    [switch]$UseDocker,
    [switch]$SeedDemoData
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDataDirectory = Join-Path $repoRoot '.backend-data'
$backendRuntimeDirectory = Join-Path $repoRoot '.backend-runtime'
$apiLogPath = Join-Path $backendRuntimeDirectory 'api.log'
$apiErrorLogPath = Join-Path $backendRuntimeDirectory 'api-error.log'
$apiPidPath = Join-Path $backendRuntimeDirectory 'api.pid'

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

function Stop-TrackedProcess {
    param([Parameter(Mandatory = $true)][string]$PidFile)

    if (-not (Test-Path $PidFile)) {
        return
    }

    $pidValue = Get-Content -LiteralPath $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    $processId = 0
    if ([int]::TryParse($pidValue, [ref]$processId)) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
        }
        catch {
        }
    }

    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
}

function Wait-ForUrl {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$Attempts = 45,
        [int]$DelaySeconds = 2
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        }
        catch {
        }

        Start-Sleep -Seconds $DelaySeconds
    }

    throw "Timed out waiting for $Url"
}

function Get-BackendEnvironment {
    param([bool]$SeedDemo)

    $contextDbPath = [System.IO.Path]::GetFullPath((Join-Path $backendDataDirectory 'context_layer.db'))
    $customerOpsDbPath = [System.IO.Path]::GetFullPath((Join-Path $backendDataDirectory 'customer_ops.db'))

    return @{
        'ASPNETCORE_ENVIRONMENT' = 'Development'
        'ASPNETCORE_URLS' = 'http://127.0.0.1:5198'
        'Platform__Mode' = 'BackendOnly'
        'Bootstrap__ApplyMigrationsOnStartup' = 'true'
        'Bootstrap__SeedDemoData' = $SeedDemo.ToString().ToLowerInvariant()
        'Database__Provider' = 'Sqlite'
        'ConnectionStrings__ContextLayer' = "Data Source=$contextDbPath"
        'ConnectionStrings__CustomerOps' = "Data Source=$customerOpsDbPath"
        'Telemetry__OtlpEndpoint' = ''
    }
}

$dotnetCommand = & (Join-Path $PSScriptRoot 'ensure-dotnet.ps1') -RepoRoot $repoRoot
if (-not (Test-Path $backendRuntimeDirectory)) {
    New-Item -ItemType Directory -Path $backendRuntimeDirectory | Out-Null
}
if (-not (Test-Path $backendDataDirectory)) {
    New-Item -ItemType Directory -Path $backendDataDirectory | Out-Null
}

Stop-TrackedProcess -PidFile $apiPidPath

if ($UseDocker) {
    if (-not (Test-DockerAvailable)) {
        throw 'Docker mode was requested, but Docker is not available on this machine.'
    }

    Push-Location $repoRoot
    try {
        docker compose up -d postgres
    }
    finally {
        Pop-Location
    }

    $environmentVariables = @{
        'ASPNETCORE_ENVIRONMENT' = 'Development'
        'ASPNETCORE_URLS' = 'http://127.0.0.1:5198'
        'Platform__Mode' = 'BackendOnly'
        'Bootstrap__ApplyMigrationsOnStartup' = 'true'
        'Bootstrap__SeedDemoData' = $SeedDemoData.ToString().ToLowerInvariant()
        'Database__Provider' = 'Postgres'
        'ConnectionStrings__ContextLayer' = 'Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres'
        'ConnectionStrings__CustomerOps' = 'Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'
    }
}
else {
    $environmentVariables = Get-BackendEnvironment -SeedDemo:$SeedDemoData
}

$backendScript = @"
Set-Location '$repoRoot'
"@

foreach ($entry in $environmentVariables.GetEnumerator()) {
    $escapedValue = ([string]$entry.Value).Replace("'", "''")
    $backendScript += "`n`$env:$($entry.Key) = '$escapedValue'"
}

$backendScript += "`n& '$dotnetCommand' run --project src/ContextLayer.Api"

$apiProcess = Start-Process -FilePath 'powershell' `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $backendScript `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $apiLogPath `
    -RedirectStandardError $apiErrorLogPath `
    -PassThru
$apiProcess.Id | Set-Content -LiteralPath $apiPidPath

Wait-ForUrl -Url 'http://127.0.0.1:5198/health'

Write-Host ''
Write-Host 'Context Layer backend is running.' -ForegroundColor Green
Write-Host 'API:      http://127.0.0.1:5198'
Write-Host 'GraphQL:  http://127.0.0.1:5198/graphql'
Write-Host 'REST doc: http://127.0.0.1:5198/swagger'
Write-Host 'Health:   http://127.0.0.1:5198/health'
