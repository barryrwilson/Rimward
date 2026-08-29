# RIMWARD RW-003 Models ship reference

| Field | Value |
|---|---|
| **Title** | RIMWARD RW-003 Models ship reference |
| **Issue** | [RW-003 / GitHub #4](https://github.com/barryrwilson/Rimward/issues/4) |
| **Author** | RW-003 design (issue #4) |
| **Date** | 2026-08-28 |
| **Revised** | 2026-08-28 (design-review pass 2: security/a11y/write-set) |
| **Status** | **Draft pending owner acceptance.** |
| **Accepted** | — |
| **Wave** | Design-only. Later serials land code. |
| **Owner request** | Turn the Models title-menu surface into a browsable ship reference grouped by faction/class, with pirate variants, role/scale/lore summaries, and unambiguous loading progress. |
| **Honor** | HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit. Digit 0 shipyard. Digit 8/9 stay station services. Digit 1–5 stay flight WPN. KeyJ dock/jump. KeyD strafe-right default. CTL-02 never writes `flags.paused` from overlay-policy. CTL-04 Digit skip while menus own digits stays. CTL-05 pause menu is ACCESS to live Settings; Models is not a Settings path. `state.js` READ-ONLY. Frozen event vocabulary: **no new `ctx.emit` types** unless a live gap is proved and marked **owner decision**. Labels `textContent`. Color is not the only cue. `reducedMotion`: no new animation that ignores it. Fail closed: never throw from Models paint, load, or close. No in-repo LLM. Do not steal RW-002 Settings files (`settings.js`, `controls.js`, `bindings.js`, `song.js`, `ctx.js`). Do not write `title.js` unless a later serial proves a title-label change is required. |

**This stamp does not ship `src/`.** No implementation until the owner accepts this brief.

**This is not a fleet-art redesign.** **This is not new ship models.** **This is not ship-catalog combat balance.** **This is not loading every model at once.** Census of live code wins over stale wishlist wording.

---

## Issue acceptance (GitHub #4)

The issue body is the outcome source. Wishlist inbox **140–144** and remaining-work RW-003 match it. The 2026-08-25 playtest capture is the backlog source link; the Models ask itself lives in the inbox block, not as a checked playtest bullet. This brief enables every criterion:

| Criterion | Where this brief closes it |
|---|---|
| Live model sources and duplicates/variants are inventoried (cite file:line) | Background census; ship inventory |
| Design covers faction/class browsing, pirate variants, role/scale/lore summaries, loading/error state, keyboard use, and reduced motion | §2–§8 |
| Performance and disposal behavior have explicit acceptance limits | §9 |
| First implementation slice and browser verification flow are bounded | Implementation slices, Live browser, PR Plan |
| No implementation until the design is accepted | Status line; this task writes docs only |

Live census: Models is already a title overlay with its own WebGL renderer and a 245-row flat catalog. Do **not** add a second viewer. Do **not** invent HUD-scale, kit mutate, or new frozen events.

---

## Overview

Playtest inbox (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **140–144**) asks to turn Models into a browsable ship reference. The 2026-08-25 capture (`67fb1a0` build) is the remaining-work source for RW-003; census of **current** code wins over any stale “asset inspection only” wording.

Live Models already:

1. Opens from title MODELS (`title.js` **131–136**) through `ctx.models.open()` (`modelsbrowser.js` **832–836**).
2. Paints a long flat list with tabs `ALL` plus `MODEL_CATEGORIES` (`model-catalog.js` **30**, `modelsbrowser.js` **143–154**).
3. Interleaves trader and pirate NPC hulls as separate rows (`model-catalog.js` **58–85**).
4. Lazy-loads GLB hulls via `primeShipAsset` + `buildShipMesh` (`model-catalog.js` **66–82**, `ship-assets.js` **425–428**, `npc.js` **199–201**).
5. Shows “Loading asset…” / build errors by interpolating strings into `innerHTML` (`modelsbrowser.js` **459–474**, **597–608**).

The smallest compatible expansion is:

1. Keep `modelsbrowser.js` as the only owner of the Models overlay, its renderer, and `ctx.models`.
2. Keep `model-catalog.js` as the only catalog assembler. Add **display metadata** on existing ship entries (class, variant, summaries). Do not change ids, categories, or builders.
3. On the Ships tab, group by live `FACTION_ORDER` then `CLASS_ORDER`. Hide pirate rows behind a variant control. Keep other categories as the live flat list.
4. Paint role / scale / lore from **already-authored** tables (`SHIP_SCALE`, `FACTIONS.name`, static bible one-liners copied into the catalog). Do not parse markdown at runtime. Do not write `state.js`.
5. Make loading and errors unambiguous with `textContent`, `role="status"`, and a one-in-flight load queue.
6. Cap cached **clones**. Never `dispose()` module-shared GPU resources.

Numeric performance defaults below are **deputized** so a first serial can ship without blocking on owner arithmetic.

---

## Background & Motivation

### Current evidence (code wins)

Issue #4 says the viewer exposes a long flat list, lacks faction/class grouping, role/scale/lore context, pirate handling, and clear loading progress.

| Claim | Live | Cite |
|---|---|---|
| Flat catalog list with category tabs `ALL` + `MODEL_CATEGORIES` | **Present.** Tabs: ALL, Ships, Stations, Gates, Landmarks, Celestial, Props | `model-catalog.js` **30**; `modelsbrowser.js` **143–154**, **355–360** |
| Default open is Ships, first catalog ship | **Present.** `selectedCategory = 'Ships'`; first Ships entry | `modelsbrowser.js` **650–655** |
| Pirate variants are separate `:pirate` entries | **Present.** 144 NPC rows = 72 hulls × trader+pirate | `model-catalog.js` **58–85** |
| Player living hull is a Ships entry | **Present.** `ship:player`, `faction: 'beautiful'`, sync `build()` | `model-catalog.js` **92–113** |
| Own WebGL renderer, must not share game renderer | **Present.** Comment + `new THREE.WebGLRenderer` | `modelsbrowser.js` **23–26**, **206–224** |
| Game renderer is configured for ship assets at boot | **Present.** | `main.js` **70** |
| Models first open **overwrites** the module renderer pointer | **Present.** `configureShipAssets(renderer)` on the overlay GL context | `modelsbrowser.js` **216**; `ship-assets.js` **405–408** |
| Cache Map never disposes geometries | **Present.** “cached object is never disposed” | `modelsbrowser.js` **35–38**, **91**, **418–428** |
| NPC clones also register in a module `instances` Set | **Present.** LOD attach walks every live clone | `ship-assets.js` **387–401**, **493–509** |
| `releaseShipAsset` exists and is unused by the browser | **Present.** | `ship-assets.js` **502–509** |
| Loading text is a string in the info bar | **Present.** `"Loading asset…"` via `innerHTML` | `modelsbrowser.js` **459–461** |
| Load races drop stale mounts | **Present.** `if (currentEntry === entry)` | `modelsbrowser.js` **432–436** |
| Rapid arrows can start many in-flight `load()`s | **Present.** Coalesce **per id** only; other ids all run | `modelsbrowser.js` **422–436** |
| `innerHTML` used for chrome, list clear, info, errors | **Present.** Bio07 already names this file | `modelsbrowser.js` **114–117**, **317**, **369**, **460**, **468–473**, **602–608**; `docs/Bio07BodiesDesign.md` **67** |
| Overlay z-index 80, same as Settings | **Present.** Title Models and Settings stay key-mutexed | `models.css` **13**; `title.js` **209**; Settings z 80 in Ctl06 census |
| Title capture yields while Models is open | **Present.** | `title.js` **205–209** |
| Overlay is not `role="dialog"` | **Absent dialog semantics.** Root is a `div.rw-models` | `modelsbrowser.js` **107–110** |
| Keyboard: Esc close, ↑↓ list, R reframe | **Present.** Capture-phase; filter input letters pass | `modelsbrowser.js` **47–49**, **703–750** |
| Focus trap / Tab cycle inside Models | **Absent.** | no trap in `handleKeydown` |
| `reducedMotion` freezes turntable | **Present.** | `modelsbrowser.js` **52–53**, **814–817** |
| `reducedMotion` freezes Beautiful swim / mixers | **Present.** passed into `animateShipMesh` | `modelsbrowser.js` **807–811**; `ship-assets.js` **511–528** |
| Star shell ignores `reducedMotion` | **Present.** still rotates | `modelsbrowser.js` **819–823** |
| Role / scale / lore on the info bar | **Absent.** Info shows label, faction id, meshes/tris/radius | `modelsbrowser.js` **597–608** |
| `SHIP_SCALE` already has role + berth + target span | **Present.** | `ship-scale.js` **69–187**, **258** |
| Faction display names | **Present.** `FACTIONS[id].name` | `state.js` **591–606** |
| Faction first-read / class nicknames | **Docs only.** Not imported by the catalog | `docs/FactionShipDesignBible.md` **82–256** |
| New frozen `ctx.emit` types for Models | **None live.** `ctx.models` is a sync API, not an event | `modelsbrowser.js` **16–18**, **832–836**; `ctx.js` has no `models` field |

Do **not** invent a second catalog. Do **not** load markdown from `docs/` in the browser bundle.

### Live catalog inventory

`MODEL_CATALOG` concatenates ships, stations, gates, landmarks, celestial, props (`model-catalog.js` **265–272**).

| Family | Count law | Count | Cite |
|---|---|---:|---|
| NPC ships | 12 factions × 6 classes × 2 roles | 144 | `model-catalog.js` **45–85** |
| Player living hull | one `build()` sculpt | 1 | `model-catalog.js` **92–113** |
| Stations | 10 detail + beautiful + unknowables + placeholder | 13 | `model-catalog.js` **116–153** |
| Gates | 12 faction + 1 hub | 13 | `model-catalog.js` **156–173** |
| Landmarks | kinds×2 + authored + convergence/deepening | 22 (boot pin) | `model-catalog.js` **176–216**; `boot-test.mjs` **11254–11278** |
| Celestial | 7 authored systems × (1 star + 5 planets) | 42 | `authored-systems.js` **30–234**; `solarsystem.js` **170–206**, **443** |
| Props | 9 `ORE_KEYS` + cargo pod | 10 | `model-catalog.js` **241–261**; `boot-test.mjs` **11229–11252** |
| **Total** | | **245** | |

`FACTION_ORDER` (browse order, live):

`freehold`, `veridian`, `redledger`, `ferrous`, `gilded`, `congregation`, `assembly`, `lamplighter`, `independent`, `hollow`, `beautiful`, `unknowables` (`model-catalog.js` **45–48**).

This is **not** `FACTION_REBUILD_ORDER` (`ship-scale.js` **264–268**) and **not** `NPC_FACTIONS` order (`ship-assets.js` **16–19**). Deputize: keep live `FACTION_ORDER` so the first hull remains Freehold light (starter-facing).

`CLASS_ORDER` (charter size ladder): `light`, `ace`, `cutter`, `heavy`, `frigate`, `freighter` (`ship-scale.js` **258**).

NPC ship **ids** (stable; do not rename):

```text
ship:{faction}:{classKey}           # trader / standard bake
ship:{faction}:{classKey}:pirate    # pirate bake
ship:player                         # living hull scale anchor
```

Pirate is **not** a second GLB body. `primeShipAsset(faction, classKey, 'trader'|'pirate')` loads the **same** LOD0 template and a **role material set** (`ship-assets.js` **33–46**, **425–428**). Duplicate rows in the UI are duplicate **catalog entries**, not duplicate files.

**Variant census (every live ship id):**

| Pattern | Count | Pirate twin? |
|---|---:|---|
| `ship:{faction}:{classKey}` trader | 72 | yes, `…:pirate` |
| `ship:{faction}:{classKey}:pirate` | 72 | is the twin |
| `ship:player` | 1 | **no** |
| Total Ships category | 145 | |

`FACTION_ORDER` is a **non-exported** `const` today (`model-catalog.js` **45–48**). PR1 exports it (or exports a frozen copy) so the browser does not duplicate the array. `CLASS_ORDER` is already exported (`ship-scale.js` **258**).

Stations / gates / landmarks / celestial / props stay inspection rows. This issue does not regroup them.

WAVE51N pins Props count = ores + pod and deterministic asteroid verts (`boot-test.mjs` **11223–11252**). Serials must not change prop ids, labels, or `build()` seeds.

Boot also pins title button text `[1] NEW GAME|[2] MODELS|[3] SETTINGS` (`boot-test.mjs` **9515**). Do not rename the MODELS title action.

### Live viewer controls and loading path

```text
title MODELS click/Digit
  → ctx.models.open()
  → create overlay (once) + show
  → initThree() once: own WebGLRenderer, OrbitControls, star shell, modelGroup
  → configureShipAssets(modelsRenderer)   // overwrites main.js pointer
  → flags.paused = true (save/restore previous)
  → capture-phase keydown
  → select first Ships entry
      if cached: mount
      else if entry.load: showLoading, Promise load(), cache, mount if still current
      else entry.build() sync
  → rAF loop: update(), turntable, star rotate, controls.update, render
close()
  → cancel rAF, drop keydown, hide overlay, restore flags.paused
  → renderer KEPT; cache KEPT; configureShipAssets NOT restored
```

Filter: case-insensitive substring of `entry.label` (`modelsbrowser.js` **355–360**). Pirate rows match `"pirate"` because the label includes `(pirate)`.

Legend live: `DRAG ORBIT — WHEEL ZOOM — ↑↓ SELECT — R RESET — ESC CLOSE` (`modelsbrowser.js` **166**).

`playSurfaceBlocked` already returns true while `ctx.models.isOpen()` (`overlay-policy.js` **83–86**). `controls.js` skips dock pulse and reticle lock while Models is open (**240**, **587**). Pause `KeyP` also returns (`main.js` **313**). Do not steal those files.

### Pain points

- 145 Ships rows interleave trader/pirate, so a faction family is 12 clicks apart.
- Info bar names the faction **id** (`freehold`), not `Freehold Compact`, and has no role/scale/lore.
- “Loading asset…” is a color-styled HTML fragment with no `aria-busy`, no list-row cue, and no error retry control.
- Arrow-hold can prime dozens of GLBs. Freighter lod0 is the large bake (`ship-scale.js` **171–175** comments ~5.2 MB).
- Cache never calls `releaseShipAsset`. Browser clones stay in `instances` and keep receiving LOD attaches.
- First open points KTX2/`configureShipAssets` at the overlay renderer and never points it back at `ctx.renderer`.
- `innerHTML` interpolates `entry.label` and `error.message` (`modelsbrowser.js` **460**, **468–473**, **603**). Labels are authored today; loader messages are not a closed set.
- Overlay is not a dialog. Tab can leave to title buttons (z 70) that remain in the tree.
- Star shell still moves under `reducedMotion`.

---

## Goals & Non-Goals

### Goals

1. Census live catalog, viewer, loading path, and faction/class/lore sources from **code** (this document).
2. Ships tab: browse by faction then class. Pirate is a variant of a hull, not a twin row.
3. Show role, scale, and a short lore/first-read line next to the framed hull.
4. Loading and error states a screen reader and a sighted player can both trust.
5. Keyboard-only use of grouping, variant, filter, list, reframe, and close. Honor `reducedMotion`.
6. Explicit cache / in-flight / disposal limits that do not `dispose()` shared GPU resources.
7. Split later implementation into serial PRs with named write sets.
8. Preserve title MODELS, Settings mutex, own renderer, WAVE51N props pins, and frozen events.

### Non-goals (locked)

- No implementation in this design task.
- No new ship GLBs, materials, or fleet-art redesign.
- No ship combat / catalog balance / SKU / kit mutation.
- No regroup of Stations, Gates, Landmarks, Celestial, or Props in this issue.
- No load-all-models-on-open. No unbounded simultaneous primes.
- No `state.js` writes. No `WORLD_FIELDS`. No new frozen events (no live gap).
- No writes to RW-002 files: `settings.js`, `controls.js`, `bindings.js`, `song.js`, `ctx.js`.
- No aim-glass gauges. No Digit 0/8/9 meaning changes. No in-repo LLM.
- No `innerHTML` for new copy. Existing interpolated `innerHTML` is retired in the Models serials.

---

## Proposed Design

### 1. Ownership

| Object | Writer | Readers |
|---|---|---|
| `MODEL_CATALOG` / `MODEL_BY_ID` | `model-catalog.js` only | models browser; boot WAVE51N (cite only) |
| Overlay DOM, rAF, cache Map, load queue | `modelsbrowser.js` only | title MODELS via `ctx.models` |
| `ctx.models = { open, close, isOpen }` | `modelsbrowser.js` at init | `title.js`, `overlay-policy.js`, `controls.js`, `main.js` pause key |
| Ship GLB templates / materials / `instances` | `ship-assets.js` (unchanged API) | npc, models catalog `load()` |
| `flags.paused` save/restore while open | `modelsbrowser.js` (live) | loop |
| Frozen events | unchanged | — |
| `state.js` / `FACTIONS` | **none** | catalog reads `.name` |
| `ship-scale.js` | **none** | catalog reads `CLASS_ORDER` / `SHIP_SCALE` |
| `ctx.js` | **none** | — |

`ctx.models` stays a runtime attach (`modelsbrowser.js` **832–836**). Do not add a `createCtx` field. Do not add `ctx.emit('modelsOpen')`.

`configureShipAssets` is a module pointer (`ship-assets.js` **405–408**). Models serials **must** restore `configureShipAssets(ctx.renderer)` on close and on failed WebGL init. That is a `modelsbrowser.js` call, not a `ctx.js` write.

### 2. Grouping and navigation (Ships tab)

**Deputized browse order:** live `FACTION_ORDER` then live `CLASS_ORDER`. First selectable hull remains Freehold Compact — Light (trader).

**Ships tab structure:**

1. Sticky filter input (live).
2. Category tabs (live set). Unchanged labels.
3. **Variant control** (new, Ships-relevant): `Trader` / `Pirate` toggle. Default **Trader**.
4. Scroll list:
   - One group header per faction with `FACTIONS[id].name` via `textContent`. Headers are `h3` (or `role="heading"` `aria-level="3"`), not buttons.
   - Under each header, six hull rows (one per class) when that faction has both roles. Row label is the class display name (`Light`, `Ace`, …), not the long live string `Freehold Compact — Light`.
   - After all faction groups, a **Scale anchor** group with `ship:player` (`Player — Living Hull`). Keep it last so the size ladder stays faction-first. The entry’s catalog `faction: 'beautiful'` is data, not a second Beautiful Ones row.

**ALL tab:** same grouping for ship entries; non-ship entries remain a flat tail under a `Other models` header, live order preserved.

**Non-Ships category tabs:** live flat `entry.label` list. No faction grouping in this issue.

**Filter:** match if any of these lowercase strings contain the needle (`String.prototype.includes`, **not** `RegExp` — the needle is player-typed):

- `entry.label`
- `FACTIONS[faction].name` when present
- `classKey`
- `trader` / `pirate` / `variant`
- group title `Scale anchor` for `ship:player`

The filter string is user-controlled. It must never be assigned to `innerHTML`, never interpolated into HTML, and never passed to `new RegExp`. Compare with `includes` on authored lowercase haystacks only.

Empty groups hide. If the filter leaves zero rows, the list shows one status node `No matching models` (`role="status"`). Do not keep a stale hull selected without a visible row; if the current entry is filtered out, clear the viewport and info status `No matching models`.

Filter input: `aria-label="Filter models"` (placeholder `Filter...` is not a name).

**Selection:** clicking a hull row selects that faction×class. The variant control chooses trader vs pirate **id**. Selecting `ship:player` ignores the pirate toggle (no pirate bake).

**Default on open:** Ships tab, Trader variant, `ship:freehold:light`. Same first mesh as live, without auto-selecting the pirate twin.

### 3. Pirate variants

| Law | Rule |
|---|---|
| Identity | Trader id `ship:{f}:{c}`; pirate id `ship:{f}:{c}:pirate`. Do not merge catalog rows. |
| UI | One row per faction×class. Variant control + selected-row badge text `Pirate` or `Trader`. Color is not the only cue. |
| Default | Trader (**deputized**). |
| Keyboard | `ArrowLeft` / `ArrowRight` flip variant when the selected hull has both bakes. The toggle is also a real `button` (`aria-pressed`). |
| Filter `pirate` | Shows pirate-capable hulls and, while the needle is `pirate`, forces the variant to Pirate until the player changes it or clears the filter. (**deputized**) |
| Player hull | No variant. Toggle disabled (`disabled` + status text `Living hull has no pirate bake`). |
| Assets | Still `primeShipAsset(..., 'trader'|'pirate')`. No new files. |

Do not hide pirate **data**. Reviewers can still reach every id. The list just stops presenting 72 twins as peers.

### 4. Lore / role / scale sources

Do not fetch `docs/*.md` at runtime. Do not write `FACTIONS` in `state.js`. Copy short authored strings into `model-catalog.js` (or a sibling `src/game/ship-reference.js` imported **only** by the catalog — prefer **in-catalog constants** to avoid a third write-set file unless the catalog module becomes unreadable).

Per **class** (already live; read, do not rewrite `ship-scale.js`):

| classKey | Role (`SHIP_SCALE.role`) | Berth | Target span |
|---|---|---|---:|
| light | scout, courier, interceptor, personal workboat | fits an internal berth | 6.8 |
| ace | bespoke high-performance personal combat craft | fits an internal berth | 7.2 |
| cutter | patrol, boarding, customs, rescue, raiding | fits a large internal berth | 11.0 |
| heavy | gunship, convoy escort, tough specialist vessel | uses a large bay or exterior cradle | 17.0 |
| frigate | compact capital escort and command ship | normally uses an exterior military clamp | 32.0 |
| freighter | bulk carrier, mobile industry, migration vessel | NEVER fits inside a station; exterior berth only | 78.0 |

Cite: `ship-scale.js` **69–187**.

Per **faction**, copy **one** first-read sentence from `docs/FactionShipDesignBible.md` (static):

| faction | First-read (authored copy) | Bible |
|---|---|---|
| veridian | calm corporate authority, survey precision, modular extraction hardware | §4.1 **84** |
| ferrous | disciplined military mass, exact symmetry, protected citizens behind a hard line | §4.2 **99** |
| freehold | maintained by neighbors, repaired for decades, useful before beautiful, warm without being quaint | §4.3 **114** |
| redledger | captured hardware reorganized into a deliberate predatory machine | §4.4 **129** |
| gilded | reptilian auction-house elegance, sealed and controlled | §4.5 **144** |
| beautiful | majestic animal intelligence, tenderness, breath, and self-directed motion | §4.6 **159** |
| unknowables | a coherent traveling energy configuration carrying real physical energy cells | §4.7 **174** |
| assembly | ancient survey machinery, recursive self-similarity, copy errors that accumulated into lineage | §4.8 **189** |
| congregation | practical frontier vessel shaped by sacred orientation and disciplined ritual | §4.9 **204** |
| lamplighter | rugged infrastructure, replaceable parts, access to everything, tools before weapons | §4.10 **219** |
| independent | commercially available frames, secondhand modules, practical field repairs | §5.1 **238** |
| hollow | sealed and shuttered hulls; deep-rim regional equipment, not a formal nation | §5.2 **249** |

Per **faction×class**, copy the bible **craft nickname** only (e.g. Freehold light = `family runabout`, Veridian freighter = `extraction carrier`). Full brief paragraphs stay in the bible.

Player hull summary (authored, not bible NPC):

- Role: `player living hull; visual and scale yardstick (P = 6.6)`
- Scale: `spanX 6.60 · spanY 0.70 · spanZ 4.20` (`ship-scale.js` **12–20**)
- Lore: `A small personal living craft. NPC sizes are measured against this hull.`

**Info panel fields** (all `textContent`; `role="status"` on the live region):

1. Display name: `{FACTIONS.name} — {Class}` plus `Trader` or `Pirate`.
2. Craft nickname (bible).
3. Class role + berth (`SHIP_SCALE`).
4. Scale: `target {n} units ({pBand[0]}–{pBand[1]} P)`.
5. First-read sentence.
6. Live inspection stats already computed: meshes, tris, radius (`modelsbrowser.js` **479–499**). Keep these; they are how art review still works.
7. Status line: `Ready` / `Loading hull…` / `Load failed` + error text.

Do not show combat DPS, prices, or SKUs. Those are catalog-balance (out of scope).

### 5. Loading, progress, and error

Loader progress from GLTF is opaque today. Do **not** fake a percent.

| State | Viewport | List row | Live region | Other |
|---|---|---|---|---|
| Idle / ready | mounted mesh | `aria-current="true"` | name + summaries + stats | — |
| Loading | previous mesh **removed** (live) + non-animated skeleton text `Loading hull…` | `aria-busy="true"`; name stays | `Loading {display name}…` | indeterminate CSS bar; `prefers`/`reducedMotion`: static bar, no shimmer |
| Error | empty viewport | `aria-invalid="true"` | `Load failed: {sanitized message}` | `Retry` button |
| WebGL init fail | no canvas | — | `WebGL not available` | filter still usable; list does not call `load()` |

**In-flight law (deputized):** at most **one** `entry.load()` / `primeShipAsset` started by the browser at a time. A newer selection becomes the single **pending** id. When the in-flight promise settles:

- if it is still current → mount
- if it is not current → cache the built object (counts toward LRU) but do not mount
- then start the pending id if any

Do not `AbortController` the GLTF loader in this issue (no measured abort API on the live `GLTFLoader` path). Queue + ignore-stale is enough.

**Retry:** the same `selectEntry(current)` path. Fail closed: catch, never throw, never break the overlay.

**Sanitize error text:** `String(error && error.message ? error.message : error)` then paint with `textContent`. Strip controls. Cap at 180 characters. Never assign to `innerHTML`.

**Shared prime:** `primeShipAsset` is global. A Models load of `veridian/freighter/trader` helps the live system if the player then CONTINUE. That is desired. Do not build a second asset cache.

### 6. Keyboard

Capture-phase listener stays on `window` while open (live). Title already yields (`title.js` **209**).

| Key | When | Action |
|---|---|---|
| `Escape` | always | close (live) |
| `ArrowDown` / `ArrowUp` | list or filter focused | next/prev **hull row** (skip headers) |
| `ArrowLeft` / `ArrowRight` | not typing in filter | trader ↔ pirate if both exist |
| `Home` / `End` | not in filter | first/last visible hull row (**deputized** new) |
| `KeyR` | not in filter; no ctrl/meta/alt | reframe (live) |
| `Tab` / `Shift+Tab` | overlay open | cycle: close, filter, tabs, variant, list row, retry (if any). **Trap** inside `.rw-models` |
| letters | filter focused | pass through (live) |
| other | not in filter | swallow (live; keeps KeyP from unpausing) |

Do not bind Digit 0–9 as Models shortcuts (station Digit 0 honor; title digits already yielded).

Close button, tabs, variant, rows, retry: real `button`s, `type="button"`, visible `:focus-visible` (live CSS already has a 2px accent ring). Hit size: variant and retry ≥ 44×44 CSS px; list rows may stay compact but not shrink below one line (`flex: 0 0 auto` live `models.css` **174–177**).

On `open()`, focus the filter (live) **after** setting `aria-modal`. On `close()`, restore focus to the title MODELS button if that node is still connected (`document.getElementById('rw-title-models')` and `isConnected`). If missing or not a focusable element, leave focus on `document.body`. Never throw. Do not write `title.js` if the id stays `rw-title-models` (`title.js` **131**). The headless boot harness may stub `getElementById`; fail closed.

### 7. reducedMotion

| Motion | Live | This issue |
|---|---|---|
| Y turntable `0.18 rad/s` until drag | frozen when `ctx.settings.reducedMotion` | keep |
| Beautiful swim / mixer | `update(..., reducedMotion)` | keep |
| Star shell rotate | **not** frozen | freeze when reducedMotion |
| New loading shimmer | none | **forbidden** when reducedMotion; use a static bar + text |
| `scrollIntoView` | `block: 'nearest'` (no smooth) | keep; do not add `behavior: 'smooth'` |
| CSS `transition` on tabs/rows | 0.12–0.15s | live Settings toggles `body.rw-reduced-motion` (`settings.js` **106**). Gate **new** Models CSS animation/shimmer on `body.rw-reduced-motion` **and** `@media (prefers-reduced-motion: reduce)`. Canvas motion (turntable, star, swim) keeps reading `ctx.settings.reducedMotion` as live. **Do not** write `settings.js` |

Do not read or write `settings.js`. Canvas path: `ctx.settings.reducedMotion` (live). CSS path: `body.rw-reduced-motion` plus `prefers-reduced-motion`. Either gate is enough to kill new shimmer.

### 8. Accessibility and DOM safety

**Dialog:** overlay root `role="dialog"` `aria-modal="true"` `aria-label="Models"`. Close button keeps `aria-label="Close"`.

**Live region:** info bar `role="status"` `aria-live="polite"` `aria-atomic="true"`.

**Selected row:** `aria-current="true"` in addition to `.rw-selected` (color + weight already). Group headers are headings (`h3`), not `presentation`.

**Variant:** `aria-pressed` on Pirate when pirate is active. Visible text `Pirate variant: on/off`.

**High contrast:** extend existing `body.rw-contrast` rules in `models.css` to new group headers, variant, progress, retry. Color is not the only selected/error cue (text + border + `aria-*`).

**`innerHTML` law:**

| Use | Verdict |
|---|---|
| New player-facing strings | **Forbidden.** `textContent` / `createElement` only |
| `listDiv.innerHTML = ''` | Replace with `replaceChildren()` (no interpolations) |
| Header template with MODELS + ✕ | Rebuild with `createElement`; keep visible title `MODELS` |
| `updateInfoBar` / `showLoading` / `showBuildError` / `showFatalError` | Retire interpolation. Loader `error.message` is the XSS hole |
| Empty `innerHTML = ''` as a shortcut | Not needed if `replaceChildren()` is used |

Authored labels are trusted **today**, but the error path is not. One law for the overlay.

**Pointer:** overlay is full-screen (no `pointer-events: none` in `models.css`). Clicks do not fall through to title. Keep stopPropagation on mousedown/click/wheel (live **184–187**). Do not click-out-to-close (live has none).

**Settings z-80:** do not open both. Live: Models swallows KeyO (`modelsbrowser.js` **745–749`). RW-002 PR4 will make Settings eat the dim ring, which blocks title MODELS clicks while Settings is open. This issue does not write Settings files. Deputize: `open()` if already open is a no-op (live); do not call Settings APIs.

### 9. Performance and disposal limits (verifiable)

All numbers below are **deputized** acceptance limits unless the owner overrides.

| Limit | Value | How to verify |
|---|---|---|
| Viewport mounted hulls | **1** | `modelGroup.children.length === 1` while ready |
| Browser-started in-flight `load()` | **1** | log or debug counter; arrow-spam does not grow it |
| Pending selection | **1** (latest wins) | skip intermediate ids |
| Cached built clones in `builtModels` | LRU **12** | after 13 distinct hulls, size ≤ 12 |
| Models open does not prime the other 144 hulls | true | network/log: only selected (+ at most pending) |
| Pixel ratio | `min(devicePixelRatio, 2)` (live) | keep |
| Star points | 1500 (live) | keep |
| Renderer lifetime | session (create once, hide on close) | keep |
| `dispose()` of NPC template geometry / shared materials / KTX2 textures | **forbidden** | no `geometry.dispose` / `material.dispose` on ship-asset clones |
| On LRU evict or close-unmount of an NPC clone | `modelGroup.remove`; `releaseShipAsset(root)` | `instances` Set no longer holds the clone |
| Player `ship:player` evict | allowed to dispose **browser-created** flesh material + vein texture + geo from that `build()` only | never dispose `makeLivingHull` internals if they become shared later; today they are created in the catalog `build()` (`model-catalog.js` **97–111**) |
| Non-ship entries | cache as live (no LRU in first slice). Do not dispose station/gate shared mats | first slice is Ships-heavy |
| Restore asset renderer | `configureShipAssets(ctx.renderer)` on `close()` and WebGL-fail path | after close, world NPCs still decode on the game canvas |
| Open-all budget | **out of scope** | do not add a “load fleet” button |

**Why not dispose NPC clones’ meshes:** `buildShipAsset` clones the skinned graph and binds materials (`ship-assets.js` **445–448**) but LOD templates stay in the module `templates` Map. A naive `traverse(dispose)` will free the template the game still uses.

**Why call `releaseShipAsset`:** `instances.get(key)` drives `attachLowerLods` (`ship-assets.js` **387–401**). A hidden browser clone with `parent` still set would keep growing LODs. Remove from the group first, then release.

**Close behavior:** hide overlay, stop rAF, restore pause flag, restore `configureShipAssets(ctx.renderer)`, keep LRU cache for the session (live keep-all except now capped). Do not destroy the WebGL context each close (live comment **6–7**).

**CONTINUE after Models:** title unpause path unchanged. Models must not leave `flags.paused` stuck true (`wasPausedBeforeOpen` live **638–640**, **690**).

---

## Implementation slices (write sets)

Overlapping files: `modelsbrowser.js`, `model-catalog.js`, `models.css`. **Serial, not parallel.**

Do **not** write: `settings.js`, `controls.js`, `bindings.js`, `song.js`, `ctx.js`, `state.js`, `title.js` (unless a later serial proves a title change), `scripts/boot-test.mjs` in the design task. Later serials may add pins; they must not hide RW-006/RW-007 known FAILs.

### Slice A — catalog metadata only

| File | Change |
|---|---|
| `src/game/model-catalog.js` | Add `classKey`, `variant` (`'trader' \| 'pirate' \| null`), `displayClass`, `craftName`, `firstRead`, `scaleNote` (or equivalent) on **ship** entries. Keep every `id`, `label`, `category`, `faction`, `load`/`build`. **Export** `FACTION_ORDER` (today it is a non-exported const at **45–48**). WAVE51N props unchanged |

Does not: DOM, CSS, load queue, renderer restore.

### Slice B — Ships reference UI (first player-facing slice)

| File | Change |
|---|---|
| `src/systems/modelsbrowser.js` | Grouped list, variant toggle, summaries via `textContent`, dialog semantics, focus trap, Home/End, Left/Right variant, loading/error/retry, in-flight=1+pending, `replaceChildren`, `configureShipAssets(ctx.renderer)` restore, freeze star shell under reducedMotion, `releaseShipAsset` when replacing the mounted NPC clone |
| `src/ui/models.css` | Group headers, variant control, status bar, indeterminate (motion-safe) progress, contrast rules, 44px variant/retry |

Does not: LRU eviction yet (cache may still grow for the session in B if A+B land without C). **Prefer landing B+C together** on a playable branch so a review session cannot cache 144 freighters.

Does not: Settings, title, ctx, state.

### Slice C — LRU 12 + player-hull dispose exception

| File | Change |
|---|---|
| `src/systems/modelsbrowser.js` | LRU cap 12 on `builtModels`; evict → unmount if current (shouldn’t), `releaseShipAsset` for NPC, dispose only `ship:player` browser-owned resources |

Depends on B. Overlaps `modelsbrowser.js` → **serial after B**, or merge B+C as one PR if the owner wants a single Models write.

### Slice D — verification + backlog status (implementation wave only)

Build, boot, live browser, then parent updates `docs/REMAINING-WORK.md` / wishlist. Not this design task. Do not edit those files here.

---

## Live browser verification (later serials)

Player-facing UI requires a live browser plus console check (`AGENTS.md`). This design task does **not** start Vite or Chrome.

**Open / mutex:** Title `[2] MODELS`. Overlay covers the title. Esc closes. Digit 2 does not re-fire title while open. KeyP does not unpause. KeyO does not open Settings. Console: no throw.

**Grouping:** Ships tab shows faction headers in `FACTION_ORDER` with Compact/Combine/… names. Six class rows each. No `(pirate)` twin rows. First selection is Freehold Compact — Light trader.

**Pirate:** Toggle Pirate (click and Left/Right). Same class, pirate materials. Badge text `Pirate`. Filter `pirate` surfaces hulls and pirate variant. Player living hull: toggle disabled.

**Summaries:** For Veridian freighter, info shows extraction-carrier nickname, bulk-carrier role, exterior-berth line, target 78, first-read corporate/survey sentence, plus meshes/tris/radius. All visible as text, not color-only chips.

**Loading:** On a cold hull (hard refresh, open Models, pick a far faction freighter) the info region reads `Loading …` before Ready. Row `aria-busy`. No percent lie. Fail a path (devtools offline after cache clear, or a broken id in a debug build): `Load failed` + Retry; overlay stays up.

**Keyboard:** Tab cycles close → filter → tabs → variant → rows. Focus does not land on CONTINUE. ↑↓ skip headers. Home/End. R reframes. Esc closes and focus returns to MODELS.

**reducedMotion:** Enable in Settings **before** opening Models (Settings is RW-002; do not write it). Turntable frozen, swim frozen, star shell frozen, no loading shimmer. Contrast mode: headers and selected row still read.

**Performance:** Arrow-spam down the Freehold family: only one GLB network/prime at a time. Open 13 distinct hulls: cached clones ≤ 12. Continue the run: world ships still render; no missing textures from a disposed template. Console: no WebGL lost-context from dispose.

**Regression:** Props tab still 10 entries. Stations/gates still list. Title buttons still `[n] MODELS`. WAVE51N still green. Digit 0 at a station is still shipyard after CONTINUE.

---

## Regression risks

| Risk | Sev | Mitigation |
|---|---|---|
| `geometry.dispose()` on a shared GLB template | High | Forbid dispose on NPC clones; only `releaseShipAsset` |
| `configureShipAssets` left on overlay GL | High | Restore `ctx.renderer` on close/fail |
| Arrow-spam primes 144 hulls | High | in-flight=1 + pending=1 |
| LRU evicts the mounted hull | Med | Never evict `currentEntry.id`; pick another |
| Pirate toggle rebuilds the wrong id | Med | Derive id from faction+class+variant; keep catalog rows |
| Filter drops current entry, stale mesh remains | Med | Clear mount + status |
| `innerHTML` + `error.message` XSS | High | `textContent` only |
| Tab to title CONTINUE under the overlay | High | focus trap + `aria-modal` |
| Both Settings and Models at z 80 | Low | Models swallows keys; RW-002 hit-layer blocks clicks later |
| WAVE51N props / title MODELS string | High | Do not change those ids/labels |
| `flags.paused` stuck after close | High | keep live save/restore |
| New `ctx.emit` | High | Forbidden |
| Parallel edits to `modelsbrowser.js` | High | Serial PRs |
| Writing `state.js` lore fields | High | Static copy in catalog only |
| Star shell motion vs reducedMotion | Med | Freeze in the rAF branch |
| `ship:player` material leak on rebuild | Low | Cache the one living hull; dispose only if LRU evicts it |
| Stolen RW-002 files | High | Write-set list excludes them |

---

## Alternatives considered

| Alternative | Why not |
|---|---|
| Nested `<details>` per faction without a variant toggle | Pirate twins remain 72 extra rows; wishlist asks to hide duplicates behind a variant control |
| Drop pirate from the catalog | Reviewers and WAVE-era inspection lose a bake; ids stay; UI hides, data stays |
| Group by `CLASS_ORDER` first (all lights, then aces) | Family read is the bible’s review unit; class-first is a later filter chip if the owner asks |
| Use `FACTION_REBUILD_ORDER` | Live list starts Freehold; changing first-open mesh is an extra product change |
| Fetch bible markdown in the browser | Bundle/docs leakage; not JSON-safe; LLM-adjacent scraping. Copy one-liners |
| Write lore onto `FACTIONS` in `state.js` | Honor READ-ONLY; combat/station readers do not need viewer copy |
| Load every Ships entry on open with a progress bar | Issue forbids unmeasured simultaneous loads; freighter bakes are large |
| Share the game WebGL renderer | Live comment: `main.js` renders every frame; sharing conflicts (`modelsbrowser.js` **23–26**) |
| Destroy the overlay renderer on close | Live keeps it to avoid GL churn (`modelsbrowser.js` **6–7**) |
| `dispose()` everything in `builtModels` on close | Shared templates/materials; use-after-free in the running game |
| AbortController on `GLTFLoader` | Not measured on the live loader; queue is enough |
| New `ctx.emit('modelLoaded')` | No live gap; overlay is local |
| innerHTML kept because labels are authored | Error messages and future label edits; Bio07 already flagged this file |
| Regroup stations/gates in the same slice | Issue outcome is **ship** reference; other tabs stay inspection |

---

## Open questions

Status: **Draft.** Deputized laws below are playable defaults. Owner may override before serials start. Same pattern as Ctl06 (Ctl06 is now owner-accepted; this brief is not).

1. **Browse order = live `FACTION_ORDER`** (Freehold first), not bible rebuild order. **Deputized.**
2. **Pirate default = trader.** **Deputized.**
3. **Variant keys = Left/Right** plus a visible toggle. **Deputized.**
4. **LRU = 12 clones; in-flight = 1; pending = 1.** **Deputized.** Owner may pick another cap after a measured session.
5. **Lore = static catalog one-liners** (bible first-read + craft nickname + `SHIP_SCALE`). No `state.js` write. **Deputized.**
6. **Player hull group last as Scale anchor.** **Deputized.**
7. **Non-ship categories stay flat.** **Deputized.**
8. **Restore `configureShipAssets(ctx.renderer)` on close.** Treated as required correctness, not optional. **Deputized required.**
9. **Land B+C together** on a playable branch so LRU ships with the UI. **Deputized.** Slice A can merge alone.
10. **No new frozen events. No Models persist key.** Session UI state (filter, tab, variant) may persist only in the overlay closure for the page lifetime (live already keeps the DOM). **Deputized.**

No remaining question requires the owner to invent a number before a draft serial: the deputized numbers are listed.

---

## Key Decisions

1. **`modelsbrowser.js` remains the only overlay owner.** Own WebGL renderer stays. Do not share `main.js`’s renderer.
2. **`model-catalog.js` remains the only catalog.** Ids, categories, and builders stay. Metadata is additive.
3. **Ships browse by live `FACTION_ORDER` × `CLASS_ORDER`.** Pirate is a variant, not a row.
4. **Lore/role/scale are copies of live tables + bible one-liners.** `state.js` and `ship-scale.js` stay read-only. No markdown loader. No LLM.
5. **One in-flight load, latest pending, LRU 12, no shared `dispose()`.** Call `releaseShipAsset` on NPC unmount/evict. Restore `configureShipAssets(ctx.renderer)` on close.
6. **All new copy is `textContent`.** Retire interpolated `innerHTML`. Dialog + focus trap + `role="status"`.
7. **`reducedMotion` freezes turntable, swim, and the star shell.** New CSS shimmer also dies under `body.rw-reduced-motion` and `prefers-reduced-motion`. Filter text uses `includes`, never `innerHTML` or `RegExp`.
8. **No new `ctx.emit` types, no `ctx.js` writes, no RW-002 files, no Digit/aim-glass/kit mutate.**
9. **Serial PRs.** Slice A is data-only. B+C are the player-facing Models write (`modelsbrowser.js` + `models.css`).

---

## Honor

- HUD-01 empty hub: Models is title overlay, not a hub widget.
- Digit 0 shipyard: no Models digit shortcuts.
- No aim-glass gauges.
- No kit mutate.
- No new frozen events (none required; flagged if a serial claims otherwise — **owner decision**).
- Labels `textContent`.
- Color is not the only cue (text + border + `aria-current` / `aria-pressed` / status).
- Fail closed: catch load/build; never throw from open/close/paint.
- No in-repo LLM; no model credentials in the bundle.
- `state.js` READ-ONLY.
- Do not steal RW-002 Settings files.

---

## References

- [GitHub issue #4](https://github.com/barryrwilson/Rimward/issues/4)
- `docs/REMAINING-WORK.md` RW-003
- `docs/PLAYER-EXPERIENCE-WISHLIST.md` **140–144**; playtest capture heading 2026-08-25 (`67fb1a0`)
- `docs/Ctl06ExpandedSettingsDesign.md` — stamp pattern; Settings z-80 mutex
- `docs/FactionShipDesignBible.md` — first-read and craft nicknames
- `docs/FactionShipRebuildPlan.md` — historical; code + bible win
- `docs/Bio07BodiesDesign.md` — `innerHTML` named on `modelsbrowser.js`
- `src/systems/modelsbrowser.js`, `src/game/model-catalog.js`, `src/ui/models.css`
- `src/systems/title.js`, `src/systems/ship-assets.js`, `src/systems/npc.js`
- `src/game/state.js` (`FACTIONS`), `src/game/ship-scale.js`
- `src/main.js` **70**, **101–103**, **142**
- `scripts/boot-test.mjs` WAVE51N props; title MODELS label — cite only

---

## PR Plan

**No implementation until the owner accepts this brief.** This stamp does not start `src/` work.

Each PR is independently **reviewable**. Merge in order. Slice A does not claim a player-facing reference. Prefer B+C together on a playable branch.

### PR1 — Ship reference metadata

- **Title:** `RW-003 PR1: ship catalog metadata for faction/class/variant summaries`
- **Files:** `src/game/model-catalog.js`
- **Dependencies:** design accepted
- **Description:** Additive fields on ship entries (`classKey`, `variant`, craft nickname, first-read, scale note). Export `FACTION_ORDER` if needed. Do not change ids, labels, categories, or prop/station builders. Boot WAVE51N still passes.

### PR2 — Browsable Ships UI, loading/error, a11y, renderer restore

- **Title:** `RW-003 PR2: Models ships reference grouping, pirate variant, and safe loading`
- **Files:** `src/systems/modelsbrowser.js`, `src/ui/models.css`
- **Dependencies:** PR1
- **Description:** Grouped Ships list, trader/pirate toggle, summaries via `textContent`, dialog/focus trap/status, in-flight queue, Retry, reducedMotion star freeze, `configureShipAssets(ctx.renderer)` restore, `releaseShipAsset` on NPC unmount. No Settings/title/ctx writes.

### PR3 — LRU cache cap

- **Title:** `RW-003 PR3: Models browser LRU without shared GPU dispose`
- **Files:** `src/systems/modelsbrowser.js`
- **Dependencies:** PR2
- **Description:** Cap `builtModels` at 12. Evict unmounted NPC clones with `releaseShipAsset` only. Optional `ship:player` dispose of browser-owned material/geo. **Merge with PR2 on a playable branch** (deputized).

### PR4 — Verification and backlog (implementation wave)

- **Title:** `RW-003 PR4: verify Models ship reference and mark wishlist`
- **Files:** `docs/REMAINING-WORK.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md` (status only); optional boot pins. **Not** a silent edit of known RW-006/RW-007 FAILs.
- **Dependencies:** PR1–PR3
- **Description:** `npm run build`, `npm run test:boot` (rerun rule), live browser matrix, console check, security pass. Then mark RW-003 / inbox **140–144** done. Parent/implementation wave only.

**Overlapping write sets:** `model-catalog.js` is PR1 only. `models.css` is PR2 only. `modelsbrowser.js` is PR2 and PR3 — **serial**. Do not land a sibling pack on those files in the same window without a merge-law note. Do not overlap RW-002’s `settings.js` / `controls.js` / `bindings.js` / `song.js` / `ctx.js`.
