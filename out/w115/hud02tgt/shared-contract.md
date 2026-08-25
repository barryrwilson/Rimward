# HUD-02 remaining TARGET class silhouettes shared contract

**Wave:** 115. Design only. No target-class-silhouette feature ships in this wave.  
**Status:** MERGE LAW for `docs/Hud02RemainingTargetSilhouettesDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md` (frozen Wave 61/62 record — **cite only**), `docs/Hud02RemainingSilhouettesDesign.md` (frozen Wave 111/113 living **player** leftover — **cite only**), `docs/Hud02RemainingMechSilhouettesDesign.md` (frozen Wave 113/114 plated **player** leftover — **cite only**), `docs/Hud03AlertsDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Phy*.md`, `docs/Fx01*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave115.md`. Do not write sibling Wave 115 paths (`out/w115/hud03vis/**`, `out/w115/shp/**`).  
**Locked sources:** wishlist HUD-02 living vs conventional (Wave 62 **LIVE**); live inventory `out/w115/hud02tgt/current-hud02-target-silhouette-inventory.md` (code wins); Wave 61 merge law `out/w61/shared-contract.md` (family switch — **do not invert**); Wave 65 family audio; Wave 112 owner knobs `docs/OwnerDecisionsWave112.md` (**cite, do not edit**); WAVE113 bio **player** tokens; WAVE114 mech **player** tokens.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale copy.

**This leftover is a class hint on existing HUD-02 target facing chrome.** It is **not** a new family. It is **not** HUD-01 hub gauges. It is **not** WAVE113 / WAVE114 player tokens. It is **not** a new SKU.

**Wave 62** `hudFamily` + `#hud[data-family]` mech|bio skins are **LIVE**. **Consume.** Family is mech|bio from **player** hullKind. Class is **inside** family, not a third family. Do **not** select family from lock `classKey` (`out/w61/shared-contract.md` §3.2).

**Wave 65** family audio is **LIVE**. **Consume.** Do **not** add per-class or per-lock CUES.

**WAVE113 / WAVE114 player tokens** are **LIVE**. **Consume.** Do **not** steal those CSS blocks as this leftover. They remain **player** facing. Later PR1 may **narrow** player selectors to `.rw-combat-self` so they stop leaking onto `tgtFacing`. That is a **scope fix**, not a rewrite of clip-path / plate metrics.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No class pip, class name, class meter, or lock-class label on the aim glass. RANGE stays TGT-01 (`hud.js` 726–729; `src/ui/hud.css` 184–193, 207–220). **Do not** put class chrome inside `.rw-reticle`. **No new DOM on `.rw-reticle`.** Facing glyph stays on existing `.rw-facing-sil` (`hud.js` 354–361, 864, 875).
3. Digit 0 stays **shipyard** (`station.js` 188, 5963–5966, 6100–6105). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1644–1646, 1691, 1705). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** KeyT / KeyV / KeyK / KeyX stay (`controls.js` 44, 268, 280–290).
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. **No** SVG markup from `classKey`. **No** `insertAdjacentHTML` / `document.write`. CSS clip-path / plate metrics are authored in `hud.css`, not concatenated from lock or save strings.
5. `src/game/state.js` is READ-ONLY later. **No** new `SHIP_CLASSES` keys. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. HUD may **read** `SHIP_CLASSES` / lock visual `classKey` for an allowlist. HUD **must not** write `ctx.player.classKey`, lock `record.classKey`, or `hullKind`.
6. Persist: **no** new `WORLD_FIELDS` key. Hangar row already stores **player** `classKey` (`save.js` 93–94; `hangar.js` `classKeyOf` 40–42). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. **No** `world.hudClass`. **No** `world.tgtClass`. **No** new `localStorage` key. **No** session class picker (`rw-hud-family` stays mech|bio only).
7. Prototype-safe later helpers: never `for-in` merge from a record / save blob into `#hud.dataset` or `tgtRail.dataset`. Index `classKey` only after `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, key)` (same pattern as `hangar.js` `classKeyOf`). Do not `Object.assign` a ship record onto the HUD root or the target rail.
8. Family switch is **LIVE** (Wave 62). Do **not** rewrite `hudFamily`. Do **not** treat lock `classKey` as grown vs built. Do **not** reopen HUD-03 free skin override (owner closed). Do **not** add `settings.js` `hudSkin`.
9. Kit mutate omit. Aim-glass gauges stay off. Do **not** parent GLBs into the overlay. Do **not** clone `makeLivingHull` or plated meshes onto `.rw-facing-sil`.
10. WAVE62 / WAVE65 / WAVE113 / WAVE114 boot pins **stay**. Later serial **may add** a pin for `.rw-combat-target[data-class-key]`. Do not invert `hudFamily` greps, family CUES greps, or player-token greps. Do not treat WAVE113 `mechOmit` drift as this leftover.
11. CPU freeze: **no** per-frame DOM alloc. **no** per-frame `clip-path` string build. Player root writer stays `applyClassKeyAttr` on `#hud` (`hud.js` 110–115, 1101, 1758). Target class is a **separate rail writer** on `.rw-combat-target` only, write-on-change (5 Hz while shown; omit immediately when the rail hides). **Do not** add a second writer on `#hud.dataset.classKey`. **Do not** put lock class on `#hud`.
12. Fail closed:
    - Missing lock / non-ship lock / unknown / non-allowlisted / proto `classKey` → **delete** `data-class-key` on `.rw-combat-target` (or never set it). Keep live **generic family facing on the target row** (player `data-family` chrome, **no** class restyle). **Never** freeze the sim. **Never** throw. **Never** `innerHTML` a fallback SVG.
    - Unrevealed Q-ship → use **visual / cover** class (`coverClass ?? 'freighter'`), never hidden `state.classKey`.
    - Mk II name pierce does **not** unmask the class glyph (mesh is still cover until `revealed`).
