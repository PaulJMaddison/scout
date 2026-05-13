[CmdletBinding()]
param(
    [string]$ExpectedBranch = "pjm/v2-next-public-core",
    [ValidateSet("MainAfterPromotion", "TagAfterPromotion", "FeaturePreviewOnly")]
    [string]$HostingPlan = "MainAfterPromotion"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    $output = & git @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    return (($output | Out-String).Trim())
}

function Write-Value {
    param([string]$Name, [string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        $Value = "(none)"
    }

    Write-Host ("{0}: {1}" -f $Name, $Value)
}

$branch = Invoke-Git @("branch", "--show-current")
$upstream = Invoke-Git @("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}")
$status = Invoke-Git @("status", "--short")
$latestTag = Invoke-Git @("describe", "--tags", "--abbrev=0")
$ahead = "unknown"
$behind = "unknown"

if (-not [string]::IsNullOrWhiteSpace($upstream)) {
    $counts = Invoke-Git @("rev-list", "--left-right", "--count", "HEAD...@{upstream}")
    if ($counts -match "^\s*(\d+)\s+(\d+)\s*$") {
        $ahead = $Matches[1]
        $behind = $Matches[2]
    }
}

Write-Host "Universal Context Layer public release alignment"
Write-Value "Repository" $repoRoot
Write-Value "Current branch" $branch
Write-Value "Expected readiness branch" $ExpectedBranch
Write-Value "Upstream" $upstream
Write-Value "Ahead" $ahead
Write-Value "Behind" $behind
Write-Value "Latest tag" $latestTag
Write-Value "Working tree clean" (([string]::IsNullOrWhiteSpace($status)).ToString())
Write-Value "Hosting plan" $HostingPlan

if (Get-Command gh -ErrorAction SilentlyContinue) {
    try {
        $release = @(gh release list --limit 1 --json tagName,name,isDraft,isPrerelease,publishedAt | ConvertFrom-Json)
        if ($release.Count -gt 0) {
            Write-Value "Latest GitHub release" ("{0} ({1}) draft={2} prerelease={3}" -f $release[0].tagName, $release[0].name, $release[0].isDraft, $release[0].isPrerelease)
        } else {
            Write-Value "Latest GitHub release" "(none)"
        }
    } catch {
        Write-Warning "gh is available but release lookup failed: $($_.Exception.Message)"
    }
} else {
    Write-Value "Latest GitHub release" "gh not available"
}

if ($branch -ne $ExpectedBranch) {
    Write-Warning "Current branch is not the expected readiness branch."
}

if ($HostingPlan -eq "FeaturePreviewOnly") {
    Write-Warning "Feature branch hosting must remain private preview only. Production hosting should use main or a reviewed tag after promotion."
}

if ($HostingPlan -eq "MainAfterPromotion" -and $branch -ne "main") {
    Write-Warning "Production hosting should point at main only after this branch is reviewed and promoted."
}

if ($HostingPlan -eq "TagAfterPromotion" -and [string]::IsNullOrWhiteSpace($latestTag)) {
    Write-Warning "Tag-based hosting is planned but no tag was found locally."
}

if (-not [string]::IsNullOrWhiteSpace($status)) {
    Write-Warning "Working tree is not clean. Review local changes before release or hosting decisions."
}

Write-Host "No merge, tag, release, push, or hosting change was performed."
