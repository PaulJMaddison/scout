[CmdletBinding()]
param(
    [switch]$StartContainers
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$rootEnvPath = Join-Path $repoRoot '.env'
$rootEnvExamplePath = Join-Path $repoRoot '.env.example'
$webEnvPath = Join-Path $repoRoot 'apps\web\.env.local'
$demoDataDirectory = Join-Path $repoRoot '.demo-data'

function Assert-Command {
    param([Parameter(Mandatory = $true)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Get-DotnetCommand {
    $localDotnet = Join-Path $repoRoot '.dotnet\dotnet.exe'
    if (Test-Path $localDotnet) {
        return $localDotnet
    }

    $globalDotnet = Get-Command dotnet -ErrorAction SilentlyContinue
    if ($globalDotnet) {
        return $globalDotnet.Source
    }

    throw "A compatible .NET SDK was not found. Expected '$localDotnet' or 'dotnet' in PATH."
}

function Ensure-FileFromExample {
    param(
        [Parameter(Mandatory = $true)][string]$TargetPath,
        [Parameter(Mandatory = $true)][string]$ExamplePath
    )

    if (-not (Test-Path $TargetPath)) {
        Copy-Item -LiteralPath $ExamplePath -Destination $TargetPath
    }
}

function Set-WebEnvFile {
    @'
VITE_API_BASE_URL=http://127.0.0.1:5198
VITE_GRAPHQL_ENDPOINT=http://127.0.0.1:5198/graphql
VITE_DEMO_FALLBACK=false
'@ | Set-Content -LiteralPath $webEnvPath
}

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
        [string]$WorkingDirectory = $repoRoot,
        [string]$DisplayCommand = 'run'
    )

    $previous = @{}
    foreach ($entry in $Variables.GetEnumerator()) {
        $previous[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
        [Environment]::SetEnvironmentVariable($entry.Key, [string]$entry.Value, 'Process')
    }

    try {
        Invoke-RepoCommand -Action $Action -DisplayCommand $DisplayCommand -WorkingDirectory $WorkingDirectory
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

function Get-LocalDemoEnvironment {
    $contextDbPath = [System.IO.Path]::GetFullPath((Join-Path $demoDataDirectory 'context_layer_demo.db'))
    $customerOpsDbPath = [System.IO.Path]::GetFullPath((Join-Path $demoDataDirectory 'customer_ops_demo.db'))
    return @{
        'ASPNETCORE_ENVIRONMENT' = 'Development'
        'Database__Provider' = 'Sqlite'
        'ConnectionStrings__ContextLayer' = "Data Source=$contextDbPath"
        'ConnectionStrings__CustomerOps' = "Data Source=$customerOpsDbPath"
        'Cors__AllowedOrigins__0' = 'http://localhost:5173'
        'Cors__AllowedOrigins__1' = 'http://127.0.0.1:5173'
        'Telemetry__OtlpEndpoint' = ''
    }
}

$dotnetCommand = Get-DotnetCommand
Assert-Command -Name 'node'
Assert-Command -Name 'npm.cmd'

Ensure-FileFromExample -TargetPath $rootEnvPath -ExamplePath $rootEnvExamplePath
Set-WebEnvFile

$dockerAvailable = Test-DockerAvailable
$demoMode = if ($dockerAvailable) { 'docker' } else { 'sqlite' }

if ($demoMode -eq 'sqlite' -and -not (Test-Path $demoDataDirectory)) {
    New-Item -ItemType Directory -Path $demoDataDirectory | Out-Null
}

Invoke-RepoCommand -DisplayCommand 'dotnet tool restore' -Action { & $dotnetCommand tool restore }
Invoke-RepoCommand -DisplayCommand 'dotnet restore ContextLayer.slnx' -Action { & $dotnetCommand restore ContextLayer.slnx }

if ($demoMode -eq 'docker') {
    Write-Host 'Docker is available. Bootstrapping PostgreSQL-backed demo infrastructure.' -ForegroundColor Green
    Invoke-RepoCommand -DisplayCommand 'docker compose up -d postgres otel-collector prometheus tempo grafana' -Action {
        docker compose up -d postgres otel-collector prometheus tempo grafana
    }

    $postgresReady = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            docker compose exec -T postgres sh -lc 'pg_isready -U "${POSTGRES_USER:-postgres}" -d postgres' | Out-Null
            $postgresReady = $true
            break
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    if (-not $postgresReady) {
        throw 'PostgreSQL did not become ready within the expected time window.'
    }

    Invoke-RepoCommand -DisplayCommand 'dotnet tool run dotnet-ef database update --context CustomerOpsDbContext' -Action {
        & $dotnetCommand tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context CustomerOpsDbContext
    }
    Invoke-RepoCommand -DisplayCommand 'dotnet tool run dotnet-ef database update --context ContextLayerDbContext' -Action {
        & $dotnetCommand tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context ContextLayerDbContext
    }
    Invoke-RepoCommand -DisplayCommand 'dotnet run --project src/ContextLayer.Api -- bootstrap-demo' -Action {
        & $dotnetCommand run --project src/ContextLayer.Api -- bootstrap-demo
    }

    if ($StartContainers) {
        Invoke-RepoCommand -DisplayCommand 'docker compose up -d api web' -Action {
            docker compose up -d api web
        }
    }
}
else {
    Write-Host 'Docker is not available. Bootstrapping the local two-database demo using SQLite files for this machine.' -ForegroundColor Yellow
    $localDemoEnvironment = Get-LocalDemoEnvironment
    Invoke-WithEnvironment -Variables $localDemoEnvironment -DisplayCommand 'dotnet run --project src/ContextLayer.Api -- bootstrap-demo' -Action {
        & $dotnetCommand run --project src/ContextLayer.Api -- bootstrap-demo
    }
}

Invoke-RepoCommand -DisplayCommand 'npm install' -WorkingDirectory (Join-Path $repoRoot 'apps\web') -Action { npm.cmd install }

Write-Host ''
Write-Host 'Context Layer demo bootstrap complete.' -ForegroundColor Green
Write-Host "Mode: $demoMode" -ForegroundColor Yellow
Write-Host ''
Write-Host 'Start locally:' -ForegroundColor Yellow
Write-Host '  .\scripts\start-demo.ps1'
Write-Host ''
if ($demoMode -eq 'docker') {
    Write-Host 'Optional packaged containers:' -ForegroundColor Yellow
    Write-Host '  docker compose up -d api web'
    Write-Host ''
}
Write-Host 'URLs:' -ForegroundColor Yellow
Write-Host '  Web app:           http://127.0.0.1:5173'
Write-Host '  API base:          http://127.0.0.1:5198'
Write-Host '  GraphQL:           http://127.0.0.1:5198/graphql'
Write-Host '  Health:            http://127.0.0.1:5198/health'
if ($demoMode -eq 'docker') {
    Write-Host '  Grafana:           http://localhost:3000'
    Write-Host '  Prometheus:        http://localhost:9090'
    Write-Host '  Tempo:             http://localhost:3200'
}
Write-Host ''
Write-Host 'Demo credentials:' -ForegroundColor Yellow
Write-Host '  demo / admin@contextlayer.local / DemoAdmin123!'
Write-Host '  demo / rep@contextlayer.local / DemoSales123!'
Write-Host '  summit / admin@summit.contextlayer.local / SummitAdmin123!'
Write-Host '  summit / rep@summit.contextlayer.local / SummitSales123!'
Write-Host ''
Write-Host 'Seeded sample users:' -ForegroundColor Yellow
Write-Host '  demo   User 123  Avery Stone          Northstar Logistics'
Write-Host '  demo   User 126  Priya Nwosu          Harbor Health Systems'
Write-Host '  demo   User 129  Marcus Bell          Atlas Legal Cloud'
Write-Host '  summit User 132  Elena Petrov         Meridian Industrial Robotics'
Write-Host '  summit User 135  Calvin Reese         Cedar Financial Group'
