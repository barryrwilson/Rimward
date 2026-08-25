# HUD-02 remaining living class silhouettes — live inventory

**Wave:** 111. Markdown only. Code wins over wishlist / frozen Wave 61/62 records.  
**Census date:** 2026-08-24.  
**Scope:** leftover HUD-02 **class identity on living chrome** after Wave 62 family skins, Wave 65 family audio, and Wave 106 BIO-07 class bodies.  
**Not this leftover:** living vs conventional family skins (LIVE). Family audio (LIVE). HUD-01 empty 80 px hub. HUD-03 free skin override (owner closed). Kit mutate. Aim-glass gauges. BIO-07 NPC GLB bake. Player `makeLivingHull` replace. BIO-06 fin Hz.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Frozen records / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| HUD-02 two identities | `docs/Hud02IdentitiesDesign.md` (Wave 61; **cite, do not rewrite**); `out/w61/shared-contract.md` | **Shipped Wave 62.** `hudFamily` → `'mech' \| 'bio'`; `#hud[data-family]` |
| Wave 62 PR1–PR3 skins | Hud02IdentitiesDesign status; WAVE62 boot | **LIVE.** Hook + mech plate + bio organism |
| Wave 65 PR4 family audio | Hud02IdentitiesDesign; WAVE65 boot `boot-test.mjs` 13372–13414 | **LIVE.** `hudMechRange` / `hudMechMatch` / `hudMechContact` / `hostileEnter` / `hullBand` |
| Organic facing silhouettes | Hud02IdentitiesDesign living intent; `out/w61/living-family.md` §1 | **Partial.** One **generic** bio clip-path in the 22×10 box. **Not** six class glyphs |
| BIO-07 six class bodies | Task: Wave 106; `docs/Bio07BodiesDesign.md`; `out/w106/foundation/notes.md` | **3D NPC / player mesh leftover elsewhere.** HUD does **not** consume those bodies |
| Class keys | `state.js` `SHIP_CLASSES` 37–44 | **Six:** light, heavy, freighter, ace, cutter, frigate |
| `hudFamily` must not switch on `classKey` alone | `out/w61/shared-contract.md` §3.2 | **Still law.** Family = hullKind / Beautiful / living default. This leftover is **inside bio**, not a third family |

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

**No `classKey` read.** Return tokens stay `'mech' \| 'bio'`.

Apply:

| When | Cite |
|---|---|
| Init | `last.family = hudFamily(ctx)`; `root.dataset.family = last.family` **1078–1084** |
| 5 Hz | Compare `hullKind`, `faction`, session override only **1719–1737**. Writes `dataset.family` on change. Bio swap forces `rw-hair-off` |

`last` cache **1058–1068** tracks `family`, `kind`, `faction`, `hudOverride`. **No `classKey`.** Hangar swap of living class therefore **does not** restyle HUD chrome.

Session override is **family only**. **No** `rw-hud-class` key.

---

## 2. Facing silhouette DOM — one tree, two copies, one glyph

`makeFacing(parent)` **337–344**:

```
div.rw-facing
  div.rw-facing-sil
    span.rw-facing-nose
    span.rw-facing-body
  div.rw-facing-ends
    span.rw-facing-end.rw-facing-fore  text FORE
    span.rw-facing-end.rw-facing-aft   text AFT
```

Created **once** via `el()` (`createElement` + `textContent`, **244–249**). Self rail **847**. Target rail **858**. **No** class token on the sil node. **No** SVG. **No** `innerHTML` in `hud.js` (grep: none).

`set(mode)` **348–** toggles `is-lit` / `is-dim` / flash on the **words**. Silhouette spans are **static CSS**.

Facing data path **1389–1408**: lock hemisphere + `selfHitFlashUntil` (**1109–1110**, 0.4 s wash). Color is never the only cue (comment **336**).

---

## 3. CSS — family skins LIVE; class skins ABSENT

Base box (`src/ui/hud.css`):