13. Key **visible lock hull** class only, scoped to the **target rail**. Player mounted `classKey` stays on `#hud` via live `classKeyToken`. **Do not** restyle `selfFacing` from lock class. **Do not** restyle `tgtFacing` from player class after PR1 (scope leak closed).
14. Pixel box: target class hint stays inside existing **22×10** `.rw-facing-sil` (`hud.css` 239–244). **Never** change sil `width`, `height`, or `flex-basis`. Reuse WAVE113 bio / WAVE114 mech **numeric freeze by cite** (`hud.css` 1286–1336 mech; 1590–1669 bio). Do **not** grow toward the 78 px rail gap or AGEZ. FORE/AFT words stay. If a key cannot read in-box, omit **that** key’s **target** CSS and keep generic family facing on the target row for that key.
15. `reducedMotion` **must not** add facing loops (`hud.css` 1183–1188 already kills HUD animation). Static clip / plate is allowed. Do not invent a new settings checkbox.
16. Target paint must not win a duel (Wave 61 §2). Class hint is accent inside the sil box. Same glance set, same cadence, same data.
17. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md`, `docs/Hud02RemainingSilhouettesDesign.md`, `docs/Hud02RemainingMechSilhouettesDesign.md`. Do not write `docs/OwnerDecisionsWave115.md`. Deputize defaults live in **this** contract.
18. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate). Do not “fix” WAVE113 mechOmit vs WAVE114 invert as this leftover.
19. Earth photocopies forbidden. HUD glyphs **hint** class; they are not shark/squid/tank/jet toys.
20. 3D quality bars stay `makeLivingHull` / plated GLB. HUD 22 px is **not** that bar.
21. WAVE113 bio CSS and WAVE114 mech CSS remain **player** facing. Do **not** specify new bio clip-path polygons or new mech plate tuples in this leftover. **Cite** live authored metrics. Target selectors copy those declarations under `.rw-combat-target` only.

---

## 0.1 Wave 115 deputize (owner may override after playtest)

Pick playable **target-class-hint** defaults. Inventory proves **player class tokens are LIVE** and **target class HUD silhouettes are ABSENT**. Do not park. Do not invent UU / SKU / Digit. Do not invent HTML from `classKey`.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `hudFamily` tokens | `'mech' \| 'bio'` from **player** | `hud.js` 81–89 |
| `#hud[data-family]` | set init + 5 Hz | 1100, 1748 |
| Player class write | `classKeyToken` **player** only; `applyClassKeyAttr` on `#hud` | 101–115, 1101, 1758 |
| Facing DOM | nose + body spans, 22×10; **two** copies | `hud.js` 354–361, 864, 875 |
| Target rail | `.rw-combat-target`; hidden unless live ship lock | 873–886, 1253–1268 |
| Player mech class CSS | unscoped `#hud[data-family="mech"][data-class-key]` | `hud.css` 1286–1336 |
| Player bio class CSS | unscoped `#hud[data-family="bio"][data-class-key]` | `hud.css` 1590–1669 |
| Target class CSS | **ABSENT** | leftover |
| Session override | `rw-hud-family` mech\|bio | 92–97 |
| Family CUES | five keys | `song.js` 115–130 |
| `SHIP_CLASSES` | six keys | `state.js` 37–44 |
| Hub | 80 px | `hud.css` 184–193 |
| Cover class | `visualClassFor` / `coverClass` | `traffic-feel.js` 114–121; `npc.js` 276–277 |
| Wave 112 | catalogs / scanner / Digit honor | `docs/OwnerDecisionsWave112.md` |

