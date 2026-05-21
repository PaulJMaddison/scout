[CmdletBinding()]
param(
    [switch]$UseDocker
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$demoDataDirectory = Join-Path $repoRoot '.demo-data'
$demoRuntimeDirectory = Join-Path $repoRoot '.demo-runtime'
$apiLogPath = Join-Path $demoRuntimeDirectory 'api.log'
$apiErrorLogPath = Join-Path $demoRuntimeDirectory 'api-error.log'
$webLogPath = Join-Path $demoRuntimeDirectory 'web.log'
$webErrorLogPath = Join-Path $demoRuntimeDirectory 'web-error.log'
$apiPidPath = Join-Path $demoRuntimeDirectory 'api.pid'
$webPidPath = Join-Path $demoRuntimeDirectory 'web.pid'
$webWorkingDirectory = Join-Path $repoRoot 'apps\web'

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
    $contextDbPath = [System.IO.Path]::GetFullPath((Join-Path $demoDataDirectory 'scout_context_demo.db'))
    $customerOpsDbPath = [System.IO.Path]::GetFullPath((Join-Path $demoDataDirectory 'customer_ops_demo.db'))
    $licencePath = [System.IO.Path]::GetFullPath((Join-Path $demoDataDirectory 'scout-demo.licence.json'))
    return @{
        'ASPNETCORE_ENVIRONMENT' = 'Development'
        'ASPNETCORE_URLS' = 'http://127.0.0.1:5198'
        'Platform__Mode' = 'Demo'
        'Bootstrap__ApplyMigrationsOnStartup' = 'true'
        'Bootstrap__SeedDemoData' = 'true'
        'Database__Provider' = 'Sqlite'
        'ConnectionStrings__Scout' = "Data Source=$contextDbPath"
        'ConnectionStrings__CustomerOps' = "Data Source=$customerOpsDbPath"
        'Licence__Mode' = 'Community'
        'Licence__FilePath' = $licencePath
        'Cors__AllowedOrigins__0' = 'http://localhost:5173'
        'Cors__AllowedOrigins__1' = 'http://127.0.0.1:5173'
        'Telemetry__OtlpEndpoint' = ''
    }
}

function Get-DockerDemoEnvironment {
    $licencePath = [System.IO.Path]::GetFullPath((Join-Path $demoDataDirectory 'scout-demo.licence.json'))
    return @{
        'ASPNETCORE_ENVIRONMENT' = 'Development'
        'ASPNETCORE_URLS' = 'http://127.0.0.1:5198'
        'Platform__Mode' = 'Demo'
        'Bootstrap__ApplyMigrationsOnStartup' = 'true'
        'Bootstrap__SeedDemoData' = 'true'
        'Database__Provider' = 'Postgres'
        'ConnectionStrings__Scout' = 'Host=localhost;Port=5432;Database=scout_context_db;Username=postgres;Password=postgres'
        'ConnectionStrings__CustomerOps' = 'Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'
        'Licence__Mode' = 'Community'
        'Licence__FilePath' = $licencePath
        'Cors__AllowedOrigins__0' = 'http://localhost:5173'
        'Cors__AllowedOrigins__1' = 'http://127.0.0.1:5173'
        'Telemetry__OtlpEndpoint' = 'http://localhost:4317'
    }
}

function Ensure-DemoLicenceFile {
    $licencePath = Join-Path $demoDataDirectory 'scout-demo.licence.json'
    if (Test-Path $licencePath) {
        return
    }

    if (-not (Test-Path $demoDataDirectory)) {
        New-Item -ItemType Directory -Path $demoDataDirectory | Out-Null
    }

    $issuedAt = [DateTime]::UtcNow.AddDays(-1).ToString('O')
    $expiresAt = [DateTime]::UtcNow.AddYears(2).ToString('O')
    @"
{
  "licenceKey": "scout_demo_local_productisation_preview",
  "plan": "Community",
  "licensedTo": "KynticAI Scout local demo",
  "issuedAtUtc": "$issuedAt",
  "expiresAtUtc": "$expiresAt",
  "entitlements": {
    "open-core": "enabled",
    "local-demo": "enabled",
    "self-hosted-admin-console": "enabled",
    "enterprise-connectors": "not-in-public-repo"
  }
}
"@ | Set-Content -LiteralPath $licencePath
}

