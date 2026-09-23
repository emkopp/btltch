# Fixed Internals — Cockpit & Actuators

The **always‑present anatomy** of a `'Mech`. These parts are standard (no per‑item stats) and
appear in fixed positions in every design. Their placement is dictated by the location, not the
designer. Counts are slots used across the ~623 stock designs.

## 1. Cockpit group (Head)

The head always contains the life‑support / sensor / cockpit cluster. In `BiMechClasses` these
occupy head slots `HD01`–`HD06` (columns `AE`–`AJ`); the middle slots (`HD04`/`HD05` area) are
often free for a small weapon or equipment.

| Slot label | Typical head slots | Count | Role |
|-----------|--------------------|------:|------|
| `Life Support` | HD01 and HD06 | 1246 (≈2/`'Mech`) | Keeps the pilot alive; heat damage risks the pilot if destroyed |
| `Sensors` | HD02 and HD05 | 1246 (≈2/`'Mech`) | Targeting sensors; loss cripples to‑hit ability |
| `CockPit` | HD03 | 623 (1/`'Mech`) | The pilot's station; destruction kills the pilot / the `'Mech` |

Together these make up the standard **3‑ton cockpit** assembly in BattleTech construction.

## 2. Arm actuators

Arms are built top‑down. The upper two actuators are mandatory; the lower two are **often removed**
to free critical slots for arm‑mounted weapons — which is why their counts drop off.

| Slot label | Arm slot | Count | Notes |
|-----------|----------|------:|-------|
| `Shoulder` | RA01 / LA01 | 1236 (≈2/`'Mech`) | Always present |
| `Upper Arm` | RA02 / LA02 | 1236 (≈2/`'Mech`) | Always present |
| `Lower Arm` | RA03 / LA03 | 804 | **Optional** — removed on many weapon arms |
| `Hand` | RA04 / LA04 | 531 | **Optional** — removed most often; needed to punch or hold melee weapons |

> The falling counts (1236 → 1236 → 804 → 531) directly show the classic design trade‑off:
> stripping the Lower Arm and Hand actuators frees two slots per arm for bigger guns, at the cost
> of melee capability and arm flexibility.

## 3. Leg actuators

Legs use a fixed four‑actuator stack; none are optional (a `'Mech` must stand and walk).

| Slot label | Leg slot | Count | Notes |
|-----------|----------|------:|-------|
| `Hip` | RL01 / LL01 | 1256 (≈2/`'Mech`) | Damage **halves** remaining Walking MP |
| `Upper Leg` | RL02 / LL02 | 1256 | Damage reduces Walking MP |
| `Lower Leg` | RL03 / LL03 | 1256 | Damage reduces Walking MP |
| `Foot` | RL04 / LL04 | 1256 | Damage reduces Walking MP |

Leg slots `RL05`/`RL06` (and `LL05`/`LL06`) are usually free for heat sinks, jump jets, or
structure/armor filler.

## 4. Center-torso internals (reference)

The center torso's fixed internals — `Engine` and `Gyro` — are documented in
[engines-and-movement.md](engines-and-movement.md). A standard center torso reads:

```text
CT01–CT03  Engine
CT04–CT07  Gyro (4 slots)
CT08–CT10  Engine
CT11–CT12  (free — often ammo, heat sinks, or XL engine on XL designs)
```

## 5. How actuator damage feeds the record sheet

The record tab's movement calculation depends directly on these actuator slots surviving:

```text
Cruising MP = ROUND( Walk − legHits − (Walk ÷ 2) × hipHits , 0 )
```

- Each destroyed **Hip** applies the `Walk ÷ 2` penalty.
- Destroyed **Upper/Lower Leg** and **Foot** actuators reduce Walking MP.
- Destroyed **Shoulder/Upper Arm** actuators impose to‑hit penalties on that arm's weapons and
  disable physical attacks with that arm.

See [engines-and-movement.md](engines-and-movement.md) for the full movement formula and
[BiMechClasses_Reference.md](BiMechClasses_Reference.md) for the slot‑column layout.
