# Weapons

Every weapon that can fill a `'Mech`'s critical slots, grouped by class. Stats come from the
`ISWeapons` and `ClanWeapons` sheets. **Inner Sphere and Clan versions of the same weapon often
differ** — Clan weapons are generally lighter, hotter‑hitting, and longer‑ranged.

**Column key**

- **Heat** — heat points generated when fired.
- **Shots** — attacks/missiles per firing (`NumberOfAttacks`).
- **Dmg** — damage per attack (`DamagePerAttack`).
- **Total** — Shots × Dmg (max damage if every hit lands).
- **Min / Short / Med / Long** — range bands in hexes. Med = Short×2, Long = Short×3.
- **Ammo** — rounds per ton (blank = no ammo / energy weapon).
- **Tons / Slots** — standard BattleTech construction weight and critical slots (reference values;
  the workbook stores placement, not these numbers).

---

## 1. Energy Weapons

Energy weapons need **no ammunition** — they draw on the fusion engine and dump heat instead.
This makes them reliable but heat‑intensive.

### 1.1 Lasers — Inner Sphere

| Weapon | Heat | Shots | Dmg | Total | Min | Short | Med | Long | Tons | Slots |
|--------|-----:|------:|----:|------:|----:|------:|----:|-----:|-----:|------:|
| Small Laser | 1 | 1 | 3 | 3 | 0 | 1 | 2 | 3 | 0.5 | 1 |
| Medium Laser | 3 | 1 | 5 | 5 | 0 | 3 | 6 | 9 | 1 | 1 |
| Large Laser | 8 | 1 | 8 | 8 | 0 | 5 | 10 | 15 | 5 | 2 |
| ER Small Laser | 2 | 1 | 3 | 3 | 0 | 2 | 4 | 6 | 0.5 | 1 |
| ER Medium Laser | 5 | 1 | 5 | 5 | 0 | 4 | 8 | 12 | 1 | 1 |
| ER Large Laser | 12 | 1 | 8 | 8 | 0 | 7 | 14 | 21 | 5 | 2 |
| Pulse Small Laser | 2 | 1 | 3 | 3 | 0 | 1 | 2 | 3 | 1 | 1 |
| Pulse Medium Laser | 4 | 1 | 6 | 6 | 0 | 2 | 4 | 6 | 2 | 1 |
| Pulse Large Laser | 10 | 1 | 9 | 9 | 0 | 3 | 6 | 9 | 7 | 2 |

### 1.2 Lasers — Clan

| Weapon | Heat | Shots | Dmg | Total | Min | Short | Med | Long | Tons | Slots |
|--------|-----:|------:|----:|------:|----:|------:|----:|-----:|-----:|------:|
| ER Micro Laser | 1 | 1 | 2 | 2 | 0 | 1 | 2 | 3 | 0.25 | 1 |
| ER Small Laser | 2 | 1 | 5 | 5 | 0 | 2 | 4 | 6 | 0.5 | 1 |
| ER Medium Laser | 5 | 1 | 7 | 7 | 0 | 5 | 10 | 15 | 1 | 1 |
| ER Large Laser | 12 | 1 | 10 | 10 | 0 | 8 | 16 | 24 | 4 | 1 |
| Pulse Micro Laser | 1 | 1 | 3 | 3 | 0 | 1 | 2 | 3 | 0.5 | 1 |
| Pulse Small Laser | 2 | 1 | 3 | 3 | 0 | 2 | 4 | 6 | 1 | 1 |
| Pulse Medium Laser | 4 | 1 | 7 | 7 | 0 | 5 | 10 | 15 | 2 | 1 |
| Pulse Large Laser | 10 | 1 | 10 | 10 | 0 | 6 | 12 | 18 | 6 | 2 |
| Heavy Small Laser | 3 | 1 | 6 | 6 | 0 | 1 | 2 | 3 | 0.5 | 1 |
| Heavy Medium Laser | 7 | 1 | 10 | 10 | 0 | 3 | 6 | 9 | 1 | 2 |
| Heavy Large Laser | 18 | 1 | 16 | 16 | 0 | 5 | 10 | 15 | 4 | 3 |

