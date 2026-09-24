# Campaign Manager

The campaign manager is the single deployable web interface for the mercenary command.

- `server/` contains the Express API and SQLite document store.
- `web/` contains the browser UI and integrated Inner Sphere map.
- `scripts/` contains catalog maintenance tools.
- `storage/` contains local runtime state and is ignored by Git.

Reference data is read from the repository-level `data/` and `reference/` directories.

## Staff advancement

The Game Master Staff panel manages engineering, medical, and support personnel,
including hiring, profile updates, monthly costs, individual or bulk XP awards,
and two-step XP resets. Each staff member has a dedicated skill-selection page
with three type-specific advancement trees. Skills are purchased in tier order
for 20, 40, and 80 XP and are persisted in SQLite with their accumulated
operational effects.

## Commands

```powershell
npm start
npm run seed
npm run convert
npm run seed:catalog
npm run seed:systems
```
