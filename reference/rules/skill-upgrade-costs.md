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
