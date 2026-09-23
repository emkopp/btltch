# BattleTech Mercenary Campaign Manager

One web application for managing a BattleTech mercenary company: personnel, BattleMechs,
ship assets, travel, missions, inventory, and finances.

## Project layout

```text
apps/campaign-manager/  Express API and browser interface
data/catalog/           Canonical machine-readable reference data
docs/campaign/          Campaign notes and human-readable ledgers
installer/              Windows distribution and hosting toolkit
reference/              Rules, record sheets, maps, and ship material
_ephemeral/             Reproducible working artifacts (not version-controlled)
```

The Inner Sphere map is integrated into the campaign manager at `/map/`. Reference
documents are served read-only at `/reference/`.

## Run locally

```powershell
Set-Location .\apps\campaign-manager
npm install
npm run seed
npm run seed:catalog
npm run seed:systems
npm start
```

Open `http://localhost:3000/`.

Set `MERC_DB_PATH` to use a database outside
`apps/campaign-manager/storage/merc.db`.

## Host on another Windows computer

The supported deployment method creates a ZIP containing the application, reference
data, and Windows host-management scripts.

### Host requirements

- Windows 10, Windows 11, or Windows Server
- 64-bit Node.js 22 LTS with npm
- Approximately 250 MB free disk space after dependencies are installed
- PowerShell 5.1 or newer
- Administrator access only if opening the Windows Firewall or registering automatic
  startup
- A trusted private network if other computers will access the site

The application currently has no login or user authorization. Do not expose port 3000
directly to the public internet. Use it only on a trusted LAN unless authentication,
HTTPS, and a reverse proxy are added.

### 1. Build the transferable installer

From the repository root, build a fresh campaign package:

```powershell
.\installer\New-Distribution.ps1
```

To transfer the current campaign state, including teams, missions, payments, and
location:

```powershell
.\installer\New-Distribution.ps1 -IncludeCampaignData
```

The package is written to:

```text
installer\output\BattleTech-Mercenary-Manager.zip
```

Campaign data is captured through SQLite's backup API, so the local site can remain
running while the package is built.

### 2. Prepare the host

1. Install [Node.js 22 LTS](https://nodejs.org/) on the host computer.
2. Copy the generated ZIP to that computer.
3. Extract the ZIP.
4. Open PowerShell in the extracted `BattleTech-Mercenary-Manager` folder.

### 3. Install and start

For local access on the host:

```powershell
.\host\Install.ps1
```

The default install folder is `C:\BattleTechMercenaryManager`. To use a different
folder:

```powershell
.\host\Install.ps1 -Destination 'D:\BattleTechMercenaryManager'
```

To allow LAN connections and start the server automatically with Windows, open
PowerShell as Administrator and run:

```powershell
.\host\Install.ps1 -OpenFirewall -RegisterStartup
```

The firewall option opens the configured TCP port only for Windows networks marked
**Private**.

### 4. Connect

On the host computer:

```text
http://localhost:3000/
```

To display the host's LAN addresses:

```powershell
C:\BattleTechMercenaryManager\host\Get-ServerStatus.ps1
```

Other computers on the same network can use one of the displayed network URLs.

### Host management

```powershell
# Start
C:\BattleTechMercenaryManager\host\Start-Server.ps1

# Stop
C:\BattleTechMercenaryManager\host\Stop-Server.ps1

# Status and access URLs
C:\BattleTechMercenaryManager\host\Get-ServerStatus.ps1

# Create a consistent database backup
C:\BattleTechMercenaryManager\host\Backup-Data.ps1
```

Logs are stored in `C:\BattleTechMercenaryManager\run`. Database backups are stored
in `C:\BattleTechMercenaryManager\backups` by default.

### Updating an existing host

Build and extract a new distribution, then run its `host\Install.ps1` with the same
destination. Existing campaign data is preserved automatically. A package database
replaces existing campaign data only when explicitly requested:

```powershell
.\host\Install.ps1 -ReplaceCampaignData
```

Back up the existing database before deliberately replacing it.

See [installer/README.md](installer/README.md) for a compact command reference.
