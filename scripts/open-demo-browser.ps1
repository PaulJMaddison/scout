param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$TenantSlug = "demo",
  [string]$Email = "admin@contextlayer.local",
  [string]$Password = "DemoAdmin123!",
  [string]$TargetPath = "/demo"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction Stop
$nodePath = $nodeCommand.Source
$demoDir = Join-Path $repoRoot ".demo"
$logPath = Join-Path $demoDir "open-demo-browser.log"
$errPath = Join-Path $demoDir "open-demo-browser.err.log"

New-Item -ItemType Directory -Force -Path $demoDir | Out-Null
Remove-Item $logPath, $errPath -Force -ErrorAction SilentlyContinue

$arguments = @(
  (Join-Path $repoRoot "scripts/open-demo-browser.mjs"),
  "--base-url=$BaseUrl",
  "--tenant=$TenantSlug",
  "--email=$Email",
  "--password=$Password",
  "--target=$TargetPath"
)

$process = Start-Process `
  -FilePath $nodePath `
  -ArgumentList $arguments `
  -WorkingDirectory (Join-Path $repoRoot "apps/web") `
  -RedirectStandardOutput $logPath `
  -RedirectStandardError $errPath `
  -PassThru

$deadline = (Get-Date).AddSeconds(45)

while ((Get-Date) -lt $deadline) {
  if (Test-Path $logPath) {
    $logContent = Get-Content $logPath -Raw
    if ($logContent -match "READY:(.+)") {
      Write-Host "Browser launched and signed in at $($matches[1])"
      Write-Host "Background process id: $($process.Id)"
      exit 0
    }
  }

  if (Test-Path $errPath) {
    $errContent = Get-Content $errPath -Raw
    if ($errContent -match "ERROR:") {
      Write-Error $errContent
    }
  }

  Start-Sleep -Milliseconds 500
}

Write-Warning "Browser process started but the ready signal did not arrive within 45 seconds."
Write-Host "Process id: $($process.Id)"
if (Test-Path $logPath) {
  Get-Content $logPath
}
