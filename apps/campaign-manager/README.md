# Campaign Manager

The campaign manager is the single deployable web interface for the mercenary command.

- `server/` contains the Express API and SQLite document store.
- `web/` contains the browser UI and integrated Inner Sphere map.
- `scripts/` contains catalog maintenance tools.
- `storage/` contains local runtime state and is ignored by Git.

Reference data is read from the repository-level `data/` and `reference/` directories.

## Commands

```powershell
npm start
npm run seed
npm run convert
npm run seed:catalog
npm run seed:systems
```
