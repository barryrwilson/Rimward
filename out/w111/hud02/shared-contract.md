# HUD-02 remaining living class silhouettes shared contract

**Wave:** 111. Design only. No class-silhouette feature ships in this wave.  
**Status:** MERGE LAW for `docs/Hud02RemainingSilhouettesDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md` (frozen Wave 61/62 record — **cite only**), `docs/Hud03AlertsDesign.md`, `docs/HudUtilityChangeProposal.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Msn*.md`, `docs/Rep*.md`, `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Phy*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave111.md`. Do not write sibling Wave 111 paths (`src/systems/station.js`, `src/systems/combat.js`, `scripts/boot-test.mjs`, `docs/Rep03RemedialDesign.md`, `docs/Fx01RemainingDesign.md`, `out/w111/rep03/**`, `out/w111/fx01/**`).  
**Locked sources:** wishlist HUD-02 living vs conventional (Wave 62 **LIVE**); live inventory `out/w111/hud02/current-hud02-silhouette-inventory.md` (code wins); Wave 61 merge law `out/w61/shared-contract.md` (family switch — **do not invert**); Wave 65 family audio; Wave 106 BIO-07 class bodies (3D — **not** overlay).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale “organic silhouettes” copy that already shipped **one** bio glyph.

**This leftover is a class hint on existing HUD-02 living chrome.** It is **not** a new family. It is **not** HUD-01 hub gauges. It is **not** BIO-07 bake. It is **not** a new SKU.

**Wave 62** `hudFamily` + `#hud[data-family]` mech|bio skins are **LIVE**. **Consume.** Do not reopen the family switch. Do **not** select family from `classKey` alone (`out/w61/shared-contract.md` §3.2).

**Wave 65** family audio is **LIVE**. **Consume.** Do **not** add per-class CUES. Do **not** reopen music, radio, or station ambience.

**Wave 106 BIO-07** class bodies live on NPC GLBs + player `makeLivingHull`. **Do not** clone those meshes onto `.rw-facing-sil`.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No class pip, species name, class meter, or marine label on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `src/ui/hud.css` 184–193, 207–220). **Do not** put class chrome inside `.rw-reticle`. **No new DOM on `.rw-reticle`.** Facing glyph stays on `.rw-facing-sil` (`hud.js` 337–344, 847, 858).
3. Digit 0 stays **shipyard** (`station.js` 188, 5963–5966, 6101). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 1633–1712). First remaining serial **must not steal** Digit 0/8/9. **No new Digit.** Class hint is not a dock verb.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. **No** SVG markup from `classKey`. **No** `insertAdjacentHTML` / `document.write`. CSS `clip-path` is authored in `hud.css`, not concatenated from save strings.
5. `src/game/state.js` is READ-ONLY later. **No** new `SHIP_CLASSES` keys. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. HUD may **read** `SHIP_CLASSES` / `classKey` for an allowlist. HUD **must not** write `ctx.player.classKey` or `hullKind`.
6. Persist: **no** new `WORLD_FIELDS` key. Hangar row already stores `classKey` (`save.js` 94; `hangar.js` `classKeyOf` 40–42). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. **No** `world.hudClass`. **No** new `localStorage` key. **No** session class picker (`rw-hud-family` stays mech|bio only).
7. Prototype-safe later helpers: never `for-in` merge from a save blob into `#hud.dataset`. Index `classKey` only after `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, key)` (same pattern as `hangar.js` `classKeyOf`). Do not `Object.assign` a hangar row onto the HUD root.
8. Family switch is **LIVE** (Wave 62). Do **not** rewrite `hudFamily`. Do **not** treat `classKey` as grown vs built. Do **not** reopen HUD-03 free skin override (owner closed). Do **not** add `settings.js` `hudSkin`.
9. Kit mutate omit. Aim-glass gauges stay off. Do **not** steal BIO-06 cadence tables. Do **not** replace `makeLivingHull`. Do **not** parent NPC GLBs into the overlay.
10. WAVE62 / WAVE65 boot pins **stay**. Later serial **may add** a `data-class-key` pin. Do not invert `hudFamily` greps or family CUES greps.
11. CPU freeze: **no** per-frame DOM alloc. **no** per-frame `clip-path` string build. Set `#hud.dataset.classKey` (attribute `data-class-key`) **write-on-change** on the existing 5 Hz path. Nodes stay init-once.
12. Fail closed: unknown / missing / non-allowlisted `classKey` → **delete** `data-class-key` (or never set it). Keep **today’s generic living chrome**. Mech family CSS does **not** gain class facing rules in PR1. **Never** freeze the sim. **Never** throw on a bad key. **Never** `innerHTML` a fallback SVG.
13. Key **player mounted hull** `classKey` only (`ctx.player.classKey` after hangar sync). **Do not** restyle from lock / target `classKey` (would be a new TGT instrument and can fight Q-ship cover).
14. Pixel box: class clip stays inside existing **22×10** `.rw-facing-sil` (`hud.css` 239–244, 1503–1506). Do **not** grow toward the 78 px rail gap or AGEZ. FORE/AFT words stay. Do not hide numbers behind a pretty glyph.
15. `reducedMotion` **must not** add facing loops. Static clip-path is allowed. Existing `body.rw-*` stay. Do not invent a new settings checkbox.
16. Living paint must not win a duel (Wave 61 §2). Class hint is accent inside the sil box. Same glance set, same cadence, same data.
17. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud/Owner docs, wishlist, `PROGRESS.md`, `docs/Hud02IdentitiesDesign.md`. Do not write `docs/OwnerDecisionsWave111.md`. Deputize defaults live in **this** contract.
18. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate).
19. Earth photocopies forbidden (BIO-07 law). HUD glyphs **hint** class; they are not shark/squid/octopus toys.
20. `makeLivingHull` is the **3D** quality bar. HUD does not have to match vertex quality. HUD **must not** degrade that bar.

