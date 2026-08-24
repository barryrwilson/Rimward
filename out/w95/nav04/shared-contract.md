# NAV-04 galaxy-map hover shared contract

**Wave:** 95. Design only. No NAV-04 feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Nav04HoverDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, or `out/w84/nav01|nav02|nav03/**`.  
**Locked sources:** wishlist Initiative NAV NAV-04; live inventory `out/w95/nav04/current-nav04-inventory.md` (code wins); `src/systems/galaxychart.js`; `src/game/data-trade.js` `standingRead`; `src/game/state.js` `RANK_LADDER` / `rankFor` / `FACTIONS` / `SYSTEMS` (READ-ONLY); Digit 9 copy in `station.js`; Wave 94 `veil`; HUD-01 / NAV-01 / NAV-02 / NAV-03 closed.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 95 is markdown only. Implementation is a later **serial** wave. Do not schedule or land these PRs in `src/` in this wave.
2. `src/game/state.js` stays READ-ONLY. No new `U.*`, no new `RANK_LADDER` rungs, no neighbor tables.
3. Persist: **no** new `WORLD_FIELDS` key. Hover is live session UI. Inventory found no required persist. Default **none**. Do not add `chartHover`, `navHover`, or a visit-fog bag unless a later owner decision authors one.
4. Chart: KeyM stays toggle (suppressed while docked/paused except close). Escape closes. Chart must not pause gameplay and must not call `preventDefault` / `stopPropagation` (wave 21 law in `galaxychart.js`).
5. Hover must **not** write `world.nav`. Must **not** call `plotRoute` / `clearRoute`. Must **not** set `ctx.targets.current`. Must **not** steal KeyV / KeyT. Click-to-plot stays NAV-01.
6. Digit 0–9 stay. Do not steal station overlay digits.
7. `innerHTML` forbidden. `textContent` / SVG attributes / `h()` only. System names and faction names are untrusted for HTML.
8. Galaxy chart must **never** read clue ids/text or landmark discovery (`world.mystery`). Wave 21 law.
9. Jump ownership stays `jump.js` / `gate.js`. Autopilot ownership stays NAV-03. Hover is read-only on `world.nav` (may read dest to avoid covering plot chrome; must not replace dest).
10. HUD-01 empty aim glass stays empty. No power pip. No new flight HUD row. Hover lives **only** on the open KeyM overlay.
11. Do not invent UU, standing deltas, BIO gift/pirate seed, police leave, Unknowables dock law, BIO-04, power ledger, living frigate buy, aim-glass gauge.
12. Do not edit sibling files: `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`.
13. Prototype keys (`__proto__`, constructor, …) must never become hover ids. Reuse `sanitizeSystemId` from `nav.js`.
14. New `ctx.emit` types: **none** for hover. Do not `emit` the hover model (spread smash on `type`).
15. Standing reads **only** `standingRead(ctx.world.reputation, factionKey)` then `rankFor`. No parallel ladder. No `dockReputation` fork.
16. Wave 94 `veil` / Unknowables: if `SYSTEMS[id].faction === 'unknowables'` and the key is in `FACTIONS`, the panel says **Unknowables**, not Independent, not Unknown, not Hollow.

---

## 1. Persist and session

### 1.1 Persist

| Item | Rule |
|---|---|
| New `WORLD_FIELDS` key | **Forbidden** |
| Write `world.nav` | **Forbidden** (hover) |
| Write `world.reputation` | **Forbidden** (hover) |
| `ctx.flags.chartOpen` | Unchanged (NAV-01) |
| Hovered id | Module-local `let` in `galaxychart.js`. **Not** a `ctx` field. **Not** persisted |
| Close / hide chart | Clear hover id, hide panel, drop highlight |

### 1.2 Idle

No hovered hit disc → panel hidden (`is-hidden` or empty `textContent` + hidden). No leftover name from the previous node.

---

## 2. Hover subject

### 2.1 Hit path (same as click)