Do **not** “fix” HUD-02 target class by adding a hub pip or a seventh class key. That reopens HUD-01 / `state.js`.

### Smallest additive class hint (reads on existing target facing chrome, not a new gauge)

**Name:** allowlisted **`data-class-key` on `.rw-combat-target` only** + authored CSS on existing `tgtFacing` `.rw-facing-sil`, keyed off **visible lock class**. Player tokens stay on `#hud` but **must be scoped to `.rw-combat-self`**.

| Piece | Freeze |
|---|---|
| Fail-closed | If lock class missing / not `hasOwn` `SHIP_CLASSES` / non-ship / proto, **omit** `tgtRail.dataset.classKey`. Keep live **generic family facing on the target row**. Never throw. Never `innerHTML`. Never freeze the sim. |
| Additive PR1 | 1) **Narrow** live player selectors from `#hud[data-class-key] .rw-facing-*` to `#hud[data-class-key] .rw-combat-self .rw-facing-*`. Do **not** change WAVE113/114 metrics. 2) New rail writer: allowlisted visible lock class → `tgtRail.dataset.classKey` write-on-change. **Not** on `#hud`. 3) Authored CSS: `#hud[data-family="mech"] .rw-combat-target[data-class-key="…"]` and `#hud[data-family="bio"] .rw-combat-target[data-class-key="…"]` **cite** live 22×10 metrics. 4) Light may keep generic family facing on the target row. 5) Unknown → delete attribute. 6) Q-ship unrevealed → `coverClass` (allowlisted) or omit. 7) Mk II name pierce does **not** unmask the glyph. 8) Hide rail → omit attribute immediately. |
| Not PR1 | hub child; Digit; `state.js` write; new persist key; session class picker; per-class audio; SVG innerHTML; GLB thumbnail; kit mutate; HUD-03 skin; lock family token; rewrite `hudFamily`; steal WAVE113 clip-path as new art; steal WAVE114 plate tuples as new art; put lock class on `#hud`; KeyT/V/K/X remap |
| Home | `hud.js` (rail attribute write-on-change) + `hud.css` (scope fix + target selectors). Not `station.js`. Not `state.js`. Not `save.js`. Not `combat.js`. |
| Persist | **none**. Attribute is DOM-only. |
| Alloc | no new nodes; no per-frame string concat of user keys into CSS |
| Root writer | Keep one writer on `#hud.dataset.classKey` (`applyClassKeyAttr`). **Do not** fork a second root writer. Target rail is a **different node**. |
| Sibling player tokens | Consume. Scope to self. Do not delete allowlisted **player** keys because the lock is unknown. |

Owner freeze (do not invert):

- Prefer CSS tokens on **existing** target facing over a new instrument.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- Census shows **no** target class token — leftover is **real**. Not CONSUME. Serial is **not** none.
- If allowlist fails, live **generic family facing** still paints on the target row. **Never stop.**
- Do **not** put target class on `#hud` (would keep restyling player facing, or mix player vs lock).
- Visible cover class only. Hidden cutter stats stay hidden.

