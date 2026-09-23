[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$installRoot = Split-Path -Parent $PSScriptRoot
$settings = Import-PowerShellDataFile -LiteralPath (
    Join-Path $PSScriptRoot 'settings.psd1'
)
$pidPath = Join-Path $installRoot 'run\server.pid'
$serverPid = if (Test-Path -LiteralPath $pidPath) {
    [int](Get-Content -LiteralPath $pidPath -Raw)
} else {
    $null
}
$running = $serverPid -and (Get-Process -Id $serverPid -ErrorAction SilentlyContinue)

Write-Host "Status: $(if ($running) { 'running' } else { 'stopped' })"
if ($running) {
    Write-Host "Process ID: $serverPid"
}
Write-Host "Local URL: http://localhost:$($settings.Port)/"

Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -ne '127.0.0.1' -and
        $_.AddressState -eq 'Preferred' -and
        $_.PrefixOrigin -ne 'WellKnown'
    } |
    ForEach-Object {
        Write-Host "Network URL: http://$($_.IPAddress):$($settings.Port)/"
    }