1. Listener on the **svg** (or each hit disc). Use `pointerover` / `pointerout` (or `pointermove` + hit test). Not native `title`.
2. Target must pass live `isHitDisc`.
3. `id = sanitizeSystemId(el.getAttribute('data-system-id'))`. Fail → treat as no hover.
4. Id must exist in the chart’s `nodesById`. Uncharted / unknown catalog ids never appear.

**Click** stays the existing `click` listener (`galaxychart.js` 540–548). Hover listeners must not call `plotRoute` / `clearRoute` / `tryEngage`.

**Overlap:** topmost hit disc wins (same as click). Pointer across overlapping nodes updates the panel to that disc’s id **immediately**.

**Flicker:** keep the current id until (a) another hit disc is the event target, or (b) the pointer leaves the svg (or all hit discs). Do not hide on `pointerout` of a child if `relatedTarget` is still inside the same hit disc. Do not use delayed native tooltips.

**Leave:** pointer leaves svg → clear.

### 2.2 Keyboard / gamepad

Live chart has **no** node focus and **no** gamepad (`inventory` §1.2).

| Case | Rule |
|---|---|
| Mouse / pointer | Primary. Pointerover hit disc shows the panel |
| Keyboard node picker | **Do not add** Arrow / WASD / typeahead. Chart does not pause (NAV-01 Q4) |
| Header buttons | Tab order unchanged (Clear, Autopilot, Close). Hover must not steal focus |
| Future node focus | If a later wave adds non-mouse chart navigation, it **must** call the same `hoverModel` + paint. Not this serial |
| Gamepad | **None** in `src/` today. Do not invent a binding |

### 2.3 Highlight

Hovered painted node (`.rw-galaxy-node`) gains `.is-hover`. Optional extra SVG ring `.rw-galaxy-hover-marker` (`pointer-events: none`), **not** the current-system marker.

Compose with `.is-current` / `.is-dest` / `.is-hop` / `.is-unreachable`. Hover must not remove plot classes.

Cue is **stroke / extra shape**, not fill-only (same law as current/dest).

Reduced motion: no hover animation. `body.rw-reduced-motion` already kills animations on the overlay.

---

## 3. Panel model (`hoverModel`)

Pure function. No DOM. No persist. Proposed home for a later wave: `src/game/chart-hover.js` **or** a non-exported helper in `galaxychart.js`. Not `state.js`.

```
hoverModel(ctx, id) → null | {
  id: string,
  name: string,
  political: 'unknown' | 'independent' | 'controlled',
  factionKey: string,     // '' when unknown
  factionName: string,    // '' when unknown
  showStanding: boolean,
  rep: number,            // 0 when !showStanding
  rankName: string        // '' when !showStanding
}
```

### 3.1 Id and name

1. `id = sanitizeSystemId(raw)` else `null`.
2. `Object.hasOwn(SYSTEMS, id)` else `null`.
3. `name`: `SYSTEMS[id].name` if non-empty string, else `id`. Strip control chars (`stripControlChars` from `save.js`, same as `nav.js` `systemName`).

### 3.2 Political status (explicit; no silent faction)

Let `key` = `SYSTEMS[id].faction`.

| Condition | `political` | Panel control line |
|---|---|---|
| `key` not a string, reserved, or `!Object.hasOwn(FACTIONS, key)` | `'unknown'` | **Unknown** |
| `key === 'independent'` | `'independent'` | **Independent** |
| else | `'controlled'` | `FACTIONS[key].name` (fallback `key` if name missing) |

**Forbidden as invented tokens:** `Contested` (no live field). **Unclaimed** as a replacement for `hollow` (hollow is a FACTIONS key; show **Hollow Reach**). Owner may later author a SYSTEMS field; until then do not display Contested / Unclaimed.

**Unknowables:** `key === 'unknowables'` → controlled, name `Unknowables`. Do not lie Independent / Unknown / Hollow.

**Neutral:** not a control state. Neutral is the standing rung **Stranger**. Do not print “Neutral” as ownership.

### 3.3 Faction standing

