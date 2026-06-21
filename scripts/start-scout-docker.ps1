[CmdletBinding()]
param(
    [switch]$Reset,
    [switch]$NoBuild,
    [switch]$NoOpenReport
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot

function Assert-Command {
    param([Parameter(Mandatory = $true)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Invoke-Compose {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    Push-Location $repoRoot
    try {
        Write-Host ">> docker compose $($Arguments -join ' ')" -ForegroundColor Cyan
        docker compose @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Wait-ForUrl {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$Attempts = 60,
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

function Get-LanIPAddress {
    $addresses = @(
        Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPAddress -notlike '127.*' -and
                $_.IPAddress -notlike '169.254*' -and
                $_.AddressState -eq 'Preferred'
            }
    )

    $preferred = $addresses |
        Where-Object { $_.InterfaceAlias -notmatch 'vEthernet|Docker|WSL|Loopback|VirtualBox|VMware' } |
        Select-Object -First 1

    if ($preferred) {
        return $preferred.IPAddress
    }

    return ($addresses | Select-Object -First 1).IPAddress
}

function Get-ScoutBindAddress {
    $processValue = [Environment]::GetEnvironmentVariable('SCOUT_BIND_ADDRESS', 'Process')
    if (-not [string]::IsNullOrWhiteSpace($processValue)) {
        return $processValue.Trim().Trim('"', "'")
    }

    $envPath = Join-Path $repoRoot '.env'
    if (Test-Path $envPath) {
        $line = Get-Content -LiteralPath $envPath |
            Where-Object { $_ -match '^\s*SCOUT_BIND_ADDRESS\s*=' } |
            Select-Object -First 1
        if ($line -and $line -match '^\s*SCOUT_BIND_ADDRESS\s*=\s*(?<value>.+?)\s*$') {
            return $Matches.value.Trim().Trim('"', "'")
        }
    }

    return '127.0.0.1'
}

function Test-LanExposureEnabled {
    param([AllowNull()][string]$BindAddress)

    $normalised = if ([string]::IsNullOrWhiteSpace($BindAddress)) {
        '127.0.0.1'
    }
    else {
        $BindAddress.Trim().Trim('"', "'").ToLowerInvariant()
    }

    return $normalised -notin @('127.0.0.1', 'localhost', '::1')
}

function ConvertTo-HtmlText {
    param([AllowNull()][object]$Value)
    return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function New-InstallReport {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Report
    )

    $reportDir = Join-Path $repoRoot '.local'
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    $reportPath = Join-Path $reportDir 'scout-install-report.html'

    $lanSection = if ($Report.LanExposureEnabled -and $Report.LanIpAddress) {
@"
        <tr><th>LAN web</th><td><a href="http://$($Report.LanIpAddress):5173">http://$($Report.LanIpAddress):5173</a></td></tr>
        <tr><th>LAN API</th><td><a href="http://$($Report.LanIpAddress):5198">http://$($Report.LanIpAddress):5198</a></td></tr>
        <tr><th>LAN webhook</th><td><code>http://$($Report.LanIpAddress):5198/api/v1/events/source-system?tenantSlug=demo</code></td></tr>
"@
    }
    else {
        '<tr><th>LAN webhook</th><td>LAN exposure is disabled. Docker ports are bound to localhost by default; set <code>SCOUT_BIND_ADDRESS=0.0.0.0</code> only on a trusted LAN/VPN.</td></tr>'
    }

    $lanTest = if ($Report.LanWebhookStatus) {
        "IP webhook test through <code>$($Report.LanApiUrl)</code>: event was <strong>$(ConvertTo-HtmlText $Report.LanWebhookStatus)</strong>, stored <strong>$(ConvertTo-HtmlText $Report.LanStoredSignalCount)</strong> signal, matched <strong>$(ConvertTo-HtmlText $Report.LanMatchedSelectorCount)</strong> selectors."
    }
    elseif (-not $Report.LanExposureEnabled) {
        'LAN/IP webhook smoke was skipped because published Docker ports are bound to localhost by default.'
    }
    else {
        'LAN/IP webhook smoke was skipped because no LAN IP was detected or the private address was not reachable from this host.'
    }

    $lanSummary = if ($Report.LanExposureEnabled -and $Report.LanIpAddress) {
        "printed LAN URL $(ConvertTo-HtmlText $Report.LanIpAddress)."
    }
    else {
        "kept LAN/private-network endpoints disabled; published bind address is <code>$(ConvertTo-HtmlText $Report.BindAddress)</code>."
    }

    $html = @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>KynticAI Scout Installation Report</title>
  <style>
    :root { color-scheme: light; --ink:#1f2320; --muted:#5f655f; --line:#d9ddd4; --paper:#fffaf4; --panel:#ffffff; --sage:#5f7d62; --copper:#b45f35; --gold:#8d6b2f; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f6f0e8; color:var(--ink); }
    main { max-width:1120px; margin:0 auto; padding:34px 20px 54px; }
    header { display:grid; gap:14px; padding:28px; border:1px solid var(--line); border-radius:24px; background:linear-gradient(135deg,#1f2320,#3a2d28); color:#fffaf4; box-shadow:0 18px 45px rgba(31,35,32,.14); }
    h1 { margin:0; font-size:clamp(2rem,4vw,3.4rem); line-height:1; letter-spacing:0; }
    h2 { margin:0 0 14px; font-size:1.35rem; }
    p { line-height:1.65; color:var(--muted); }
    header p { color:#eadfd1; max-width:850px; }
    section { margin-top:18px; padding:24px; border:1px solid var(--line); border-radius:22px; background:var(--panel); box-shadow:0 12px 30px rgba(31,35,32,.08); }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:12px 0; border-bottom:1px solid #ece7df; text-align:left; vertical-align:top; }
    th { width:220px; color:#394039; }
    td { color:var(--muted); }
    a { color:#8f4b2a; font-weight:700; }
    code { display:inline-block; max-width:100%; overflow-wrap:anywhere; border-radius:10px; background:#1f2320; color:#fffaf4; padding:2px 7px; font-family:"Cascadia Mono", Consolas, monospace; font-size:.92em; }
    .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); }
    .card { padding:16px; border:1px solid #e6ded3; border-radius:16px; background:#fffdf9; }
    .badge { display:inline-flex; align-items:center; border-radius:999px; padding:5px 10px; font-size:.82rem; font-weight:800; background:#e4f0e1; color:#345a39; }
    .warn { background:#fff4d8; color:#6b4e12; }
    .fail { background:#fae4e0; color:#8f2c1f; }
    ul, ol { margin:0; padding-left:22px; }
    li { margin:8px 0; line-height:1.55; color:var(--muted); }
    .actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
    .actions a { display:inline-flex; text-decoration:none; border-radius:999px; padding:10px 14px; background:var(--copper); color:#fffaf4; }
    .actions a.secondary { background:#eef2ea; color:#314034; }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="badge">Install self-test complete</div>
      <h1>KynticAI Scout is running locally</h1>
      <p>This report was generated by <code>scripts/start-scout-docker.ps1</code> after Docker Compose started, the API became healthy, the demo context was queried, connectors were tested, and a source event was accepted.</p>
      <p>Generated at $(ConvertTo-HtmlText $Report.GeneratedAt).</p>
      <div class="actions">
        <a href="http://127.0.0.1:5173">Open Scout web console</a>
        <a class="secondary" href="http://127.0.0.1:5198/api-docs">Open API docs</a>
        <a class="secondary" href="http://127.0.0.1:5173/data-sources">Open connector lab</a>
      </div>
    </header>

    <section>
      <h2>Verified on this laptop</h2>
      <ul>
        <li><strong>Build:</strong> $(ConvertTo-HtmlText $Report.BuildStatus)</li>
        <li><strong>Docker stack:</strong> running; API and Postgres health checks are healthy.</li>
        <li><strong>Start script:</strong> $lanSummary</li>
        <li><strong>Demo context:</strong> User 123 returned $(ConvertTo-HtmlText $Report.DemoUser) / $(ConvertTo-HtmlText $Report.DemoCompany).</li>
        <li><strong>Connector test:</strong> mock CRM configuration validated, connector registered, health check returned $(ConvertTo-HtmlText $Report.ConnectorHealthStatus).</li>
        <li><strong>Local webhook test:</strong> event was $(ConvertTo-HtmlText $Report.LocalWebhookStatus), stored $(ConvertTo-HtmlText $Report.LocalStoredSignalCount) signal, matched $(ConvertTo-HtmlText $Report.LocalMatchedSelectorCount) selectors.</li>
        <li>$lanTest</li>
      </ul>
    </section>

    <section>
      <h2>Current running URLs</h2>
      <table>
        <tr><th>Web console</th><td><a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a></td></tr>
        <tr><th>API</th><td><a href="http://127.0.0.1:5198">http://127.0.0.1:5198</a></td></tr>
        <tr><th>GraphQL</th><td><a href="http://127.0.0.1:5198/graphql">http://127.0.0.1:5198/graphql</a></td></tr>
        <tr><th>OpenAPI / Scalar</th><td><a href="http://127.0.0.1:5198/api-docs">http://127.0.0.1:5198/api-docs</a></td></tr>
        <tr><th>Grafana</th><td><a href="http://127.0.0.1:3000">http://127.0.0.1:3000</a> (<code>admin</code> / <code>admin</code>)</td></tr>
        <tr><th>Prometheus</th><td><a href="http://127.0.0.1:9090">http://127.0.0.1:9090</a></td></tr>
        <tr><th>Published bind address</th><td><code>$(ConvertTo-HtmlText $Report.BindAddress)</code></td></tr>
        $lanSection
      </table>
    </section>

    <section>
      <h2>Login</h2>
      <table>
        <tr><th>Tenant</th><td><code>demo</code></td></tr>
        <tr><th>Email</th><td><code>admin@scout.local</code></td></tr>
        <tr><th>Password</th><td><code>DemoAdmin123!</code></td></tr>
      </table>
    </section>

    <section>
      <h2>First walkthrough</h2>
      <ol>
        <li>Open <a href="http://127.0.0.1:5173/demo">/demo</a> for the executive story.</li>
        <li>Open <a href="http://127.0.0.1:5173/customers/123">/customers/123</a> for Avery Stone at Larkspur Logistics Group.</li>
        <li>Open <a href="http://127.0.0.1:5173/relationship-intelligence">/relationship-intelligence</a> to inspect exact linked records, relationships, citations, masking, and next action.</li>
        <li>Open <a href="http://127.0.0.1:5173/data-sources">/data-sources</a> to validate/register a connector, run health, and send a source event.</li>
        <li>Open <a href="http://127.0.0.1:5173/admin/events">/admin/events</a> to see source events and selector-triggered recomputation.</li>
        <li>Open <a href="http://127.0.0.1:5173/admin/connectors">/admin/connectors</a> to see executable open-core connectors versus enterprise/SaaS placeholders.</li>
      </ol>
    </section>

    <section>
      <h2>Webhook use</h2>
      <p>For local workshops, LAN/VPN testing, or static private IP installs, point source systems at the LAN webhook URL above. For public internet webhooks, use HTTPS with a stable DNS name or reverse proxy.</p>
      <p>Machine integrations should use an API client with <code>events:ingest</code> and webhook HMAC signing. The web console connector lab uses your logged-in admin token for a safe local smoke test.</p>
    </section>

    <section>
      <h2>Useful commands</h2>
      <div class="grid">
        <div class="card"><strong>Status</strong><p><code>docker compose ps</code></p></div>
        <div class="card"><strong>Logs</strong><p><code>docker compose logs -f api web</code></p></div>
        <div class="card"><strong>Stop</strong><p><code>docker compose down</code></p></div>
        <div class="card"><strong>Clean reset</strong><p><code>.\scripts\start-scout-docker.ps1 -Reset</code></p></div>
        <div class="card"><strong>Upgrade</strong><p><code>git pull</code><br><code>.\scripts\start-scout-docker.ps1</code></p></div>
      </div>
    </section>
  </main>
</body>
</html>
"@

    Set-Content -Path $reportPath -Value $html -Encoding UTF8
    return $reportPath
}

Assert-Command -Name 'docker'

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker is installed, but the Docker engine is not running. Start Docker Desktop and run this script again.'
}

if ($Reset) {
    Invoke-Compose -Arguments @('down', '--remove-orphans', '-v')
}

$upArguments = @('up', '-d')
if (-not $NoBuild) {
    $upArguments += '--build'
}

Invoke-Compose -Arguments $upArguments

Wait-ForUrl -Url 'http://127.0.0.1:5198/health/ready'
Wait-ForUrl -Url 'http://127.0.0.1:5173'

$loginResponse = Invoke-RestMethod -Method Post `
    -Uri 'http://127.0.0.1:5198/api/auth/login' `
    -ContentType 'application/json' `
    -Body (@{
        tenantSlug = 'demo'
        email = 'admin@scout.local'
        password = 'DemoAdmin123!'
    } | ConvertTo-Json)

$contextResponse = Invoke-RestMethod -Method Get `
    -Uri 'http://127.0.0.1:5198/api/v1/context/users/123?tenantSlug=demo' `
    -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" }

if (-not $contextResponse.fullName) {
    throw 'Startup smoke test failed: demo user 123 context was not returned.'
}

$bindAddress = Get-ScoutBindAddress
$lanExposureEnabled = Test-LanExposureEnabled -BindAddress $bindAddress
$lanIpAddress = if ($lanExposureEnabled) { Get-LanIPAddress } else { $null }
$buildStatus = if ($NoBuild) {
    'Skipped by -NoBuild; existing Docker images were reused.'
}
else {
    'Passed. Docker built the web image, including npm run build, and built the API image.'
}

$connectorConfigJson = @{
    scenario = 'safe-local-demo'
    records = @(
        @{
            externalUserId = '123'
            observedAtUtc = '2026-05-11T10:45:00Z'
            payload = @{
                crm = @{
                    lifecycleStage = 'customer'
                    opportunityStage = 'proposal'
                    preferredChannel = 'email'
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

$connectorValidation = Invoke-RestMethod -Method Post `
    -Uri 'http://127.0.0.1:5198/api/rest/connectors/validate' `
    -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" } `
    -ContentType 'application/json' `
    -Body (@{
        connectorType = 'mockCrm'
        kind = 1
        configurationJson = $connectorConfigJson
        credentialsJson = $null
    } | ConvertTo-Json -Depth 10)

if (-not $connectorValidation.isValid) {
    throw "Connector validation failed: $($connectorValidation.errors -join '; ')"
}

$dataSourcesQuery = @'
query GetDataSources($tenantSlug: String!) {
  dataSources(tenantSlug: $tenantSlug) {
    id
    name
  }
}
'@
$dataSourcesResponse = Invoke-RestMethod -Method Post `
    -Uri 'http://127.0.0.1:5198/graphql' `
    -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" } `
    -ContentType 'application/json' `
    -Body (@{
        operationName = 'GetDataSources'
        query = $dataSourcesQuery
        variables = @{ tenantSlug = 'demo' }
    } | ConvertTo-Json -Depth 10)
$existingSmokeSource = @($dataSourcesResponse.data.dataSources) |
    Where-Object { $_.name -eq 'Mock CRM connector install smoke' } |
    Select-Object -First 1
$existingSmokeSourceId = if ($existingSmokeSource) { [string]$existingSmokeSource.id } else { $null }

$connectorRegistration = Invoke-RestMethod -Method Post `
    -Uri 'http://127.0.0.1:5198/api/rest/connectors/register' `
    -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" } `
    -ContentType 'application/json' `
    -Body (@{
        id = $existingSmokeSourceId
        tenantSlug = 'demo'
        name = 'Mock CRM connector install smoke'
        description = 'Safe connector smoke-test data source generated by the Docker start script.'
        kind = 1
        connectorType = 'mockCrm'
        configurationJson = $connectorConfigJson
        credentialsJson = $null
    } | ConvertTo-Json -Depth 10)

$connectorHealth = Invoke-RestMethod -Method Post `
    -Uri 'http://127.0.0.1:5198/api/rest/connectors/health' `
    -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" } `
    -ContentType 'application/json' `
    -Body (@{
        tenantSlug = 'demo'
        dataSourceId = $connectorRegistration.dataSourceId
        externalUserId = '123'
        mode = 'preview'
    } | ConvertTo-Json -Depth 10)

if (-not $connectorHealth.isHealthy) {
    throw "Connector health check failed: $($connectorHealth.messages -join '; ')"
}

$localEventId = "install-report-local-$(Get-Date -Format yyyyMMddHHmmss)"
$localWebhook = Invoke-RestMethod -Method Post `
    -Uri 'http://127.0.0.1:5198/api/v1/events/source-system?tenantSlug=demo' `
    -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" } `
    -ContentType 'application/json' `
    -Body (@{
        eventId = $localEventId
        sourceSystem = 'customer_context_rollups'
        eventType = 'source.product_usage.rollup_ready'
        externalUserId = '123'
        externalAccountId = 'acct-larkspur-logistics'
        payload = @{
            active_days_30 = 26
            pricing_page_visits_30 = 4
            source = 'install-report-local'
        }
    } | ConvertTo-Json -Depth 10)

$lanWebhook = $null
if ($lanExposureEnabled -and $lanIpAddress) {
    try {
        $lanApiUrl = "http://$($lanIpAddress):5198"
        Invoke-RestMethod -Method Get -Uri "$lanApiUrl/health/ready" -TimeoutSec 10 | Out-Null
        $lanEventId = "install-report-lan-$(Get-Date -Format yyyyMMddHHmmss)"
        $lanWebhook = Invoke-RestMethod -Method Post `
            -Uri "$lanApiUrl/api/v1/events/source-system?tenantSlug=demo" `
            -Headers @{ Authorization = "Bearer $($loginResponse.accessToken)" } `
            -ContentType 'application/json' `
            -Body (@{
                eventId = $lanEventId
                sourceSystem = 'customer_context_rollups'
                eventType = 'source.product_usage.rollup_ready'
                externalUserId = '123'
                externalAccountId = 'acct-larkspur-logistics'
                payload = @{
                    active_days_30 = 26
                    pricing_page_visits_30 = 4
                    source = 'install-report-lan'
                }
            } | ConvertTo-Json -Depth 10)
    }
    catch {
        $lanWebhook = $null
    }
}

$reportPath = New-InstallReport -Report @{
    GeneratedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz')
    BuildStatus = $buildStatus
    DemoUser = $contextResponse.fullName
    DemoCompany = $contextResponse.companyName
    LanIpAddress = $lanIpAddress
    BindAddress = $bindAddress
    LanExposureEnabled = $lanExposureEnabled
    LanApiUrl = if ($lanIpAddress) { "http://$($lanIpAddress):5198" } else { $null }
    ConnectorHealthStatus = $connectorHealth.status
    LocalWebhookStatus = $localWebhook.status
    LocalStoredSignalCount = $localWebhook.storedSignalCount
    LocalMatchedSelectorCount = $localWebhook.matchedSelectorCount
    LanWebhookStatus = if ($lanWebhook) { $lanWebhook.status } else { $null }
    LanStoredSignalCount = if ($lanWebhook) { $lanWebhook.storedSignalCount } else { $null }
    LanMatchedSelectorCount = if ($lanWebhook) { $lanWebhook.matchedSelectorCount } else { $null }
}

Write-Host ''
Write-Host 'Scout Docker stack is running.' -ForegroundColor Green
Write-Host 'Web app:      http://127.0.0.1:5173'
Write-Host 'API:          http://127.0.0.1:5198'
Write-Host 'GraphQL:      http://127.0.0.1:5198/graphql'
Write-Host 'OpenAPI:      http://127.0.0.1:5198/api-docs'
Write-Host 'Grafana:      http://127.0.0.1:3000'
Write-Host 'Prometheus:   http://127.0.0.1:9090'
if ($lanExposureEnabled -and $lanIpAddress) {
    Write-Host ''
    Write-Host 'LAN / private-network endpoints:' -ForegroundColor Yellow
    Write-Host "LAN web app:  http://$($lanIpAddress):5173"
    Write-Host "LAN API:      http://$($lanIpAddress):5198"
    Write-Host "Webhook URL:  http://$($lanIpAddress):5198/api/v1/events/source-system?tenantSlug=demo"
    Write-Host 'Use the LAN webhook URL only on a trusted LAN/VPN, or put HTTPS/reverse-proxy/DNS in front of it.'
}
else {
    Write-Host ''
    Write-Host 'LAN / private-network endpoints are disabled by default.' -ForegroundColor Yellow
    Write-Host "Published bind address: $bindAddress"
    Write-Host 'Set SCOUT_BIND_ADDRESS=0.0.0.0 only when you intentionally expose the demo on a trusted LAN/VPN.'
}
Write-Host ''
Write-Host 'Demo login:' -ForegroundColor Yellow
Write-Host '  Tenant:   demo'
Write-Host '  Email:    admin@scout.local'
Write-Host '  Password: DemoAdmin123!'
Write-Host ''
Write-Host "Smoke test user: $($contextResponse.fullName) / $($contextResponse.companyName)"
Write-Host "Install report: $reportPath" -ForegroundColor Green
if (-not $NoOpenReport) {
    Start-Process $reportPath
}
Write-Host ''
Invoke-Compose -Arguments @('ps')
