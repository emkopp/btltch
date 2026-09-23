[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$installRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $installRoot 'apps\campaign-manager'
$settingsPath = Join-Path $PSScriptRoot 'settings.psd1'
$runDirectory = Join-Path $installRoot 'run'
$pidPath = Join-Path $runDirectory 'server.pid'
$stdoutPath = Join-Path $runDirectory 'server.log'
$stderrPath = Join-Path $runDirectory 'server-error.log'

if (-not (Test-Path -LiteralPath $settingsPath)) {
    throw "Host settings were not found: $settingsPath"
}
$settings = Import-PowerShellDataFile -LiteralPath $settingsPath

if (Test-Path -LiteralPath $pidPath) {
    $existingPid = [int](Get-Content -LiteralPath $pidPath -Raw)
    if (Get-Process -Id $existingPid -ErrorAction SilentlyContinue) {
        Write-Host "The server is already running with process ID $existingPid."
        exit 0
    }
    Remove-Item -LiteralPath $pidPath -Force
}

$nodePath = if ($settings.NodePath -and (Test-Path -LiteralPath $settings.NodePath)) {
    $settings.NodePath
} else {
    (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodePath) {
    throw 'Node.js was not found. Reinstall the application after installing Node.js.'
}

New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null
$env:PORT = [string]$settings.Port
$env:HOST = [string]$settings.HostAddress
$process = Start-Process -FilePath $nodePath -ArgumentList 'server/app.js' `
    -WorkingDirectory $appRoot -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath -PassThru -WindowStyle Hidden
$process.Id | Set-Content -LiteralPath $pidPath -Encoding ascii

$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (-not (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) {
        break
    }
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri (
            "http://localhost:$($settings.Port)/api/location"
        ) -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        # Continue until the startup deadline.
    }
}

if (-not $ready) {
    if (Get-Process -Id $process.Id -ErrorAction SilentlyContinue) {
        Stop-Process -Id $process.Id
    }
    Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
    $details = if (Test-Path -LiteralPath $stderrPath) {
        Get-Content -LiteralPath $stderrPath -Raw
    } else {
        'No error log was produced.'
    }
    throw "The server did not become ready. Error log:`n$details"
}

Write-Host "Server started with process ID $($process.Id)."
Write-Host "Open http://localhost:$($settings.Port)/"
