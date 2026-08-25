# HUD-02 remaining TARGET class silhouettes — live inventory

**Wave:** 115. Markdown only. Code wins over wishlist / frozen Wave 61/62 records / Wave 111 living leftover / Wave 113 mech leftover copy.  
**Census date:** 2026-08-24.  
**Scope:** leftover HUD-02 **class identity on existing target facing chrome** after Wave 62 family skins, Wave 65 family audio, Wave 113 living **player** facing tokens, and Wave 114 plated **player** facing tokens.  
**Not this leftover:** living vs conventional family skins (LIVE). Family audio (LIVE). HUD-01 empty 80 px hub. HUD-03 free skin override (owner closed). Kit mutate. Aim-glass gauges. WAVE113 bio player tokens. WAVE114 mech player tokens. Target family switch. New Digit. New persist key.

Line numbers are 1-based from live `src/` at census. If a later serial or sibling moved a symbol, **re-census**; do not trust this file over `src/`.

**Player tokens (LIVE, consume, do not steal as this leftover):** Wave 113 living facing class tokens (`docs/Hud02RemainingSilhouettesDesign.md` — **cite, do not rewrite**). Wave 114 plated facing class tokens (`docs/Hud02RemainingMechSilhouettesDesign.md` — **cite, do not rewrite**). Live `classKeyToken` reads **`ctx.player.classKey` only**. `#hud[data-class-key]` therefore restyles **both** `selfFacing` and `tgtFacing` from the **player** class.

**Target facing (LIVE, generic class):** `makeFacing(tgtRail)` already exists. FORE/AFT on the lock already works. **No** allowlisted `data-class-key` on `.rw-combat-target`. **No** lock-class writer.

---

## 0. Frozen records / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| HUD-02 two identities | `docs/Hud02IdentitiesDesign.md` (Wave 61; **cite, do not rewrite**); `out/w61/shared-contract.md` | **Shipped Wave 62.** `hudFamily` → `'mech' \| 'bio'`; `#hud[data-family]` |
| Wave 62 PR1–PR3 skins | Hud02IdentitiesDesign; WAVE62 boot | **LIVE.** Hook + mech plate + bio organism |
| Wave 65 PR4 family audio | WAVE65 boot; `src/systems/song.js` 115–130 | **LIVE.** Family CUES. Consume |
| Living **player** class tokens | `docs/Hud02RemainingSilhouettesDesign.md`; WAVE113 boot `scripts/boot-test.mjs` 22960–23087 | **LIVE player facing.** Bio `#hud[data-family="bio"][data-class-key]` `hud.css` **1590–1669**. **Not** a target token |
| Plated **player** class tokens | `docs/Hud02RemainingMechSilhouettesDesign.md`; WAVE114 boot `scripts/boot-test.mjs` 23090–23225 | **LIVE player facing.** Mech `#hud[data-family="mech"][data-class-key]` `hud.css` **1286–1336**. **Not** a target token |
| Lock classKey on player leftover | Wave 111 contract §0.13; Wave 113 mech contract §0.13 | **Deferred.** Those leftover packs forbade lock-class on the **player** glyph (Q-ship / new TGT instrument). This census is whether **target facing** still lacks its own token |
| Class keys | `state.js` `SHIP_CLASSES` 37–44 | **Six:** light, heavy, freighter, ace, cutter, frigate. No seventh |
| `hudFamily` must not switch on `classKey` | `out/w61/shared-contract.md` §3.2 | **Still law.** Family = **player** hullKind / Beautiful / living default. Class is **inside** family |
| Wave 112 live knobs | `docs/OwnerDecisionsWave112.md` (**cite, do not edit**) | Consume catalogs, scanner, Digit honor. Do not retune as this leftover |
| Q-ship visual class | `npc.js` 276–277; `traffic-feel.js` `visualClassFor` **114–121** | Cover mesh uses `coverClass`. Hidden `state.classKey` is not the hull you see |

Wave 62 verify: `scripts/boot-test.mjs` pins `hudFamily`. Consume.  
Wave 65 verify: family `CUES` in `song.js`. Consume.  
WAVE113 / WAVE114 pins lock **player** `#hud[data-class-key]`. They do **not** pin `.rw-combat-target[data-class-key]`.

---

## 1. Family switch (`src/systems/hud.js`) — consume Wave 62

`export function hudFamily(ctx)` **81–89**:

1. Session debug `sessionHudFamilyOverride()` **92–97**: `sessionStorage['rw-hud-family']` only `'mech' \| 'bio'`. Catch private storage → `null`.
2. No player → `'bio'`.
3. `p.hullKind === 'built'` → `'mech'`.
4. `p.hullKind === 'living'` → `'bio'`.
5. `isBeautiful(p.faction)` → `'bio'`.
6. Else `'bio'`.

`hudFamily` reads **player** hullKind / faction. It does **not** read lock `classKey` or lock `hullKind`. Return tokens stay `'mech' \| 'bio'`.

Apply family:

| When | Cite |
|---|---|
| Init | `last.family = hudFamily(ctx)`; `root.dataset.family = last.family` **1099–1100** |
| 5 Hz | Compare player `hullKind`, `faction`, session override **1736–1756**. Writes `dataset.family` on change. Bio swap forces `rw-hair-off` on **both** rails |

**Target rail does not have `data-family`.** Family chrome on `tgtFacing` comes from `#hud[data-family]` (player). This leftover does **not** invent a lock family.

---

## 2. Player class write — LIVE (WAVE113 / WAVE114). Consume. Not this leftover

| When | Cite |
|---|---|
| `classKeyToken` | **101–108**. Family must be `'bio'` or `'mech'`. Then `raw = ctx.player && ctx.player.classKey`. `hasOwn` `SHIP_CLASSES`. Empty omit. **Never reads lock.** |
| `applyClassKeyAttr` | **110–115**. Write-on-change `#hud.dataset.classKey` or delete. **One writer on the root.** |
| Init | **1101** |
| 5 Hz | **1758** (outside the family-if; class swap does not need hullKind change) |

`last` cache **1077** tracks `family`, **`classKey`** (player), `kind`, `faction`, `hudOverride`. **No** `tgtClassKey`.

Session override is **family only**. **No** `rw-hud-class` key.

`hud.js` import from `state.js` **3** includes `SHIP_CLASSES`. HUD **reads** the allowlist. It must **not** write `state.js`.

---

## 3. Facing silhouette DOM — one tree, two copies, one player token

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

Created **once** via `el()` (`createElement` + `textContent`, **261–266**). Self rail **864**. Target rail **873–875**:

```
section.rw-combat-rail.rw-combat-target.is-hidden.rw-hair-off
  div.rw-combat-name
  makeFacing(tgtRail)  → tgtFacing
  SCREEN / SHELL / ENGINE / hull / speed / DIST / CLOS
```

**No** class token on the sil node. **No** `dataset.classKey` on `tgtRail`. **No** SVG. **No** `innerHTML` in `hud.js` (grep: none).

`set(mode)` **365–379** toggles `is-lit` / `is-dim` / `is-flash` on the **words**. Silhouette spans are **static CSS**.

Facing data path **1407–1426**: lock hemisphere for `tgtFacing` when `shipTgt` and `target.object.quaternion`. Color is never the only cue (comment **353**).

Target rail show/hide **1253–1268**: live ship lock only. Hide for no target, destroyed, asteroid. Rock / station / pod / landmark never get ship vitals.

---

## 4. CSS — player class LIVE; target class ABSENT; player token leaks onto tgt

Base box (`src/ui/hud.css`):

| Selector | Live | Cite |
|---|---|---|
| `.rw-facing-sil` | **22×10 px**, flex 0 0 22px | **239–244** |
| `.rw-facing-nose` / `.rw-facing-body` | default triangle + hollow rect | **246–265** |
| FORE/AFT | fill vs hollow + word | **272–317** |
| Hub | `.rw-reticle` **80×80**, empty middle | **184–193** |
| RANGE | word on hub when in-range | **207–220**; `hud.js` **729** |
| Target rail | `.rw-combat-target` translate + reverse meters | **901–910** |
| `reducedMotion` | kill all HUD animation | **1183–1188** |

**Mech generic** `#hud[data-family="mech"] .rw-facing-sil` **1262–1284**: one triangle + square; 21/22 px fill. Applies to **self and target**.

**Mech player class (WAVE114 LIVE)** `#hud[data-family="mech"][data-class-key="…"] .rw-facing-*` **1286–1336** (heavy/ace/cutter/frigate/freighter; light keeps generic plate). Selectors are **not** scoped to `.rw-combat-self`. They restyle **every** `.rw-facing-*` under `#hud`, including `tgtFacing`.

**Bio generic** `#hud[data-family="bio"] .rw-facing-*` **1555–1578**: one ellipse + one organism polygon. Self and target.

**Bio player class (WAVE113 LIVE)** `#hud[data-family="bio"][data-class-key="…"] .rw-facing-*` **1590–1669**. Same leak: target glyph follows **player** class.

**Grep at this census:**

| Pattern | Result |
|---|---|
| `classKeyToken` lock / `tgt` / `coverClass` | **none** — player only |
| `tgtRail.dataset` / `.rw-combat-target` `classKey` | **none** |
| `.rw-combat-target[data-class-key]` | **none** in `hud.css` |
| `#hud[data-class-key]` | **player root only** |
| `innerHTML` in `hud.js` | **none** |

**Census hole:** lock / target class does **not** have its own facing token. `tgtFacing` FORE/AFT is live. The 22×10 sil on the target row paints **player** class chrome (or generic family chrome if the player key is omitted). WAVE113 / WAVE114 player metrics are **not** a target-class feature.

---

## 5. Lock class sources (read later; do not write)

