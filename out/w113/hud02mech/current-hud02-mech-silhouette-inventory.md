# HUD-02 remaining plated / mech class silhouettes — live inventory

**Wave:** 113. Markdown only. Code wins over wishlist / frozen Wave 61/62 records / Wave 111 living leftover copy.  
**Census date:** 2026-08-24.  
**Scope:** leftover HUD-02 **class identity on plated / mech chrome** after Wave 62 family skins, Wave 65 family audio, SHP plated remount, and Wave 111 living-class leftover (bio tokens = **other worker**).  
**Not this leftover:** living vs conventional family skins (LIVE). Family audio (LIVE). HUD-01 empty 80 px hub. HUD-03 free skin override (owner closed). Kit mutate. Aim-glass gauges. Living class tokens on bio chrome (sibling Wave 111 / Wave 113 living PR1). Player `makeLivingHull` replace. NPC plated GLB bake.

Line numbers are 1-based from live `src/` at census. If a later serial or sibling moved a symbol, **re-census**; do not trust this file over `src/`.

**Sibling note (re-census 2026-08-24 iteration 2):** living PR1 is **LIVE**. `hud.js` `classKeyToken` **101–108** writes allowlisted `data-class-key` **only when `family === 'bio'`** (omit on mech). `applyClassKeyAttr` **110–115**; init **1101**; 5 Hz **1757–1758**. Bio CSS `#hud[data-family="bio"][data-class-key]` **1538–1617** (heavy/ace/cutter/frigate/freighter; light keeps generic organism). Treat those rules as the **living sibling**, not this leftover. Do **not** invent bio clip-path here. Mech leftover is still **real**: grep `#hud[data-family="mech"][data-class-key]` is empty.

---

## 0. Frozen records / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| HUD-02 two identities | `docs/Hud02IdentitiesDesign.md` (Wave 61; **cite, do not rewrite**); `out/w61/shared-contract.md` | **Shipped Wave 62.** `hudFamily` → `'mech' \| 'bio'`; `#hud[data-family]` |
| Wave 62 PR1–PR3 skins | Hud02IdentitiesDesign status; WAVE62 boot | **LIVE.** Hook + mech plate + bio organism |
| Wave 65 PR4 family audio | Hud02IdentitiesDesign; WAVE65 boot `boot-test.mjs` 13372–13414 | **LIVE.** `hudMechRange` / `hudMechMatch` / `hudMechContact` / `hostileEnter` / `hullBand` |
| Mechanical facing plate | Hud02IdentitiesDesign §4.3: hard plate in 22×10; square body | **Partial.** One **generic** triangle + square plate. **Not** six plated class glyphs |
| Living class HUD leftover | `docs/Hud02RemainingSilhouettesDesign.md` (Wave 111; **cite, do not rewrite**); `out/w111/hud02/shared-contract.md` | **Other worker.** Bio tokens. This leftover is **inside mech** |
| Class keys | `state.js` `SHIP_CLASSES` 37–44 | **Six:** light, heavy, freighter, ace, cutter, frigate. No seventh |
| `hudFamily` must not switch on `classKey` alone | `out/w61/shared-contract.md` §3.2 | **Still law.** Family = hullKind / Beautiful / living default. This leftover is **inside mech**, not a third family |

Wave 62 verify: `scripts/boot-test.mjs` 11875–11972 pins `hudFamily` independent→bio, Beautiful→bio, `hullKind:'built'`→mech, living Unknowables→bio, session `rw-hud-family` override, blocked storage → bio.

Wave 65 verify: `boot-test.mjs` 13372–13414 pins family `CUES` keys in `song.js` and `ctx.js` comment. **Consume. Do not reopen music / radio / new family ticks as this leftover.**

---

## 1. Family switch (`src/systems/hud.js`) — consume Wave 62

`export function hudFamily(ctx)` **81–89**:

1. Session debug `sessionHudFamilyOverride()` **92–97**: `sessionStorage['rw-hud-family']` only `'mech' \| 'bio'`. Catch private storage → `null`.
2. No player → `'bio'`.
3. `p.hullKind === 'built'` → `'mech'`.
4. `p.hullKind === 'living'` → `'bio'`.
5. `isBeautiful(p.faction)` → `'bio'`.
6. Else `'bio'`.

