[CmdletBinding()]
param(
    [switch]$IncludeCampaignData,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot 'output')
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$appSource = Join-Path $projectRoot 'apps\campaign-manager'
$databaseSource = Join-Path $appSource 'storage\merc.db'
$packageName = 'BattleTech-Mercenary-Manager'
$stagingRoot = Join-Path $OutputDirectory $packageName
$archivePath = Join-Path $OutputDirectory "$packageName.zip"

foreach ($requiredPath in @(
    (Join-Path $appSource 'package.json'),
    (Join-Path $appSource 'package-lock.json'),
    (Join-Path $PSScriptRoot 'Start-Server.cmd'),
    (Join-Path $projectRoot 'data'),
    (Join-Path $projectRoot 'reference')
)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Required project content was not found: $requiredPath"
    }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
if (Test-Path -LiteralPath $stagingRoot) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}
if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
}

New-Item -ItemType Directory -Force -Path (
    Join-Path $stagingRoot 'apps'
), (
    Join-Path $stagingRoot 'host'
) | Out-Null

$stagedApp = Join-Path $stagingRoot 'apps\campaign-manager'
New-Item -ItemType Directory -Force -Path $stagedApp | Out-Null
Get-ChildItem -LiteralPath $appSource -Force |
    Where-Object { $_.Name -notin @('node_modules', 'storage') } |
    ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $stagedApp -Recurse
    }
if (Test-Path -LiteralPath (Join-Path $stagedApp 'storage')) {
    throw 'The distribution unexpectedly contains runtime storage.'
}
New-Item -ItemType Directory -Force -Path (Join-Path $stagedApp 'storage') | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot 'data') -Destination (
    Join-Path $stagingRoot 'data'
) -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'reference') -Destination (
    Join-Path $stagingRoot 'reference'
) -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'README.md') -Destination (
    Join-Path $stagingRoot 'README.md'
)
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Start-Server.cmd') -Destination (
    Join-Path $stagingRoot 'Start-Server.cmd'
)
Copy-Item -Path (Join-Path $PSScriptRoot 'host\*') -Destination (
    Join-Path $stagingRoot 'host'
) -Recurse

if ($IncludeCampaignData) {
    if (-not (Test-Path -LiteralPath $databaseSource)) {
        throw "Campaign database was not found: $databaseSource"
    }

    $exportScript = Join-Path $PSScriptRoot 'Export-Database.js'
    $databaseTarget = Join-Path $stagedApp 'storage\merc.db'
    & node $exportScript $appSource $databaseSource $databaseTarget
    if ($LASTEXITCODE -ne 0) {
        throw "The campaign database snapshot failed with exit code $LASTEXITCODE."
    }
}

Compress-Archive -LiteralPath $stagingRoot -DestinationPath $archivePath -CompressionLevel Optimal
Remove-Item -LiteralPath $stagingRoot -Recurse -Force

$archive = Get-Item -LiteralPath $archivePath
Write-Host "Created $($archive.FullName)"
Write-Host ("Size: {0:N1} MB" -f ($archive.Length / 1MB))
Write-Host "Campaign data included: $IncludeCampaignData"
