# Wave 122 remaining NAV leftover after NAV-07 — live inventory

**Wave:** 122. Markdown only. Code wins over wishlist Initiative NAV-03 “Remaining zone handoff leftover: Wave 116 brief; impl later.”  
**Census date:** 2026-08-25.  
**Scope:** remaining **NAV leftover after Wave 121 NAV-07 chart-label PR1**. Not TGT. Not REP. Not overlay mutex. Not toast. Not KeyJ.  
**Cite, do not rewrite:** [`docs/Nav01RouteDesign.md`](../../docs/Nav01RouteDesign.md), [`docs/Nav02GuidanceDesign.md`](../../docs/Nav02GuidanceDesign.md), [`docs/Nav03AutopilotDesign.md`](../../docs/Nav03AutopilotDesign.md), [`docs/Nav04HoverDesign.md`](../../docs/Nav04HoverDesign.md), [`docs/Nav05HandoffDesign.md`](../../docs/Nav05HandoffDesign.md), [`docs/Nav06ChartCloseDesign.md`](../../docs/Nav06ChartCloseDesign.md), [`docs/Nav07ChartLabelDesign.md`](../../docs/Nav07ChartLabelDesign.md); [`docs/PLAYER-EXPERIENCE-WISHLIST.md`](../../docs/PLAYER-EXPERIENCE-WISHLIST.md) Initiative NAV + Idea inbox (read only).  
**Not this leftover:** HUD-01 empty hub. Digit 0/8/9. KeyJ dock/jump. Overlay hail/chart/berth mutex. Toast flood. Teleport. Persist-resume flying AP. Hub PPI. New Digit. New persist key. UU. SKU. Kit mutate. Aim-glass gauges.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Verdict first (code wins)

| Question | Live | Result |
|---|---|---|
| NAV-01 plot persist + chart click? | **Yes.** `WORLD_FIELDS` includes `nav`; `plotRoute` / `clearRoute`; chart click `activateSystem` | **LIVE** (Wave 85) |
| NAV-02 next-gate readout / cue / ring? | **Yes.** `.rw-nav-readout`, `.rw-nav-gate-cue`, `nav-guidance.js` | **LIVE** (Wave 85) |
| NAV-03 Autopilot MATCH refuse, cancel keeps dest, restore never resumes? | **Yes.** `apRefuseToken` `match`; `disengage` clears flying flag only; `writeNav` / `sanitizeNav` force `autopilot: false` | **LIVE** (Wave 85) |
| NAV-04 hover strip? | **Yes.** `hoverModel` + reserved `.rw-galaxy-hover`; hover does not plot | **LIVE** (Wave 96) |
| NAV-05 AP handoff (nearer hub does not cancel a physical ring; split `AP_LINES`; `gate.js` sole emit; `#rw-galaxy-ap-live` on fly cancel; chart does not close on **direct** engage)? | **Yes.** `lookupLiveNavHopKind`; split English; `jumpRequested` only in `gate.js`; `showApLive(apLine(reason))` | **LIVE** (Wave 117) |
| NAV-06 Autopilot **button** success `setOpen(false)` + blur / HUD Cancel; direct `tryEngage` still does not close? | **Yes.** Button empty token → `setOpen(false)`; WAVE117 pin `chartStayOpen` on `e117` then `chartEngageStay` on button click | **LIVE** (Wave 120) |
| NAV-07 labels share `activateSystem`; dest `#rw-galaxy-dest`; KeyM close skips `isTypingFocus()`? | **Yes.** `isPlotTarget` includes `.rw-galaxy-label`; dest `<select>`; KeyM typing skip | **LIVE** (Wave 121) |
| Second unnamed NAV hole (teleport, resume-flying persist, hub PPI, dest-select hover leftover, missingGate collapse, labels not clickable)? | **No.** Idea inbox NAV items are `[x] DONE`. Wishlist NAV-03 handoff sentence is **stale** | **Not a hole** |
| Wishlist “Remaining zone handoff leftover … impl later” still true vs code? | **No.** Wave 117 landed. Code wins | **CONSUME** |

