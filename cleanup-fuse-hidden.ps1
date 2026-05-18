# cleanup-fuse-hidden.ps1
# Removes the .fuse_hidden* zombie files left over from FUSE-mediated deletions.
# Safe to re-run. Reports which files were locked so you know if a reboot is needed.
#
# Usage:
#   1. Open PowerShell in the repo folder (Shift+right-click in Explorer -> "Open in Terminal")
#   2. If you've never run a local script before, allow it for this session:
#        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   3. Run:
#        .\cleanup-fuse-hidden.ps1

$ErrorActionPreference = 'Continue'
$repo = $PSScriptRoot
if (-not $repo) { $repo = Get-Location }

Write-Host ""
Write-Host "Scanning $repo for .fuse_hidden* files..." -ForegroundColor Cyan

$files = Get-ChildItem -Path $repo -Force -Recurse -Filter '.fuse_hidden*' -ErrorAction SilentlyContinue
if (-not $files) {
    Write-Host "None found. You're clean." -ForegroundColor Green
    exit 0
}

Write-Host ("Found {0} file(s):" -f $files.Count) -ForegroundColor Yellow
$files | ForEach-Object { Write-Host ("  {0,10} bytes  {1}" -f $_.Length, $_.FullName) }
Write-Host ""

$removed = @()
$locked  = @()

foreach ($f in $files) {
    try {
        # Clear hidden/system/readonly attrs first so Remove-Item doesn't choke
        $f.Attributes = 'Normal'
        Remove-Item -LiteralPath $f.FullName -Force -ErrorAction Stop
        $removed += $f.FullName
    } catch {
        $locked += [pscustomobject]@{ Path = $f.FullName; Reason = $_.Exception.Message }
    }
}

Write-Host ""
Write-Host ("Removed: {0}" -f $removed.Count) -ForegroundColor Green
Write-Host ("Locked:  {0}" -f $locked.Count)  -ForegroundColor (if ($locked.Count) { 'Yellow' } else { 'Green' })

if ($locked.Count -gt 0) {
    Write-Host ""
    Write-Host "These files are still held open by another process:" -ForegroundColor Yellow
    $locked | ForEach-Object { Write-Host ("  - {0}" -f $_.Path) }
    Write-Host ""
    Write-Host "Common culprits: GitHub Desktop, VS Code, Windows Search Indexer, antivirus."
    Write-Host "Options to free them:"
    Write-Host "  1. Close GitHub Desktop and your editor, then re-run this script."
    Write-Host "  2. Reboot Windows (cleanest) and re-run."
    Write-Host "  3. To identify the exact holding process, download Sysinternals 'handle.exe'"
    Write-Host "     from https://learn.microsoft.com/sysinternals/downloads/handle and run:"
    Write-Host "       handle.exe -nobanner $repo\.fuse_hidden0000000400000001"
}
