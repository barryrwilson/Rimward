# NAV-04 Wave 95 verifier notes

**Verdict:** CLEAN  
**Date:** 2026-08-23  
**Scope:** markdown freeze only. No Vite. No browser. No `src/` edits by this verifier.

Graph note: `graph_resolve` returned `codex/workflow-activar-client-brief` on weak terms (`brief`, `question`, coverage 0.06). That workflow is for client/prospect outreach and does not apply to this WebSim data check. This record follows the assigned NAV-04 verification task.

---

## 1. Brief / contract / inventory agree

| Source | Role |
|---|---|
| `docs/Nav04HoverDesign.md` | Integrator brief |
| `out/w95/nav04/shared-contract.md` | Merge law (wins on conflict) |
| `out/w95/nav04/current-nav04-inventory.md` | Live inventory (code wins) |

Checked freeze points: no persist key; hover does not write `world.nav`; standing path is `standingRead` then `rankFor`; Digit 9 pane copy; omit local standing; do not print Contested/Unclaimed; Independent and Unknown are explicit strings; `veil` → Unknowables; reserved strip below SVG; click still plots; no `innerHTML`; HUD-01 empty glass; `state.js` READ-ONLY; serial PR1–PR4 later.

No brief-vs-contract contradiction. Brief § merge table matches contract §0 / §3 / §4 / §10.

---

## 2. Brief exists with Wave 95 frontmatter and later serial PR plan

`docs/Nav04HoverDesign.md` exists (untracked). Frontmatter: Title, Author Wave 95 NAV-04 integrator, Date 2026-08-23, Status design-only, Wave `95 — design. Later — impl.`, merge law pointer to contract.

Serial plan named only (brief § Serial PR plan; contract §8): PR1 `hoverModel` pins → PR2 pointer + reserved panel + click still plots → PR3 overlap/a11y → PR4 live standing / no `world.nav` write. Wave 95 does not land `src/`.

---

## 3. Standing cites vs live code

| Claim | Live | Result |
|---|---|---|
| `RANK_LADDER` / `rankFor` `state.js` **707–717** | 707–714 ladder; 715–718 `rankFor` | Brief cite live |
| `standingRead` `data-trade.js` **72–81** | 73–81 | Live |
| Digit 9 pane `station.js` **5675–5676** | `src/systems/station.js` 5675–5676 `Name: Rank (+N)` with `Math.round` | Live |
| Dock-root extra ` rep` suffix **5808–5810** | 5808–5810 | Live; NAV-04 matches pane, not suffix |
| `FACTIONS` **584–599** | 584–599; `independent` name Independent; `unknowables` Unknowables; `hollow` Hollow Reach | Live |
| Default bag `ctx.js` **152** | four keys at 0 | Live |
| `sanitizeReputation` `save.js` **918–938** | 919–939 | Live |
| `dockReputation` twin `shipyard.js` **102–108** | 102–108; no FACTIONS allowlist | Live; freeze forbids fork |
| Local bag none; `restitution.js` **7–12** | 7–12 uses `SYSTEMS[id].faction` | Live |
| Digit 9 is Standing | `DOCK_KEY_SERVICES` 186; comment 1623; menu label 5801 | Live |

`rankFor` uses `rep >= min`; missing `standingRead` key → 0 → Stranger (`min: -10`). Matches Digit 9 / yards / law.

---

## 4. Hover does not steal NAV-01 click; does not write `world.nav`

Live click (`galaxychart.js` 540–548): `isHitDisc` → `sanitizeSystemId` → current clears else `plotRoute`. No `preventDefault` / `stopPropagation`.

No hover today: no `innerHTML`, `pointerenter`, `mouseover`, or `title=` in `galaxychart.js`.

Freeze: pointer inspect only; must not call `plotRoute` / `clearRoute` / `tryEngage`; must not write `world.nav`; click handler unchanged (contract §2.1 / §5; brief risks + acceptance 7).

`world.nav` is already a `WORLD_FIELDS` key for NAV-01. Hover does not add a writer.

---

## 5. No new persist / WORLD_FIELDS / frozen emit

Live `WORLD_FIELDS` (`save.js` 76–100) has `reputation` and `nav`. No hover / visit-fog key.

Contract §0.3 / §1.1 / §0.14: no new `WORLD_FIELDS`; hovered id is module-local `let`; no `ctx.emit` for hover.

Live emit (`ctx.js` 261–263) spreads `data` onto `{ type, t, ...data }`. Freeze forbids emitting the model (spread smash on `type`). No new frozen event type.

---

## 6. This worker did not edit `src/`

Git (2026-08-23):

- Untracked worker set: `docs/Nav04HoverDesign.md`, `out/w95/nav04/*.md` (five files). No `out/w95/nav04/verify/` before this notes file.
- Dirty / untracked `src/**` belongs to other Wave 95 workers (`npc.js`, GLBs/catalog, nav/AP, etc.). Not treated as NAV-04 bugs.

---

## 7. Open owner questions listed; no invented UU/deltas

Brief lists Q1–Q5 with defaults (visit fog none; no Contested/Unclaimed tokens; reserved strip; no extra friendly/hostile gloss; no keyboard picker). Contract §10 matches.

Non-goals lock: no UU, standing deltas, BIO, police, visit-fog persist, aim-glass gauge. Plot steal / `innerHTML` / mystery / second persist key are not open questions.

---

## 8. HUD-01 / NAV-01/02/03 not reopened

- HUD-01: empty aim glass; no power pip; hover lives only on open KeyM overlay.
- Do not edit `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, or `out/w84/nav01|nav02|nav03/**`. Those paths are not in the worker write-set.
- Digit 0–9 stay; chart closed while docked (`galaxychart.js` 573).
- KeyV / KeyT / `ctx.targets.current` untouched.

---

## Live chart facts used by the freeze

- Overlay built once: `initGalaxyChart` 87; panel mount through 312; file 602 lines.
- Hit floor `HIT_CSS_DIAMETER` 42; discs 268–276; radii 325–342.
- `data-faction` fallback `?? 'independent'` at 256 (panel must use `SYSTEMS[id].faction` + `FACTIONS` hasOwn, not that attr).
- Uncharted skip: 94–95 and 249 (no node / hit). Mystery unread: header 16–21.
- KeyM toggle 551–561; `aria-modal=false` 110; `chartOpen` `setOpen` 317–319; LMB gate `controls.js` 436–438.
- `veil`: `authored-systems.js` 234–243, faction `unknowables`, station The Quiet; `AUTHORED_IDS` includes `veil` (48).
- Generated faction counts (node probe of `galaxy.generated.js`): freehold 19, veridian 17, ferrous 17, redledger 11, gilded 8, beautiful 3, congregation 3, assembly 2, independent 13, lamplighter 1. No generated `hollow` / `unknowables`. Matches inventory §2.1.
- No `contested` in `src/`. No `gamepad` in `src/`. No `.is-hover` in `hud.css`.
- CSS cites for chart panel / plot-status / reduced-motion still match `hud.css` 1620–1638, 1642–1652, 1903–1911, 1944–1948.

---

## Residual nits (not freeze blockers)

1. Inventory §1.1 Uncharted cite includes `galaxychart.js` **181**. Live 181 is `legendHub.textContent = 'hub'`. Real skips are 94–95 and 249 (brief already omits 181).
2. Inventory §8 and security-review cite `ctx.emit` spread at `ctx.js` **231–232**. Those lines are the frozen-event comment list. Live `emit` is **261–263**. Claim is still true.

Standing cites in the brief are not stale.

---

## Processes

None started. No leftover Vite or Chrome from this verifier.