`hudFamily` still **does not** switch on `classKey`. Return tokens stay `'mech' \| 'bio'`.

Apply family:

| When | Cite |
|---|---|
| Init | `last.family = hudFamily(ctx)`; `root.dataset.family = last.family` **1099–1100** |
| 5 Hz | Compare `hullKind`, `faction`, session override **1736–1756**. Writes `dataset.family` on change. Bio swap forces `rw-hair-off` |

Sibling class write (**LIVE**, bio only):

| When | Cite |
|---|---|
| `classKeyToken` | **101–108**. `if (family !== 'bio') return ''`. Then `hasOwn` `SHIP_CLASSES`. |
| `applyClassKeyAttr` | **110–115**. Write-on-change `dataset.classKey` or delete. **One writer.** |
| Init | **1101** |
| 5 Hz | **1757–1758** (outside the family-if; class swap does not need hullKind change) |

`last` cache **1077** tracks `family`, **`classKey`**, `kind`, `faction`, `hudOverride`. Hangar swap of a **plated** class while `hullKind` stays `'built'` still **does not** restyle the mech plate: token omits on mech, and `hud.css` has no mech `[data-class-key]` rules.

Session override is **family only**. **No** `rw-hud-class` key.

`hud.js` import from `state.js` **3** now includes `SHIP_CLASSES` (sibling living PR1). HUD **reads** the allowlist. It must **not** write `state.js`. Later mech PR1 **extends** `classKeyToken` so `family === 'mech'` also returns the allowlisted key. **Do not add a second writer.**

---

## 2. Facing silhouette DOM — one tree, two copies, one plate

`makeFacing(parent)` **354–361**:

```
div.rw-facing
  div.rw-facing-sil
    span.rw-facing-nose
    span.rw-facing-body
  div.rw-facing-ends
    span.rw-facing-end.rw-facing-fore  text FORE
    span.rw-facing-end.rw-facing-aft   text AFT
```

Created **once** via `el()` (`createElement` + `textContent`, **261–266**). Self rail **864**. Target rail **875**. **No** class token on the sil node. **No** SVG. **No** `innerHTML` in `hud.js` (grep: none).

`set(mode)` **365–** toggles `is-lit` / `is-dim` / `is-flash` on the **words**. Silhouette spans are **static CSS**.

Facing data path **1407–**: lock hemisphere + `selfHitFlashUntil` (**1127**, 0.4 s wash). Color is never the only cue (comment **353**).

---

## 3. CSS — family skins LIVE; plated class skins ABSENT

Base box (`src/ui/hud.css`):

| Selector | Live | Cite |
|---|---|---|
| `.rw-facing-sil` | **22×10 px**, flex 0 0 22px | **239–244** |
| `.rw-facing-nose` | triangle (default / mech language) | **246–255** |
| `.rw-facing-body` | hollow 16×4 rectangle | **257–265** |
| FORE/AFT | fill vs hollow + word | **272–317** |
| Hub | `.rw-reticle` **80×80**, empty middle | **184–193** |
| RANGE | word on hub when in-range | **207–220**; `hud.js` **729** |

**Mech** (`#hud[data-family="mech"]`) **1262–1284**:

- Sil box still **22×10** (**1262–1265**).
- Nose: hard triangle, `border-right: 5px solid` (**1267–1272**).
- Body: **one** square plate, left 5px, top 2px, **16×6**, `border-radius: 0` (**1274–1280**).
- Ends: `border-radius: 0` (**1282–1284**).

Matches frozen Hud02IdentitiesDesign §4.3 (hard plate; square the body; FORE/AFT stay). **One** conventional glyph for every built class (`light` / `heavy` / `ace` / `cutter` / `frigate` / `freighter` with `hullKind:'built'`).

**Live fill (layout law):** nose `border-right: 5px` + body `left: 5px; width: 16px` uses **21 of 22 px**. Height 6 of 10 (`top: 2`). Later mech class CSS **must not** grow sil `width` / `height` / `flex-basis`. Apparent length only by **reallocation** (shrink nose, then body `left` down and `width` up so `left + width ≤ 22`). Authored keys must not share one tuple: heavy stays tall-only (16×8); freighter is tall **and** realloc (18×8). See contract §0.14.