### 1.3 Particle Projection Cannons (PPC)

| Weapon | Tech | Heat | Dmg | Min | Short | Med | Long | Tons | Slots |
|--------|------|-----:|----:|----:|------:|----:|-----:|-----:|------:|
| PPC | IS | 10 | 10 | 3 | 6 | 12 | 18 | 7 | 3 |
| ER PPC | IS | 15 | 10 | 0 | 7 | 14 | 21 | 7 | 3 |
| ER PPC | Clan | 15 | 15 | 0 | 7 | 14 | 21 | 6 | 2 |

### 1.4 Flamer

| Weapon | Tech | Heat | Dmg | Short | Med | Long | Tons | Slots |
|--------|------|-----:|----:|------:|----:|-----:|-----:|------:|
| Flamer | IS | 3 | 2 | 1 | 2 | 3 | 1 | 1 |
| Flamer | Clan | 3 | 2 | 1 | 2 | 3 | 0.5 | 1 |

> Flamers can be fired to deal damage **or** to add heat to a target instead.

---

## 2. Ballistic Weapons

Ballistic weapons fire physical rounds — low heat, but they **consume ammunition** (see
[ammunition.md](ammunition.md)) and their ammo can explode if hit (mitigate with **CASE**).

### 2.1 Standard Autocannons (Inner Sphere)

| Weapon | Heat | Dmg | Min | Short | Med | Long | Ammo/ton | Tons | Slots |
|--------|-----:|----:|----:|------:|----:|-----:|---------:|-----:|------:|
| Auto Cannon/2 | 1 | 2 | 4 | 8 | 16 | 24 | 45 | 6 | 1 |
| Auto Cannon/5 | 1 | 5 | 3 | 6 | 12 | 18 | 20 | 8 | 4 |
| Auto Cannon/10 | 3 | 10 | 0 | 5 | 10 | 15 | 10 | 12 | 7 |
| Auto Cannon/20 | 7 | 20 | 0 | 3 | 6 | 9 | 5 | 14 | 10 |

### 2.2 LB-X Cluster Autocannons

Fire a spread of sub‑munitions (`MissileWeapon = TRUE`); each cluster point is rolled separately.

| Weapon | Tech | Heat | Shots | Dmg | Total | Min | Short | Med | Long | Ammo/ton | Tons | Slots |
|--------|------|-----:|------:|----:|------:|----:|------:|----:|-----:|---------:|-----:|------:|
| LB 2-X AC | IS | 1 | 2 | 1 | 2 | 4 | 9 | 18 | 27 | 45 | 6 | 4 |
| LB 5-X AC | IS | 1 | 5 | 1 | 5 | 3 | 7 | 14 | 21 | 20 | 8 | 5 |
| LB 10-X AC | IS | 2 | 10 | 1 | 10 | 0 | 6 | 12 | 18 | 10 | 11 | 6 |
| LB 20-X AC | IS | 6 | 20 | 1 | 20 | 0 | 4 | 8 | 12 | 5 | 14 | 11 |
| LB 2-X AC | Clan | 1 | 2 | 1 | 2 | 4 | 10 | 20 | 30 | 45 | 5 | 3 |
| LB 5-X AC | Clan | 1 | 5 | 1 | 5 | 3 | 8 | 16 | 24 | 20 | 7 | 4 |
| LB 10-X AC | Clan | 2 | 10 | 1 | 10 | 0 | 6 | 12 | 18 | 10 | 10 | 5 |
| LB 20-X AC | Clan | 6 | 20 | 1 | 20 | 0 | 4 | 8 | 12 | 5 | 12 | 9 |

### 2.3 Ultra Autocannons (double‑fire capable)

Can fire twice per turn (`Shots = 2`) for double damage at the risk of jamming.

