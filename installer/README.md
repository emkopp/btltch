# Windows installer toolkit

This folder builds a transferable ZIP for hosting the campaign manager on another
Windows computer.

## Build a distribution

From the repository root:

```powershell
.\installer\New-Distribution.ps1
```

That creates `installer/output/BattleTech-Mercenary-Manager.zip` with a fresh,
uninitialized campaign database.

To include a consistent snapshot of the current campaign:

```powershell
.\installer\New-Distribution.ps1 -IncludeCampaignData
```

The builder uses SQLite's backup API, so it can safely snapshot the database while
the local application is running.

## Install on the host computer

1. Copy the ZIP to the host computer and extract it.
2. Open PowerShell in the extracted folder.
3. Run:

   ```powershell
   .\host\Install.ps1
   ```

The default destination is `C:\BattleTechMercenaryManager`. Use `-Destination`
to choose another folder.

To allow other computers on the local network and start the app automatically
when Windows starts, run PowerShell as Administrator:

```powershell
.\host\Install.ps1 -OpenFirewall -RegisterStartup
```

The installer never replaces an existing campaign database unless
`-ReplaceCampaignData` is explicitly supplied.
