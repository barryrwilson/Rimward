# HUD-02 remaining plated / mech class silhouettes shared contract

**Wave:** 113. Design only. No plated-class-silhouette feature ships in this wave.  
**Status:** MERGE LAW for `docs/Hud02RemainingMechSilhouettesDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md` (frozen Wave 61/62 record — **cite only**), `docs/Hud02RemainingSilhouettesDesign.md` (frozen Wave 111 living leftover — **cite only**), `docs/Hud03AlertsDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Phy*.md`, `docs/Fx01RemainingScrapeDesign.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave113.md`. Do not write sibling Wave 113 paths (`out/w113/hud02/**`, `out/w113/fxscrape/**`).  
**Locked sources:** wishlist HUD-02 living vs conventional (Wave 62 **LIVE**); live inventory `out/w113/hud02mech/current-hud02-mech-silhouette-inventory.md` (code wins); Wave 61 merge law `out/w61/shared-contract.md` (family switch — **do not invert**); Wave 65 family audio; Wave 111 living class leftover (bio tokens — **other worker**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale “organic / plated silhouettes” copy that already shipped **one** mech plate.

**This leftover is a class hint on existing HUD-02 mech facing chrome.** It is **not** a new family. It is **not** HUD-01 hub gauges. It is **not** the living class leftover. It is **not** a new SKU.

**Wave 62** `hudFamily` + `#hud[data-family]` mech|bio skins are **LIVE**. **Consume.** Do not reopen the family switch. Do **not** select family from `classKey` alone (`out/w61/shared-contract.md` §3.2). Class is **inside mech**.

**Wave 65** family audio is **LIVE**. **Consume.** Do **not** add per-class CUES. Do **not** reopen music, radio, or station ambience.

**Wave 111 living leftover** / sibling living PR1: **LIVE.** `classKeyToken` (`hud.js` 101–108) writes allowlisted `data-class-key` when `family === 'bio'` only. Bio CSS `hud.css` 1538–1617. **Consume.** Do **not** specify or copy bio clip-path in this leftover. Later mech PR1 **extends** that one writer so mech also sets the allowlisted key. **Do not add a second writer.**

**Plated 3D** class meshes live in `buildPlayerPlatedMesh` / GLB. **Do not** clone those meshes onto `.rw-facing-sil`.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No class pip, class name, class meter, or plated label on the aim glass. RANGE stays TGT-01 (`hud.js` 726–729; `src/ui/hud.css` 184–193, 207–220). **Do not** put class chrome inside `.rw-reticle`. **No new DOM on `.rw-reticle`.** Facing glyph stays on `.rw-facing-sil` (`hud.js` 354–361, 864, 875).
3. Digit 0 stays **shipyard** (`station.js` 188, 5964–5965, 6101). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1644–1646, 1691–1711). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Class hint is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. **No** SVG markup from `classKey`. **No** `insertAdjacentHTML` / `document.write`. CSS plate metrics are authored in `hud.css`, not concatenated from save strings.
5. `src/game/state.js` is READ-ONLY later. **No** new `SHIP_CLASSES` keys. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. HUD may **read** `SHIP_CLASSES` / `classKey` for an allowlist. HUD **must not** write `ctx.player.classKey` or `hullKind`.
6. Persist: **no** new `WORLD_FIELDS` key. Hangar row already stores `classKey` (`save.js` 93–94; `hangar.js` `classKeyOf` 40–42). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. **No** `world.hudClass`. **No** new `localStorage` key. **No** session class picker (`rw-hud-family` stays mech|bio only).
7. Prototype-safe later helpers: never `for-in` merge from a save blob into `#hud.dataset`. Index `classKey` only after `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, key)` (same pattern as `hangar.js` `classKeyOf`). Do not `Object.assign` a hangar row onto the HUD root.
8. Family switch is **LIVE** (Wave 62). Do **not** rewrite `hudFamily`. Do **not** treat `classKey` as grown vs built. Do **not** reopen HUD-03 free skin override (owner closed). Do **not** add `settings.js` `hudSkin`.
9. Kit mutate omit. Aim-glass gauges stay off. Do **not** steal BIO-06 cadence tables. Do **not** parent plated GLBs into the overlay.
10. WAVE62 / WAVE65 boot pins **stay**. Later serial **may add** a mech class pin (`data-class-key` under `#hud[data-family="mech"]`). Do not invert `hudFamily` greps or family CUES greps.
11. CPU freeze: **no** per-frame DOM alloc. **no** per-frame `clip-path` string build. Sibling already writes `#hud.dataset.classKey` write-on-change via `applyClassKeyAttr` (`hud.js` 110–115, init 1101, 5 Hz 1757–1758). Later PR1 **extends** `classKeyToken` so `family === 'mech'` also returns the allowlisted key. **Do not add a second writer.** Nodes stay init-once.
12. Fail closed:
    - Unknown / missing / non-allowlisted `classKey` → **delete** `data-class-key` (or never set it). Keep live **family** facing: Wave 62 generic **mech plate** if family is mech; Wave 62 **bio organism** plus sibling tokens if family is bio and the sibling attribute remains. **Never** freeze the sim. **Never** throw on a bad key. **Never** `innerHTML` a fallback SVG.
    - Family is **not** mech → **do not apply mech class facing CSS**. **Do not paint** the mechanical plate on a bio hull. **Do not delete** an allowlisted `data-class-key` solely because family is not mech. Visual fail-closed for this leftover is CSS gated `#hud[data-family="mech"][data-class-key="…"]`.
