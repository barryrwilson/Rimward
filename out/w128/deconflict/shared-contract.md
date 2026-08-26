# HUD-07 dynamic deconfliction shared contract

**Wave:** 128. Design only. No deconflict ships in this wave.  
**Status:** MERGE LAW for `docs/Hud07DeconflictionDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (dynamic deconfliction + quieter exploration layout).  
**Name:** dynamic deconfliction and a quieter exploration layout for the central HUD.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud01*`–`Hud06*`, `docs/Hud04ToastFloodDesign.md`, `docs/Hud05RemainingFeedbackDesign.md`, `docs/Hail01*`, `docs/Hail02MissFeedbackDesign.md`, `docs/Nav09ChartReadabilityDesign.md`, `docs/AgentApiDesign.md`, `docs/Ctl*.md`, `docs/Nav*.md`, `docs/Tgt*.md`, `docs/OwnerDecisions*.md`. Do not write `out/w128/deconflict/verify/**`. Do not steal `out/w128/hailmiss/**`, `out/w128/chartread/**`, `out/w127/**`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over wishlist wording.

**This leftover is one HUD layout policy:** protect four sight regions; collapse or relocate lower-priority HUD on collision; make exploration quieter than combat for combat-only chips. It is **not** HUD-05 remaining-feedback. It is **not** HUD-06 home marker. It is **not** HUD-01 empty-hub occupancy. It is **not** HUD-03 alerts. It is **not** HUD-04 toast flood. It is **not** a selected-POI picker. It is **not** a second HUD skin.

**Live hole:** no general collision vs reticle / silhouette / selected target / projectile path. Duplicate lock names (`rw-target-name` + `rw-combat-name`). RANGE/LEAD words stay on the aim column. Chartmark / home pip labels can sit on the lock. Exploration leaves combat chips at full opacity. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No** deconflict widget, compass, PPI, or gauge inside `.rw-reticle`. RANGE ring class may stay. RANGE **word** may hide/yield. Digit 0/8/9 stay. **No new Digit.** KeyH/J/L/M/P stay.
3. `innerHTML` forbidden later. Copy via `textContent` / `createTextNode` / `el()` only. **No** `insertAdjacentHTML` / `document.write`. Names through `stripHudText` (`hud.js` **426–435**). Live rail name skip (`2345–2349`) must **not** be copied; if PR1 writes `.rw-combat-name`, it must strip.
4. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. **No** persist key. **No** new `WORLD_FIELDS`. **No** new `localStorage` key.
5. Later write-set **this pack owns**:
    - **Writers:** `src/systems/hud.js` + `src/ui/hud.css` **only**.
    - **Reads (not owners):** `ctx.flags.combat`; camera project; existing HUD node boxes; `ctx.settings.reducedMotion`; `ctx.settings.textScale`.
    - **Do not claim** `hail.js`, `galaxychart.js`, `controls.js`, `npc.js`, `nav.js`, `station.js`, `nav-guidance.js` (except existing `formatNavDist` **call**), `overlay-policy.js`, `agent-api.js`.
6. **Do not steal HUD-06:** POS HOME + square pip + chevron inset **108** stay. Do **not** retune `HOME_EDGE_INSET`. Do **not** assign deconflict transforms onto `.rw-home-mark`. Pip may **hide its label** (not the pip) on collision. Hide-on-station-lock stays (`hud.js` **1907–1908**).
7. **Do not steal TGT:** do not reuse `.rw-edge-arrow` as a layout toy. Inset **84** stays. Bracket stays the selected-target identity.
8. **Do not steal NAV-02:** `.rw-nav-gate-cue` inset **84**; on-glass hide stays. GATE row stays. Do not hide GATE / cue / dock `J` / POS when they are the only nav.
9. **Do not steal HUD-04 / HUD-05:** linger **8 s**, five slots, toasts top-right. **No** new toast channel. **No** third `aria-live` region (toasts + banner already exist). Do not fold banner into toasts.
10. **Do not steal HUD-03 alerts.** No new alert chrome.
11. Fail closed:
    - Never throw from HUD update (missing box, NaN project, overlay flags).
    - Zero extra per-frame DOM alloc beyond existing pool discipline. Scratch boxes at init (AGEZ pattern).
    - Hide-not-delete pooled nodes (`.is-hidden` / opacity class). Never `remove()` chartmarks, rails, home, lead, toasts.
    - Prototype-safe: authored class names (`rw-yield`, or reuse `rw-hair-off`). Never `for-in` a blob into HUD nodes.
