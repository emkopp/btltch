# Heat Sinks

Heat sinks dissipate the heat that weapons, movement, and engine strain generate each turn. They
are a **standard part** — every heat sink is identical within its type — but a design chooses
between two technologies.

## The two heat-sink attributes in `BiMechClasses`

| Column | Header | Meaning |
|--------|--------|---------|
| `P` | `HeatsinksInt` | Heat sinks built into the engine (the "free" ones — usually 10). |
| `Q` | `HeatsinksExt` | Extra heat sinks mounted in critical slots (each is a `Heat Sink` entry in `AE`–`DD`). |
| `R` | `HeatsinkType` | `Single` or `Double`. |

The slot label itself is always `Heat Sink` (2998 occurrences across stock designs); the **type**
in column `R` decides how much each one dissipates and how many slots it costs.

## Types

| Type | Dissipation each | Slots each (IS) | Slots each (Clan) | Weight each |
|------|-----------------:|----------------:|------------------:|------------:|
| Single | 1 heat/turn | 1 | 1 | 1 ton |
| Double | 2 heat/turn | 3 | 2 | 1 ton |

- **Single** heat sinks are compact (1 slot) but dissipate only 1 point each.
- **Double** heat sinks dissipate twice as much for the same tonnage, but Inner Sphere doubles
  take **3 slots** each (Clan doubles only 2), making them harder to fit.
- The first **10** heat sinks are integral to the engine and take no external slots.

## Total dissipation

```text
Total dissipation = (HeatsinksInt + HeatsinksExt) × (Single→1 | Double→2)
```

On the record sheet this appears as, e.g., **"Heat Sinks 10 (20) Double"** — 10 physical sinks
dissipating 20 points because they are doubles.

## Heat balance

Each turn a `'Mech` compares heat **generated** (sum of fired‑weapon heat + movement heat) against
heat **dissipated** (total from above). Net positive heat accumulates on the heat scale and causes
escalating penalties (slower movement, to‑hit penalties, ammo‑explosion risk, shutdown). Managing
heat is why energy‑heavy designs pack extra `Heat Sink` slots and often prefer Double technology.

## Interaction with damage

A `Heat Sink` slot can be destroyed by a critical hit, reducing total dissipation. The record
tab's critical‑hit table counts surviving `Heat Sink` slots to recompute available cooling.