13. Key **player mounted hull** `classKey` only (`ctx.player.classKey` after hangar sync). **Do not** restyle from lock / target `classKey` (would be a new TGT instrument and can fight Q-ship cover).
14. Pixel box: class plate stays inside existing **22×10** `.rw-facing-sil` (`hud.css` 239–244, 1262–1265). **Never** change sil `width`, `height`, or `flex-basis`. Live mech body is `left: 5; width: 16; height: 6` with a 5 px nose (`hud.css` 1267–1280) — **21 of 22 px**. Later rules must satisfy `body.left + body.width ≤ 22` and `body.top + body.height ≤ 10`. Grow apparent length **only** by shrinking the nose, then lowering `left` and raising `width`. If a key cannot read inside that budget, **omit that key’s mech CSS** and keep the live generic plate for **that** key. Do **not** photocopy wet-navy capitals. Do **not** grow toward the 78 px rail gap or AGEZ. FORE/AFT words stay. Do not hide numbers behind a pretty glyph. Geometry is **border-triangle + square metrics only**. Do not import bio `clip-path` polygons.
15. `reducedMotion` **must not** add facing loops. Static triangle/square metrics are allowed. Existing `body.rw-*` stay. Do not invent a new settings checkbox.
16. Plated paint must not win a duel (Wave 61 §2). Class hint is accent inside the sil box. Same glance set, same cadence, same data.
17. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md`, `docs/Hud02RemainingSilhouettesDesign.md`. Do not write `docs/OwnerDecisionsWave113.md`. Deputize defaults live in **this** contract.
18. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate).
19. Earth photocopies forbidden. HUD glyphs **hint** plated class; they are not tanks, jet fighters, wet-navy destroyers, or photocopied Earth hulls.
20. `buildPlayerPlatedMesh` is the **3D** plated quality bar. HUD does not have to match vertex quality. HUD **must not** degrade that bar.
21. Living bio tokens are **other worker**. Do not author `#hud[data-family="bio"][data-class-key]` clip-path in this leftover. Consume sibling / later living PR1.

---

## 0.1 Wave 113 deputize (owner may override after playtest)