---

## 0.1 Wave 111 deputize (owner may override after playtest)

Pick playable class-hint defaults. Inventory proves **family skins are LIVE** and **class HUD silhouettes are ABSENT**. Do not park. Do not invent UU / SKU / Digit. Do not invent HTML from `classKey`.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| `hudFamily` tokens | `'mech' \| 'bio'` | `hud.js` 80–89 |
| `#hud[data-family]` | set init + 5 Hz | 1083, 1730 |
| Facing DOM | nose + body spans, 22×10 | `hud.js` 337–344; `hud.css` 239–244 |
| Bio organism clip | **one** polygon + ellipse | `hud.css` 1503–1526 |
| Mech plate | **one** square + triangle | 1262–1284 |
| Session override | `rw-hud-family` mech\|bio | 92–97 |
| Family CUES | five keys | `song.js` 114–130 |
| `SHIP_CLASSES` | six keys | `state.js` 37–44 |
| Hub | 80 px | `hud.css` 184–193 |

Do **not** “fix” HUD-02 by adding a hub species pip or a seventh class key. That reopens HUD-01 / `state.js`.

### Smallest additive class hint (reads on existing living chrome, not a new gauge)

**Name:** allowlisted **`data-class-key`** + CSS tokens on existing `.rw-facing-sil` / bio chrome.

| Piece | Freeze |
|---|---|
| Fail-closed | If `classKey` missing / not `hasOwn` `SHIP_CLASSES` / family is not bio, **omit** `data-class-key`. Keep live generic bio clip. Never throw. Never `innerHTML`. |
| Additive PR1 | 1) On the existing 5 Hz hull-change path, read `ctx.player.classKey`. 2) Allowlist via `SHIP_CLASSES`. 3) Set `#hud.dataset.classKey` to that token (`data-class-key`). 4) Authored CSS: `#hud[data-family="bio"][data-class-key="…"] .rw-facing-nose` / `.rw-facing-body` modest clip-path / radius / width-height **inside 22×10**. 5) Light may keep live generic organism (identity). 6) Unknown → delete attribute. 7) Mech: no new class facing rules. 8) Target facing uses the **same player** token (family-wide identity), **not** lock classKey. |
| Not PR1 | hub child; Digit; `state.js` write; new persist key; session class picker; per-class audio; SVG innerHTML; GLB thumbnail; `makeLivingHull` clone; kit mutate; HUD-03 skin; lock-class facing; four-face shields |
| Home | `hud.js` (attribute write-on-change) + `hud.css` (authored selectors). Not `station.js`. Not `state.js`. Not `save.js`. |
| Persist | **none**. Attribute is DOM-only; hangar already has `classKey`. |
| Alloc | no new nodes; no per-frame string concat of user keys into CSS |

Owner freeze (do not invert):