### Formulas (later impl)

```
// LIVE player writer — keep. Scope CSS to self. Do not put lock class here.
applyClassKeyAttr(root, last, classKeyToken(ctx, last.family))  // ctx.player.classKey

// NEW rail writer — target node only. Not a second #hud writer.
function lockClassToken(target, ctx) {
  if (!target || !target.state) return ''
  const rec = target.record
  const coverOn = !!(rec && rec.qship === true && rec.revealed !== true)
  const raw = coverOn
    ? (rec.coverClass ?? 'freighter')
    : (rec && rec.classKey) || (target.state && target.state.classKey)
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)) {
    return raw
  }
  return ''
}
// write-on-change tgtRail.dataset.classKey = key, or delete
// when !shipTgt: delete immediately
// CSS authored only:
// #hud[data-family="mech"][data-class-key="heavy"] .rw-combat-self .rw-facing-body { … WAVE114 cite … }
// #hud[data-family="mech"] .rw-combat-target[data-class-key="heavy"] .rw-facing-body { … same metrics … }
// unknown / absent target attribute → generic family facing on the target row
```

Do **not** persist `data-class-key`. Do **not** write hangar. Do **not** write ship records.

### 22×10 numeric budget (cite, do not invent)

Sil stays 22×10. **Cite** live WAVE114 mech table and WAVE113 bio clips. Do not author a third metric set.

Mech target rules must satisfy live WAVE114 invariants (`hud.css` 1262–1336; leftover `docs/Hud02RemainingMechSilhouettesDesign.md` §3 / `out/w113/hud02mech/shared-contract.md` §0.14 — **cite, do not rewrite**): `body.left + body.width ≤ 22`; `body.top + body.height ≤ 10`; light keeps generic plate; uniqueness of authored tuples.

Bio target rules stay inside 22×10 live WAVE113 clips (`hud.css` 1555–1669; `docs/Hud02RemainingSilhouettesDesign.md` — **cite, do not rewrite**).