Name: **no remaining NAV leftover.** Freeze **CONSUME**. Named serial **none**.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/galaxychart.js` | plot, labels, dest select, Autopilot button, hover, `showApLive`, `setOpen` |
| `src/game/autopilot.js` | MATCH, cancel dest keep, restore silent, hub/ring, `AP_LINES`, `wantJump` |
| `src/systems/gate.js` | sole `jumpRequested`; `lookupLiveNavHopKind`; hub cycle skip for ring |
| `src/systems/hud.js` | nav cue / readout / AP Cancel (MATCH cite only) |
| `src/systems/nav-guidance.js` | next-hop ring / names; read-only `world.nav` |
| `src/game/chart-hover.js` | NAV-04 `hoverModel` |
| `src/core/ctx.js` | `autopilot` channel; `flags.chartOpen` session |
| `src/game/save.js` | `WORLD_FIELDS.nav`; snapshot/restore `sanitizeNav` |
| `src/game/nav.js` | `plotRoute` / `sanitizeNav` / `autopilot: false` on write |
| `src/systems/overlay-policy.js` | `isTypingFocus` includes `SELECT` |
| `src/ui/hud.css` | label pointer-events; empty 80 px hub |
| `scripts/boot-test.mjs` | WAVE85 / WAVE117 / WAVE118 pins; WAVE96 / WAVE120 / WAVE121 **named logs absent** |
| `out/w121/chartlabel/` | Wave 121 PR1 re-census (read) |
| `out/w120/chartclose/` | Wave 120 PR1 close (read) |
| `out/w117/nav05/` | Wave 117 PR1 handoff (read) |
| Honor docs | Nav01–07 briefs; wishlist Initiative NAV |

Did **not** start Vite or Chrome. Domain is **data**.

---

## 2. Wishlist vs code (stale line)

Initiative NAV (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **1113–1124**, cite only): NAV-01..07 listed DONE through Wave 121.

NAV-03 body still says (**1165–1169**):

> **Status:** DONE (Wave 85). Restore does not resume flying.  
> Remaining zone handoff leftover: Wave 116 brief  
> (`docs/Nav05HandoffDesign.md`); impl later.

**Code wins.** Wave 117 PR1 landed handoff (`docs/Nav05HandoffDesign.md` Status: Wave 117 PR1 landed). Idea inbox P0 NAV handoff is `[x] DONE` (**44–49**). This pack does **not** edit the wishlist.

Idea inbox remaining NAV rows are also `[x] DONE`: chart-label Wave 121 (**65–71**); close-chart-on-AP Wave 120 (**72–76**). No unchecked NAV IDEA.

---

## 3. NAV-01 plot persist + chart click (Wave 85)

| Surface | Live | Cite |
|---|---|---|
| Persist key | one `nav` on `WORLD_FIELDS` | `save.js` **77–101** |
| Snapshot / restore heal | `sanitizeNav(ctx)` | `save.js` **976**, **1240** |
| Write bag | `{ dest, path, remaining, status, autopilot: false }` | `nav.js` **48–55** |
| Plot / clear | `plotRoute` / `clearRoute`; uncharted fail closed | `nav.js` **271–300** |
| Recalc | `recalcOnLoad` — “Does not teleport. Does not request a jump.” | `nav.js` **302–303** |
| Chart click | `isPlotTarget` → `activateSystem` → current `clearRoute` else `plotRoute` | `galaxychart.js` **89–97**, **726–732**, **748–751** |
| Status paint | dest square / hop lines / unreachable / arrived | **543–638** |
| WAVE85 persist pin | `WAVE85 NAV PERSIST` | `boot-test.mjs` **18828–19084** |
| WAVE85 chart pin | `WAVE85 NAV CHART` | **19087–19374** |

---

## 4. NAV-02 next-gate readout / cue / ring (Wave 85)

| Surface | Live | Cite |
|---|---|---|
| Readout | NEXT / DEST / JUMPS / GATE; `aria-live` polite on live block | `hud.js` **1008–1026** |
| Off-glass cue | `.rw-nav-gate-cue` park docked/jumping | **818–822**, **1690–1738** |
| Ring | `nav-guidance.js` consume `path[1]`; live assembly zone origin | `nav-guidance.js` **1–12** |
| WAVE85 guidance pin | `WAVE85 NAV GUIDANCE` | `boot-test.mjs` **19377–19558** |

Not a lock. Not `.rw-edge-arrow`. TGT workers own combat arrows.

---

## 5. NAV-03 Autopilot (Wave 85)

| Surface | Live | Cite |
|---|---|---|
| Command computer | no mesh; no `jumpRequested` | `autopilot.js` **1–4** |
| MATCH refuse | `apRefuseToken` → `'match'`; English `Autopilot refused — MATCH is on.` | **22**, **175–188** |
| Cancel keeps dest | `disengage` sets `nav.autopilot = false` only; does not `dropNav` | **191–207** |
| Restore never resumes | `writeNav` / `sanitizeNav` always `autopilot: false`; `reason === 'restore'` silent | `nav.js` **48–55**, **191–192**; `autopilot.js` **202–206** |
| WAVE85 stuffed heal | `stuffedFalse` after `sanitizeNav` of `autopilot: true` | `boot-test.mjs` **19680–19688**, **19730** |
| WAVE85 dest keep | `destKeep` in `w85ap` | **19724** |
| WAVE85 AP pin | `WAVE85 NAV AUTOPILOT` | **19561–19735** |
| WAVE85 path pin | `WAVE85 NAV AP PATH` | **19738–19892** |
| Channel | `ctx.autopilot` live only; not `WORLD_FIELDS` | `ctx.js` **16**, **96–105** |

---

## 6. NAV-04 hover strip (Wave 96)

| Surface | Live | Cite |
|---|---|---|
| Model | `hoverModel(ctx, id)` sanitize + standing + rank; no DOM; no persist | `chart-hover.js` **1–8**, **28–66** |
| Strip | reserved `.rw-galaxy-hover` under SVG; `textContent` name / Control / Standing | `galaxychart.js` **374–387**, **439–460** |
| Pointer | `pointerover` `isPlotTarget` → `applyHoverId` only | **754–758** |
| Hover plots? | **No** | **31–33**, **754–758** |
| WAVE96 named pin in `boot-test.mjs` | **absent** (grep `WAVE96` / `hoverModel` / `chart-hover` = 0) | honor: code still **LIVE**; do not invent a pin leftover |

Keyboard dest list is NAV-07 plot path, not a missing hover leftover. Do **not** freeze dest-select hover inspect as PR1.

---

## 7. NAV-05 AP handoff (Wave 117)

| Surface | Live | Cite |
|---|---|---|
| Hop kind | `'ring'` \| `'hub'` \| `''` | `gate.js` **501–505** |
| Nearer hub vs ring | `hopKind !== 'hub'` → no `cycleHub`, no `missingHub` | `autopilot.js` **335–337** |
| Hub cycle skip ring | `lookupLiveNavHopKind(...) !== 'ring'` | `gate.js` **681–690** |
| `AP_LINES` split | `missingHop` ≠ `missingGate`; lookup / path / hub / wrap distinct | `autopilot.js` **21–38** |
| Sole emit | `ctx.emit('jumpRequested', { to: near.to })` in `gate.js` only | **672–678** |
| `wantJump` | `inZone && !docked && nearTo === hop` | `autopilot.js` **333** |
| Chart live on fly cancel | `#rw-galaxy-ap-live` `showApLive(apLine(reason))` | `galaxychart.js` **157–162**, **644–647**, **819–827** |
| Direct `tryEngage` does not close | WAVE117 `chartStayOpen` after `e117` | `boot-test.mjs` **23570–23572**, **23712** |
| WAVE117 pin | `WAVE117 NAV-05 HANDOFF` incl. `liveRouteSeq` / `hubNoCancel` | **23439–23730** |

