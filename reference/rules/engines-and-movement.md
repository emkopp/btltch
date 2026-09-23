# Engines & Movement

The parts that make a `'Mech` move. These are **standard components** — the item itself is always
the same, but its size (weight and slot count) is derived from the `'Mech`'s **engine rating**
(`BiMechClasses` column `E`, `PowerPlantModel`) and **tonnage** (column `O`).

## 1. Fusion Engine

The engine sits in the **Center Torso** and, for extralight models, also in the side torsos.

| Slot label | Column source | Center Torso slots | Side Torso slots | Count |
|-----------|---------------|-------------------:|-----------------:|------:|
| `Engine` | type `Normal` (col `F`) | 6 | 0 | 3738 |
| `XL Engine` | type `XL` (col `F`) | 6 | 3 each side (IS) / 2 (Clan) | 1576 |

### Engine rating → speed

The rating drives movement directly:

```text
Walking MP (col G)  = Engine Rating ÷ Tonnage   (rounded down)
Running  MP (col H) = ROUND(Walking × 1.5, 0)
```

So a 300‑rated engine in a 60‑ton `'Mech` = 5 Walk / 8 Run. The engine **rating** must be a
multiple of the tonnage to reach a whole Walking MP.

### Engine type trade-off

| Type | Weight | Slots | Trade-off |
|------|--------|-------|-----------|
| `Engine` (Standard fusion) | Heavier | 6 CT slots only | Rugged — side‑torso loss doesn't kill it |
| `XL Engine` (Extralight) | ≈ half the weight | 6 CT **plus** side‑torso slots | Fragile — losing a side torso with engine crits destroys the `'Mech` |

Engine weight itself comes from the standard BattleTech engine table (a function of rating);
XL halves that weight but spreads crits into the torsos — visible as `XL Engine` entries in the
`RT`/`LT` slot columns.

## 2. Gyro

| Slot label | Location | Slots | Count | Weight |
|-----------|----------|------:|------:|--------|
| `Gyro` | Center Torso (below engine) | 4 | 2492 | `⌈Rating ÷ 100⌉` tons |

The gyro stabilizes the `'Mech`. Losing gyro slots forces piloting rolls or a fall. It always
occupies the 4 center‑torso slots between the engine halves.

## 3. Jump Jets

| Slot label | Location(s) | Slots each | Count |
|-----------|-------------|-----------:|------:|
| `Jump Jet` | Torsos and/or Legs | 1 | 1299 |

- **Jump MP** is stored in column `I` (`JumpDist`); `0` = no jump capability.
- Number of `Jump Jet` slots = the `'Mech`'s Jump MP (one jet per hex of jump).
- **Weight per jet** depends on tonnage class:

| `'Mech` tonnage | Weight per jump jet |
|-----------------|--------------------:|
| 20–55 t (Light/Medium) | 0.5 t |
| 60–85 t (Heavy) | 1.0 t |
| 90–100 t (Assault) | 2.0 t |

Jump jets let a `'Mech` ignore terrain and reposition, at the cost of extra heat.

## 4. Speed & Agility enhancers

| Item | Tech | Slots | Count | Effect |
|------|------|------:|------:|--------|
| `MASC` | IS/Clan | tonnage‑based | 83 | Myomer Accelerator Signal Circuitry — temporarily boosts running speed; risks actuator lockup on repeated use |
| `TSM` (Triple‑Strength Myomer) | IS | 6 slots | 6 | Boosts movement **and** melee damage once the `'Mech` runs hot (heat ≥ 9) |

## 5. Movement on the record sheet

The record tab recomputes movement **after damage**:

```text
Cruising = ROUND( Walk − legActuatorHits − (Walk ÷ 2) × hipHits , 0 )
Max Run  = ROUND( Cruising × 1.5 , 0 )
Jump     = JumpDist − destroyedJumpJets
```

- Each destroyed **leg** actuator group reduces Walking MP.
- A destroyed **Hip** halves the remaining Walking MP (hence the `Walk ÷ 2 × hipHits` term).
- Destroyed **Jump Jet** slots reduce Jump MP one‑for‑one.

See [fixed-internals.md](fixed-internals.md) for the leg actuators (Hip, Upper Leg, Lower Leg,
Foot) that this calculation depends on.
