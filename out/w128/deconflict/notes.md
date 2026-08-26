# Wave 128 HUD-07 leftover notes

**Verdict:** leftover **REAL**. Name: **dynamic deconfliction + quieter exploration layout**. Named serial: **PR1**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt9mdtp0-428cf757`). No active workflow met the threshold. Did **not** `graph_approve` / `graph_propose`. Did **not** mutate CRM, calendar, or the graph. Local markdown only.
- Census live `src/systems/hud.js` create-once tree, AGEZ, `.in-combat`, duplicate names, RANGE/LEAD, HOME, NAV-02, TGT, banner, toasts, prompt.
- Census `src/ui/hud.css` hub 80 px, rail seats, fade numbers, insets 84 / 108, toast/banner seats.
- Honor: HUD-01 empty hub, HUD-04 linger 8 s, HUD-05 CONSUME, HUD-06 pip + chevron 108, TGT arrow 84, NAV-02 cue 84 — cite, do not edit.
- Code wins over inbox “bright suns” as HUD nodes (they are 3D + existing toasts).
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`.

## Why REAL (not CONSUME)

Named hole still live:

- No general collision vs reticle / silhouette / selected target / projectile path.
- `agezHairOff` hides **bio rail hair** only (`hud.js` **209–221**, **1545–1561**).
- Duplicate lock name: `.rw-target-name` + `.rw-combat-name` (**2322**, **2349**).
- `RANGE` / `LEAD` words sit on the aim column.
- Chartmark / HOME labels can sit on hub and lock (combat only dims to 0.14).
- Exploration does **not** quiet combat-only chips; `.in-combat` fades **career** chrome instead.
- Banner/toasts already off-column (do not redo). NAV-02 on-glass hide already live (do not steal).

Owner-omitted / skippable (not this leftover):

- HUD-05 remaining-feedback (CONSUME).
- HUD-06 PR2 stills / POI picker.
- Hail02 miss toasts. NAV-09 chart zoom.
- Sun 3D dimmer. Selected-POI picker.

Rejected as invented work: hub compass/PPI/deconflict widget, two HUD trees, steal HOME pip, retune inset 108, new toast, third live region, persist key, new Digit, `innerHTML`, `state.js` keys, hail.js / galaxychart.js / controls.js / npc.js claims.

## Deputize (frozen)

- Protect: 80 px hub, silhouette proxy (stroke rails + AGEZ path), bracket box, reticle→lead segment.
- Yield: duplicate name, RANGE/LEAD **words**, chart/home **labels**. Hide-not-delete.
- Exploration: quieter combat-only words. Keep HOME / NAV-02 / dock J / POS.
- Combat: keep existing `.rw-fade` / aux / chart / home numbers. Do not stack a hide of nav.
- Write-set later: **`src/systems/hud.js` + `src/ui/hud.css` only**.

## This pack

Markdown only:

- `docs/Hud07DeconflictionDesign.md`
- `out/w128/deconflict/**` (no `verify/**`)

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs.

## Reviews

- Security: self-applied `security-review.md`. HIGH (`innerHTML`, third live region, rail name skip, persist) locked in contract. Re-review: clean.
- Code/design-doc: self-applied `code-review.md`. No remaining Blocker/Major.
- UI: self-applied `ui-audit.md`. Hub / quieter cruise / yield vs steal locked.

## Processes

Started none. No Vite. No Chrome. No CDP.

## Coupling for orchestrator

Do **not** implement in this worker. Sibling Hail02 owns miss toasts. Sibling NAV-09 owns chart zoom. HUD-06 pip/108 stays. HUD-04 linger stays. Serial **PR1** is named only. Graph resolution id `r-mt9mdtp0-428cf757` (`proceed_unmodeled`).
