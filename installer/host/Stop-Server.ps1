[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$installRoot = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $installRoot 'run\server.pid'

if (-not (Test-Path -LiteralPath $pidPath)) {
    Write-Host 'The server is not running.'
    exit 0
}

$serverPid = [int](Get-Content -LiteralPath $pidPath -Raw)
$process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $serverPid
    $process.WaitForExit()
    Write-Host "Stopped server process $serverPid."
} else {
    Write-Host "Server process $serverPid was no longer running."
}

Remove-Item -LiteralPath $pidPath -Force
