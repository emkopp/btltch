# Pilot & Gunnery Skill Upgrade Costs

Skill improves as the number drops (5 → 0). Costs work as a running total — each upgrade adds the increment, and the cumulative column is the total spent to reach that level.

## General mech skills (applies to all mechs)

| Upgrade | Cost of this step | Cumulative total |
|---------|------------------:|-----------------:|
| 5 → 4   | 10                | 10               |
| 4 → 3   | 40                | 50               |
| 3 → 2   | 70                | 120              |
| 2 → 1   | 100               | 220              |

## Mech weight-class tier (Light / Medium / Heavy / Assault)

Applies to all mechs of one weight class. Cost sits between the general (all-mechs) skill and the single mech-specific skill.

| Upgrade | Cost of this step | Cumulative total |
|---------|------------------:|-----------------:|
| 5 → 4   | 8                 | 8                |
| 4 → 3   | 30                | 38               |
| 3 → 2   | 52                | 90               |
| 2 → 1   | 75                | 165              |

## Single mech-specific skill

| Upgrade | Cost of this step | Cumulative total |
|---------|------------------:|-----------------:|
| 5 → 4   | 5                 | 5                |
| 4 → 3   | 20                | 25               |
| 3 → 2   | 35                | 60               |
| 2 → 1   | 50                | 110              |


## Incremental purchase rule

You can stay on a level and **buy up through the tiers**, paying only the difference each time instead of the full price. The tiers stack from cheapest to most expensive:

1. Buy the **single mech-specific** skill first.
2. Later, upgrade to the **weight-class** tier by paying only the difference (weight-class − single mech).
3. Finally, upgrade to the **general** tier by paying only the difference (general − weight-class).

The three payments always add up to the general cost, so buying incrementally costs the same as buying general outright — but it lets you spread the cost and level up one step at a time all the way up.

| Upgrade | Buy single | + to weight-class | + to general | = General total |
|---------|-----------:|------------------:|-------------:|----------------:|
| 5 → 4   | 5          | 3                 | 2            | 10              |
| 4 → 3   | 20         | 10                | 10           | 40              |
| 3 → 2   | 35         | 17                | 18           | 70              |
| 2 → 1   | 50         | 25                | 25           | 100             |

## Notes

- **Three tiers, by how many mechs the skill covers** — the broader the coverage, the more expensive:
  - **General (all mechs):** most expensive. Step costs 10 → 40 → 70 → 100 (+30 each step); reaches 220 total by skill 1.
  - **Weight-class (Light / Medium / Heavy / Assault):** mid-priced, sits between the other two. Step costs 8 → 30 → 52 → 75; reaches 165 total by skill 1.
  - **Single mech-specific:** cheapest, roughly half the general cost per tier. Step costs 5 → 20 → 35 → 50; reaches 110 total.
- Each upgrade gets progressively more expensive as the skill improves (lower number), so buying down the last point costs the most.
- Cumulative total = XP/C-bills spent to reach that skill level from 5.
- The single mech table is currently missing its 4 → 3 step.

## Combat perks

Pilots may also spend XP on combat perks. Perks are separate from the permanent
Gunnery and Piloting skill-upgrade tiers above.

- **General perks** apply in every BattleMech.
- **Chassis perks** apply only in a selected chassis, such as Black Knight.
- **Weight-class perks** apply only in Light, Medium, Heavy, or Assault designs.
- **Weapon perks** apply only when firing the selected weapon.
- Scoped perks can be purchased again for a different valid scope, but the same
  perk and scope cannot be purchased twice.
- Perk effects are stored with the purchase so a future catalog change does not
  silently alter perks a pilot has already earned.
- Prerequisites and assigned-BattleMech requirements are validated when XP is spent.

Initial perks cover general and weapon gunnery, chassis and weight-class piloting,
terrain handling, jump distance, defensive movement, heat generation and penalties,
long-range fire, recoil, and initiative. The in-app pilot card is the authoritative
catalog for current costs and exact effects.

### Global gunnery perk path

The global gunnery path broadens in three increasingly expensive tiers. Each tier
adds another −1 gunnery modifier and requires the tier before it:

| Tier | Coverage | Cost | Requirement |
|------|----------|-----:|-------------|
| 1 | One selected chassis | 40 XP | None |
| 2 | One selected weight class | 80 XP | Tier 1 in a chassis from that class |
| 3 | All BattleMechs | 160 XP | Tier 2 in any weight class |

The modifiers stack where their coverage overlaps. A pilot with Black Knight,
Heavy, and all-mech mastery receives −3 gunnery in a Black Knight, −2 in another
Heavy chassis, and −1 in a Light, Medium, or Assault chassis.

### Global piloting perk path

Piloting follows the same widening and stacking progression, at half the gunnery
cost because combat produces many more gunnery rolls than piloting rolls:

| Tier | Coverage | Cost | Requirement |
|------|----------|-----:|-------------|
| 1 | One selected chassis | 20 XP | None |
| 2 | One selected weight class | 40 XP | Tier 1 in a chassis from that class |
| 3 | All BattleMechs | 80 XP | Tier 2 in any weight class |

A pilot with Wasp, Light, and all-mech piloting mastery receives −3 piloting in a
Wasp, −2 in another Light chassis, and −1 in a Medium, Heavy, or Assault chassis.

### Weapon-family mastery paths

Laser, missile, PPC, autocannon, and melee attacks each have an independent
three-tier mastery path:

| Tier | Coverage | Cost | Requirement |
|------|----------|-----:|-------------|
| 1 | One selected chassis | 30 XP | None |
| 2 | One selected weight class | 60 XP | Tier 1 in a chassis from that class |
| 3 | All BattleMechs | 120 XP | Tier 2 in any weight class |

Each purchased tier reduces the attack target number by 1 when using that weapon
family. The modifiers stack where coverage overlaps. A pilot with Laser mastery
for the Stinger chassis, the Light weight class, and all mechs receives −3 on
laser attacks in a Stinger, −2 in another Light chassis, and −1 in Medium, Heavy,
or Assault chassis. Each weapon family must be purchased separately.

### Terrain movement perks

Terrain perks use a piloting roll to eliminate the normal movement surcharge.
Failing the roll leaves the normal terrain or elevation cost in place.

| Perk tree | Chassis | Weight class | All mechs | Free movement thresholds |
|-----------|--------:|-------------:|----------:|--------------------------|
| Woodland Runner | 30 XP | 60 XP | 120 XP | Light woods on 10 or less; heavy woods on 7 or less |
| Rubble Runner | 30 XP | 60 XP | 120 XP | Light rubble on 10 or less; heavy rubble on 7 or less |
| Elevation Expert | 40 XP | 80 XP | 160 XP | Separate roll per level: first on 10 or less; second on 7 or less; third on 5 or less |

Woods, rubble, and elevation are separate three-tier trees. Each weight-class tier
requires chassis training in that class, and each all-mechs tier requires its
weight-class tier. The roll thresholds do not stack; only their coverage widens.

Elevation Expert resolves each level separately. For a three-level climb, roll once
for the first level at 10 or less, again for the second at 7 or less, and again for
the third at 5 or less. Each successful roll removes only that level's movement
surcharge. A failed roll leaves the normal cost for that level and does not cancel
successful rolls for the other levels.
