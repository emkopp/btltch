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

## Mission promises

Creating a mission opens a promised-rewards window before the contract is saved.
The Game Master can promise BattleMechs, standard weapons or equipment, rare
modified items, and completion bonuses in addition to monthly pay and salvage.
BattleMechs are selected from a three-column picker filtered by weight class and
Inner Sphere or Clan technology. Standard weapons and equipment use a matching
three-column picker filtered by item group and category, including energy,
ballistic, missile, artillery, cooling, electronics, physical, and general
equipment. Repeated item selections build exact multi-item batches. Every
existing mission has an explicit
**Edit promised rewards** action that opens the same window. Promised assets are
added to company inventory when the contract is awarded.

## Marketplace and system metadata

Every system provides infinite standard weapon and equipment stock. Rare inventory
is generated once per system and persisted until purchased or rerolled by the Game
Master. Capital systems have a 60% rare-stock chance, Lostech systems 30%, pirate
systems 15%, and untagged systems 2%. A successful roll produces one to three
finite rare items from the database-backed rare-item template catalog.

Owned common weapons and equipment can be sold immediately to the current
system for 50% of their market value. Rare items instead create a GM sale
negotiation; the item remains in inventory until the GM approves a negotiated
price, or remains with the company if the offer is rejected.

The Game Master Metadata panel manages system tags and rare-item templates. The
private GM map at `/gm-map` visualizes capital, Lostech, and pirate systems without
exposing those tags on the mercenary travel map. Initial deterministic allocation
tags approximately 5% of systems as Lostech and 1% as pirate systems.

## Commands

```powershell
npm start
npm run seed
npm run convert
npm run seed:catalog
npm run seed:systems
```