12. `reducedMotion`: **no new pulse**. No new `@keyframes`. Opacity / display / transform only. Honor `body.rw-reduced-motion` (`hud.css` **1252–1258**).
13. Accessibility: **color is not the only cue**. Collapse must leave a text or shape cue for the same fact (rail DIST if RANGE word hides; POS HOME if pip label hides).
14. CPU: collision tests use existing scratch math (`hairBoxForRail` / `agezHairOff` / `distPointBox` / `segmentHitsBox` — `hud.js` **163–221**). Write-on-change class toggles. Text still throttled (`TEXT_UPDATE_INTERVAL` **67**).
15. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake).
16. Combat vs exploration is **one** layout policy, not two HUDs. Reuse `#hud.in-combat`. Do **not** blindly duplicate `.in-combat` fade onto HOME / NAV-02 / dock J / POS.
17. Do not invent selected-POI picker (HUD-06 omitted that).
18. Do not invent HUD sun callouts. Suns stay 3D + existing toasts.
19. Do not steal sibling Wave 128 Hail02 / NAV-09 packs. Do not edit honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.

---

## 0.1 Wave 128 deputize (owner may override after playtest)

Pick a playable **smallest additive** yield. Inventory proves **dynamic deconfliction is not live**. Do not park. Do not invent UU / SKU / Digit / persist key. Do not invent HTML from save blobs.

### Protected regions (must keep clear)

| Region | Measure (later PR1) | Never yield this away |
|---|---|---|
| Reticle | 80 px hub box around current reticle translate (`hud.js` **1400**, `hud.css` **188–189**) | hub ring; empty glass |
| Player silhouette | chase/third: keep rails stroke-only; treat a bottom-center keep-out **or** AGEZ rail-vs-lead as the proxy. Do **not** add a silhouette HUD widget | 3D hull read |
| Selected-target bracket | `.rw-target-box` 60 px (`hud.css` **404–409**) | corners |
| Projectile path | reticle→lead segment when lead shown (`agezHairOff` **212–218**); otherwise hub only | bolts + lead ring |

Collision = overlap of a **lower-priority** HUD box with those regions.

### Lower priority (collapse / fade / relocate — hide-not-delete)

Priority high → low (later PR1 may stop after the first cheap wins):

| Layer | Node | On collision |
|---|---|---|
| Duplicate name | `.rw-target-name` when `.rw-combat-name` is visible | hide the bracket **name** (keep meta/dist/band) |
| Duplicate range | `.rw-reticle-range` word when rail `DIST` or bracket meta shows dist | hide the **word**; keep `.in-range` ring |
| Duplicate lead word | `.rw-lead-label` | hide the word; keep lead **ring** |
| Chartmark labels | `.rw-chartmark-label` | hide label; keep diamond or fade the slot (`is-hidden` ok) |
| Home pip label | `.rw-home-pip-label` | hide label; **keep pip** and POS HOME |
| Combat rail card | `.rw-combat-self` / `.rw-combat-target` | opacity yield (new class, AGEZ-like) **not** `display:none` of the rail in combat |
| AP/AM chips | `.rw-chip-stack` | stay top-center unless they overlap hub; then nudge **up**, not into hub |
| Banner / toasts | already off-column | **do not move** |
| Dock `J` / Jump prompt | `.rw-prompt` | **do not hide** for deconflict |
| HOME pip / chevron / GATE cue / TGT arrow | identity chromes | **do not steal**; labels may yield |

Do **not** delete pooled nodes.

### Exploration quieter than combat (same `#hud`, not two HUDs)

When **not** `.in-combat`:

| Keep full | Fade / collapse |
|---|---|
| POS, POS HOME, NAV-02 GATE row, NAV-02 cue, dock `J`, HUD-06 pip/chevron (labels may still yield on collision) | Combat-only chips: `.rw-reticle-range` word, `.rw-lead-label`, MATCH lamp if no lock need, FORE/AFT **flash** already reducedMotion-safe |
| Self hull / SCREEN / SHELL / SPD (career vitals) | Target rail stays **hidden** until a ship lock (already) |

When **`.in-combat`**:

- Keep existing `.rw-fade` **0.14**, `.rw-aux` **0.38**, chartmark/home **0.14**. Do not stack a second fade that hides HOME / GATE / POS.
- Keep rails, lead ring, bracket, RANGE ring **readable**.
- Collision yield still applies (duplicate name/word).

