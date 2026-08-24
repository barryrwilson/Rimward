# NAV-04 live galaxy-chart hover inventory

**Wave:** 95. Design only. Code wins over stale Wave 84 line numbers.  
**Scope:** What the KeyM chart, standing helpers, RANK_LADDER, and knowledge bags do **today**.  
**Not this wave:** any edit under `src/`. Do not edit sibling Nav briefs, the wishlist, or `PROGRESS.md`.

---

## 1. Galaxy chart module

**File:** `src/systems/galaxychart.js` (602 lines). Init `initGalaxyChart(ctx)` at 87. Returns `{ update }`.

### 1.1 What it paints

| Surface | Live | Cite |
|---|---|---|
| Overlay | DOM/SVG dialog, built **once** from `SYSTEMS` / `FACTIONS` | 4–10, 87–312 |
| Geometry | `system.chart` `[x,y]`; viewBox = data bbox + `MARGIN` 80 | 12–14, 38, 90–104, 191–197 |
| Painted node | `circle.rw-galaxy-node` `NODE_R` 8 | 39, 252–259 |
| Faction color | `--rw-node-color` from `FACTIONS[sys.faction].color`; fallback `FACTIONS.independent` gray `0x9aa7b8` | 51–55, 251–258 |
| Attributes | `data-system-id`; `data-faction` = `sys.faction ?? 'independent'` | 255–256 |
| Hub ring | `HUB_RING_R` 15, `pointer-events` none in CSS | 40, 261–266; `hud.css` 1831–1837 |
| Hit disc | `.rw-galaxy-hit`, filled transparent, `pointer-events: all`, `data-system-id` | 73–80, 268–276, 540–543 |
| Hit floor | Diameter ≥ **24 CSS px** from live viewBox × CSS size | 42, 325–342 |
| Labels | Authored seven + hubs + pinned specials only | 48–49, 279–287 |
| Authored ids | `freehold`, `veridian`, `redmarch`, `hollowreach`, `hush`, `verge`, **`veil`** (Wave 94) | 48 |
| Pinned | `stolenwomb`, `lastbeacon`, `blackstation`, `fx_bastion`, `gc_auction` | 49 |
| Uncharted | Skip if `chart` is not an array. **No node, no hit, no label** | 94–95, 181, 249 |
| Mystery | Header law: clue ids/text and landmark discovery are **NEVER** read | 16–21 |
| `innerHTML` | **none** in this file | grep 0 |
| Hover / tooltip | **none** (`pointerenter` / `mouseover` / `title` absent) | grep 0 |

Paint order (bottom → top): gates → hub routes → plot overlay → painted nodes + hub rings → **hit discs** → labels → current marker (238–299).

### 1.2 Open / keys / pointer

| Rule | Live | Cite |
|---|---|---|
| KeyM | Toggle. Open only if `!docked && !paused`. Close always | 551–561 |
| Escape | Closes | 559–560 |
| `preventDefault` / `stopPropagation` | **Not called** on keydown or click | 551–561, 540–549 |
| Pause | Chart does not set `ctx.flags.paused` | 23–26, 108–113 `aria-modal=false` |
| Docked | `update()` closes if `open && docked` | 573 |
| Session flag | `ctx.flags.chartOpen` in `setOpen` | 317–319; `ctx.js` 206 |
| LMB fire | `controls.js` sets `fireHeld` false while `chartOpen` | `controls.js` 436–438 |
| Click verb | Hit disc → `sanitizeSystemId` → current **clears**, else **`plotRoute`** | 540–548 |
| Autopilot | Header button; `tryEngage` / `disengage`; does not plot | 143–150, 515–531 |
| Keyboard node pick | **None** (no Arrow, no tabindex on nodes, no gamepad) | 551–561; grep `gamepad` in `src/` = 0 |
| Tab order | Real buttons: Clear route, Autopilot, Close | 129–156 |

### 1.3 Plot / hover collision surface

Click lives on `svg` `click` and requires `isHitDisc` (540–543). Hover does **not** exist. A later hover listener on the same hit discs can share `data-system-id` without changing the click path.

`world.nav` is **read** for plot paint and AP button (344–513). Chart does not write the bag except via `plotRoute` / `clearRoute` / AP helpers.

### 1.4 CSS (`src/ui/hud.css`)