**Bio generic** (`#hud[data-family="bio"]`) **1503–1536**: one ellipse nose + one organism polygon.

**Bio class tokens (sibling LIVE)** `#hud[data-family="bio"][data-class-key]` **1538–1617**. Light keeps generic organism. **Consume. Do not author or copy those clip-paths onto mech.**

**Grep at this census:** `hud.js` reads `classKey` via `classKeyToken` (bio only). `hud.css` has bio `[data-class-key]` rules. **Zero** `#hud[data-family="mech"][data-class-key]` rules. No tank / fighter / destroyer selectors.

**Census hole:** every plated classKey still paints the **same** mech facing plate and the **same** mech rail chrome. Player plated 3D meshes (`buildPlayerPlatedMesh`) do not reach the overlay. Sibling class write does **not** restyle mech (omit on `family !== 'bio'`).

---

## 4. Plated 3D class bodies (not HUD)

| Surface | Live | Cite |
|---|---|---|
| Class keys | six | `state.js` **37–44** |
| Built visual | `buildBuiltVisual(classKey, faction)` | `ship.js` **467–483** |
| Plated mesh | `buildPlayerPlatedMesh(classKey, faction)` then `buildShipMesh` | `npc.js` **182–185**, **177–178** |
| Fallback box | `makeFallbackPlated` 2.4×0.6×3.6 | `ship.js` **364–377** |
| Rest scale | `livingRestScale(classKey)` vs light P | `ship.js` **258–262**, **481–482** |
| Player remount | `hullKind === 'built'` → plated path | `ship.js` **544**, **565–566** |
| Living 3D (other) | `makeLivingHull`; modest cutter/heavy sil | `ship.js` **264–268**, **280–339** |

**Quality bar** for plated hulls is the faction/class GLB (or the fallback box). HUD 22 px plate is **not** that bar. Do **not** clone plated meshes or NPC GLBs onto `.rw-facing-sil`.

Hangar `classKey` is already the persist (`save.js` `WORLD_FIELDS` includes `'hangar'` **93–94**). `hangar.js` `classKeyOf` **40–42** allowlists `SHIP_CLASSES`. Station already reads mounted class for papers (`mountedClassKey` **1659–1664**). HUD **does not**.

---

## 5. Family audio — consume Wave 65

`song.js` **114–140**:

| Cue | Family gate |
|---|---|
| `hudMechRange` / `hudMechMatch` / `hudMechContact` | mech |
| `hostileEnter` / `hullBand` | bio |
| `reticleLock` | HUD_ALERT_TYPES; not class |

`FAMILY_CUES` **124–130**. Emit gated in `hud.js` `emitFamilyTick` **1087–1090** (`reducedMotion` returns). RANGE tick **1385**.

**No** per-class cue. **Do not** add class ticks as this leftover.

---

## 6. Persist / `state.js` / settings

| Surface | Live | Cite |
|---|---|---|
| Autosave | `rimward-save-v1` | `save.js` **66** |
| `WORLD_FIELDS` | hangar row holds `classKey`; **no HUD family/class field** | **76–101** |
| Settings | `rimward-settings-v1` | `settings.js` **24** |
| `FIELDS` | colorblind, highContrast, reducedMotion, muted, **hudAlerts**, hints, textScale, masterVolume | **29–38** |
| HUD-03 skin picker | **absent** (owner closed) | no `hudSkin` |
| Session debug | `rw-hud-family` only | `hud.js` **92–97** |
| `state.js` | `SHIP_CLASSES` six keys | **37–44**. HUD **reads** `SHIP_CLASSES` (`hud.js` **3**, **104**). **Does not write** |

**No new persist key.** Class already lives on the hangar row. HUD must **read** allowlisted `ctx.player.classKey` (or mounted row) and **must not write** hullKind / classKey / hangar.

---

## 7. HUD / Digit (freeze)