If `political === 'unknown'` or `factionKey === ''`: `showStanding = false`. Standing line **Unknown**. Do not `standingRead` a non-allowlisted key.

Else:

```
rep = standingRead(ctx.world.reputation, factionKey)
rank = rankFor(rep)
showStanding = true
rankName = rank.name
```

`standingRead` missing key → `0` → `rankFor(0)` → **Stranger** (`min: -10`). That matches Digit 9 / yards / law.

**Copy (Digit 9 pane, `station.js` 5675–5676):**

```
${factionName}: ${rankName} (${rep >= 0 ? '+' : ''}${Math.round(rep)})
```

When `political === 'independent'`, `factionName` is `Independent` (the FACTIONS name). Still show standing with key `independent`.

Do **not** add a parallel friendly/neutral/unwelcome/hostile enum in persist. The RANK_LADDER **name** is the label:

| Rung | Player reading (docs only; do not print unless owner asks) |
|---|---|
| Sworn / Trusted / Known | friendly |
| Stranger | neutral |
| Suspect | unwelcome |
| Marked | hostile |

Default UI prints **rung name + signed number**, not the docs-only gloss.

### 3.4 Local / system standing

**Omit the row.** Inventory: no separate bag. Do not invent `0` local standing. Do not duplicate the faction line with a “local” suffix.

If a later owner authors per-system standing, extend this contract then. Not this serial.

### 3.5 Knowledge / unknown

| Source | Hover |
|---|---|
| Uncharted (`!chart` array) | No node → cannot hover → no leak |
| Invalid / reserved id | `sanitizeSystemId` null → no panel |
| Missing / non-FACTIONS `faction` | Control **Unknown**; standing **Unknown** |
| `world.mystery` | **Do not read** |
| Visit fog | **Does not exist.** Do not hide catalog faction that the node color already paints. Do not add a visit persist key |

Unknown is an **explicit string**, never a blank line that implies “no faction”.

### 3.6 Freshness

While the chart is open and a hover id is set, `update()` **rebuilds** the standing line from live `standingRead` / `rankFor`. Do not cache `rep` across frames. Reputation writers elsewhere must show on the next frame without re-entering the node.

Name / political come from `SYSTEMS` (immutable catalog). Re-read them when the hovered id changes; standing every `update` is enough.

---

## 4. Panel chrome (chart only)

### 4.1 Placement (fail-closed)

**Reserved readout** `.rw-galaxy-hover` **below the SVG** and **above** `.rw-galaxy-plot-status` (or beside it if CSS can keep both readable). Compact: system name, control line, standing line.

**Forbidden:** floating tooltip that covers the hovered node, plot strokes, hub routes, legend, or header buttons (Clear / Autopilot / Close).

This matches live plot-status (already below the map) and meets “readable without obscuring the hovered system, nearby route connections, or map controls.”

Do not use `title=` tooltips.

### 4.2 DOM

- `createElement` + `textContent`. Three (or fewer) child nodes, or one `aria-live` region with three lines.
- `role="status"` `aria-live="polite"`. Update `textContent` only when id or standing **text** changes (avoid polite spam).
- Hidden when idle.
- `pointer-events: none` on the readout so it cannot steal the next click. Header buttons stay clickable.
- No `innerHTML`. No untrusted attribute names.

### 4.3 Tokens

Use existing chart CSS variables (`--rw-accent`, `--white`, `--dim`, `--panel`). Honor `body.rw-colorblind`, `body.rw-contrast`, `body.rw-reduced-motion`, `--rw-text-scale`.

Hover stroke must remain distinct from dest (thick solid accent + dest rect), hop (dashed accent), current (white + dashed marker). Suggested: **thin dashed white/accent ring** or extra radius, not the dest square.

### 4.4 Copy skeleton (static labels; values via textContent)

```
<name>
Control: <Unknown | Independent | factionName>
Standing: <Unknown | Digit-9 line>
```

English labels are authored literals. Values are catalog / standing strings.

---

## 5. Interaction with NAV-01 / 02 / 03

