# Server modules

The API is a modular monolith. Each folder owns routes and business rules for one campaign
capability while sharing the same Express process and SQLite store.

- `mechs/`: owned BattleMechs, assignments, and battle state
- `finance/`: balances, payroll, and ledger summaries
- `missions/`: contract availability and rewards
- `pilots/`: pilot cards, scoped combat perks, and XP purchases
- `staff/`: staff profiles, type-specific advancement trees, and XP purchases
- `market/`: system tags, rare-stock generation, item templates, and purchases
- `travel/`: company location, systems, and route calculations
- `catalog/`: reference designs, weapons, and equipment
- `time/`: campaign clock and monthly processing
- `documents/`: compatibility CRUD for document types that do not yet have dedicated routes

As personnel, ship, company, and logistics workflows gain specialized behavior, move their
routes out of `documents/` into dedicated modules without changing their public URLs.