Pick playable plated-class-hint defaults. Inventory proves **family skins are LIVE** and **plated class HUD silhouettes are ABSENT**. Do not park. Do not invent UU / SKU / Digit. Do not invent HTML from `classKey`.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `hudFamily` tokens | `'mech' \| 'bio'` | `hud.js` 81–89 |
| `#hud[data-family]` | set init + 5 Hz | 1100, 1748 |
| Facing DOM | nose + body spans, 22×10 | `hud.js` 354–361; `hud.css` 239–244 |
| Mech plate | **one** triangle + square; 21/22 px fill | `hud.css` 1262–1284 |
| Bio organism clip | generic polygon + ellipse | `hud.css` 1503–1526 |
| Bio class tokens | sibling LIVE | `hud.css` 1538–1617; `classKeyToken` 101–108 |
| Session override | `rw-hud-family` mech\|bio | 92–97 |
| Family CUES | five keys | `song.js` 114–130 |
| `SHIP_CLASSES` | six keys | `state.js` 37–44 |
| Hub | 80 px | `hud.css` 184–193 |

Do **not** “fix” HUD-02 by adding a hub class pip or a seventh class key. That reopens HUD-01 / `state.js`.

### Smallest additive class hint (reads on existing mech facing chrome, not a new gauge)

**Name:** allowlisted **`data-class-key`** + authored CSS on existing `.rw-facing-sil` plate (triangle + square). Attribute is the mounted player `classKey`. **Visual** restyle is **only when family is mech**.

| Piece | Freeze |
|---|---|
| Fail-closed | If `classKey` missing / not `hasOwn` `SHIP_CLASSES`, **omit** `data-class-key`. Keep live **family** facing (mech generic plate **or** bio organism + sibling tokens). If family is not mech, **do not apply mech class CSS**; **do not paint** the mechanical plate; **do not delete** an allowlisted attribute. Never throw. Never `innerHTML`. |
| Additive PR1 | 1) **Extend** live `classKeyToken` (`hud.js` 101–108) so `family === 'bio' \|\| family === 'mech'` may return the allowlisted key. **Do not add a second writer** — keep `applyClassKeyAttr`. 2) Allowlist stays `hasOwn` `SHIP_CLASSES`. 3) Authored CSS: `#hud[data-family="mech"][data-class-key="…"] .rw-facing-nose` / `.rw-facing-body` **border-triangle + square** metrics **inside 22×10** per §0.14 budget. 4) Light plated may keep live generic plate. 5) Unknown → delete attribute. 6) Bio clip-path: **none** in this leftover (`hud.css` 1538–1617 consume). 7) Target facing uses the **same player** token, **not** lock classKey. 8) If a key cannot read in-box, omit **that** key’s mech CSS. |
| Not PR1 | hub child; Digit; `state.js` write; new persist key; session class picker; per-class audio; SVG innerHTML; GLB thumbnail; kit mutate; HUD-03 skin; lock-class facing; four-face shields; bio clip-path; Earth tank glyphs |
| Home | `hud.js` (attribute write-on-change) + `hud.css` (authored **mech** selectors). Not `station.js`. Not `state.js`. Not `save.js`. |
| Persist | **none**. Attribute is DOM-only; hangar already has `classKey`. |
| Alloc | no new nodes; no per-frame string concat of user keys into CSS |
| Sibling | Living PR1 **is LIVE**. Consume `classKeyToken` / `applyClassKeyAttr`. Extend the family gate for mech. Do not invert bio selectors. Do not delete allowlisted keys on bio. |

Owner freeze (do not invert):

- Prefer CSS tokens on **existing** facing / mech plate over a new instrument.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- Census shows **one** generic mech plate — leftover is **real**. Not CONSUME.
- If allowlist fails, live **family** facing still paints. **Never stop.**
- Length is reallocation inside 22 px, not sil grow. Unreadable key → keep live generic **mech** plate for that key.

### Formulas (later impl)

