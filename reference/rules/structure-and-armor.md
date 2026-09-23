# Structure & Armor

The two protective layers of a `'Mech`: the **internal structure** (skeleton) underneath, and the
**armor** plating on top. Both come in a standard form (no critical slots) and a lightweight
"advanced material" form that saves weight by consuming 14 critical slots of filler.

## 1. Internal Structure

Internal structure points per location are stored in `BiMechClasses` columns `Z`–`AD`
(`HeadStructure`, `CentreTorsoStructure`, `SideTorsoStructure`, `ArmStructure`, `LegStructure`).
The **points are fixed by tonnage** (standard BattleTech structure table); the choice a designer
makes is what the skeleton is *made of*.

| Structure type | Slot filler | Slots used | Weight | Count |
|----------------|-------------|-----------:|--------|------:|
| Standard | *(none — no slots)* | 0 | 10% of tonnage | — |
| Endo Steel | `Endo Steel` | 14 (spread anywhere) | 5% of tonnage | 2408 |

- **Standard** structure occupies no slots and weighs **10%** of the `'Mech`'s tonnage.
- **Endo Steel** halves that to **5%** of tonnage, but the saved weight costs **14 critical
  slots**, which appear as `Endo Steel` entries scattered through the slot columns.
- Head structure is always **3**; other locations scale with tonnage.

## 2. Armor

Armor points per facing are stored in columns `S`–`Y`:

| Column | Facing |
|--------|--------|
| `S` `HeadArmor` | Head |
| `T` `CenterTorsoArmor` | Center Torso (front) |
| `U` `SideTorsoArmor` | Left & Right Torso (front) — shared value |
| `V` `ArmArmor` | Arms — shared |
| `W` `LegArmor` | Legs — shared |
| `X` `RearCentreArmor` | Center Torso (rear) |
| `Y` `RearSideArmor` | Side Torsos (rear) — shared |

The **armor type** determines how many points you get per ton:

| Armor type | Slot filler | Slots used | Points per ton | Count |
|------------|-------------|-----------:|---------------:|------:|
| Standard | *(none)* | 0 | 16 | — |
| Ferro-Fibrous (IS) | `Ferro Fibre` | 14 | ≈ 17.9 | 2051 |
| Ferro-Fibrous (Clan) | `Ferro Fibre` | 7 | ≈ 20 | (Clan designs) |

- **Standard** armor: 16 points per ton, no slots.
- **Ferro‑Fibrous**: more points per ton (denser), but the composite backing costs slots —
  **14** for Inner Sphere, **7** for Clan — shown as `Ferro Fibre` entries in the slot columns.

### Armor limits

Each location can hold at most **2 × its internal structure** in armor (the head is capped at 9).
This is why the armor values in `S`–`Y` never exceed roughly double the matching structure value
in `Z`–`AD`.

## 3. Why Endo Steel and Ferro Fibre "fill slots"

Both are advanced materials whose weight savings are paid for in **space**. Their 14 (or 7) slots
of filler are why you see `Endo Steel` and `Ferro Fibre` repeated many times inside a single
`'Mech`'s slot columns — they are not equipment, just the distributed "cost" of the lighter
material. A design using **both** loses 28 (IS) slots to filler, tightly constraining how many
weapons and heat sinks it can also mount.

## 4. Damage model on the record sheet

For each location the record tab computes a status from remaining armor/structure:

```text
% remaining = (Max − Damage) ÷ Max
status = Nominal (>90%) → Light → Moderate → Heavy → Severe → Destroyed (0%)
```

Armor is stripped first; once a location's armor reaches 0, further hits reduce **internal
structure** and can trigger critical hits against the slot contents cataloged in the other
breakout files.