| Surface | Live | Cite |
|---|---|---|
| Hub | 80×80 `.rw-reticle`; pupil + 3 cilia + RANGE | `hud.js` **726–729**; `hud.css` **184–193** |
| `el()` | `createElement` + `textContent` | `hud.js` **261–266** |
| Hit flash | `.rw-combat-self` facing, 0.4 s | **864**, **1127**, **1407–** |
| Digit 0 | shipyard (last of `DOCK_KEY_SERVICES`) | `station.js` **188**, **5964–5965**, **6101** |
| Digit 8 dock root | launch (index 7) | **188**, **5964** |
| Digit 9 dock root | epics / Standing (index 8) | **188**, **5964** |
| Outfitting Digit 8/9 | launcher / turret papers | **1644–1646**, **1691–1711** |
| Class pip on `.rw-reticle` | **absent** | — |
| `#hud[data-class-key]` | **bio LIVE** (`hud.css` **1538–1617**); **mech ABSENT** | leftover = mech CSS |

HUD-01 empty 80 px hub. **No class name, class pip, or aim-glass gauge.**

---

## 8. `reducedMotion` / HUD-03 honor

| Path | Behavior | Cite |
|---|---|---|
| Body class | `rw-reduced-motion` kills HUD animation/transition | `hud.css` **1185–1188**; `settings.js` **32** |
| Mech RANGE one-shot | `animation: none` | **1241–1243** |
| Facing flash | outline, no keyframes | **305–307** |
| Family ticks | `emitFamilyTick` returns | `hud.js` **1105–1108** |
| Color-blind / contrast | `rw-colorblind` / `rw-contrast` | `settings.js` **30–31** |

Later class clip-path / plate geometry must be **static**. No new `@keyframes` on facing. Under reduced motion, bio vs mech layout parity (Wave 61 §2.4) stays; class token may change **static** triangle/square metrics inside 22×10.

---

## 9. Fail closed (live)

| Condition | Result |
|---|---|
| Missing `#hud` | HUD disabled warn; `{ update() {} }` **719–721** |
| Session storage blocked | family bio **94–96** |
| Unknown `hullKind` | bio (WAVE62 `nope` pin) |
| Unknown hangar `classKey` | hangar heals to `'light'` (`classKeyOf`). Sibling omits non-`hasOwn` keys. **Mech still paints generic plate** (no mech class CSS). **Bio** paints generic organism unless sibling token matches |
| `classKeyToken` on mech | returns `''` (**102**); `applyClassKeyAttr` deletes attribute. Later PR1 **extends** this gate; does not add a second writer |
| `innerHTML` | unused in `hud.js` |

---

## 10. Boot pins (honor; do not invert)

| Pin | File | Meaning |
|---|---|---|
| WAVE62 HUD family | `boot-test.mjs` **11875–11972** | `hudFamily` + session override + dataset hook |
| WAVE65 audio | **13372–13414** | family CUES keys; no `playCue` |

Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate) are **other**. Do not “fix” them.

---

## 11. Census verdict — what remains

**Dropped from remaining (shipped; consume):**

- Living vs conventional HUD identities (Wave 62 `hudFamily` + `#hud[data-family]`).
- Mech plate facing + bio organism facing (one glyph each).
- Mech tick ring, square petals, square contacts (Wave 62 PR2).
- Family audio ticks (Wave 65 PR4).
- HUD-03 `body.rw-*` + existing `hudAlerts` checkbox. **No free skin override.**
- Empty 80 px hub + RANGE (HUD-01 / TGT-01).
- Digit 0 shipyard, Digit 8/9 launch / Standing / papers.

**Other worker (LIVE; do not specify clip-path here):**

- Living class tokens on bio chrome. Sibling Wave 113 PR1: `classKeyToken` + `hud.css` **1538–1617**. Consume. Do not invert. Do not delete the attribute on bio.

**Absent leftover (this pack):**

SHP plated remount already paints six 3D class meshes when assets are ready (`buildPlayerPlatedMesh(classKey, faction)`). The live overlay still draws **one generic mechanical plate (triangle + square) for every plated class**. Sibling `classKeyToken` **omits** the attribute when family is mech. `hud.css` has **no** `#hud[data-family="mech"][data-class-key]` rules.

**Not absent (do not pick as PR1):** a second HUD family. New aim-glass gauge. Class name on RANGE. New Digit. `state.js` write. New persist key. innerHTML SVG. NPC GLB thumbnails in HUD. Per-class `song.js` cues. HUD-03 skin picker. Kit mutate. Bio clip-path rewrite. Earth tank / fighter photocopies.

**Verdict:** leftover is **real**. Do **not** freeze CONSUME. Do **not** invent a fake feature beyond class tokens on **existing** mech facing chrome.
