# Equipment

Non‑weapon, non‑structural modules that fill critical slots. Unlike weapons, most equipment has
**no attack stats** (the weapon tables list them with `-`); their value is a special rule.
Occurrence counts are slots used across the ~623 stock designs.

## 1. Detection & Electronic Warfare

| Item | Tech | Slots | Tons | Count | Effect |
|------|------|------:|-----:|------:|--------|
| Beagle Active Probe | IS | 2 | 1.5 | 42 | Detects powered‑down / hidden units at short range |
| Active Probe | Clan | 1 | 1 | 25 | Clan equivalent of the Beagle probe (lighter) |
| Light Active Probe | Clan | 1 | 0.5 | — | Shorter‑ranged, lighter probe |
| Guardian ECM Suite | IS | 2 | 1.5 | 32 | Jams enemy Artemis/Narc/C3/probes in a bubble |
| ECM Suite | Clan | 1 | 1 | 10 | Clan electronic countermeasures |

## 2. Targeting & Fire Control

| Item | Tech | Slots | Tons | Count | Effect |
|------|------|------:|-----:|------:|--------|
| Artemis IV FCS | IS/Clan | 1 | 1 | 70 | Boosts LRM/SRM cluster accuracy; **one per launcher**, mounted in the same location |
| Targeting Computer | IS/Clan | varies | varies | 104 | Improves to‑hit for direct‑fire weapons; weight scales with linked weapon tonnage |
| TAG | IS/Clan | 1 | 1 | — | Laser designator that guides friendly semi‑guided artillery/missiles |
| Light TAG | Clan | 1 | 0.5 | — | Lighter TAG variant |
| TAG (Arrow IV) | IS | 1 | 1 | 27 | TAG paired to Arrow IV homing artillery |
| Narc Beacon | IS/Clan | 1 | 3 | 28 | Fires a homing pod that boosts friendly missile accuracy (uses ammo) |

## 3. C3 Networked Targeting

C3 links a lance so members share the best firing solution.

| Item | Tech | Slots | Tons | Count | Effect |
|------|------|------:|-----:|------:|--------|
| C3 Master | IS | 5 | 5 | — | Command node of a C3 network |
| C3 Slave / C3 Computer | IS | 1 | 1 | 25 / 13 | Networked node sharing targeting data |

## 4. Physical / Melee Weapons

These occupy arm slots and require a functioning **Hand actuator** area to swing.

| Item | Tech | Slots | Count | Effect |
|------|------|------:|------:|--------|
| Hatchet | IS | tonnage‑based (≈ 1 per 15 t) | 26 | Melee weapon; damage = ⌈tonnage ÷ 5⌉ |
| Sword | IS | tonnage‑based | — | Melee weapon; slightly less damage than a hatchet but easier to hit |

## 5. Ammo Protection & Survival

| Item | Tech | Slots | Tons | Count | Effect |
|------|------|------:|-----:|------:|--------|
| CASE | IS | 1 | 0.5 | 158 | Vents ammo explosions out the back, saving the `'Mech` (see [ammunition.md](ammunition.md)) |
| CASE | Clan | 0 | 0 | — | Built into Clan `'Mechs` for free |

## 6. Miscellaneous

| Item | Slots | Count | Effect |
|------|------:|------:|--------|
| Anti-Personnel Pod (A-Pod) | 1 | 14 | Anti‑infantry defensive charge |
| Command Console | 1 | 1 | Second cockpit station for a commander |
| SpotLight / Searchlight | 1 | 26 | Illuminates targets at night |

## 7. Speed & Structure enhancers (cross-referenced)

These are technically equipment but are documented with their functional systems:

- **MASC** (83) and **Triple‑Strength Myomer / TSM** (6) → [engines-and-movement.md](engines-and-movement.md)
- **Endo Steel** structure filler → [structure-and-armor.md](structure-and-armor.md)
- **Ferro Fibre** armor filler → [structure-and-armor.md](structure-and-armor.md)
- **Heat Sink** → [heat-sinks.md](heat-sinks.md)

## Note on Inner Sphere vs Clan equipment

Clan versions of the same equipment are almost always **lighter and take fewer slots** than their
Inner Sphere counterparts (e.g., Active Probe 1 slot/1 ton vs Beagle Probe 2 slots/1.5 tons; Clan
CASE is free and slotless). The `MechTech` column (`DE`) of a design tells the record sheet which
technology base to price against.