| Selector | Live | Cite |
|---|---|---|
| `.rw-facing-sil` | **22×10 px**, flex 0 0 22px | **239–244** |
| `.rw-facing-nose` | triangle (default / mech language) | **246–255** |
| `.rw-facing-body` | hollow 16×4 rectangle | **257–265** |
| FORE/AFT | fill vs hollow + word | **272–317** |
| Hub | `.rw-reticle` **80×80**, empty middle | **184–193** |
| RANGE | word on hub when in-range | **207–220**; `hud.js` **712** |

**Mech** (`#hud[data-family="mech"]`) **1262–1284**: hard plate; square body; triangle nose. Matches frozen Hud02IdentitiesDesign §4.3 (22×10 box). **One** conventional glyph for every built class.

**Bio** (`#hud[data-family="bio"]`) **1503–1536**:

- Sil box still **22×10**.
- Nose: ellipse clip, vein fill (**1508–1516**).
- Body: **one** organism `clip-path: polygon(...)` (**1518–1526**).
- Ends: organic radius + vein lit fill.

**Grep `hud.js` + `hud.css`:** no `classKey`, no `data-class`, no `data-class-key`, no `rw-hud-class-*`, no wayfinder / shieldback / gardenback selectors.

**Census hole:** every living classKey paints the **same** bio facing glyph and the **same** bio rail chrome (hair, iris, contacts). BIO-07 six bodies do not reach the overlay.

---

## 4. BIO-07 / player class bodies (3D — not HUD)

| Surface | Live | Cite |
|---|---|---|
| Class keys | six | `state.js` **37–44** |
| Player sculpt | `makeLivingHull(classKey)` manta/whale sphere 64×40 | `ship.js` **280–339** |
| Modest 3D class | `livingSilhouette`: **cutter** 0.88/0.78/1.16, **heavy** 1.10/1.32/1.06, else identity | `ship.js` **264–268** |
| Rest scale | `livingRestScale` vs light P | **258–262** |
| Player remount | living visual, not NPC GLB | `ship.js` `makeLivingHull` call **394** |
| NPC Beautiful | GLB + GPU swim | BIO-07 / Wave 106 foundation |
| Wave 106 plans | light shark, ace squid, cutter shark, heavy whale, frigate octopus, freighter gardenback | `out/w106/foundation/notes.md` **7–15** |
| Bible glance | wayfinder / taut dart / guardian cradle / shieldback / elder / gardenback | `docs/Bio03ClassLookDesign.md` **169–180** (**cite only**) |

**Quality bar** is the player CPU hull. HUD 22 px glyph is **not** that bar. Do **not** clone `makeLivingHull` vertices or NPC GLBs onto `.rw-facing-sil`.

Hangar `classKey` is already the persist (`save.js` `WORLD_FIELDS` includes `'hangar'` **94**). `hangar.js` `classKeyOf` **40–42** allowlists `SHIP_CLASSES`. Station already reads mounted class for papers (`mountedClassKey` **1648–1653**). HUD **does not**.

---

## 5. Family audio — consume Wave 65

`song.js` **114–140**:

| Cue | Family gate |
|---|---|
| `hudMechRange` / `hudMechMatch` / `hudMechContact` | mech |
| `hostileEnter` / `hullBand` | bio |
| `reticleLock` | HUD_ALERT_TYPES; not class |

`FAMILY_CUES` **124–130**. Emit gated in `hud.js` `emitFamilyTick` **1087–1090** (`reducedMotion` returns). Contact enter **1535–1540**.

**No** per-class cue. **Do not** add class ticks as this leftover.

---

## 6. Persist / `state.js` / settings

| Surface | Live | Cite |
|---|---|---|
| Autosave | `rimward-save-v1` | `save.js` **16, 66** |
| `WORLD_FIELDS` | hangar row holds `classKey`; **no HUD family/class field** | **76–101** |
| Settings | `rimward-settings-v1` | `settings.js` **7–8, 24** |
| `FIELDS` | colorblind, contrast, reducedMotion, muted, **hudAlerts**, hints, textScale, masterVolume | **29–38** |
| HUD-03 skin picker | **absent** (owner closed) | no `hudSkin` |
| Session debug | `rw-hud-family` only | `hud.js` **92–97** |
| `state.js` | `SHIP_CLASSES` six keys | **37–44**. HUD imports WEAPONS etc. **3**. **Does not write** |