```
// LIVE sibling writer — extend the family gate. Do not fork a second writer.
function classKeyToken(ctx, family) {
  if (family !== 'bio' && family !== 'mech') return ''
  const raw = ctx.player && ctx.player.classKey
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)) {
    return raw
  }
  return ''
}
applyClassKeyAttr(root, last, classKeyToken(ctx, last.family))
// CSS authored only:
// #hud[data-family="mech"][data-class-key="heavy"] .rw-facing-body { … }
// family !== mech → no mech class CSS; live family facing (bio organism + sibling tokens)
// unknown / absent attribute → live family facing
// sil stays 22×10; body.left + body.width ≤ 22; body.top + body.height ≤ 10
```

Do **not** persist `data-class-key`. Do **not** write hangar. Do **not** delete an allowlisted key just because family flipped to bio (sibling needs it). Unknown key still deletes.

### 22×10 numeric budget (normative)

Live join: nose `border-right: 5px`; body `left: 5; width: 16; height: 6; top: 2` (`hud.css` 1267–1280). Invariants for every mech `[data-class-key]` rule:

| Invariant | Law |
|---|---|
| `.rw-facing-sil` | `width: 22px; height: 10px; flex: 0 0 22px` — **never** change |
| Length | `body.left + body.width ≤ 22` |
| Height | `body.top + body.height ≤ 10` |
| Nose vs body | If `body.width > 16`, shrink nose and lower `left` so the join still fits |
| Unreadable key | omit that selector; live generic plate for **that** key |
| Authored uniqueness | Two authored keys (except `light` matching unknown) **must not** share the same nose/left/top/width/height tuple. Split on a second in-box axis. Do **not** use fill color as the class cue |
| Shape language | border-triangle + square only; **no** bio `clip-path`; **no** wet-navy / tank / jet photocopy |

Playable defaults (owner may retune px after playtest; must honor invariants):

| `classKey` | Nose `border-right` | Body `left` | `top` | `width` | `height` | `left+width` | `top+height` |
|---|---|---|---|---|---|---|---|
| `light` | 5 (live) | 5 | 2 | 16 | 6 | 21 | 8 |
| `heavy` | 5 | 5 | 1 | 16 | 8 | 21 | 9 |
| `ace` | 4 | 4 | 3 | 14 | 4 | 18 | 7 |
| `cutter` | 4 | 4 | 2 | 17 | 6 | 21 | 8 |
| `frigate` | 3 | 3 | 3 | 18 | 4 | 21 | 7 |
| `freighter` | 3 | 3 | 1 | 18 | 8 | 21 | 9 |

