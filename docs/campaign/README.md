# Mercenary Management

Working files for running a BattleTech **mercenary command** — the people, machines, money,
and contracts that keep a merc outfit in the field. This folder is the campaign-side companion
to the tactical reference material in [../../reference/rules/README.md](../../reference/rules/README.md): where
those documents catalog *what a `'Mech` is made of*, these track *who owns it, who pilots it,
and who is paying for it*.

The structure follows the force-management loop used by **Campaign Operations** and
**Field Manual: Mercenaries** (and mirrored by the MekHQ campaign tool): take a contract, field
a force, spend C-Bills to keep it running, collect payment and salvage, repeat.

## How the pieces fit together

```text
Contract (income + salvage + terms)
        │
        ▼
   Company (identity · unit rating · reputation)
        │
        ├── Personnel ....... MechWarriors + support staff (techs, medics, admin)
        ├── Mech Stable ..... owned 'Mechs and their condition
        └── Finances ........ C-Bill ledger: income in, upkeep out
        │
        ▼
   Deploy → fight → take losses & salvage → repair & pay bills → next contract
```

## Component index

| File | Tracks | Status |
|------|--------|--------|
| [company-overview.md](company-overview.md) | Unit identity, Dragoon/unit rating, reputation, TO&E summary | Started |
| [personnel-roster.md](personnel-roster.md) | MechWarriors (skills, XP, injuries) and support personnel | Started |
| [mech-stable.md](mech-stable.md) | Owned `'Mechs`, variants, condition, assigned pilots | Started (4 `'Mechs`) |
| [finances.md](finances.md) | C-Bill balance, income, recurring upkeep, transaction ledger | Started |
| [contracts.md](contracts.md) | Employer terms, payment, transport, salvage & command rights | Started |

### Planned components

These are not built yet — we will add them as the campaign needs them:

- **transport-assets.md** — DropShip / JumpShip capacity and lease costs
- **salvage-log.md** — recovered units and parts pending repair or sale
- **repair-bay.md** — tech-hours, spare parts warehouse, refit projects
- **reputation.md** — faction standings and employer relationships

## Conventions

- **Currency** is C-Bills, written `C-Bills 1,000,000` or `1,000,000 C-Bills`.
- **Skills** use the `Gunnery / Piloting` shorthand (lower is better; `4/5` is a regular).
- **Dates** use the in-universe format `DD MMM YYYY` (e.g. `12 Aug 3025`).
- Each `'Mech` in the stable links to its record/quirk sheet under `reference/mechs/recordsheets`.

## Attribution

BattleTech, MechWarrior, and related names, rules, and imagery are the property of
The Topps Company / Catalyst Game Labs and their licensors. This folder holds personal
campaign-tracking notes for tabletop play. No affiliation or ownership is implied.
