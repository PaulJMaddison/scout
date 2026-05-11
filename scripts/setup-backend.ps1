[CmdletBinding()]
param(
    [switch]$UseDocker,
    [switch]$SeedDemoData
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDataDirectory = Join-Path $repoRoot '.backend-data'

function Invoke-RepoCommand {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [Parameter(Mandatory = $true)][string]$DisplayCommand,
        [string]$WorkingDirectory = $repoRoot
    )

    Write-Host ">> $DisplayCommand" -ForegroundColor Cyan
    Push-Location $WorkingDirectory
    try {
        & $Action
    }
    finally {
        Pop-Location
    }
}

function Invoke-WithEnvironment {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Variables,
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [string]$DisplayCommand
    )

    $previous = @{}
    foreach ($entry in $Variables.GetEnumerator()) {
        $previous[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
        [Environment]::SetEnvironmentVariable($entry.Key, [string]$entry.Value, 'Process')
    }

    try {
        Invoke-RepoCommand -Action $Action -DisplayCommand $DisplayCommand
    }
    finally {
        foreach ($entry in $previous.GetEnumerator()) {
            [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
        }
    }
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

function Get-BackendEnvironment {
    param([bool]$SeedDemo)

    $contextDbPath = [System.IO.Path]::GetFullPath((Join-Path $backendDataDirectory 'context_layer.db'))
    $customerOpsDbPath = [System.IO.Path]::GetFullPath((Join-Path $backendDataDirectory 'customer_ops.db'))

    return @{
        'ASPNETCORE_ENVIRONMENT' = 'Development'
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
if (-not (Test-Path $backendDataDirectory)) {
    New-Item -ItemType Directory -Path $backendDataDirectory | Out-Null
}

Invoke-RepoCommand -DisplayCommand 'dotnet tool restore' -Action { & $dotnetCommand tool restore }
Invoke-RepoCommand -DisplayCommand 'dotnet restore ContextLayer.slnx' -Action { & $dotnetCommand restore ContextLayer.slnx }

if ($UseDocker) {
    if (-not (Test-DockerAvailable)) {
        throw 'Docker mode was requested, but Docker is not available on this machine.'
    }

    Invoke-RepoCommand -DisplayCommand 'docker compose up -d postgres' -Action {
        docker compose up -d postgres
    }

    Invoke-RepoCommand -DisplayCommand 'dotnet tool run dotnet-ef database update --context CustomerOpsDbContext' -Action {
        $env:Database__Provider = 'Postgres'
        $env:ConnectionStrings__ContextLayer = 'Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres'
        $env:ConnectionStrings__CustomerOps = 'Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'
        & $dotnetCommand tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context CustomerOpsDbContext
    }
    Invoke-RepoCommand -DisplayCommand 'dotnet tool run dotnet-ef database update --context ContextLayerDbContext' -Action {
        $env:Database__Provider = 'Postgres'
        $env:ConnectionStrings__ContextLayer = 'Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres'
        $env:ConnectionStrings__CustomerOps = 'Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'
        & $dotnetCommand tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context ContextLayerDbContext
    }

    if ($SeedDemoData) {
        Invoke-RepoCommand -DisplayCommand 'dotnet run --project src/ContextLayer.Api -- bootstrap' -Action {
            $env:Platform__Mode = 'BackendOnly'
            $env:Bootstrap__ApplyMigrationsOnStartup = 'true'
            $env:Bootstrap__SeedDemoData = 'true'
            $env:Database__Provider = 'Postgres'
            $env:ConnectionStrings__ContextLayer = 'Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres'
            $env:ConnectionStrings__CustomerOps = 'Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'
            & $dotnetCommand run --project src/ContextLayer.Api -- bootstrap
        }
    }
}
else {
    $environmentVariables = Get-BackendEnvironment -SeedDemo:$SeedDemoData
    Invoke-WithEnvironment -Variables $environmentVariables -DisplayCommand 'dotnet run --project src/ContextLayer.Api -- bootstrap' -Action {
        & $dotnetCommand run --project src/ContextLayer.Api -- bootstrap
    }
}

Write-Host ''
Write-Host 'Context Layer backend bootstrap complete.' -ForegroundColor Green
Write-Host ''
Write-Host 'Start locally:' -ForegroundColor Yellow
Write-Host '  .\scripts\start-backend.ps1'
Write-Host ''
Write-Host 'Optional seeded demo data:' -ForegroundColor Yellow
Write-Host '  .\scripts\setup-backend.ps1 -SeedDemoData'
Write-Host ''
Write-Host 'Optional PostgreSQL package mode:' -ForegroundColor Yellow
Write-Host '  .\scripts\setup-backend.ps1 -UseDocker'
Write-Host ''
Write-Host 'API base:          http://127.0.0.1:5198'
Write-Host 'GraphQL:           http://127.0.0.1:5198/graphql'
Write-Host 'REST docs:         http://127.0.0.1:5198/swagger'
Write-Host 'Health:            http://127.0.0.1:5198/health'
