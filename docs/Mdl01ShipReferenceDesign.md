# RIMWARD RW-003 browsable ship reference

| Field | Value |
|---|---|
| **Title** | RIMWARD RW-003 browsable ship reference |
| **Issue** | [RW-003 / GitHub #4](https://github.com/barryrwilson/Rimward/issues/4) |
| **Author** | RW-003 design (issue #4) |
| **Date** | 2026-08-28 |
| **Status** | **Accepted.** Owner accepted the design on 2026-08-29. No `src/` change lands under this stamp; serials may start after it. |
| **Accepted** | 2026-08-29 (owner) |
| **Wave** | Design-only. Later serials land code. |
| **Owner request** | Turn the Models title-menu surface into a browsable ship reference rather than a flat asset inspection list: faction/class grouping, pirate variant handling, role/scale/lore summaries, and unambiguous loading progress. |
| **Honor** | `src/core/ctx.js` frozen event vocabulary — **no new `ctx.emit` types**. `src/game/state.js` READ-ONLY. `ctx.asteroids.list` `id === array index` untouched. `src/main.js` init order untouched. No new persisted fields, no new digits/keys outside the overlay, no equipment SKU or kit mutation, no aim-glass gauge. `innerHTML` forbidden in new code; labels `textContent`. Colour is never the only cue. `reducedMotion` respected by every new motion. Fail closed: one broken sculpt must never break the browser. No new ship models, no fleet-art redesign, no balance or catalog change. No in-repo LLM. Do not steal RW-002 Settings, OPT-004 `fireHeld`, or OPT-001 evidence. |

**This stamp does not ship `src/`.** Design accepted 2026-08-29. Serials may start after this stamp. **This is not new ship art.** **This is not a catalog or balance change.** **This is not a HUD change.** Census of live code wins over the issue's prose.

---

## Issue acceptance (GitHub #4)

| Criterion | Where this brief closes it |
|---|---|
| Live model sources and duplicates/variants are inventoried | §1 Census, §2 Duplicates and variants |
| Faction/class browsing, pirate variants, role/scale/lore summaries, loading/error state, keyboard use, reduced motion | §3–§8 |
| Performance and disposal behaviour have explicit acceptance limits | §9 Budgets and §10 Disposal |
| First implementation slice and browser verification flow are bounded | §11 Slices, §12 Verification matrix |
| No implementation begins until the design is accepted | Status line; this task wrote docs only. First slice is filed as #23 |

---

## 1. Census — what is live today

Measured on this worktree at `b042b4f5`. Commands used are named so a reviewer
can repeat each number.

### 1.1 Catalog size

`node --import ./scripts/with-css-stub.mjs scripts/probe-models.mjs`:

```
catalog: 245 entries, 245 unique ids, 0 duplicates, 0 bad categories
probed:  245 entries, 245 built, 0 failures, 0 animation failures, 1 without update()
```

| Category | Entries | LOD0 triangles (sum over entries) | Radius range |
|---|---:|---:|---|
| Ships | 145 | 2,015,960 | 3.66 .. 54.91 |
| Stations | 13 | 908,900 | 106.79 .. 111.54 |
| Gates | 13 | 50,388 | 67.95 .. 98.86 |
| Landmarks | 22 | 21,886 | 3.08 .. 45.93 |
| Celestial | 42 | 38,864 | 16.10 .. 261.53 |
| Props | 10 | 3,916 | 1.33 .. 14.46 |
| **Total** | **245** | **3,039,914** | — |

The 245 total decomposes exactly:

- Ships `12 factions x 6 classes x 2 roles = 144`, plus `ship:player` (the scale
  anchor) = **145**. `src/game/model-catalog.js` **45–113**.
- Stations `10 DETAIL_STATION_FACTIONS + beautiful + unknowables + placeholder` = **13**. **116–153**.
- Gates `12 factions + 1 Lamplighter hub junction` = **13**. **156–173**.
- Landmarks `5 kinds x 2 factions = 10`, plus 10 authored landmarks across the
  seven `AUTHORED_SYSTEMS`, plus `CONVERGENCE.site` and `DEEPENING.site` = **22**. **176–217**.
- Celestial `7 authored systems x (1 star + PLANET_SLOT_COUNT 5 planets)` = **42**. **220–238**.
- Props `9 ORE_KEYS + cargo pod` = **10**. **241–261**.

### 1.2 The viewer

`src/systems/modelsbrowser.js` (843 lines) owns its own `WebGLRenderer`, scene,
camera, `OrbitControls`, and `requestAnimationFrame` loop. It is opened from
`src/systems/title.js` **131–135** (`[2] MODELS`) through
`ctx.models = { open, close, isOpen }`. `src/systems/overlay-policy.js` **86**
treats an open browser as an overlay; `src/main.js` **313** stops `KeyP` from
unpausing behind it.

| Surface | Live behaviour | Cite |
|---|---|---|
| Sidebar list | One flat `<button>` per filtered entry, no grouping, no headers | `modelsbrowser.js` **367–385** |
| Tabs | `ALL` plus the six `MODEL_CATEGORIES` | **142–157**, `model-catalog.js` **30** |
| Filter | Substring match on `entry.label` only, lower-cased | **134–137**, **355–361** |
| Selection | `selectEntry` clears, builds or loads, mounts, measures, frames, writes the info bar | **389–445** |
| Info bar | Label, faction **id** (raw key, not display name), meshes, triangles, radius | **597–611** |
| Loading state | One line, `Loading asset…`, in the info bar. No list affordance, no progress, no cancel | **459–461** |
| Error state | `entry.label` plus `error.message` in the info bar, warm colour only | **466–474** |
| Framing | Box-fit on a side-biased `(1, 0.42, 0.34)` direction | **553–592** |
| Turntable | `0.18 rad/s` on Y until the first drag; frozen under `reducedMotion` | **71**, **815–817** |
| Star shell | 1,500 additive points at radius 4,000, rotates **regardless of `reducedMotion`** | **263–308**, **820–823** |
| Keys | `Escape` close, `Arrow↑/↓` navigate, `KeyR` reframe; every other key is swallowed | **703–751** |

### 1.3 Ship loading path

Ship entries call `primeShipAsset(faction, classKey, role)` then
`buildShipMesh` (`src/systems/npc.js` **199–201** → `buildShipAsset`).

- `primeShipAsset` awaits `lod0.glb` **and** the role's four KTX2 maps, then
  calls `attachLowerLods`, which fetches `lod1`/`lod2` (`lod3` for freighters)
  in the background with **no** UI signal. `src/systems/ship-assets.js` **425–428**, **387–402**.
- Measured on disk: 72 sculpts, 228 LOD GLBs, 24 KTX2 atlas sets
  (`npm run ships:validate`). Total GLB `27,379,976 B`; total KTX2 `1,628,559 B`.

| Class | LOD0 mean | All LODs, 12 factions |
|---|---:|---:|
| light | 100,860 B | 2,142,172 B |
| ace | 118,898 B | 2,565,272 B |
| cutter | 145,693 B | 3,563,584 B |
| heavy | 169,435 B | 3,956,428 B |
| frigate | 298,625 B | 5,974,268 B |
| freighter | 486,138 B | 9,178,252 B |

A role material set is four KTX2 maps, ~52 KB.

### 1.4 Data already available for summaries

Everything the issue asks for as "role/scale/lore" is already authored. **No new
world content is written by this design.**

| Field | Live source |
|---|---|
| Class role sentence | `SHIP_SCALE[class].role` — `src/game/ship-scale.js` **69–187** |
| Berth rule | `SHIP_SCALE[class].berth` (e.g. freighter "NEVER fits inside a station") |
| Size band and target | `SHIP_SCALE[class].pBand`, `.span`, `.target`; yardstick `P = 6.6` **39** |
| Metre conversion | `UNITS_PER_METRE = P / 24` **42** |
| Class ladder order | `CLASS_ORDER` **258** |
| Faction display name and identity colour | `FACTIONS[faction].name` / `.color` — `state.js` **591–606** |
| Faction palette | `FACTION_STYLE` — `src/game/faction-style.js` |
| Faction "first read" line and per-class role name | `docs/FactionShipDesignBible.md` §3, §4.1–§5.2 |

The bible is **documentation, not a module.** §5 below fixes how it becomes data
without touching `state.js`.

### 1.5 Live defects found while censusing

These are current-code facts, listed so the slices below are honest about what
they repair. None is new scope invented by this brief.

1. **Six `innerHTML` sites.** Header markup **114–117**, `showFatalError`
   **317**, the list clear **369**, `showLoading` **460**, `showBuildError`
   **468–473**, `updateInfoBar` **602–610**. Only the list clear is benign.
   `AGENTS.md` requires text-safe DOM for world/content strings, and
   `error.message` is the least predictable string in the file.
2. **Tab is dead.** `handleKeydown`'s `default` branch calls `preventDefault()`
   plus `stopImmediatePropagation()` on every unhandled key while the filter
   input is unfocused (**745–749**). Tab is unhandled, so keyboard focus cannot
   move once it leaves the input, and there is no focus trap to justify it.
3. **No dialog semantics.** The overlay has no `role="dialog"`, no `aria-modal`,
   no accessible name, no live region for the loading/error line, and focus is
   not restored to `[2] MODELS` on close.
4. **The info bar prints a raw faction key** (`beautiful`, `redledger`) rather
   than `FACTIONS[faction].name` — **599**.
5. **Nothing is ever released.** `builtModels` never evicts and
   `releaseShipAsset` is never called, so every selected ship root stays in the
   `instances` set in `ship-assets.js` and keeps receiving background LOD
   attachments for the rest of the session (`ship-assets.js` **502–510**).
6. **Arrow-key scrubbing starts an unbounded load fan-out.** Holding `Arrow↓`
   through the Ships tab calls `selectEntry` per repeat; each `load()` is
   memoised by id, but nothing cancels, so a two-second hold can put a dozen
   `lod0` fetches plus their background LOD chains in flight at once.
7. **The star shell ignores `reducedMotion`** (**820–823**), unlike the
   turntable beside it.
8. **CSS transitions ignore `reducedMotion`.** `models.css` has
   `transition: all 0.15s ease` on the close button, tabs and entries, with no
   `body.rw-reduced-motion` guard.

---

## 2. Duplicates and variants — the inventory the issue asks for

| Kind | Count | Fact | Consequence for the design |
|---|---:|---|---|
| **Trader/pirate role pairs** | 72 pairs (144 rows) | Both rows call the **same** `lod0.glb`. Only `materials/<faction>/<role>` differs, ~52 KB. `cloneSkinned` shares geometry, so the second row costs a material set and a draw object, **not** a second sculpt. `ship-assets.js` **33–45**, **435–470** | The pirate row is a *skin*, not a model. It belongs behind a variant control on one row, not as a second row. This alone removes 72 of 245 rows. |
| **`ship:player`** | 1 | Sculpted by `makeLivingHull()` with a locally re-declared flesh material so the live mood lerp cannot mutate it. `model-catalog.js` **87–113** | Keep it, but pin it as the explicit scale anchor at the head of the ladder, not as a Beautiful Ones ship. |
| **Station special cases** | 3 pushes | `station:beautiful` (**132–138**) and `station:unknowables` (**140–146**) call `buildStationModel(faction)` exactly as the ten `DETAIL_STATION_FACTIONS` do. Only the comments differ | Cosmetic redundancy in the catalog source. Not player-visible; not repaired by this issue. Noted so a later serial does not "discover" it as a defect. |
| **Gate hub junction** | 1 | `buildGateModel('lamplighter', { hub: true, routes: 3 })` — a true option variant of a listed gate | Same variant control as the pirate skin. |
| **Landmark kind × faction** | 10 | 5 kinds × `{independent, beautiful}` | Genuine variants of one kind. Group by kind. |
| **Authored landmarks** | 12 | 10 from `AUTHORED_SYSTEMS`, plus Convergence and Deepening. Several reuse a generic kind with an authored id (`hr_quiet_beacon` is a `beacon`) | Distinct sculpts. Keep as rows, grouped by system. |
| **Celestial planets** | 35 | 5 shared `SLOTS` geometries, re-graded per system by `FACTION_STYLE.planetMood` / `planetTint` | Seven near-copies of the same five bodies. Group by system; do not flatten. |
| **Category collision** | — | 12 faction gates and 12 faction stations are separate rows, and the Ships tab hides them | Faction browsing must cross categories (§3). |

**Net:** 245 flat rows collapse to **173 canonical rows plus a variant control**
(245 − 72 pirate rows). Ships alone go from 145 rows to 73.

---

## 3. Browsing model — faction first, class second

### 3.1 Two axes, one sidebar

The live sidebar has one axis (category) and one flat list. The reference adds a
**grouping axis** that is orthogonal to it:

```
┌ MODELS ───────────────────────────────────────── [✕] ┐
│ ┌ Filter… ─────────────┐                             │
│ │ BY FACTION │ BY TYPE │      ← group mode (2 tabs)  │
│ ├──────────────────────┤                             │
│ │ ▾ Veridian Combine  ▪│                             │
│ │    Light — claim sco…│         VIEWPORT            │
│ │    Ace — patent dem… │                             │
│ │  ▸ Ferrous Hegemony ▪│                             │
│ │  ▸ Freehold Compact ▪│                             │
│ │  ▸ …                 │                             │
│ │  ▸ Not a faction     │  ┌ info bar ──────────────┐ │
│ └──────────────────────┘  │ …                      │ │
│ [ ] Pirate livery                                    │
│ DRAG ORBIT — WHEEL ZOOM — ↑↓ SELECT — ← → GROUP …    │
└──────────────────────────────────────────────────────┘
```

- **BY TYPE** is today's behaviour, preserved: the six `MODEL_CATEGORIES` become
  six collapsible groups instead of six tabs. Nothing is lost; `ALL` becomes
  "all groups expanded".
- **BY FACTION** groups by `entry.faction` in `FACTION_ORDER`
  (`model-catalog.js` **45–49**), with a final **Not a faction** group for the
  entries that carry no `faction` key (all 42 Celestial rows,
  `station:placeholder`, all 10 Props). That group is required, not optional:
  53 of 245 rows have no faction.
- Inside a faction group, rows are ordered **Ships in `CLASS_ORDER`, then
  Station, then Gate, then Landmarks**. The Ships block therefore reads as the
  size ladder the charter measures, which is the point of the `CLASS_ORDER`
  comment at `model-catalog.js` **51–55**.
- Group mode is session state only. **No new persisted field** (`state.js` is
  read-only; `settings.js` `FIELDS` is RW-002's surface, not this issue's).

### 3.1.1 Opening state — settled

Live `open()` (`modelsbrowser.js` **650–658**) forces `selectedCategory = 'Ships'`
and selects the first Ships entry on **every** open, so re-opening throws away
where the reviewer was. Grouping needs this pinned, not left to the serial.

| # | Decision | Reason |
|---|---|---|
| **G1** | First open of a session uses **BY FACTION**. | The wave exists to make the surface read as a faction reference. Opening on BY TYPE would reproduce today's list and hide the feature behind a tab the player has no reason to press. |
| **G2** | The first faction group is expanded; every other group is collapsed. | `FACTION_ORDER[0]` is `freehold` (`model-catalog.js` **46**), which is also the Freehold Greenhand start the playtest captures use. The player meets a faction they will actually fly against first. |
| **G3** | The selected row is that faction's **first class in `CLASS_ORDER`** — Freehold Compact, Light. | `CLASS_ORDER[0]` is `light`, the cheapest ship in the catalog at a 101 KB mean LOD0 (§1.3). The viewport shows a model immediately without opening on the 486 KB freighter. |
| **G4** | Re-opening **within the same session** restores the last group mode, expansion set, filter text and selection. | The model is already cached, so restoring costs nothing and honours D4 ("re-open must not re-fetch"). This repairs the live reset quirk above. |
| **G5** | A page reload returns to G1–G3. | Session state only; nothing is persisted (§3.1). |
| **G6** | Switching group mode keeps the current selection and expands whichever group now holds it. | The reviewer never loses the model on screen by changing how the list is sorted. Consistent with §3.2. |

First paint under G1–G3 is **22 rows**: 12 faction headers, the "Not a faction"
header, and Freehold's 9 rows (6 ships in `CLASS_ORDER`, 1 station, 1 gate, and
the authored `fh_shepherd` beacon). That is inside budget **P1** (≤ 40) with
room to spare, and it is the number V6 should assert.

### 3.2 Group headers

A header row is a `<button>` with `aria-expanded`, showing the group name, the
faction identity colour as a **swatch plus the faction name in text** (colour is
never the only cue), and the row count. Collapsed by default except the group
holding the current selection, so first paint is 13 headers, not 245 buttons.

### 3.3 Filter

The filter keeps its live substring behaviour and gains two things: it also
matches the faction display name and the class key, and while it is non-empty
every matching group is force-expanded. A filter that matches nothing shows one
`No models match "<text>"` row rather than an empty box.

---

## 4. Pirate variants

One control, applied to the selected row, never a second row.

- A checkbox **`Pirate livery`** sits under the list. When a ship row is
  selected and the box is ticked, the viewer mounts `…:pirate`; otherwise the
  trader bake. The label states what it is — a livery, i.e. a material set.
- The 72 `…:pirate` catalog entries **stay in `MODEL_CATALOG`** and keep their
  ids. `scripts/probe-models.mjs` walks the catalog and must keep proving all
  245 entries build; the sidebar renders the trader row and resolves the pirate
  id on demand. This keeps the headless contract and the browsing surface
  independent.
- The checkbox is disabled with an explanatory title when the selection has no
  pirate counterpart (`ship:player`, and everything outside Ships).
- The same control names the Lamplighter gate hub as **`Hub junction`** when a
  gate row is selected. One variant slot, two labels; not a general variant
  system.
- Switching the variant reuses the current camera pose. It is a re-skin, so
  re-framing would read as a bug.

---

## 5. Role, scale, and lore summaries

### 5.1 Where the copy lives

A new module `src/game/model-lore.js`. It is **derived data transcribed from
`docs/FactionShipDesignBible.md`**, and it is not `state.js`:

```
FACTION_LORE[faction] = { firstRead: string }              // 12 entries, bible §4.1–§5.2
SHIP_ROLE_NAME[faction][classKey] = string                 // 72 entries, bible §4 bullets
CLASS_GRAMMAR[classKey] = string                           // 6 entries, bible §3
```

Rules that make it safe:

- Read-only frozen objects, no functions, no colours, no tuning numbers. Nothing
  here is persisted, so `save.js` `WORLD_FIELDS` is untouched.
- Every lookup is `Object.hasOwn`-guarded and falls back to an empty string. A
  missing key must render a shorter card, never throw.
- Numbers are **never** copied here. Scale text is computed from
  `SHIP_SCALE`/`ship-scale.js` at render time, so the charter stays the single
  source of truth.

### 5.2 The card

The info bar becomes a two-column card, built entirely with `textContent`:

```
Veridian Combine — Cutter                       [trader livery]
Inspection launch
Patrol, boarding, customs, rescue, raiding · fits a large internal berth
Class target 11.0 u (~40 m) · charter band 6.6–15.4 u · measured 12.4 u long
Meshes 3 · Triangles 8,432 · Bounding radius 6.4
Veridian Combine — calm corporate authority, survey precision, modular
extraction hardware.
```

| Line | Source |
|---|---|
| Title | `FACTIONS[faction].name` + capitalised class (not the raw key — repairs §1.5.4) |
| Role name | `SHIP_ROLE_NAME[faction][class]` |
| Role and berth | `SHIP_SCALE[class].role`, `.berth` |
| Scale | `.target`, `.pBand`/`.span`, `UNITS_PER_METRE`; measured span from `measureModel` |
| Stats | live `computeStats` and `measureModel` |
| First read | `FACTION_LORE[faction].firstRead` |

Non-ship rows show the lines they have: a station shows title, faction first
read, and stats; a planet shows title and stats. **The card never shows an empty
labelled line.**

### 5.3 The scale anchor is always readable

`ship:player` is the yardstick (`P = 6.6`, `ship-scale.js` **10–22**). Every
Ships card states the class target in P-relative terms *and* metres, so the
ladder is legible without leaving the selected model. A comparison silhouette is
explicitly **out of this issue** — it needs a second render target and belongs
to a later serial if the owner wants it.

---

## 6. Loading and error state

The single "Loading asset…" line is the issue's "clear loading progress" gap.
Replace it with three signals that cannot disagree:

1. **Row state.** The selected row shows a determinate state word next to its
   label — `loading`, `ready`, or `failed` — plus a matching non-colour glyph.
   Rows whose asset is already cached show `ready` immediately, so a reviewer
   can see what is warm before clicking.
2. **Viewport state.** While a load is pending the viewport shows a centred
   panel: the entry name, `Loading model…`, and a **byte-count line** — the
   class's mean LOD0 size from §1.3 plus the material set — so a 486 KB
   freighter announces itself as slower than a 101 KB scout. The panel is an
   `aria-live="polite"` region.
3. **Background LOD line.** `attachLowerLods` keeps fetching after the model is
   on screen. The card carries a quiet trailing line `Detail levels: 1 of 3`
   that resolves to `Detail levels: 3 of 3`. Today this traffic is invisible,
   which is precisely the ambiguity the issue reports.

Error state keeps the current fail-closed promise and gets text-safe DOM: the
entry name, the message via `textContent`, the word `Failed`, and a `Retry`
button that clears the memoised rejection for that id. One broken sculpt still
must not break the browser.

**Progress bars are out.** `GLTFLoader.loadAsync` exposes an `onProgress`
callback, but the KTX2 texture loads run in parallel and the LOD chain runs
after, so a single bar would be a lie. A determinate state word plus an expected
size is honest and cheap.

---

## 7. Keyboard and accessibility

| Requirement | Design |
|---|---|
| Dialog semantics | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the MODELS title |
| Focus on open | Filter input, as today |
| Focus on close | Restored to `#rw-title-models` (`title.js` **131**). Today focus is dropped |
| **Tab** | A real focus trap over `[close, filter, group tabs, expanded rows, variant checkbox]`, cycling at both ends. This replaces the current dead-Tab behaviour (§1.5.2) |
| `Arrow↑/↓` | Navigate visible rows, skipping collapsed groups. Preserved |
| `Arrow←/→` | Collapse / expand the group of the focused row. New, and the only new keys |
| `Enter` / `Space` on a header | Toggle the group |
| `KeyR` | Reframe. Preserved |
| `Escape` | Close. Preserved |
| Every other key | Still swallowed, so `KeyP` cannot unpause behind the overlay (`main.js` **313**) |
| Live regions | `aria-live="polite"` on the loading/error panel and on the selection card |
| Colour | Faction identity is swatch **plus name**; state is word **plus** glyph |
| High contrast | Extend the existing `body.rw-contrast` block in `models.css` to the new group headers, variant checkbox, and state words |
| Reduced motion | Turntable already frozen. **Add**: freeze the star-shell rotation (§1.5.7) and wrap the `models.css` transitions in a `body.rw-reduced-motion` guard (§1.5.8). Group expand/collapse is instant under reduced motion |
| Text scale | Out of scope. `--rw-text-scale` is scoped to `#hud` (`settings.js` **75–80**); widening it is RW-002's surface, not this issue's |

No new digit binding, no new global key, nothing outside the overlay's own
capture-phase listener.

---

## 8. What stays exactly as it is

Named so a serial does not drift: the private renderer and its session-lifetime
reuse; `configureShipAssets` / `applyShipToneMapping` / `applyShipLighting` /
`addShipLightRig`; the box-fit framing math and its `(1, 0.42, 0.34)` side bias
(`modelsbrowser.js` **553–592** — the comment records why a sphere fit failed);
`OrbitControls` damping and the `safeRadius * 0.02 .. * 60` distance clamps;
`ctx.flags.paused` capture and restore; `ctx.models = { open, close, isOpen }`;
`MODEL_CATALOG` ids; `overlay-policy.js` **86**.

---

## 9. Performance budgets — acceptance limits

The issue's exclusion is "loading every model simultaneously without a measured
budget". These are the measured budgets. Each is a pass/fail line, not a target.

| # | Limit | Value | Why this number | How it is checked |
|---|---|---|---|---|
| P1 | Rows in the DOM at first paint | ≤ 40 | Collapsed groups give 13 (BY FACTION) or 6 (BY TYPE) headers plus one expanded group; the largest expanded faction group is 6 ships + 1 station + 1 gate + landmarks | `document.querySelectorAll('.rw-models-entry').length` on open |
| P2 | Ship asset fetches in flight | ≤ 1 selection chain | Arrow-key scrubbing must debounce (§1.5.6). A held key starts **one** load, for the row still selected when the key settles | Network panel row count during a 2 s `Arrow↓` hold |
| P3 | Selection-to-first-frame, warm cache | ≤ 150 ms | Cached entries mount synchronously today | Manual timing, `performance.now()` around `mountBuilt` |
| P4 | Selection-to-first-frame, cold freighter | ≤ 3 s on a local dev server | 486 KB LOD0 + 52 KB materials | Timed in the verification matrix |
| P5 | Resident ship sculpts | ≤ 24 templates | 24 × the freighter worst case (486 KB) is under 12 MB of GLB against the 27.4 MB full set. Below the ceiling `ship-scale.js` **171–175** already reasons about | `templates.size` in `ship-assets.js` |
| P6 | Resident non-ship models | ≤ 48 built objects | Stations are the heavy tail: 129,364 triangles for `station:ferrous`. 48 mixed objects stays under ~1.5 M triangles | `builtModels.size` |
| P7 | Overlay frame time | ≥ 50 fps on the reference machine with a freighter selected | The loop already renders one model; grouping adds DOM only | Chrome performance record, 10 s sample |
| P8 | Steady-state heap growth | < 5 MB over 60 s idle with a model selected | Catches a leak in the new state words / live regions | `performance.memory` samples |

**No "load everything" affordance is designed, and none may be added.** Walking
the full catalog is possible one row at a time; it is not offered as a button.

---

## 10. Disposal behaviour — acceptance limits

Today nothing is released (§1.5.5). The reference must bound its own footprint.

| # | Rule |
|---|---|
| D1 | `builtModels` becomes a bounded LRU keyed by entry id, capacity **P5/P6**. Eviction removes the object from `modelGroup` and, for a ship root, calls `releaseShipAsset(root)` so the `instances` set in `ship-assets.js` stops handing it background LODs. |
| D2 | **Geometry and materials are never disposed.** They are module-shared across the whole project (`modelsbrowser.js` **36–39**, `ship-assets.js` template cache). Calling `geometry.dispose()` here would break the live game the next time it built the same ship. Eviction drops references only. |
| D3 | The current selection is never evicted. |
| D4 | `close()` releases every root but keeps the renderer, the scene, the star shell and the template caches, exactly as today. Re-open must not re-fetch. |
| D5 | The KTX2 transcoder and `GLTFLoader` are never torn down; `ship-assets.js` owns them and the live game shares them. |
| D6 | Acceptance: open, walk 30 ship rows, close, re-open. `templates.size ≤ 24`, `builtModels.size ≤ 48`, one `WebGLRenderer`, zero console errors. |

---

## 11. Implementation slices

Four PRs. Each is independently shippable and independently verifiable. **The
first slice deliberately contains no new feature**, because the census found
eight live defects and a grouping rewrite on top of dead Tab and `innerHTML`
would be built on sand.

### PR1 — Hygiene and shell (no new browsing)

- Replace all six `innerHTML` sites with `textContent` / `createElement`.
- `role="dialog"`, `aria-modal`, accessible name, `aria-live` on the info bar.
- Real Tab focus trap; restore focus to `#rw-title-models` on close.
- Info bar prints `FACTIONS[faction].name`, not the raw key.
- `reducedMotion` freezes the star shell; `models.css` transitions guarded.
- Boot-test assertions: no `innerHTML` in `modelsbrowser.js`; dialog attributes
  present; `FACTIONS` name used.

### PR2 — Grouping and variants

- `BY FACTION` / `BY TYPE` group modes, collapsible headers, `Arrow←/→`.
- Filter matches faction name and class key; force-expands matches.
- `Pirate livery` / `Hub junction` variant checkbox; the 72 pirate rows leave
  the sidebar and keep their catalog ids.
- Opening and restore state per **G1–G6** (§3.1.1); the live "reset to Ships on
  every open" behaviour goes away.
- Acceptance P1 measured (expect 22 rows at first paint).

### PR3 — Summary card and lore

- `src/game/model-lore.js` (12 + 72 + 6 frozen strings, bible-transcribed).
- The card of §5.2, every line `textContent`, every lookup `Object.hasOwn`.
- Boot-test assertions: every `FACTION_ORDER` faction has a `firstRead`; every
  `faction × CLASS_ORDER` pair has a role name; a bogus key returns `''` and
  does not throw.

### PR4 — Loading, errors, and disposal

- Row state words, the sized loading panel, the `Detail levels: n of m` line.
- `Retry` on failure; memoised rejection cleared.
- Selection debounce (P2) and the LRU of §10.
- Acceptance P2–P8 and D6 measured.

**Bounded first slice for acceptance:** PR1. It is self-contained, repairs named
live defects, adds no player-facing feature, and leaves the catalog untouched.

---

## 12. Verification matrix

Every slice runs `npm run build`, `npm run test:boot` (never weakened), and
`node --import ./scripts/with-css-stub.mjs scripts/probe-models.mjs`, which must
keep reporting **245 entries, 245 built, 0 failures**.

Live browser flows, Chrome, `npm run dev`, console watched throughout:

| # | Flow | Pass condition | Slice |
|---|---|---|---|
| V1 | Title → `[2] MODELS` → `Escape` | Overlay opens and closes; focus returns to `[2] MODELS`; title still paused | PR1 |
| V2 | Tab from the filter input, forward past the last control and back | Focus cycles inside the overlay and never reaches the title | PR1 |
| V3 | Screen reader / a11y tree | Dialog is named; the info bar announces a selection change | PR1 |
| V4 | Settings → Reduced motion on, re-open | Turntable **and** star shell are still; no CSS transition runs | PR1 |
| V5 | Settings → High contrast on | Headers, state words and the variant checkbox all meet the contrast block | PR2 |
| V6 | First open of a session | G1–G3: BY FACTION, Freehold expanded, `Freehold Compact — Light` selected and on screen; 22 rows in the DOM | PR2 |
| V6b | `BY FACTION`, expand Veridian | Six ships in `CLASS_ORDER`, then station, then gate | PR2 |
| V6c | Change mode, select a row, `Escape`, re-open | G4: mode, expansion, filter and selection all restored; no refetch. Then reload the page and confirm G5 returns to Freehold Light | PR2 |
| V7 | `BY TYPE` | Reproduces today's six categories with no row lost; 173 canonical rows | PR2 |
| V8 | Filter `lamp` | Lamplighter group expands and matches; no other group expands | PR2 |
| V9 | Select Ferrous frigate, toggle `Pirate livery` | Livery changes, camera pose unchanged, no refetch of `lod0` | PR2 |
| V10 | Select `ship:player` | Variant checkbox disabled with a reason; card names the scale anchor | PR2/PR3 |
| V11 | Select a station, a planet, a prop | Card shows only the lines that exist; no empty labelled line | PR3 |
| V12 | Cold-load Red Ledger freighter (hard reload first) | Loading panel names the entry and its expected size; P4 ≤ 3 s; `Detail levels` reaches `3 of 3` | PR4 |
| V13 | Hold `Arrow↓` through the Ships group for 2 s | P2: one selection chain in the network panel, not a dozen | PR4 |
| V14 | Force a build failure (temporarily throw in one builder) | `Failed`, the message as text, a working `Retry`; the browser stays usable and every other row still selects | PR4 |
| V15 | Walk 30 ship rows, close, re-open, select a warm row | D6 limits hold; re-open refetches nothing; P3 ≤ 150 ms | PR4 |
| V16 | 60 s idle with a freighter selected | P7 ≥ 50 fps, P8 < 5 MB growth, zero console errors | PR4 |

`out/` screenshots are verification artefacts and are not committed
(`.gitignore` **11**); the PR body carries the numbers.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Grouping hides a row a reviewer used to find by scrolling | `BY TYPE` reproduces today's six categories exactly; the filter force-expands every match |
| The pirate row leaving the sidebar looks like a deleted model | The checkbox is labelled `Pirate livery`, the card names the active livery, and all 245 catalog ids survive for `probe-models.mjs` |
| Transcribing bible copy drifts from the bible | `model-lore.js` carries a header naming the section each string came from; a boot-test assertion pins the key set, not the prose |
| An LRU eviction disposes shared geometry and breaks live flight | D2 forbids `dispose()` outright; eviction drops references only |
| A debounce makes selection feel laggy | Debounce is trailing-edge and applies **only** to entries needing `load()`; `build()` entries stay synchronous |
| The renderer is created lazily and can still fail | `showFatalError` stays; it becomes text-safe in PR1 |

---

## 14. Explicitly parked

- Side-by-side or silhouette scale comparison against the player hull.
- Thumbnails or a grid view (needs offscreen render targets and a cache budget).
- Any new ship model, retexture, or catalog addition.
- Station and gate interior or detail modes.
- Persisting the group mode, the variant toggle, or the last selection.
- Widening `--rw-text-scale` beyond `#hud` — RW-002's surface.
- Repairing the three redundant station pushes in `model-catalog.js` (§2).
