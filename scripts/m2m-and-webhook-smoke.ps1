[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:5198",
    [string]$TenantSlug = "demo",
    [string]$AdminEmail = "admin@contextlayer.local",
    [string]$AdminPassword = "DemoAdmin123!"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        $Body = $null,
        [hashtable]$Headers = @()
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

function Invoke-Status {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body,
        [hashtable]$Headers
    )

    try {
        Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -ContentType "application/json" -Body $Body -UseBasicParsing | Select-Object -ExpandProperty StatusCode
    } catch {
        if ($_.Exception.Response) {
            return [int]$_.Exception.Response.StatusCode
        }
        throw
    }
}

function New-UclWebhookSignature {
    param([string]$Secret, [string]$Timestamp, [string]$EventId, [string]$Body)
    $payload = "$Timestamp.$EventId.$Body"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($Secret))
    try {
        $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
        return "sha256=" + [Convert]::ToHexString($hash).ToLowerInvariant()
    } finally {
        $hmac.Dispose()
    }
}

try {
    Invoke-RestMethod "$BaseUrl/api/v1/health" | Out-Null
} catch {
    Write-Host "Backend is not reachable at $BaseUrl."
    Write-Host "Start it with:"
    Write-Host "  .\scripts\start-demo.ps1"
    Write-Host "or:"
    Write-Host "  dotnet run --project .\src\ContextLayer.Api\ContextLayer.Api.csproj --urls $BaseUrl"
    exit 2
}

$login = Invoke-Json POST "$BaseUrl/api/auth/login" @{
    tenantSlug = $TenantSlug
    email = $AdminEmail
    password = $AdminPassword
}
$adminHeaders = @{ Authorization = "Bearer $($login.accessToken)" }

$client = Invoke-Json POST "$BaseUrl/api/v1/api-clients" @{
    displayName = "Local M2M and webhook smoke"
    workspaceSlug = "primary"
    scopes = @("context:read", "events:ingest", "admin:manage")
} $adminHeaders

$token = Invoke-Json POST "$BaseUrl/api/auth/token" @{
    grantType = "client_credentials"
    clientId = $client.clientId
    clientSecret = $client.apiKey
    scope = "context:read events:ingest"
}

Invoke-Json GET "$BaseUrl/api/v1/workspaces?tenantSlug=$TenantSlug" $null @{ Authorization = "Bearer $($token.accessToken)" } | Out-Null

$apiKeyHeaders = @{
    "X-API-Client-Id" = $client.clientId
    "X-API-Key" = $client.apiKey
}

$secret = Invoke-Json POST "$BaseUrl/api/v1/webhook-signing-secrets" @{
    displayName = "Local webhook smoke"
    workspaceSlug = "primary"
} $apiKeyHeaders

$eventId = "evt-local-smoke-" + [Guid]::NewGuid().ToString("N")
$event = [ordered]@{
    eventId = $eventId
    workspaceSlug = "primary"
    sourceSystem = "local-smoke"
    eventType = "account.updated"
    externalUserId = "user-123"
    externalAccountId = "acct-123"
    observedAtUtc = (Get-Date).ToUniversalTime().ToString("O")
    payload = @{ health = "green"; aggregateOnly = $true }
}
$body = $event | ConvertTo-Json -Depth 20 -Compress
$timestamp = (Get-Date).ToUniversalTime().ToString("O")
$signature = New-UclWebhookSignature -Secret $secret.secret -Timestamp $timestamp -EventId $eventId -Body $body

$signedHeaders = $apiKeyHeaders.Clone()
$signedHeaders["X-UCL-Webhook-Secret-Id"] = $secret.secretId
$signedHeaders["X-UCL-Webhook-Secret"] = $secret.secret
$signedHeaders["X-UCL-Webhook-Timestamp"] = $timestamp
$signedHeaders["X-UCL-Webhook-Signature"] = $signature

$accepted = Invoke-Status POST "$BaseUrl/api/v1/events/source-system" $body $signedHeaders
$replay = Invoke-Status POST "$BaseUrl/api/v1/events/source-system" $body $signedHeaders

$badHeaders = $signedHeaders.Clone()
$badHeaders["X-UCL-Webhook-Signature"] = "sha256=bad"
$badEvent = [ordered]@{
    eventId = "$eventId-bad"
    workspaceSlug = "primary"
    sourceSystem = "local-smoke"
    eventType = "account.updated"
    externalUserId = "user-123"
    externalAccountId = "acct-123"
    observedAtUtc = (Get-Date).ToUniversalTime().ToString("O")
    payload = @{ health = "green"; aggregateOnly = $true }
}
$badBody = $badEvent | ConvertTo-Json -Depth 20 -Compress
$bad = Invoke-Status POST "$BaseUrl/api/v1/events/source-system" $badBody $badHeaders

if ($accepted -ne 202 -or $replay -ne 401 -or $bad -ne 401) {
    throw "Unexpected webhook smoke statuses. accepted=$accepted replay=$replay bad=$bad"
}

Write-Host "M2M token request succeeded."
Write-Host "Scoped API call succeeded."
Write-Host "Webhook signing secret created."
Write-Host "Signed event accepted, replay rejected, and bad signature rejected."
Write-Host "No secrets were printed."