| Weapon | Tech | Heat | Shots | Dmg | Total | Min | Short | Med | Long | Ammo/ton |
|--------|------|-----:|------:|----:|------:|----:|------:|----:|-----:|---------:|
| Ultra AC/2 | IS | 2 | 2 | 2 | 4 | 3 | 8 | 16 | 24 | 45 |
| Ultra AC/5 | IS | 2 | 2 | 5 | 10 | 2 | 6 | 12 | 18 | 20 |
| Ultra AC/10 | IS | 8 | 2 | 10 | 20 | 0 | 6 | 12 | 18 | 10 |
| Ultra AC/20 | IS | 16 | 2 | 20 | 40 | 0 | 3 | 6 | 9 | 5 |
| Ultra AC/2 | Clan | 1 | 2 | 2 | 4 | 2 | 9 | 18 | 27 | 45 |
| Ultra AC/5 | Clan | 1 | 2 | 5 | 10 | 0 | 7 | 14 | 21 | 20 |
| Ultra AC/10 | Clan | 3 | 2 | 10 | 20 | 0 | 6 | 12 | 18 | 10 |
| Ultra AC/20 | Clan | 7 | 2 | 20 | 40 | 0 | 4 | 8 | 12 | 5 |

### 2.4 Gauss Rifles

Magnetic slug throwers — very high damage, almost no heat, but the weapon itself can explode.

| Weapon | Tech | Heat | Dmg | Min | Short | Med | Long | Ammo/ton | Tons | Slots |
|--------|------|-----:|----:|----:|------:|----:|-----:|---------:|-----:|------:|
| Gauss Rifle | IS | 1 | 15 | 2 | 7 | 14 | 21 | 8 | 15 | 7 |
| Gauss Rifle | Clan | 1 | 15 | 2 | 7 | 14 | 21 | 8 | 12 | 6 |
| Light Gauss Rifle | IS | 1 | 8 | 3 | 8 | 16 | 24 | 16 | 12 | 5 |

> **Data note:** the `ISWeapons` row for *Light Gauss Rifle* stores `Shots = 8, Dmg = 8`, so the
> sheet's computed `Total` reads 64. In tabletop rules a Light Gauss Rifle does **8** damage in a
> single hit; treat the 8×8 as a data‑entry artifact.

### 2.5 Machine Guns

Anti‑infantry weapons: zero heat, tiny range, cheap ammo.

| Weapon | Tech | Heat | Dmg | Short | Med | Long | Ammo/ton | Tons | Slots |
|--------|------|-----:|----:|------:|----:|-----:|---------:|-----:|------:|
| Machine Gun | IS | 0 | 2 | 1 | 2 | 3 | 200 | 0.5 | 1 |
| Machine Gun | Clan | 0 | 2 | 1 | 2 | 3 | 200 | 0.25 | 1 |
| Light Machine Gun | Clan | 0 | 1 | 2 | 4 | 6 | 200 | 0.25 | 1 |
| Heavy Machine Gun | Clan | 0 | 3 | 1 | 2 | 3 | 100 | 0.5 | 1 |

---

## 3. Missile Weapons

Missile racks fire volleys (`MissileWeapon = TRUE`); the number of missiles that hit is rolled on
the cluster table. All consume ammo.

### 3.1 Long Range Missiles (LRM)

| Weapon | Tech | Heat | Missiles | Min | Short | Med | Long | Ammo/ton |
|--------|------|-----:|---------:|----:|------:|----:|-----:|---------:|
| LRM-5 | IS | 2 | 5 | 6 | 7 | 14 | 21 | 24 |
| LRM-10 | IS | 4 | 10 | 6 | 7 | 14 | 21 | 12 |
| LRM-15 | IS | 5 | 15 | 6 | 7 | 14 | 21 | 8 |
| LRM-20 | IS | 6 | 20 | 6 | 7 | 14 | 21 | 6 |
| LRM-5 | Clan | 2 | 5 | 0 | 7 | 14 | 21 | 24 |
| LRM-10 | Clan | 4 | 10 | 0 | 7 | 14 | 21 | 12 |
| LRM-15 | Clan | 5 | 15 | 0 | 7 | 14 | 21 | 8 |
| LRM-20 | Clan | 6 | 20 | 0 | 7 | 14 | 21 | 6 |

