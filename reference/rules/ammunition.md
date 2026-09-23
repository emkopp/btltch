# Ammunition

Ballistic and missile weapons draw from **ammo bins**, each occupying one critical slot and
weighing **1 ton** (except where noted). The `BiMechClasses` sheet records a `'Mech`'s ammo in two
places:

1. **Critical‑slot columns** (`AE`–`DD`) — an `Ammo <type>` entry marks the physical slot the
   ammo occupies (and that can be hit / explode).
2. **Ammo bins** (`Ammo1`–`Ammo20`, columns `DF`–`DY`) — the ordered list the record sheet's
   ammo‑tracking table reads, looking up rounds‑per‑ton from `ISWeapons` (`AmmoName` / `AmmoNumber`).

**Rounds per ton** is per one ton of ammo; carrying multiple tons multiplies the count.

## Ammunition catalog

| Ammo type | Feeds | Rounds/ton (IS) | Rounds/ton (Clan) |
|-----------|-------|----------------:|------------------:|
| Ammo AC/2 | Auto Cannon/2 | 45 | — |
| Ammo AC/5 | Auto Cannon/5 | 20 | — |
| Ammo AC/10 | Auto Cannon/10 | 10 | — |
| Ammo AC/20 | Auto Cannon/20 | 5 | — |
| Ammo 2-X | LB 2-X AC | 45 | 45 |
| Ammo 5-X | LB 5-X AC | 20 | 20 |
| Ammo 10-X | LB 10-X AC | 10 | 10 |
| Ammo 20-X | LB 20-X AC | 5 | 5 |
| Ammo Ultra AC/2 | Ultra AC/2 | 45 | 45 |
| Ammo Ultra AC/5 | Ultra AC/5 | 20 | 20 |
| Ammo Ultra AC/10 | Ultra AC/10 | 10 | 10 |
| Ammo Ultra AC/20 | Ultra AC/20 | 5 | 5 |
| Ammo Gauss | Gauss Rifle | 8 | 8 |
| Ammo MG - Full | Machine Gun | 200 | 200 |
| Ammo MG - Half | Machine Gun (½ ton) | 100 | 100 |
| Ammo HMG | Heavy Machine Gun | — | 100 |
| Ammo LMG | Light Machine Gun | — | 200 |
| Ammo LRM-5 | LRM-5 | 24 | 24 |
| Ammo LRM-10 | LRM-10 | 12 | 12 |
| Ammo LRM-15 | LRM-15 | 8 | 8 |
| Ammo LRM-20 | LRM-20 | 6 | 6 |
| Ammo SRM-2 | SRM-2 | 50 | 50 |
| Ammo SRM-4 | SRM-4 | 25 | 25 |
| Ammo SRM-6 | SRM-6 | 15 | 15 |
| Ammo Streak-2 | Streak SRM-2 | 50 | 50 |
| Ammo Streak-4 | Streak SRM-4 | 25 | 25 |
| Ammo Streak-6 | Streak SRM-6 | 15 | 15 |
| Ammo Narc | Narc Beacon | 6 | 6 |
| Ammo AMS / Anti-Missile | Anti-Missile System | 12 | 24 |
| Ammo Arrow | Arrow IV System | (artillery) | (artillery) |

> Half‑ton ammo bins (`Ammo MG - Half`) carry half the listed rounds for half a ton — a common
> weight‑saving trick for low‑demand weapons like machine guns.

## Ammo, explosions, and CASE

Ammo bins are a **critical vulnerability**. A critical hit to an ammo slot detonates the remaining
rounds, usually destroying the location and often the `'Mech`.

- **CASE** (Cellular Ammunition Storage Equipment) — vents an ammo explosion out the back of the
  location, saving the `'Mech`. Appears as a `CASE` slot (158 occurrences across stock designs).
  See [equipment.md](equipment.md).
- **Streak SRM** ammo is efficient because Streak launchers only fire on a lock, so no rounds are
  wasted on misses.
- Energy weapons (lasers, PPCs, flamers) carry **no ammo** and cannot chain‑explode.

## How the record sheet tracks ammo

For each bin the record tab computes:

```text
Max rounds  = VLOOKUP(ammoName, ISWeapons!AmmoName→AmmoNumber)   ' rounds per ton
Current     = Max − Spent
```

so players decrement *Spent* as they fire and the sheet shows remaining rounds.
