---
name: battletech-ship-technical-diagram
description: Convert hand-drawn BattleTech spacecraft, DropShip, JumpShip, pod, deck, or module sketches into a single clean high-level SVG technical diagram. Preserves the vessel silhouette while removing paper lines, applies best-attempt left-right and fore-aft symmetry when the artist intended it, and renders recognizable ship subsystems such as engines, thrusters, cockpits, wings, and docking collars in established engineering style. Use when a user supplies a graph-paper or notebook sketch and wants a technical image placed in a component folder under theShip.
---

# BattleTech Ship Technical Diagram

Produce a single evidence-grounded technical concept image from a rough ship sketch. Preserve the drawn silhouette and confirmed design intent, regularize obvious symmetry, and render ship subsystems as recognizable engineered components. Mark unsupported engineering values `TBD` on the sheet. The deliverable is the SVG image only; do not generate a separate Markdown specification unless the user explicitly asks for one.

Read [references/technical-sheet-contract.md](references/technical-sheet-contract.md) before creating outputs.

## Workflow

1. Locate the source image and inspect every related image and existing ship document in `theShip/`.
2. Correct image orientation mentally or with a lossless reference copy. Distinguish ship strokes from graph lines, page edges, holes, shadows, and handwriting.
3. Record:
	 - confirmed geometry and labels;
	 - geometry inferred from symmetry or repeated modules;
	 - unknown dimensions, systems, and rules data.
4. Decide the intended symmetry. Judge whether the artist meant left-right (bilateral) or fore-aft / top-bottom symmetry, and note any deliberate asymmetry to keep.
5. Identify the ship's subsystems from the shared vocabulary: engines, maneuvering thrusters, cockpit or bridge, wings or fins, docking collar, weapon mounts, sensors, landing gear, radiators, and fuel. Plan a recognizable engineered rendering for each present or clearly implied element.
6. Use the established destination `theShip/<component>/`. For the four-Mech DropShip, use `theShip/dropship/`.
7. Create a single standalone SVG technical sheet. Preserve the source silhouette, apply best-attempt symmetry, render the subsystems as recognizable components, and do not trace the graph-paper grid into the ship drawing. Do not produce a Markdown specification unless the user explicitly asks for one.
8. Create an additional standalone SVG only when a section has independent geometry or operational meaning. Keep every output an image; do not add paired Markdown.
9. Ask focused clarification questions only after collecting all available image and written evidence. Do not block a high-level draft when unknowns can be marked `TBD`.
10. Run the bundled validator:

```powershell
python .github/skills/battletech-ship-technical-diagram/scripts/validate_outputs.py theShip/<component>
```

11. Render or open the SVG and visually verify the complete canvas, readable labels, no clipping, regularized symmetry, recognizable subsystems, and a match to the source.

## Evidence rules

- Treat user statements as confirmed requirements.
- Treat visible outlines and repeated compartments as confirmed geometry when unambiguous.
- Label interpretations from shape or common spacecraft practice as inferred.
- Never invent tonnage, dimensions, crew, thrust, armor, weapons, endurance, or BattleTech construction legality.
- Use `TBD` for absent values and list decisions needed for detailed design.
- Retain the original sketch unchanged. A copied source reference may be included beside outputs when its workspace path is available.

## Drawing rules

- Use native SVG shapes, paths, text, markers, and groups; do not embed the source bitmap as the final drawing.
- Preserve distinctive proportions, symmetry, tapers, bay count, centerlines, and docking geometry.
- When the sketch indicates bilateral or fore-aft symmetry, regularize the drawing to that axis: mirror and equalize paired features and straighten skewed centerlines. Preserve any clearly deliberate asymmetry.
- Render recognizable ship subsystems in established spacecraft, aircraft, and BattleTech engineering tradition: nozzle bells for main drives, clustered small nozzles for maneuvering thrusters, framed canopy geometry for cockpits and bridges, swept or straight airfoils for wings and fins, ringed collars with latch detail for docking interfaces, and ribbed panels for radiators. Keep them stylized but readable, label each, and mark function inferred when unconfirmed.
- Remove graph-paper lines, notebook holes, shadows, hands, perspective distortion, and photographic background.
- Show at least one primary orthographic view. Add elevations, docking context, or section callouts only when supported.
- Keep dimensions as `TBD` when no scale is supplied.
- Use clear engineering hierarchy, restrained color, high contrast, and printable labels.
- Include a note that the sheet is conceptual and not a construction drawing.

## Four-Mech DropShip defaults

When the supplied sketch is the four-Mech DropShip docked to the JumpShip:

- Preserve the pointed prow, rectangular main body, four-bay `2 x 2` arrangement, central longitudinal spine, and aft docking interface.
- Treat the body as bilaterally symmetric about the centerline; mirror and equalize the paired aft modules and the bays.
- Render the paired aft modules with nozzle-bell drive geometry, the aft interface as a docking collar with latch or brace detail, and any prow enclosure as a framed bridge or command canopy, each marked inferred until confirmed.
- Confirm capacity as four BattleMechs and mission as deployment/recovery of one lance.
- Do not assume aerodyne versus spheroid classification, bay-door direction, mass, crew, propulsion, armor, or weapons.
- Default output (image only):
	- `theShip/dropship/A5-FOUR-MECH-DROPSHIP-SPEC.svg`

## Completion criteria

- SVG parses as XML and has a `viewBox`, accessible title, and description.
- Diagram contains no embedded raster image and no graph-paper tracing.
- Intended symmetry is regularized and recognizable ship subsystems are drawn and labeled.
- On-sheet text distinguishes confirmed, inferred, and `TBD` information.
- All generated files stay inside the requested `theShip/<component>/` directory.
- Final response links to the created SVG and reports validation performed.