| Class | Role | Cite |
|---|---|---|
| `.rw-galaxy-chart` | Full-screen scrim, `z-index` 30 | 1620–1638 |
| `.rw-galaxy-chart-panel` | `min(1100px, 92vw)` × `min(760px, 88vh)` | 1642–1652 |
| Header actions | Clear / Autopilot / Close | 1654–1734 |
| `.rw-galaxy-node.is-current` | White thick stroke | 1801–1804 |
| `.is-hop` / `.is-dest` / `.is-unreachable` | Plot states | 1806–1822 |
| `.rw-galaxy-hit` | Cursor pointer | 1824–1829 |
| Plot / rings / labels / marker | `pointer-events: none` | 1764–1768, 1798, 1837, 1845, 1856 |
| `.rw-galaxy-plot-status` | Below SVG, `aria-live` polite | `galaxychart.js` 301–304; CSS 1903–1911 |
| Colorblind / contrast | Body classes retoken the chart | 1915–1942 |
| Reduced motion | Kills animation/transition on the overlay | 1944–1948 |

There is **no** `.is-hover` and **no** hover panel class.

---

## 2. Catalog: systems and factions

### 2.1 Merge

`SYSTEMS = { ...AUTHORED_SYSTEMS, ...GENERATED_SYSTEMS }` (`state.js` 576).

Authored seven (`authored-systems.js`):

| Id | Name | `faction` |
|---|---|---|
| `freehold` | Freehold Drift | `freehold` |
| `veridian` | (Veridian) | `veridian` |
| `redmarch` | (Red March) | `redledger` |
| `hollowreach` | Hollow Reach | `hollow` |
| `hush` | The Hush | `hollow` |
| `verge` | (Verge) | `hollow` |
| `veil` | The Veil | **`unknowables`** (Wave 94). Station **The Quiet** |

Generated (`galaxy.generated.js`) faction counts (runtime probe): freehold 19, veridian 17, ferrous 17, redledger 11, gilded 8, beautiful 3, congregation 3, assembly 2, **independent 13**, lamplighter 1. **No** generated `hollow` or `unknowables`.

Every painted node has a `chart` array. Uncharted records are not in the SVG.

### 2.2 `FACTIONS` allowlist (`state.js` 584–599)

`freehold`, `redledger`, `veridian`, `hollow`, `independent`, `ferrous`, `gilded`, `beautiful`, `congregation`, `assembly`, `lamplighter`, `unknowables`.

Comments: `hollow` is the deep-rim **unclaimed** *key* for EPICS, but it is still a **faction record** with a reputation key. It is not a separate political enum.

### 2.3 Political fields that do **not** exist

Grep of `src/` for `contested` as a system/political field: **none** (wishlist word only).  
No `political`, `unclaimed` (as a SYSTEMS field), `neutral` (as control), or per-system standing bag.

Control today is **one string**: `SYSTEMS[id].faction`.

---

## 3. Standing (canonical)

### 3.1 Ladder (`state.js` 707–717)

```
RANK_LADDER = [
  { min: 50, name: 'Sworn',    tier: 3 },
  { min: 25, name: 'Trusted',  tier: 2 },
  { min: 10, name: 'Known',    tier: 1 },
  { min: -10, name: 'Stranger', tier: 0 },
  { min: -25, name: 'Suspect',  tier: -1 },
  { min: -1000, name: 'Marked', tier: -2 },
]
rankFor(rep): first rung with rep >= min; else last rung.
```

Do **not** use stale Wave 73 cites (`state.js` 672–678). Live is **707–717**.

### 3.2 Read helper

`standingRead(bag, faction)` in `src/game/data-trade.js` 72–81:

- Non-object / array bag → `0`
- Non-string / empty faction → `0`
- `reservedId(faction)` → `0`
- `!Object.hasOwn(FACTIONS, faction)` → `0`
- Missing own key → `0`
- Non-finite number → `0`

This is the helper yards, law, missions, restitution, Digit 9, and kill-standing already import.

`shipyard.js` `dockReputation` (102–108) is a **narrower** twin (missing key → 0, no FACTIONS allowlist). NAV-04 must **not** fork a third reader. Use `standingRead`.

### 3.3 Digit 9 / dock copy (match this)

Digit 9 is Standing (`DOCK_KEY_SERVICES` last-but-shipyard; `station.js` 186, 1623, 5801).

Standing pane (`station.js` 5668–5676):

```
${fname}: ${rank.name} (${rep >= 0 ? '+' : ''}${Math.round(rep)})
```

Dock root rank line (`station.js` 5808–5810) adds a ` rep` suffix. **NAV-04 matches the Digit 9 pane** (no `rep` suffix).