Wishlist “impl later” is **stale**. Handoff is **LIVE**.

---

## 8. NAV-06 chart-close-on-AP (Wave 120)

| Surface | Live | Cite |
|---|---|---|
| Autopilot **button** success | empty `tryEngage` token → `showApLive('')` + `setOpen(false)` + blur / prefer `#hud .rw-autopilot-cancel` | `galaxychart.js` **699–721** |
| Button cancel while open | `disengage('cancel')` + `showApLive(apLine('cancel'))`; dest stays | **691–697** |
| Direct `tryEngage` | no `setOpen` in `autopilot.js` `tryEngage` | `autopilot.js` **209–223** |
| WAVE117 pin folded close | comment “Button success close (PR1)”; `chartEngageStay` requires `chartOpen === false` after **button** click | `boot-test.mjs` **23659–23664**, **23724** |
| Named `WAVE120` log | **absent** in `boot-test.mjs` | close still **LIVE** in `galaxychart.js` |

---

## 9. NAV-07 chart-label (Wave 121)

| Surface | Live | Cite |
|---|---|---|
| Labels | authored ∪ pinned ∪ hub; `data-system-id`; `textContent` name | `galaxychart.js` **340–350** |
| Label CSS | `pointer-events: all`; `cursor: pointer` | `hud.css` **2165–2171** |
| Shared activate | `isPlotTarget` hit **or** `.rw-galaxy-label` | `galaxychart.js` **89–97**, **748–751** |
| Dest `<select>` | `#rw-galaxy-dest` once at init; all charted ids; under desc | **194–230**, **394–396** |
| Dest change | `activateSystem(v)` | **742–746** |
| Dest sync | `select.value` on `retargetPlot` | **561–563** |
| KeyM typing skip | `isTypingFocus()`; fallback `ae.id === 'rw-galaxy-dest'` | **764–779**; `overlay-policy.js` **72–80** |
| Escape still closes | **Yes** | **786–787** |
| HIT discs | still 24 CSS px | `galaxychart.js` **48**, **513** |
| `innerHTML` | **none** in `galaxychart.js` | grep 0 |
| Named `WAVE121` log | **absent** in `boot-test.mjs` | live + `out/w121/chartlabel/` probe |