- Prefer CSS tokens on **existing** facing / bio chrome over a new instrument.
- First remaining serial must **not** steal Digit 0/8/9 and must **not** write `state.js`.
- If census had shown six HUD class glyphs already, this leftover would be **CONSUME**. Census shows **one** generic bio glyph — leftover is **real**.
- If allowlist fails, generic living chrome still paints (live). **Never stop.**

### Formulas (later impl)

```
// 5 Hz write-on-change, next to dataset.family
raw = ctx.player && ctx.player.classKey
key = (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw))
  ? raw : ''
if (key !== last.classKey) {
  last.classKey = key
  if (key) root.dataset.classKey = key
  else delete root.dataset.classKey
}
// CSS authored only:
// #hud[data-family="bio"][data-class-key="heavy"] .rw-facing-body { … }
// unknown / absent attribute → live generic bio rules
```

Do **not** persist `data-class-key`. Do **not** write hangar.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / “no remaining leftover” | **Forbidden** — census: one generic bio glyph |
| Third `hudFamily` token | **Forbidden** — Wave 62 consume |
| Switch family on `classKey` | **Forbidden** — w61 §3.2 |
| Class pip / name on `.rw-reticle` | **Forbidden** §0.2 |
| RANGE rewrite / species word | **Forbidden** |
| Digit / SKU / UU / `state.js` write | **Forbidden** §0.3, §0.5 |
| New `WORLD_FIELDS` / settings `hudSkin` | **Forbidden** §0.6, §0.8 |
| Session class override | **Forbidden** PR1 §0.6 |
| `innerHTML` / SVG from key | **Forbidden** §0.4 |
| Restyle from lock classKey | **Forbidden** §0.13 |
| Per-class `song.js` CUES | **Forbidden** Wave 65 consume |
| Clone `makeLivingHull` / GLB to HUD | **Forbidden** §0.9 |
| HUD-03 free skin override | **Forbidden** owner closed |
| Kit mutate | **Forbidden** |
| Grow sil box / AGEZ ink | **Forbidden** §0.14 |
| Earth animal photocopy glyphs | **Forbidden** §0.19 |
| New `@keyframes` on facing | **Forbidden** §0.15 |
| Invert WAVE62/65 pins | **Forbidden** §0.10 |
| Steal Digit 0/8/9 | **Forbidden** §0.3 |
| Aim-glass gauges | **Forbidden** |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `#hud.dataset.classKey` | HUD-02 class chrome PR1 (`hud.js` 5 Hz) | `hud.css` selectors |
| Bio facing clip variants | PR1 `hud.css` | overlay |
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
| `classKey` missing / not a string | omit `data-class-key`; generic bio |
| `classKey` not in `SHIP_CLASSES` (`__proto__`, `nope`, empty) | omit; generic bio; never assign raw |
| `hudFamily === 'mech'` | omit class facing CSS (PR1). Plate glyph stays |
| Hangar not yet synced | generic bio until 5 Hz sees allowlisted player key |
| CSS rule missing for a live key | generic bio (attribute may still be set; no visual delta) — prefer authored rules for all six, but **missing rule must not throw** |
| `reducedMotion` | static clip; no new motion |
| Partial merge (CSS without JS or JS without CSS) | live generic bio still paints; family skins still paint |
| Lock classKey present | **ignore** for this leftover |
| `#hud` missing | live disable path; no throw |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 living facing class tokens** | Allowlisted `data-class-key` on `#hud`; authored bio CSS inside 22×10; 5 Hz write-on-change; fail closed generic bio; mech unchanged | `state.js`; Digit; new persist key; hub child; innerHTML; session class picker; family rewrite; audio; GLB/SVG; lock-class |
| **PR2 class stills (optional)** | Playwright 1600×900 bio + six allowlisted keys after playtest; WAVE pin `data-class-key` | Required if PR1 reads enough; known boot FAIL fixes; HUD-03 |
| **PR3 census (optional skip)** | Re-grep `data-class-key` + six selectors; confirm no `.rw-reticle` child | New world field; Digit |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. PR2 is skippable (PHY-04 PR3 / FX-01 PR2 pattern). Do **not** land hub pip + class tokens as required PR1.

---

## 4. Persist / proto

Hangar `classKey` is **already** saved. PR1 writes a DOM attribute only. Restore already runs hangar sync — next 5 Hz HUD tick applies the token. No `for-in` on save waypoints. No `WORLD_FIELDS` growth. No `settings.js` write. Session `rw-hud-family` must **not** grow a class value.
