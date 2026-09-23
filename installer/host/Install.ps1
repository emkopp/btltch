[CmdletBinding()]
param(
    [string]$Destination = 'C:\BattleTechMercenaryManager',
    [ValidateRange(1, 65535)]
    [int]$Port = 3000,
    [switch]$OpenFirewall,
    [switch]$RegisterStartup,
    [switch]$ReplaceCampaignData
)

$ErrorActionPreference = 'Stop'

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Copy-DirectoryContents {
    param(
        [Parameter(Mandatory)]
        [string]$Source,
        [Parameter(Mandatory)]
        [string]$Target
    )

    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Target -Recurse -Force
    }
}

$packageRoot = Split-Path -Parent $PSScriptRoot
$sourceApp = Join-Path $packageRoot 'apps\campaign-manager'
$sourceDatabase = Join-Path $sourceApp 'storage\merc.db'
$destinationApp = Join-Path $Destination 'apps\campaign-manager'
$destinationDatabase = Join-Path $destinationApp 'storage\merc.db'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $nodeCommand -or -not $npmCommand) {
    throw 'Node.js and npm are required. Install Node.js 22 LTS, reopen PowerShell, and run this installer again.'
}

$nodeMajor = [int]((& node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) {
    throw "Node.js 20 or newer is required. Found $(& node --version)."
}

if (($OpenFirewall -or $RegisterStartup) -and -not (Test-Administrator)) {
    throw 'OpenFirewall and RegisterStartup require PowerShell to be run as Administrator.'
}

foreach ($requiredPath in @(
    (Join-Path $sourceApp 'package.json'),
    (Join-Path $packageRoot 'data'),
    (Join-Path $packageRoot 'reference')
)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "The extracted installer is incomplete. Missing: $requiredPath"
    }
}

$existingStopScript = Join-Path $Destination 'host\Stop-Server.ps1'
if (Test-Path -LiteralPath $existingStopScript) {
    & $existingStopScript
}

New-Item -ItemType Directory -Force -Path $Destination, $destinationApp | Out-Null

Get-ChildItem -LiteralPath $sourceApp -Force |
    Where-Object { $_.Name -notin @('node_modules', 'storage') } |
    ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $destinationApp -Recurse -Force
    }

Copy-DirectoryContents -Source (Join-Path $packageRoot 'data') -Target (
    Join-Path $Destination 'data'
)
Copy-DirectoryContents -Source (Join-Path $packageRoot 'reference') -Target (
    Join-Path $Destination 'reference'
)
Copy-DirectoryContents -Source $PSScriptRoot -Target (Join-Path $Destination 'host')
Copy-Item -LiteralPath (Join-Path $packageRoot 'README.md') -Destination (
    Join-Path $Destination 'README.md'
) -Force

New-Item -ItemType Directory -Force -Path (Join-Path $destinationApp 'storage') | Out-Null
if (Test-Path -LiteralPath $sourceDatabase) {
    if (-not (Test-Path -LiteralPath $destinationDatabase) -or $ReplaceCampaignData) {
        Copy-Item -LiteralPath $sourceDatabase -Destination $destinationDatabase -Force
        Write-Host 'Installed the campaign database included in the package.'
    } else {
        Write-Host 'Preserved the existing campaign database.'
    }
}

Push-Location $destinationApp
try {
    & $npmCommand.Source ci --omit=dev
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed with exit code $LASTEXITCODE."
    }

    if (-not (Test-Path -LiteralPath $destinationDatabase)) {
        foreach ($seedCommand in @('seed', 'seed:catalog', 'seed:systems')) {
            & $npmCommand.Source run $seedCommand
            if ($LASTEXITCODE -ne 0) {
                throw "npm run $seedCommand failed with exit code $LASTEXITCODE."
            }
        }
        Write-Host 'Created a new campaign database.'
    }
} finally {
    Pop-Location
}

$settingsPath = Join-Path $Destination 'host\settings.psd1'
$nodePathForSettings = $nodeCommand.Source.Replace("'", "''")
@"
@{
    Port = $Port
    HostAddress = '0.0.0.0'
    NodePath = '$nodePathForSettings'
}
"@ | Set-Content -LiteralPath $settingsPath -Encoding utf8

if ($OpenFirewall) {
    $ruleName = "BattleTech Mercenary Manager TCP $Port"
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow `
            -Protocol TCP -LocalPort $Port -Profile Private | Out-Null
    }
    Write-Host "Windows Firewall allows TCP port $Port on private networks."
}

if ($RegisterStartup) {
    $startScript = Join-Path $Destination 'host\Start-Server.ps1'
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument (
        "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
    )
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount `
        -RunLevel Highest
    Register-ScheduledTask -TaskName 'BattleTech Mercenary Manager' -Action $action `
        -Trigger $trigger -Principal $principal -Force | Out-Null
    Write-Host 'Registered the BattleTech Mercenary Manager startup task.'
}

& (Join-Path $Destination 'host\Start-Server.ps1')
Write-Host ''
Write-Host "Installation complete: $Destination"
Write-Host "Local URL: http://localhost:$Port/"
Write-Host 'Use host\Get-ServerStatus.ps1 to display network URLs and status.'