---

## 10. Ctx / persist / honor

| Surface | Live | Cite |
|---|---|---|
| `ctx.autopilot` | live command; `wantJump` default false | `ctx.js` **96–105** |
| `flags.chartOpen` | session only; not `WORLD_FIELDS` | **208** |
| Overlay open gate | `setOpen(true)` calls `canOpenPlayCard(ctx, 'chart')` | `galaxychart.js` **482–486** |
| Empty hub | 80 px reticle | `hud.css` **184–193** |
| Digit 0 / 8 / 9 | shipyard / launch / epics | `station.js` **188**, **6035–6036** |
| HUD AP Cancel | `disengage(ctx, 'cancel')` | `hud.js` **1068–1076** |

---

## 11. Grep remaining holes (rejected as leftover)

| Candidate | Live | Verdict |
|---|---|---|
| Teleport dest | `autopilot.js` never assigns `currentSystem` except **compare** dest (**396**). Jump emit is `near.to` | **not a hole** — inventing teleport is forbidden |
| Persist-resume flying AP | `sanitizeNav` always `autopilot: false` | **not a hole** |
| Collapsed `missingGate` English | split `AP_LINES` Wave 117 | **gone** |
| Hub-zone cancel of physical ring | `hopKind !== 'hub'` skip; WAVE117 `hubNoCancel` | **gone** |
| Labels not clickable | `isPlotTarget` + CSS `pointer-events: all` | **gone** |
| Dest select missing | `#rw-galaxy-dest` | **gone** |
| KeyM typeahead closes dest | `isTypingFocus` skip | **gone** |
| Hub PPI | none; TGT contacts arc is sibling | **do not invent** |
| WAVE96/120/121 named boot logs missing | pins live under WAVE85 / WAVE117 `chartEngageStay` / src | **not a player-facing NAV hole**; do not add `scripts/` from this pack |

---

## 12. Boot pins (read only; do not edit)

| Pin | What it proves |
|---|---|
| WAVE85 NAV PERSIST | `nav` field, proto drop, restore heal |
| WAVE85 NAV CHART | click/plot, `chartOpen`, `fireHeld` gate |
| WAVE85 NAV GUIDANCE | readout / cue / marker / `path[1]` |
| WAVE85 NAV AUTOPILOT | sole emit, MATCH, dest keep, stuffed false |
| WAVE85 NAV AP PATH | live zone aim, gate-only jump |
| WAVE117 NAV-05 HANDOFF | split lines, ring vs hub, `liveRouteSeq`, chart live cancel, **button** close `chartEngageStay`, direct engage stay-open |
| WAVE118 | overlay mutex (sibling; cite) |
| WAVE96 / WAVE120 / WAVE121 named `console.log` | **not present** |

---

## 13. Name

**no remaining NAV leftover.** Freeze leftover **CONSUME**. Named serial **none**. Do **not** invent NAV-08 product work.
