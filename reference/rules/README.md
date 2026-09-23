# `'Mech` Slot-Filler Breakouts

This folder catalogs **everything that can occupy a critical slot** (or otherwise be mounted)
on a BattleMech, parsed from `data/catalog/source/mechsheet.xls`. It is the companion to
[BiMechClasses_Reference.md](BiMechClasses_Reference.md), which explains the columns of the
`BiMechClasses` data table. Where that document explains *the sheet*, these documents catalog
*the parts*.

Every part below appears in the critical‑slot columns (`AE`–`DD`) of `BiMechClasses`, in the
weapon tables (`ISWeapons`, `ClanWeapons`), or in the `Equipment` sheet. Occurrence counts are how
many slots that item fills across all ~623 stock designs.

## Two kinds of parts

1. **Standard / fixed parts** — identical on every `'Mech` (actuators, engine, gyro, cockpit,
   life support, sensors, structure & armor filler). Their *placement* varies, but the part
   itself has no per‑item stats.
2. **Variable parts** — weapons, ammo, and electronic equipment. Each has its own stat line
   (heat, damage, range, tonnage, ammo capacity) and Inner Sphere vs Clan versions can differ.

## Document index

| File | Covers |
|------|--------|
| [weapons.md](weapons.md) | All weapons: energy, ballistic, missile, artillery — Inner Sphere & Clan stat tables |
| [ammunition.md](ammunition.md) | Ammo bins, rounds‑per‑ton, which weapons consume them, CASE |
| [equipment.md](equipment.md) | Electronic warfare, targeting, C3, ECM, physical/melee, pods, misc |
| [engines-and-movement.md](engines-and-movement.md) | Engine types, gyro, jump jets, MASC, TSM |
| [heat-sinks.md](heat-sinks.md) | Single vs Double heat sinks |
| [structure-and-armor.md](structure-and-armor.md) | Internal structure (Standard/Endo‑Steel), armor (Standard/Ferro‑Fibrous) |
| [fixed-internals.md](fixed-internals.md) | Cockpit, life support, sensors, and the arm/leg actuators |

## Full slot-filler taxonomy

```text
'Mech critical-slot contents
├── Fixed internals (fixed-internals.md)
│   ├── Cockpit group ....... CockPit, Sensors (×2), Life Support (×2)
│   ├── Arm actuators ....... Shoulder, Upper Arm, Lower Arm*, Hand*
│   └── Leg actuators ....... Hip, Upper Leg, Lower Leg, Foot
├── Propulsion / motive (engines-and-movement.md)
│   ├── Engine .............. Engine (Normal), XL Engine
│   ├── Gyro ................ Gyro
│   ├── Jump Jet ............ Jump Jet
│   └── Speed boosters ...... MASC, Triple-Strength Myomer (TSM)
├── Heat management (heat-sinks.md)
│   └── Heat Sink ........... Single, Double
├── Structure & armor (structure-and-armor.md)
│   ├── Internal structure .. Standard (no slots), Endo Steel (14 slots)
│   └── Armor ............... Standard (no slots), Ferro Fibre (14 slots)
├── Weapons (weapons.md)
│   ├── Energy .............. Lasers (Std/ER/Pulse/Heavy/Micro), PPC/ER PPC, Flamer
│   ├── Ballistic .......... Autocannon 2/5/10/20, LB-X, Ultra AC, Gauss, Machine Gun
│   ├── Missile ............ LRM, SRM, Streak SRM, MRM, Narc, Anti-Missile System
│   └── Artillery .......... Arrow IV, Long Tom, Sniper, Thumper
├── Ammunition (ammunition.md)
│   └── Ammo <type> ......... one bin per weapon family; rounds/ton varies
└── Equipment (equipment.md)
    ├── Detection/EW ........ Beagle/Active Probe, Guardian ECM, ECM Suite
    ├── Targeting .......... Artemis IV FCS, Targeting Computer, TAG, Narc, C3
    ├── Physical/melee ...... Hatchet, Sword
    └── Misc ............... CASE, Anti-Personnel Pod, Command Console, SpotLight

* Lower Arm and Hand actuators are frequently removed to free slots for weapons.
```

## Range convention (used by every weapon table)

The record sheet derives the three range bands from a single **Short** value stored in the
weapon tables:

- **Short** = the stored `ShortRange`
- **Medium** = Short × 2
- **Long** = Short × 3
- **Min** = minimum range (attacker takes a penalty inside this band)

All ranges are in **hexes** (30 m each).