> Each missile that hits does **1** point. Clan LRMs have **no minimum range**.

### 3.2 Short Range Missiles (SRM)

Each SRM that hits does **2** points.

| Weapon | Tech | Heat | Missiles | Dmg/hit | Max Total | Short | Med | Long | Ammo/ton |
|--------|------|-----:|---------:|--------:|----------:|------:|----:|-----:|---------:|
| SRM-2 | IS/Clan | 2 | 2 | 2 | 4 | 3 | 6 | 9 | 50 |
| SRM-4 | IS/Clan | 3 | 4 | 2 | 8 | 3 | 6 | 9 | 25 |
| SRM-6 | IS/Clan | 4 | 6 | 2 | 12 | 3 | 6 | 9 | 15 |

### 3.3 Streak SRM (lock‑on)

Only fire when a lock is achieved — then **all** missiles hit (no wasted ammo).

| Weapon | Tech | Heat | Missiles | Max Total | Short | Med | Long | Ammo/ton |
|--------|------|-----:|---------:|----------:|------:|----:|-----:|---------:|
| Streak SRM-2 | IS | 2 | 2 | 4 | 3 | 6 | 9 | 50 |
| Streak SRM-4 | IS | 3 | 4 | 8 | 3 | 6 | 9 | 25 |
| Streak SRM-6 | IS | 4 | 6 | 12 | 3 | 6 | 9 | 15 |
| Streak SRM-2 | Clan | 2 | 2 | 4 | 4 | 8 | 12 | 50 |
| Streak SRM-4 | Clan | 3 | 4 | 8 | 4 | 8 | 12 | 25 |
| Streak SRM-6 | Clan | 4 | 6 | 12 | 4 | 8 | 12 | 15 |

### 3.4 Medium Range Missiles (MRM) — Inner Sphere only

Cheap, heavy volleys with no minimum range but poor accuracy.

| Weapon | Heat | Missiles | Short | Med | Long |
|--------|-----:|---------:|------:|----:|-----:|
| MRM-10 | 4 | 10 | 4 | 8 | 12 |
| MRM-20 | 6 | 20 | 4 | 8 | 12 |
| MRM-30 | 10 | 30 | 4 | 8 | 12 |
| MRM-40 | 12 | 40 | 4 | 8 | 12 |

### 3.5 Missile support systems

| System | Tech | Heat | Ammo/ton | Role |
|--------|------|-----:|---------:|------|
| Narc Beacon | IS/Clan | 0 | 6 | Fires a homing pod that boosts friendly missile accuracy vs the tagged target |
| Anti-Missile System (AMS) | IS | 1 | 12 | Automatically shoots down incoming missiles |
| Anti-Missile System (AMS) | Clan | 1 | 24 | Automatically shoots down incoming missiles |

---

## 4. Artillery

Long‑range indirect‑fire weapons. Ranges are in **map sheets/hexes** and are very large.

| Weapon | Tech | Heat | Dmg | Min | Short/Range |
|--------|------|-----:|----:|----:|------------:|
| Arrow IV System | IS/Clan | 10 | 20 | 20 | 20 |
| Sniper | IS/Clan | 10 | 10 | 20 | 40 |
| Thumper | IS/Clan | 6 | 5 | 20 | 60 |
| Long Tom | IS/Clan | 20 | 20 | 20 | 80 |

---

## 5. Non-weapon slot items listed in the weapon tables

The weapon sheets also list several **equipment** items (shown with `-` stats) so the record sheet
can look them up. They are cataloged in [equipment.md](equipment.md):

- **Detection/EW:** Beagle Active Probe (IS), Active Probe / Light Active Probe (Clan),
  Guardian ECM Suite (IS), ECM Suite (Clan)
- **Targeting:** Artemis IV FCS, Targeting Computer, TAG / Light TAG, C3 Slave, C3 Master
- **Physical:** Hatchet, Sword
- **Misc:** CASE, Anti-Personnel Pod, MASC