| Surface | Live | Cite |
|---|---|---|
| Ship lock | `ctx.targets.current` with `state` | `hud.js` **1243–1255** |
| Rail name cover | `masked = rec.qship && !rec.revealed`; Mk II `pierced` unmasks **name** | **2068–2071** |
| Hidden stats | `createShipState(record.classKey)` under cover mesh | `npc.js` **272–277**, **288** |
| Visible mesh class | `cover ? (record.coverClass ?? 'freighter') : record.classKey` | `npc.js` **276–277** |
| Helper | `visualClassFor` — unrevealed q-ship → `coverClass` | `traffic-feel.js` **114–121** |
| Combat proxy | mesh `userData.proxy`, **not** `state.classKey` | `combat.js` **1651–1657** |
| Non-ship locks | rock / station / gate / pod / landmark | rail **hidden**; no facing class |

`state.classKey` on a disguised Q-ship is the **hidden** cutter. Reading it for a HUD glyph would fight cover (same bug combat.js already fixed for proxies).

Mk II scanner pierce already unmasks **rail name**. It does **not** swap the 3D mesh. A class glyph that followed name-pierce would leak hidden class while the hull still looks like the cover freighter.

---

## 6. Digit / hub / persist / keys — honor, do not steal

| Surface | Live | Cite |
|---|---|---|
| Hub | 80×80 empty | `hud.css` **184–193**; RANGE `hud.js` **729** |
| Digit 0 | shipyard | `station.js` **188**, **5963–5966**, **6100–6105** |
| Digit 8 dock | launch | **188**, **5963**, **1644–1645** |
| Digit 9 dock | epics / Standing | **188**, **5963**, **1644–1645** |
| Outfitting 8/9 | launcher / turret papers | **1691**, **1705** |
| KeyT / KeyV / KeyK / KeyX | cycle / reticle lock / engine part / match | `controls.js` **44**, **268**, **280–290** |
| Persist hangar `classKey` | player hull row | `save.js` `WORLD_FIELDS` **76–101** (`hangar` **93–94**); `hangar.js` `classKeyOf` **40–42**, sanitize **227** |
| `SHIP_CLASSES` | six keys | `state.js` **37–44** |
| Settings | no `hudSkin` | `settings.js` **29–38** |
| Autosave key | `rimward-save-v1` | `save.js` **66** |
| Session | `rw-hud-family` mech\|bio only | `hud.js` **92–97** |

No `world.hudClass`. No `world.tgtClass`. No target persist key.

---

## 7. Family audio — consume Wave 65

`song.js` **115–130**:

| Cue | Family gate |
|---|---|
| `hudMechRange` / `hudMechMatch` / `hudMechContact` | mech |
| `hostileEnter` / `hullBand` | bio |
| `reticleLock` | HUD_ALERT_TYPES; not class |

**No** per-class cue. **No** per-lock cue. **Do not** add class ticks as this leftover.

---

## 8. Wave 112 knobs — consume (`docs/OwnerDecisionsWave112.md`)

Do **not** retune as the leftover. Cite only:

- No seventh class (`SHIP_CLASSES` six).
- Scanner gates contacts arc only. Core HUD ungated. No hub PPI.
- Digit 0 shipyard. No new Digit. HUD-01 empty hub.

---

## 9. Fail-closed live behavior (target row)

| Condition | Live overlay |
|---|---|
| No ship lock | `tgtRail` hidden; `tgtFacing` dim |
| Ship lock, player class allowlisted | **Both** rails use player class CSS (leak) |
| Ship lock, player class omitted | Both rails use generic **player family** facing |
| Q-ship unrevealed | Name may be cover; glyph still player class |
| Unknown player `classKey` | omit `#hud[data-class-key]`; generic family facing both rails |

There is **no** live fail-closed path that paints **lock** class on the target row.

---

## 10. Neighbours (do not steal)

| Path | This leftover |
|---|---|
| `docs/Hud02RemainingSilhouettesDesign.md` | **cite only** (player bio) |
| `docs/Hud02RemainingMechSilhouettesDesign.md` | **cite only** (player mech) |
| `docs/Hud02IdentitiesDesign.md` | **cite only** |
| `docs/Hud03AlertsDesign.md` / `docs/Fx01*.md` | **do not edit** |
| `docs/Tgt*.md` | **do not edit** (KeyT/V/K stay) |
| `out/w115/hud03vis/**` / `out/w115/shp/**` | sibling Wave 115 — **do not steal** |
| `src/` | **no write this worker** |

---

## 11. Verdict

**Leftover is real.** Name it. Do **not** freeze CONSUME.

Evidence:

1. `tgtFacing = makeFacing(tgtRail)` **875** is live FORE/AFT chrome.
2. `classKeyToken` **101–108** reads **player** `classKey` only.
3. `#hud[data-class-key]` CSS **1286–1336** / **1590–1669** is unscoped; it restyles **target** facing from the **player** class.
4. Grep finds **zero** `.rw-combat-target[data-class-key]` writers or selectors.
5. WAVE113 / WAVE114 remain **player** facing. They are not a lock-class feature.

If census had found an allowlisted lock token on `.rw-combat-target` (or a second scoped writer that already drives `tgtFacing` without mixing player vs lock), this pack would freeze **CONSUME** and name serial **none**. Census did not.

**First remaining serial:** **PR1 target facing class tokens** (named only; not this wave).
