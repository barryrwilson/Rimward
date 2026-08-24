# RIMWARD NAV-04 galaxy-map system hover

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-04 galaxy-map system hover |
| **Author** | Wave 95 NAV-04 integrator |
| **Date** | 2026-08-23 |
| **Status** | implemented |
| **Wave** | 96 — impl. Merge law still wins. |
| **Owner request** | Hover a system on the KeyM chart and see a compact panel: name, controlling faction or political status, player standing (label + number/rank matching Digit 9 / RANK_LADDER), local standing only if tracked separately. Neutral / independent / contested / unclaimed / unknown must be explicit. Respect exploration knowledge. |
| **Merge law** | [`out/w95/nav04/shared-contract.md`](../out/w95/nav04/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Wave 96 impl** | `src/game/chart-hover.js` (`hoverModel`); `src/systems/galaxychart.js` pointer + reserved strip; `src/ui/hud.css` `.rw-galaxy-hover*` / `.is-hover`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w95/nav04/current-nav04-inventory.md`](../out/w95/nav04/current-nav04-inventory.md) |
| Merge law | [`out/w95/nav04/shared-contract.md`](../out/w95/nav04/shared-contract.md) |
| Security review | [`out/w95/nav04/security-review.md`](../out/w95/nav04/security-review.md) |
| Design-doc review | [`out/w95/nav04/code-review.md`](../out/w95/nav04/code-review.md) |
| UI audit | [`out/w95/nav04/ui-audit.md`](../out/w95/nav04/ui-audit.md) |

Siblings NAV-01 (plot), NAV-02 (guidance), and NAV-03 (autopilot) are **DONE**. **Do not edit** `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, or `out/w84/nav01|nav02|nav03/**`. Do not reopen plot / autopilot law.

---

## Overview

KeyM already opens a live SVG galaxy chart. It paints every charted system, faction colors, gates, hub routes, the current marker, and the NAV-01 plot overlay. Click a hit disc to plot. There is **no** hover panel, **no** standing line on the map, and **no** hover highlight.

Wishlist NAV-04 wants: move the pointer across systems and see a compact panel (name, control/political status, faction standing matching Digit 9 / `RANK_LADDER`, local standing only if it exists). Independent / unknown (and contested / unclaimed **if live data exists**) must be explicit. Undiscovered info must say unknown, not silently appear.

This brief is the integrator document for a **later** implementation wave. It freezes hit-disc hover, a reserved readout, `hoverModel` on `standingRead` + `rankFor`, political mapping from `SYSTEMS[id].faction`, no persist key, and a serial PR plan. Wave 95 lands this markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. No power pip. NAV-01 click-to-plot stays. Hover must not replace `world.nav` dest or steal KeyV / KeyT. `state.js` stays READ-ONLY. Wave 94 `veil` / Unknowables must not be labelled Independent or Unknown. Do not invent UU or standing deltas.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w95/nav04/current-nav04-inventory.md`](../out/w95/nav04/current-nav04-inventory.md). Code wins over stale Wave 84 line numbers.

| Surface | Today | Cite |
|---|---|---|
| Chart overlay | DOM/SVG, built once from `SYSTEMS` | `galaxychart.js` 4–30, 87–312 |
| KeyM / Escape | Toggle; docked/paused close-only; no preventDefault/stopPropagation | `galaxychart.js` 551–561 |
| Hit disc | ≥ 24 CSS px, `data-system-id`, click → plot/clear | `galaxychart.js` 42, 268–276, 540–548 |
| Hover / tooltip | **None** | grep 0 in `galaxychart.js` |
| Node color | Faction fill for **every** charted system | `galaxychart.js` 251–258 |
| Labels | Authored seven (incl. `veil`) + hubs + pinned | `galaxychart.js` 48–49, 279–287 |
| Uncharted | No node | `galaxychart.js` 94–95, 249 |
| Mystery | Never read on the chart | `galaxychart.js` 16–21 |
| Plot / AP | Click plots; header Autopilot | `galaxychart.js` 515–548 |
| Keyboard node pick | **None**. No gamepad in `src/` | inventory §1.2 |
| `RANK_LADDER` / `rankFor` | Sworn 50 … Marked −1000 | `state.js` **707–717** |
| Standing read | `standingRead` allowlisted FACTIONS | `data-trade.js` 72–81 |
| Digit 9 copy | `Name: Rank (+N)` | `station.js` 5675–5676 |
| Default reputation bag | four keys at 0 | `ctx.js` 152 |
| Local standing bag | **None** | `restitution.js` 7–12 uses system **faction** |
| Contested field | **None** | inventory §2.3 |
| `veil` | The Veil, `unknowables`, The Quiet | `authored-systems.js` 234–243 |
| Persist | `WORLD_FIELDS` has `reputation` + `nav`; **no hover key** | `save.js` 76–100 |
| HUD-01 | Aim glass empty; hover must not add a pip | HUD-01 closed |
| `innerHTML` | **none** in `galaxychart.js` | grep 0 |

The player still opens Digit 9 at a dock to learn rank. Generated systems have no map labels.

### Pain points

- Wishlist NAV-04: hovering a system shows nothing. Names exist only for authored/hub/pinned nodes.
- Node fill already leaks faction color for every charted system. A panel that said Unknown while the disc is Veridian green would lie in the other direction. Visit fog is not live and must not be invented as a persist key.
- Reusing native `title` would flicker on overlapping 24 CSS px discs and would not match Digit 9 standing.
- Writing standing into `world.nav` would fight NAV-01 sanitize.
- Calling `plotRoute` on pointerover would steal the click-to-plot verb.
- A floating tooltip on the node would cover the dest square and plot strokes.
- `hollow` comments say “unclaimed”; Digit 9 still treats Hollow Reach as a faction. Relabelling hollow as Unclaimed would disagree with yards / law / missions.
- `veil` is Unknowables. Mapping unknown-looking names to Unknown would lie.

### Why now (design) / why not now (code)

The owner asked for the NAV-04 hover brief after NAV-01/02/03 shipped. Inventory and merge law exist. Implementation waits so sanitize, Digit 9 parity, Unknowables, and click-steal fences exist on paper before the first pointerover writes DOM. Wave 95 does not ship `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live chart, hit discs, standing helpers, RANK_LADDER, Digit 9 copy, mystery-off-chart, and `veil` from **live code**.
2. Freeze hover on the **same hit discs** as click, immediate panel update, visual `.is-hover`.
3. Freeze a **reserved** compact panel: name, explicit control status, Digit 9 standing line.
4. Freeze Independent / Unknown as explicit strings. Do not invent Contested / Unclaimed tokens.
5. Freeze **no** local standing row (not tracked).
6. Freeze **no** persist key. Live `standingRead` each `update`.
7. Freeze XSS / proto / no-`innerHTML` / no mystery / no lock steal / no plot steal.
8. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 95. No implementation PRs scheduled here.
- No NAV-01 plot UI, pathfinding, or click changes.
- No NAV-02 in-flight marker art. No NAV-03 Autopilot reopen.
- No KeyV / KeyT / Digit 0–9 steal. No HUD-01 layout move. No power pip.
- No `state.js` write. No new `U.*` / `JUMP.*` / RANK_LADDER rungs.
- No chart pause. No keydown preventDefault/stopPropagation.
- No clue ids/text or landmark discovery on the galaxy chart.
- No UU, standing deltas, BIO, police, visit-fog persist, aim-glass gauge.
- Do not edit the wishlist, `PROGRESS.md`, or sibling NAV files.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No** | Hover is live. Inventory: none required |
| Write `world.nav`? | **No** | NAV-01 owns dest. Hover must not steal plot |
| Standing reader? | `standingRead` then `rankFor` | Yards, law, missions, Digit 9 |
| Ladder? | Live `RANK_LADDER` `state.js` 707–717 | Stale 672 cites are wrong |
| Digit 9 match? | `Name: Rank (+N)` / signed `Math.round` | `station.js` 5675–5676 |
| Local standing? | **Omit row** | No separate bag |
| Contested? | **Do not print** | No live field |
| Unclaimed? | **Do not remap hollow** | Hollow Reach is a FACTIONS key |
| Independent? | Explicit **Independent** | `faction === 'independent'` |
| Unknown? | Explicit **Unknown** | Missing / reserved / non-FACTIONS key |
| Unknowables / `veil`? | **Unknowables** | Wave 94; do not lie |
| Visit fog? | **None** | No visit list; node color already paints faction |
| Mystery? | **Do not read** | Wave 21 |
| Panel place? | Reserved strip below SVG | Must not cover node / routes / header |
| Keyboard picker? | **No** | Chart does not pause; NAV-01 Q4 |
| Hover vs click? | Pointer inspect; **click still plots** | Regression: hover stealing plot |
| `innerHTML`? | **No** | `textContent` / SVG attrs / `h()` |
| HUD-01? | Closed | Empty glass; no pip |
| `state.js`? | READ-ONLY | Orchestrator law |

### 2. Player outcome

Open the galaxy chart (KeyM). Move the pointer onto a charted system. A compact strip under the map names that system, states who controls it (or Independent / Unknown), and shows the same rank + number Digit 9 would show for that faction. The hovered disc is outlined so the subject is clear. Move to another disc: the strip updates at once. Click still plots a route. Close the map: the strip clears. Standing on the strip matches a dock Digit 9 read of the same bag.

### 3. Hover hit and highlight

See contract §2.

Reuse `isHitDisc` + `sanitizeSystemId`. Immediate update. Topmost overlapping disc wins. Sticky until leave svg or another disc. `.is-hover` + optional marker, `pointer-events: none`. Compose with plot/current classes.

Close (`setOpen(false)`) clears hover.

### 4. Panel contents

See contract §3–§4.

Three lines:

1. **Name** — catalog `SYSTEMS[id].name` (control-char stripped).
2. **Control** — Unknown | Independent | faction display name (Hollow Reach, Unknowables, Veridian Combine, …).
3. **Standing** — Unknown, or Digit 9 line for that faction key.

No fourth local-standing line.

### 5. Knowledge

Uncharted systems are not in the SVG: hover cannot reveal them.

The chart already paints faction color for every charted node. The panel may name that same catalog faction. It must not read `world.mystery` to “fill in” landmarks or clues.

If `faction` is missing or not in `FACTIONS`, print **Unknown** for control and standing. Do not fall back to Independent for a bad key (`data-faction` already uses `?? 'independent'` on the node attribute; the **panel** must use the FACTIONS allowlist, not that attribute).

### 6. Security / emit / persist

See contract §1 and §6.

No `WORLD_FIELDS` key. No `ctx.emit`. No `innerHTML`. No proto ids.

### 7. Closed HUD / lock / digits

- Do not set `ctx.targets.current`.
- Do not change HUD-01 rails, MATCH, lead, RANGE, contacts, chart marks, power pips.
- Digit 0 shipyard. Digits 1–9 station services. Weapon 1–4 stay.
- Chart remains closed while docked.

---

## Ownership (later impl)

See contract §7.

Prefer a tiny `hoverModel` helper so pins do not need jsdom. `galaxychart.js` owns pointer + DOM. `save.js` / `state.js` untouched.

---

## Serial PR plan (later wave — named only)

Do **not** land these in Wave 95. See contract §8.

1. **PR1** `hoverModel` pins (no UI).
2. **PR2** Chart pointer + reserved panel + click still plots.
3. **PR3** Overlap / flicker / a11y / motion / contrast.
4. **PR4** Live standing refresh; plot classes survive; no `world.nav` write.

---

## Open owner questions

Defaults are in the contract. Do not invent UU/rep/fog while waiting.

1. **Visit fog for unvisited systems?** Live code has no visit list; node color already shows faction.  
   **Default: none.** Do not add a persist key.

2. **Print Contested / Unclaimed even though no SYSTEMS field exists?**  
   **Default: no.** Hollow Reach stays Hollow Reach. Independent stays Independent.

3. **Reserved strip vs floating tooltip near the node?**  
   **Default: reserved strip below the SVG** so routes and header buttons stay clear.

4. **Show extra words friendly / neutral / unwelcome / hostile beside the RANK_LADDER name?**  
   **Default: no.** Digit 9 name + number is enough.

5. **Add keyboard node focus later?**  
   **Default: not this serial.** If added later, reuse `hoverModel`.

Do not treat plot steal, lock steal, `innerHTML`, mystery-on-chart, or a second persist key as open.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Tooltip flicker on overlapping nodes | Sticky hover id; topmost `isHitDisc`; no native `title` |
| Panel off-screen | Reserved strip inside `.rw-galaxy-chart-panel`, not a cursor-following balloon |
| Stale standing | Re-read `standingRead` / `rankFor` in `update()` while hovered |
| Reveal undiscovered ownership | Uncharted never hoverable; mystery unread; bad faction key → Unknown; no new fog bag |
| Hover steals route-plot click | Hover does not call `plotRoute`; no preventDefault/stopPropagation; click handler unchanged |
| Hover writes dest | `world.nav` read-only for hover |
| Independent looks like a banner lie | Explicit Independent token |
| `veil` looks empty / independent | Unknowables + standingRead(`unknowables`) |
| Local standing `0` invented | Omit the row |
| Digit 9 mismatch | Same `rankFor` + signed `Math.round` |
| XSS names | `textContent` only |
| Proto id | `sanitizeSystemId` |
| Aim-glass pip | Chart overlay only |
| Keyboard fights WASD | No arrow picker |

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. Pointer across charted systems updates the reserved panel immediately to that system’s name, control line, and standing line.
2. Hovered node is visually highlighted; dest / hop / current marks remain.
3. Panel is readable and does not cover the hovered node, plot/hub strokes, or Clear / Autopilot / Close.
4. Standing equals Digit 9 / `rankFor(standingRead(...))` for the controlling faction key (Independent uses key `independent`).
5. Independent, Unknown, and controlled faction names are explicit strings. Contested / Unclaimed are not printed (no live field).
6. Uncharted systems cannot be hovered. Mystery is not read. `veil` shows Unknowables.
7. Click still plots (or clears current). Hover does not write `world.nav`.
8. No `innerHTML`. No lock steal. No HUD-01 pip. No new persist key.

`state.js` untouched. Digit 0 still shipyard. KeyM still toggle. NAV-01/02/03 stay DONE.