| Actor | Hover may | Hover must not |
|---|---|---|
| `plotRoute` / `clearRoute` | — | Call them |
| `world.nav` | Read (optional, paint compose) | Write dest/path/status/autopilot |
| Click on hit disc | Leave existing click handler | `preventDefault`, `stopPropagation`, delay click |
| Autopilot button | — | Cover it; change its label |
| NAV-02 HUD | — | Add aim-glass chrome |
| KeyV / KeyT | — | Bind or write lock |
| `targets.current` | — | Assign |

Hover-to-inspect is not plot. Click still plots (or clears current).

---

## 6. Security

- `innerHTML` forbidden.
- `sanitizeSystemId` on every `data-system-id`.
- `standingRead` only with keys that passed `Object.hasOwn(FACTIONS, key)` (already inside the helper).
- Do not assign untrusted strings as SVG attribute **names**. Literal attr maps only.
- No new `localStorage` key. No new `WORLD_FIELDS` key.
- Do not emit hover payloads.
- Do not read `world.mystery`.
- Uncharted systems stay absent.
- Names via `textContent` after control-char strip.

---

## 7. Ownership (later impl)

| Module | Owns |
|---|---|
| Proposed `src/game/chart-hover.js` (or helper in `galaxychart.js`) | `hoverModel` only. No DOM. No persist |
| `galaxychart.js` | Pointer hover, `.is-hover`, reserved panel, clear on close |
| `ui/hud.css` | `.rw-galaxy-hover*`, `.is-hover` |
| `data-trade.js` `standingRead` | Unchanged reader |
| `state.js` | READ-ONLY `RANK_LADDER` / `rankFor` / `FACTIONS` / `SYSTEMS` |
| `nav.js` | Unchanged plot writers; export `sanitizeSystemId` already |
| `save.js` | **No** new key |
| `hud.js` | No NAV-04 layout |
| `controls.js` | Unchanged `chartOpen` LMB gate |

---

## 8. Serial PR plan (later wave — named only)

Do **not** land these in Wave 95.

1. **PR1** `hoverModel` pins: sanitize id; Independent / Unknown / controlled; Unknowables `veil`; hollow shows Hollow Reach; missing reputation key → Stranger 0; reserved faction key → Unknown; Digit 9 standing format; no mystery import. No UI.
2. **PR2** Chart pointerover/out on hit discs; `.is-hover`; reserved `.rw-galaxy-hover` panel; `textContent`; clear on close; **click still plots**; no `preventDefault`.
3. **PR3** Overlap (topmost disc); flicker (sticky id until leave svg); panel hidden idle; does not cover header controls; reduced-motion / contrast / colorblind; `aria-live` without spam.
4. **PR4** Fresh standing while hovered (mutate `world.reputation` in a pin, panel updates next `update`); dest/hop/current classes survive hover; hover does not write `world.nav`.

---

## 9. Non-goals (locked)

- No Wave 95 `src/` edits.
- No NAV-01 plot math reopen. No NAV-02 marker art. No NAV-03 AP reopen.
- No visit-fog persist. No contested field. No unclaimed remap of `hollow`.
- No local standing number.
- No `state.js` write. No standing deltas. No UU.
- No aim-glass pip. No power pip.
- No keyboard node picker. No gamepad bind.
- No native `title` tooltips.
- No `ctx.emit` for hover.

---

## 10. Fail-closed owner defaults (until owner answers)

See brief “Open owner questions”. Defaults **in this contract**:

| Q | Default |
|---|---|
| New persist key | **None** |
| Panel placement | **Reserved strip below SVG** (not a floating tooltip) |
| Local standing row | **Omit** (not tracked) |
| Contested / Unclaimed tokens | **Do not display** (no live field; hollow = Hollow Reach) |
| Visit fog | **None** (do not hide catalog faction already on the node color) |
| Keyboard node picker | **No** |
| Standing copy | **Digit 9 pane format** |
| Extra friendly/hostile gloss words | **No** (RANK_LADDER name is the label) |
| `ctx.emit` | **None** |