`fname` = `FACTIONS[key].name` via `factionDisplayName` (`station.js` 1101–1106) which requires `Object.hasOwn(FACTIONS, key)`.

### 3.4 Persist

`WORLD_FIELDS` includes `'reputation'` and `'nav'` (`save.js` 76–100).  
`sanitizeReputation` allowlists `FACTIONS` keys, drops reserved / non-finite (`save.js` 918–938).

Default bag (`ctx.js` 152): `{ freehold, redledger, veridian, hollow }` at `0`. Other banners (including `independent`, `unknowables`) are **missing until written**; `standingRead` then returns `0` (Stranger).

### 3.5 Local / system standing

`offendedFaction(systemId)` (`restitution.js` 7–12) returns `SYSTEMS[systemId].faction` if it is a FACTIONS key. Restitution and Digit 9 then `standingRead` **that faction**. There is **no** `world.systemStanding` / per-id reputation table.

**Inventory freeze:** local standing is **not** tracked separately. Hover must not invent a second number.

### 3.6 Writers (do not invent deltas)

Existing writers: mining/patrol/rescue/sale/graft/restitution/kill-standing/BIO. NAV-04 is **read-only** on reputation.

---

## 4. Exploration / knowledge

| Bag | What it tracks | Chart today |
|---|---|---|
| `world.mystery.found` | Clue ids | **Must not read** (wave 21; `galaxychart.js` 16–21) |
| `world.mystery.charted` / `visited` | **Landmarks**, not systems (`hud.js` 32–36, 1525–1533) | Must not read |
| System visit list | **Does not exist** (grep `visitedSystem` / `knownSystems` = 0) | — |
| Chart fog | **None.** Every `chart` array becomes a node at init | 247–288 |
| Node color | Already paints controlling faction for **all** charted systems | 251–258 |

“Unknown” in live nav is an **id fail-closed** (`nav.js` `sanitizeSystemId` 30–36; `systemName` fallback `'unknown'` 63–69), not a fog-of-war flag.

Uncharted systems never appear. Hover cannot leak them because they have no hit disc.

---

## 5. Wave 94 veil / Unknowables

| Fact | Live |
|---|---|
| System `veil`, name `The Veil`, faction `unknowables` | `authored-systems.js` 234–237 |
| Station `The Quiet` | 243 |
| Chart label | `veil` in `AUTHORED_IDS` (`galaxychart.js` 48; `out/w94/unk/chart-note.txt`) |
| Standing | `standingRead(bag, 'unknowables')`; hostile Archive when `< 0` (`station.js` 1194–1196) |
| Not independent, not hollow | Distinct FACTIONS key (`state.js` 598) |

Hover must not paint Unknowables as Independent, Hollow, or a silent empty panel.

---

## 6. Closed neighbors (do not reopen)

| Feature | Status |
|---|---|
| NAV-01 plot | Live `plotRoute` / `clearRoute` / `world.nav` |
| NAV-02 guidance | In-flight; not the chart hover |
| NAV-03 autopilot | Chart Autopilot button; restore never resumes |
| HUD-01 aim glass | Empty; no power pip; hover stays on the chart overlay |
| KeyV / KeyT | Untouched. Click-to-plot must not become hover-to-plot |
| Digit 0–9 | Chart closed while docked |
| `state.js` | READ-ONLY for later impl |

---

## 7. Gaps vs wishlist NAV-04

1. **No hover panel.** Pointer across nodes does nothing except the CSS `cursor: pointer` on hits.
2. **No hover highlight** distinct from dest / hop / current.
3. **No standing readout** on the map. Digit 9 is dock-only.
4. **Generated nodes have no name labels** (only authored/hub/pinned). Hover is the natural name surface for the rest.
5. **Keyboard/gamepad node focus does not exist.** NAV-01 already defaulted “no arrow picker” because the chart does not pause.
6. **Contested / unclaimed political enum does not exist.** Independent is a faction key. Hollow is a faction key with unclaimed *flavor* in comments.
7. **No local standing row to show.**

---

## 8. Security-relevant live facts

- `svgEl` assigns `Object.entries(attrs)` (`galaxychart.js` 57–60). Later hover must pass **literal** attr maps.
- `ctx.emit` spreads data (`ctx.js` 231–232). Hover should **not** emit the model object.
- Prototype ids: reuse `sanitizeSystemId`.
- System names are world strings: `textContent` only.
- Standing keys: `standingRead` allowlist only.