Do **not** hide HOME / NAV-02 / dock J / POS because the player is exploring.

### Copy (authored `textContent` literals)

No new player-facing sentences required. If PR1 adds an `aria-hidden` on yielded labels, POS / rail DIST / bracket meta must still carry the fact.

Do **not** interpolate ship names into HTML. Do **not** add a live region.

### Fail-closed / home

| Piece | Freeze |
|---|---|
| NaN / missing lock | skip yield; never throw |
| `innerHTML` | forbidden |
| Persist | none |
| Home files | `hud.js` + `hud.css` |
| Third `aria-live` | forbidden |
| Pulse | forbidden |
| Hub child | forbidden |

Owner freeze (do not invert):

- Leftover is **real**. Not CONSUME. Serial is **PR1**, not none.
- Four regions protected. Lower-priority yields. Exploration quieter for combat-only chips.
- Do **not** put a gauge in the HUD-01 80 px aim glass.
- Do **not** steal HUD-06 pip, TGT arrow, NAV-02 cue, HUD-04 channel.
- If allowlist skip fires, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// SESSION UI — not WORLD_FIELDS
// reuse AGEZ scratch boxes; no per-frame alloc
hideWordRange = collision(hub, rangeWord) || (!inCombat && shipTgt && distOnRail)
hideWordLead  = collision(hub | bracket | path, leadLabel) || !inCombat
hideDupName   = shipTgt && collision(bracketInfo, tgtRailName)
              || (shipTgt && namesEqual)
yieldChartLabel = collision(hub | bracket | path, chartLabel)
yieldHomeLabel  = collision(hub | bracket | path, homePipLabel)
// never: homePip.remove() / chartSlots[i].box.remove()
// never: innerHTML
// never: new aria-live
```

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** / name **no HUD-07 leftover** | **Forbidden** — hole is live |
| Deconflict widget in 80 px hub | **Forbidden** §0.2 |
| Second HUD / duplicate `.in-combat` that hides HOME | **Forbidden** §0.16 |
| Steal HUD-06 pip as yield toy | **Forbidden** §0.6 |
| Steal TGT arrow / NAV-02 cue | **Forbidden** §0.7–0.8 |
| New toast / third live region | **Forbidden** §0.9 |
| Selected POI picker | **Forbidden** §0.17 |
| Sun HUD callout | **Forbidden** §0.18 |
| New `WORLD_FIELDS` / settings key | **Forbidden** §0.4 |
| `innerHTML` | **Forbidden** §0.3 |
| `state.js` write | **Forbidden** §0.4 |
| Claim hail.js / galaxychart.js / controls.js / npc.js | **Forbidden** §0.5 |
| Pulse / `@keyframes` | **Forbidden** §0.12 |
| Delete pooled nodes | **Forbidden** §0.11 |
| Fix REDMARCH `castMatches` | **Forbidden** §0.15 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| Yield classes / RANGE+LEAD word hide / dup name hide | PR1 `hud.js` | player |
| Exploration combat-chip fade | PR1 `hud.css` (`#hud:not(.in-combat)` or equivalent) | player |
| AGEZ hair | **none** (keep); PR1 may **reuse** math | bio rails |
| `.rw-home-mark` pip / chevron 108 | **none** (HUD-06) | label yield only |
| `.rw-edge-arrow` / `.rw-nav-gate-cue` | **none** | — |
| `.rw-toasts` / linger 8 s | **none** (HUD-04) | — |
| `.rw-banner` seat | **none** (already off-column) | — |
| `state.js` | **none** | — |
| Digit / toast / hail / chart | **none** | — |

---

## 2. Persist

**None.** Session/UI class toggles only.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** deconflict + quieter cruise | collision yield on duplicate name / RANGE word / LEAD word / chartmark+home **labels**; exploration fade of those combat-only words; hide-not-delete; `textContent` + `stripHudText` if names move; `#hud:not(.in-combat)` policy | hub child; HOME inset retune; TGT/NAV steal; toast channel; third live region; persist; Digit; `innerHTML`; hail.js; galaxychart.js; controls.js; npc.js; POI picker; sun pip |
| **PR2 stills (optional)** | chase lock stills: words yielded; cruise stills: quieter chips; HOME/GATE/J visible | Required with PR1 |
| **PR3 census (optional skip)** | grep no hub child; no new persist; no third `aria-live` | — |

First remaining serial is **PR1**.