**No new persist key.** Class already lives on the hangar row. HUD must **read** allowlisted `ctx.player.classKey` (or mounted row) and **must not write** hullKind / classKey / hangar.

---

## 7. HUD / Digit (freeze)

| Surface | Live | Cite |
|---|---|---|
| Hub | 80×80 `.rw-reticle`; pupil + 3 cilia + RANGE | `hud.js` **709–712**; `hud.css` **184–193** |
| `el()` | `createElement` + `textContent` | `hud.js` **244–249** |
| Hit flash | `.rw-combat-self` facing, 0.4 s | **846–847**, **1109–1110**, **1391–1399** |
| Digit 0 | shipyard (last of `DOCK_KEY_SERVICES`) | `station.js` **188**, **5963–5966**, **6101** |
| Digit 8 dock root | launch (index 7) | **188**, **5963** |
| Digit 9 dock root | epics / Standing (index 8) | **188**, **5963** |
| Outfitting Digit 8/9 | launcher / turret papers | **1633–1712** |
| Class pip on `.rw-reticle` | **absent** | — |
| `#hud[data-class-key]` | **absent** | — |

HUD-01 empty 80 px hub. **No class name, species pip, or aim-glass gauge.**

---

## 8. `reducedMotion` / HUD-03 honor

| Path | Behavior | Cite |
|---|---|---|
| Body class | `rw-reduced-motion` kills HUD animation/transition | `hud.css` **1185–1188**; `settings.js` **72** |
| Bio hair | `content: none` | `hud.css` **1483–1488** |
| Bio iris breathe | animation none | **1616–1620** |
| Facing flash | outline, no keyframes | **305–307** |
| Family ticks | `emitFamilyTick` returns | `hud.js` **1088** |
| Color-blind / contrast | `rw-colorblind` / `rw-contrast` | `settings.js` **70–71** |

Later class clip-path must be **static**. No new `@keyframes` on facing. Under reduced motion, bio vs mech layout parity (Wave 61 §2.4) stays; class token may change **static** clip inside 22×10 (same class of residual as vein tint).

---

## 9. Fail closed (live)

| Condition | Result |
|---|---|
| Missing `#hud` | HUD disabled warn; `{ update() {} }` **702–705** |
| Session storage blocked | family bio **94–96** |
| Unknown `hullKind` | bio (WAVE62 `nope` pin) |
| Unknown hangar `classKey` | hangar heals to `'light'` (`classKeyOf`) — **HUD still paints generic bio** because HUD ignores classKey |
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
- Bio rail hair, breathing iris, vein accent (Wave 62 PR3).
- Family audio ticks (Wave 65 PR4).
- HUD-03 `body.rw-*` + existing `hudAlerts` checkbox. **No free skin override.**
- Empty 80 px hub + RANGE (HUD-01 / TGT-01).
- Digit 0 shipyard, Digit 8/9 launch / Standing / papers.

**Absent leftover (this pack):**

BIO-07 gave Beautiful class bodies six marine plans. Player `makeLivingHull` modestly scales cutter/heavy in **3D**. The live overlay still draws **one generic living facing silhouette / rail chrome for every living class**. `hud.js` never reads `classKey`. `hud.css` has no `[data-class-key]` rules.

**Not absent (do not pick as PR1):** a second HUD family. New aim-glass gauge. Class name on RANGE. New Digit. `state.js` write. New persist key. innerHTML SVG. NPC GLB thumbnails in HUD. `makeLivingHull` clone onto overlay. Per-class `song.js` cues. HUD-03 skin picker. Kit mutate.

**Verdict:** leftover is **real**. Do **not** freeze CONSUME. Do **not** invent a fake feature beyond class tokens on **existing** living chrome.
