Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Checking AeroSentinel Total Project Footprint..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $PSScriptRoot
$totalBytes = (Get-ChildItem -Recurse $root | Measure-Object -Property Length -Sum).Sum
$totalMB = [math]::Round($totalBytes / 1MB, 2)

Write-Host "Total Project Size: $totalMB MB ($totalBytes bytes)" -ForegroundColor Yellow

if ($totalMB -lt 500) {
    Write-Host "PASSED: Project size is strictly below the 500 MB hackathon limit." -ForegroundColor Green
} else {
    Write-Host "FAILED: Project size exceeds 500 MB." -ForegroundColor Red
}
