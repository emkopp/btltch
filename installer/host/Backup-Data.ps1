[CmdletBinding()]
param(
    [string]$DestinationDirectory = (Join-Path $PSScriptRoot '..\backups')
)

$ErrorActionPreference = 'Stop'

$installRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $installRoot 'apps\campaign-manager'
$databasePath = Join-Path $appRoot 'storage\merc.db'
$exportScript = Join-Path $PSScriptRoot 'Export-Database.js'

if (-not (Test-Path -LiteralPath $databasePath)) {
    throw "Campaign database not found: $databasePath"
}

New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$targetPath = Join-Path $DestinationDirectory "merc-$timestamp.db"

& node $exportScript $appRoot $databasePath $targetPath
if ($LASTEXITCODE -ne 0) {
    throw "Database backup failed with exit code $LASTEXITCODE."
}

Write-Host "Backup created: $targetPath"