function Invoke-WithEnvironment {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Variables,
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [string]$WorkingDirectory = $repoRoot
    )

    $previous = @{}
    foreach ($entry in $Variables.GetEnumerator()) {
        $previous[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
        [Environment]::SetEnvironmentVariable($entry.Key, [string]$entry.Value, 'Process')
    }

    Push-Location $WorkingDirectory
    try {
        & $Action
    }
    finally {
        Pop-Location
        foreach ($entry in $previous.GetEnumerator()) {
            [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
        }
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

$dotnetCommand = & (Join-Path $PSScriptRoot 'ensure-dotnet.ps1') -RepoRoot $repoRoot
$nodeInstallDirectory = & (Join-Path $PSScriptRoot 'ensure-node.ps1') -RepoRoot $repoRoot
$env:PATH = "$nodeInstallDirectory;$env:PATH"
$dockerAvailable = Test-DockerAvailable
if ($UseDocker -and -not $dockerAvailable) {
    throw 'Docker mode was requested, but Docker is not available on this machine.'
}

$demoMode = if ($UseDocker) { 'docker' } else { 'sqlite' }

if (-not (Test-Path $demoRuntimeDirectory)) {
    New-Item -ItemType Directory -Path $demoRuntimeDirectory | Out-Null
}

if ($demoMode -eq 'sqlite' -and -not (Test-Path $demoDataDirectory)) {
    New-Item -ItemType Directory -Path $demoDataDirectory | Out-Null
}

Ensure-DemoLicenceFile

Stop-TrackedProcess -PidFile $apiPidPath
Stop-TrackedProcess -PidFile $webPidPath
Stop-RepoProcessByPattern -Name 'node.exe' -Pattern (Join-Path $repoRoot 'apps\web')
Stop-RepoProcessByPattern -Name 'dotnet.exe' -Pattern (Join-Path $repoRoot 'src\KynticAI.Scout.Api')

if ($demoMode -eq 'docker') {
    $dockerDemoEnvironment = Get-DockerDemoEnvironment
    Push-Location $repoRoot
    try {
        Write-Host '>> docker compose up -d postgres otel-collector prometheus tempo grafana' -ForegroundColor Cyan
        docker compose up -d postgres otel-collector prometheus tempo grafana
    }
    finally {
        Pop-Location
    }

    Write-Host '>> dotnet run --project src/KynticAI.Scout.Api -- bootstrap-demo' -ForegroundColor Cyan
    Invoke-WithEnvironment -Variables $dockerDemoEnvironment -Action {
        & $dotnetCommand run --project src/KynticAI.Scout.Api -- bootstrap-demo
    }
}
else {
    $localDemoEnvironment = Get-LocalDemoEnvironment
    Write-Host '>> dotnet run --project src/KynticAI.Scout.Api -- bootstrap-demo' -ForegroundColor Cyan
    Invoke-WithEnvironment -Variables $localDemoEnvironment -Action {
        & $dotnetCommand run --project src/KynticAI.Scout.Api -- bootstrap-demo
    }
}

$backendEnvironment = if ($demoMode -eq 'docker') {
    Get-DockerDemoEnvironment
}
else {
    Get-LocalDemoEnvironment
}

$backendScript = @"
Set-Location '$repoRoot'
`$env:ASPNETCORE_ENVIRONMENT = '$($backendEnvironment['ASPNETCORE_ENVIRONMENT'])'
`$env:ASPNETCORE_URLS = '$($backendEnvironment['ASPNETCORE_URLS'])'
"@

foreach ($entry in $backendEnvironment.GetEnumerator()) {
    if ($entry.Key -in @('ASPNETCORE_ENVIRONMENT', 'ASPNETCORE_URLS')) {
        continue
    }

    $escapedValue = ([string]$entry.Value).Replace("'", "''")
    $backendScript += "`n`$env:$($entry.Key) = '$escapedValue'"
}

$backendScript += "`n& '$dotnetCommand' run --project src/KynticAI.Scout.Api"

$apiProcess = Start-Process -FilePath 'powershell' `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $backendScript `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $apiLogPath `
    -RedirectStandardError $apiErrorLogPath `
    -PassThru
$apiProcess.Id | Set-Content -LiteralPath $apiPidPath

Wait-ForUrl -Url 'http://127.0.0.1:5198/health'

$loginResponse = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5198/api/auth/login' -ContentType 'application/json' -Body (@{
        tenantSlug = 'demo'
        email = 'admin@scout.local'
        password = 'DemoAdmin123!'
    } | ConvertTo-Json)

$graphqlHeaders = @{
    Authorization = "Bearer $($loginResponse.accessToken)"
    'Content-Type' = 'application/json'
}

$graphqlPayload = @{
    operationName = 'StartupContextCheck'
    query = @'
query StartupContextCheck($tenantSlug: String!, $externalUserId: String!) {
  userContext(input: { tenantSlug: $tenantSlug, externalUserId: $externalUserId }) {
    fullName
    companyName
    summary
    facts {
      attributeKey
      confidence
    }
  }
}
'@
    variables = @{
        tenantSlug = 'demo'
        externalUserId = '123'
    }
} | ConvertTo-Json -Depth 10

$graphqlResponse = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5198/graphql' -Headers $graphqlHeaders -Body $graphqlPayload
if (-not $graphqlResponse.data.userContext) {
    throw 'GraphQL startup verification failed: user context for User 123 was not returned.'
}

$webScript = @"
Set-Location '$webWorkingDirectory'
`$env:PATH = '$($nodeInstallDirectory.Replace("'", "''"))' + [System.IO.Path]::PathSeparator + `$env:PATH
`$env:BROWSER = 'none'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
"@

$webProcess = Start-Process -FilePath 'powershell' `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $webScript `
    -WorkingDirectory $webWorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $webLogPath `
    -RedirectStandardError $webErrorLogPath `
    -PassThru
$webProcess.Id | Set-Content -LiteralPath $webPidPath

Wait-ForUrl -Url 'http://127.0.0.1:5173'

Write-Host ''
Write-Host 'Scout is running.' -ForegroundColor Green
Write-Host "Mode: $demoMode" -ForegroundColor Yellow
Write-Host 'Web:     http://127.0.0.1:5173'
Write-Host 'API:     http://127.0.0.1:5198'
Write-Host 'GraphQL: http://127.0.0.1:5198/graphql'
Write-Host ''
Write-Host 'Demo login:' -ForegroundColor Yellow
Write-Host '  demo / admin@scout.local / DemoAdmin123!'
Write-Host '  demo / rep@scout.local / DemoSales123!'
