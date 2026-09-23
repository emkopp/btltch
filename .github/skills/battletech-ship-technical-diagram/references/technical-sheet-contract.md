# Technical Sheet Contract

## SVG structure

Use a standalone SVG with a fixed `viewBox`, `<title>`, and `<desc>`. Organize content into labeled groups:

1. Sheet header with designation, drawing type, sheet ID, and revision.
2. Primary orthographic view preserving the source silhouette.
3. Optional secondary elevation or docking context when supported.
4. Mission and confirmed-feature block.
5. Open-design-values block using `TBD`.
6. Concept-status and source-interpretation note.

Prefer paths and basic shapes over filters or generated effects. Avoid embedded bitmap images, external fonts, scripts, and network resources.

Because the image is the sole deliverable, keep the sheet self-documenting: the mission block, the confirmed-feature block, and the open-values block must appear as on-sheet text.

## Visual language

- Use a dark blueprint field or clean white engineering sheet.
- Use one high-contrast line color, one text color, and at most one accent color.
- Use solid lines for confirmed exterior geometry.
- Use lighter or dashed lines for inferred host craft, clearances, or hidden context.
- Use arrowed leaders for callouts and double-ended arrows for dimensions.
- Keep all text inside the `viewBox` with comfortable margins.
- Do not recreate the graph-paper grid as part of the vessel. A subtle sheet background grid is permissible only when clearly decorative and not confused with traced geometry.

## Symmetry

- Regularize the drawing to the symmetry the artist intended.
- Apply left-right (bilateral) symmetry when the hull, paired modules, or repeated features indicate a mirror about the centerline: mirror matching features, equalize paired module sizes and spacing, and straighten centerlines that the hand-drawing left skewed.
- Apply fore-aft or top-bottom symmetry only when the sketch supports it.
- Preserve clearly deliberate asymmetry, such as an offset bridge, a single dorsal fin, or one-sided docking hardware. Do not impose symmetry the sketch contradicts.

## Ship subsystem vocabulary

Ships share a consistent set of subsystems. When the sketch shows or clearly implies one, draw it as a recognizable engineered component in the established spacecraft, aircraft, and BattleTech tradition, not as an abstract box:

- Main drives: nozzle bells or a clustered thrust block at the stern.
- Maneuvering thrusters: small clustered nozzles at the extremities.
- Cockpit or bridge: a framed canopy or greenhouse near the bow or on the spine.
- Wings, fins, and control surfaces: swept or straight airfoil profiles.
- Docking collar: a ringed interface with latch or brace detail.
- Weapon mounts, sensors, landing gear, and radiators: turrets or barbettes, dish or panel arrays, retractable struts, and ribbed panels.

Keep each component stylized but readable, label it, and mark its function inferred when the sketch does not confirm it.

## Optional Markdown

The image is the default and only deliverable. Do not generate a Markdown specification unless the user explicitly requests one. When requested, keep it brief and carry the same evidence status shown on the sheet, using `TBD` for unsupported quantitative or rules-specific values.

## Section breakouts

Create separate files only when a region has enough source evidence to stand alone, such as:

- docking collar;
- command prow or bridge;
- Mech bay layout;
- habitat pod;
- fuel hull;
- engine or drive module.

Name each breakout image consistently: `<DESIGNATION>-<SECTION>-SPEC.svg`. Breakouts are images only; do not add a paired Markdown file.