Cutter and frigate **look longer** only because the nose shrinks and the body takes the spare px. They do **not** grow the sil. Frigate is **thinner** (`height: 4`), not a capital photocopy. Heavy is **tall-only** (width 16). Freighter is **tall and realloc** (nose 3 / body 18×8). Those two tuples must not collide.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / “no remaining leftover” | **Forbidden** — census: one generic mech plate |
| Third `hudFamily` token | **Forbidden** — Wave 62 consume |
| Switch family on `classKey` | **Forbidden** — w61 §3.2 |
| Class pip / name on `.rw-reticle` | **Forbidden** §0.2 |
| RANGE rewrite / class word | **Forbidden** |
| Digit / SKU / UU / `state.js` write | **Forbidden** §0.3, §0.5 |
| New `WORLD_FIELDS` / settings `hudSkin` | **Forbidden** §0.6, §0.8 |
| Session class override | **Forbidden** PR1 §0.6 |
| `innerHTML` / SVG from key | **Forbidden** §0.4 |
| Restyle from lock classKey | **Forbidden** §0.13 |
| Per-class `song.js` CUES | **Forbidden** Wave 65 consume |
| Clone plated GLB / `makeLivingHull` to HUD | **Forbidden** §0.9 |
| HUD-03 free skin override | **Forbidden** owner closed |
| Kit mutate | **Forbidden** |
| Grow sil box / AGEZ ink | **Forbidden** §0.14 |
| “Longer” by overflow past 22 px | **Forbidden** §0.14 |
| Collide `heavy` and `freighter` metrics | **Forbidden** §0.14 uniqueness |
| Gold / grey fill as the class cue | **Forbidden** §0.14 / §0.19 |
| Force triangle+square onto bio | **Forbidden** §0.12 |
| Second `dataset.classKey` writer | **Forbidden** §0.11 |
| Earth tank / fighter / wet-navy photocopy glyphs | **Forbidden** §0.19 |
| New `@keyframes` on facing | **Forbidden** §0.15 |
| Invert WAVE62/65 pins | **Forbidden** §0.10 |
| Steal Digit 0/8/9 | **Forbidden** §0.3 |
| Aim-glass gauges | **Forbidden** |
| Author bio clip-path in this leftover | **Forbidden** §0.21 |
| Delete sibling `data-class-key` on bio family | **Forbidden** §0.12 |
| Steal HUD-01 empty hub | **Forbidden** §0.2 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `#hud.dataset.classKey` | **extend** live `classKeyToken` / `applyClassKeyAttr` (one writer) | `hud.css` mech selectors |
| Mech facing plate variants | PR1 `hud.css` `#hud[data-family="mech"][data-class-key]` | overlay |
| Bio facing clip variants | **none** (sibling / later living PR1) | consume |
| `hudFamily` / `data-family` | **none** | consume Wave 62 |
| Family CUES | **none** | consume Wave 65 |
| `SHIP_CLASSES` | **none** | allowlist read |
| Hangar `classKey` | **none** (SHP / hangar already) | HUD read |
| `state.js` | **none** | read allowlist |
| Digit / station | **none** | — |
| `WORLD_FIELDS` | **none** | — |
| `.rw-reticle` | **none** | RANGE consume |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `classKey` missing / not a string | omit `data-class-key`; live **family** facing |
| `classKey` not in `SHIP_CLASSES` (`__proto__`, `nope`, empty) | omit; live family facing; never assign raw |
| `hudFamily === 'bio'` | **no mech class facing CSS**. **Do not paint** the mechanical plate. **Do not delete** an allowlisted attribute. Sibling bio tokens (`hud.css` 1538–1617) stay |
| `hudFamily === 'mech'` + allowlisted key | mech class CSS if authored and in-box; else live generic plate |
| Hangar not yet synced | live family facing until 5 Hz sees allowlisted player key |
| CSS rule missing for a live key | live generic **mech** plate for **that** key (attribute may still be set; no visual delta). Light may keep live plate on purpose. **Missing rule must not throw** |
| `reducedMotion` | static plate; no new motion |
| Partial merge (CSS without JS or JS without CSS) | live family facing still paints; family skins still paint; sibling bio tokens still paint |
| Lock classKey present | **ignore** for this leftover |
| `#hud` missing | live disable path; no throw |
| Sibling living PR1 LIVE | consume `classKeyToken`; extend family gate for mech; do not rewrite bio rules |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 plated facing class tokens** | Extend `classKeyToken` for mech (one writer); authored **mech** CSS `#hud[data-family="mech"][data-class-key]` inside 22×10 **§0.14 budget**; fail closed live **family** facing; bio clip-path untouched | `state.js`; Digit; new persist key; hub child; innerHTML; session class picker; family rewrite; audio; GLB/SVG; lock-class; bio tokens; sil grow |
| **PR2 plated class stills (optional)** | Playwright 1600×900 mech + six allowlisted keys after playtest; optional WAVE pin `data-class-key` under mech | Required if PR1 reads enough; known boot FAIL fixes; HUD-03 |
| **PR3 census (optional skip)** | Re-grep `#hud[data-family="mech"][data-class-key]` + six selectors; confirm no `.rw-reticle` child | New world field; Digit |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. PR2 is skippable. Do **not** land hub pip + class tokens as required PR1. **Named only. Do not implement in Wave 113.**

---

## 4. Persist / proto

Hangar `classKey` is **already** saved. PR1 writes a DOM attribute only. Restore already runs hangar sync — next 5 Hz HUD tick applies the token. No `for-in` on save waypoints. No `WORLD_FIELDS` growth. No `settings.js` write. Session `rw-hud-family` must **not** grow a class value.