Family gate on target CSS is **player** `#hud[data-family]`. A bio player locking a plated hull still sees **bio** language on the target row (class inside player family). Do **not** invent lock-family `data-family` on the rail.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — census: no target class token; player leak is not a lock feature |
| Put lock class on `#hud` | **Forbidden** §0.11–0.13 — mixes player vs lock |
| Third `hudFamily` token / lock family | **Forbidden** — Wave 62 consume; family from **player** |
| Switch family on `classKey` | **Forbidden** — w61 §3.2 |
| Class pip / name on `.rw-reticle` | **Forbidden** §0.2 |
| RANGE rewrite / class word | **Forbidden** |
| Digit / SKU / UU / `state.js` write | **Forbidden** §0.3, §0.5 |
| New `WORLD_FIELDS` / settings `hudSkin` | **Forbidden** §0.6, §0.8 |
| Session class override | **Forbidden** PR1 §0.6 |
| `innerHTML` / SVG from key | **Forbidden** §0.4 |
| Hidden Q-ship `state.classKey` | **Forbidden** §0.12 |
| Mk II name pierce unmasks glyph | **Forbidden** §0.12 — mesh still cover |
| Per-class `song.js` CUES | **Forbidden** Wave 65 consume |
| Clone GLB / `makeLivingHull` to HUD | **Forbidden** §0.9 |
| HUD-03 free skin override | **Forbidden** owner closed |
| Kit mutate | **Forbidden** |
| Grow sil box / AGEZ ink | **Forbidden** §0.14 |
| Second writer on `#hud.dataset.classKey` | **Forbidden** §0.11 |
| Rewrite WAVE113/114 metrics as new art | **Forbidden** §0.21 |
| Earth photocopy glyphs | **Forbidden** §0.19 |
| New `@keyframes` on facing | **Forbidden** §0.15 |
| Invert WAVE62/65/113/114 pins | **Forbidden** §0.10 |
| Steal Digit 0/8/9 | **Forbidden** §0.3 |
| Remap KeyT / KeyV / KeyK / KeyX | **Forbidden** §0.3 |
| Aim-glass gauges | **Forbidden** |
| Steal HUD-01 empty hub | **Forbidden** §0.2 |
| Steal `out/w115/hud03vis/**` or `out/w115/shp/**` | **Forbidden** |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `#hud.dataset.classKey` | **none new** — live `classKeyToken` / `applyClassKeyAttr` (player) | `hud.css` **self** selectors |
| `tgtRail.dataset.classKey` | PR1 rail writer (visible lock class) | `hud.css` `.rw-combat-target` selectors |
| Player facing variants | **none** (WAVE113/114 consume; PR1 may **narrow** to `.rw-combat-self`) | overlay self row |
| Target facing variants | PR1 `hud.css` under `.rw-combat-target[data-class-key]` | overlay target row |
| `hudFamily` / `data-family` | **none** | consume Wave 62 (**player**) |
| Family CUES | **none** | consume Wave 65 |
| `SHIP_CLASSES` | **none** | allowlist read |
| Hangar `classKey` | **none** | player HUD only |
| Lock `record.classKey` / `coverClass` | **none** | HUD **read** visual class |
| `state.js` | **none** | read allowlist |
| Digit / station | **none** | — |
| `WORLD_FIELDS` | **none** | — |
| `.rw-reticle` | **none** | RANGE consume |
| KeyT / KeyV / KeyK / KeyX | **none** | consume |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| No ship lock / rail hidden | omit `tgtRail` `data-class-key`; rail stays hidden; generic family facing if shown |
| Rock / station / pod / landmark | omit; rail hidden today |
| Lock `classKey` missing / not a string | omit; generic **family** facing on the target row |
| Lock key not in `SHIP_CLASSES` (`__proto__`, `nope`, empty) | omit; never assign raw |
| Unrevealed Q-ship | allowlist `coverClass` (default visual `freighter`); **never** hidden cutter `state.classKey` |
| Mk II pierce, still unrevealed | **name** may unmask (`hud.js` 2068–2071); **glyph stays cover class** |
| Revealed Q-ship / ordinary ship | allowlist `record.classKey` or `state.classKey` |
| `hudFamily === 'bio'` (player) | target class CSS uses **bio** language (cite WAVE113). No mech plate on the target row |
| `hudFamily === 'mech'` (player) | target class CSS uses **mech** language (cite WAVE114). No bio clip on the target row |
| CSS rule missing for a live key | generic family facing on the target row for **that** key. Light may keep generic on purpose. **Missing rule must not throw** |
| `reducedMotion` | static sil; no new motion |
| Partial merge (CSS without JS or JS without CSS) | generic family facing still paints; player tokens still paint on **self** after scope narrow |
| Player `classKey` unknown | player root omits (live). Target rail independent |
| `#hud` missing | live disable path; no throw |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 target facing class tokens** | Narrow player `[data-class-key]` CSS to `.rw-combat-self`; allowlisted `data-class-key` on `.rw-combat-target`; visible lock class writer; target CSS cites WAVE113/114 22×10 metrics; fail closed generic family facing on the target row | `state.js`; Digit; new persist key; hub child; innerHTML; session class picker; family rewrite; audio; GLB/SVG; lock family; put lock class on `#hud`; rewrite player clip-path/plate art; Key remap; sil grow |
| **PR2 target class stills (optional)** | Playwright 1600×900 lock vs player class mismatch stills after playtest; optional WAVE pin `.rw-combat-target[data-class-key]` | Required if PR1 reads enough; known boot FAIL fixes; HUD-03; WAVE113 rewrite |
| **PR3 census (optional skip)** | Re-grep `.rw-combat-target[data-class-key]` + confirm `#hud[data-class-key]` no longer restyles tgt; confirm no `.rw-reticle` child | New world field; Digit |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. PR2 is skippable. Do **not** land hub pip as required PR1. **Named only. Do not implement in Wave 115.**

Serial name is **PR1 target facing class tokens**. Serial is **not** none.

---

## 4. Persist / proto

Hangar `classKey` is **already** saved for the **player**. Lock class lives on ship records / cover fields. PR1 writes a DOM attribute on `.rw-combat-target` only. No `for-in` on records. No `WORLD_FIELDS` growth. No `settings.js` write. Session `rw-hud-family` must **not** grow a class value.
