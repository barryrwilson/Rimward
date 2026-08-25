# Wave 120 census — P2 NAV/A11Y Galaxy Chart labels vs hit discs vs keyboard

**Census time:** 2026-08-25. **Code wins.** Line numbers are 1-based from live `src/` at this census. Later PR1 **must re-census** `galaxychart.js` again before edit.

**Leftover:** **REAL.** Labels do **not** activate systems. Plot depends on invisible mouse-only SVG hit discs. Hits and labels have **no** accessible name, **no** keyboard focus, and **no** searchable destination list. Serial **PR1 chart-label**. **Not CONSUME.**

**Not this leftover:** CTL-01 KeyJ. Overlay hail/chart/berth mutex. NAV-05 `showApLive` rewrite. P1 toast-flood (Wave 120 sibling). P2 close-chart-on-AP (Wave 120 sibling **PR1 chart-close-on-AP** writes Autopilot **button** success `setOpen(false)` only — **do not** census that branch as this leftover). HUD-01 hub. HUD-02 combat rails.

**Sibling snapshot (forbidden to this leftover):** Autopilot **button** click / `tryEngage` / success `showApLive('')` / later sibling `setOpen(false)` on empty token. Do **not** treat stay-open vs close-on-AP as this leftover. Snapshot label / hit / keyboard facts that sibling is **forbidden** to touch.

Reduced coverage: **no live click**. Census is code + inventory. `[NO BROWSER COVERAGE]`.

---

## 1. Verdict table

| Question | Live | Cite |
|---|---|---|
| Labels activate their systems? | **NO** | `.rw-galaxy-label` `pointer-events: none` (`hud.css` **2126–2132**). Labels have **no** `data-system-id`. Click handler returns unless `isHitDisc` (`galaxychart.js` **659–661**). |
| Hit discs small / invisible / mouse-only? | **YES** | Build `fill: transparent` `fill-opacity: 0` (`272–279`). CSS fill transparent (`hud.css` **2110–2115**). Radius starts `NODE_R = 8` then `HIT_CSS_DIAMETER = 24` CSS px on open (`43–46`, **443–460**). Click and hover require `isHitDisc` only (**659–676**). No `tabindex`. No key handler on discs. |
| Accessible names on systems? | **NO** on nodes/hits/labels | Hits: class + `data-system-id` only (**272–279**). Labels: `textContent = sys.name` for a **subset** only (**283–290**); no `aria-label`. SVG `role='img'` (**195–201**) presents the map as one image. |
| Keyboard focus among systems? | **NO** | Window keydown is KeyM / Escape only (**698–713**). Tab order is header buttons (Clear / Autopilot / Close) only (**133–163**). Hits and labels are not focusable. |
| KeyM close skips dest typing? | **NO** (live hole for later dest `<select>`) | Open: **always** `setOpen(false)` (**700–704**). `playSurfaceBlocked` / `isTypingFocus` gate **open** only (**705–708**). `isTypingFocus` includes `SELECT` (`overlay-policy.js` **72–80**) but chart does **not** import it (**5**). |
| Searchable destination list? | **NO** | No `<select>`, `<input>`, datalist, or listbox of systems in `galaxychart.js`. |
| Unlabeled generated systems plotable by label? | **NO** | Labels only if `AUTHORED_IDS` or `PINNED_IDS` or `sys.hub` (**283**). Authored **7** + pinned **5** (+ hubs already in authored). `state.js` **580–583**: authored lane + **94** generated. Generated charted nodes have discs, **no** labels. |
| CONSUME? | **NO** | Inbox still live. Serial is **not** none. |

---

## 2. Inbox (cite, do not edit wishlist)

`docs/PLAYER-EXPERIENCE-WISHLIST.md` **65–69**:

> IDEA (P2, NAV/A11Y): Galaxy-chart labels are not clickable and route
> plotting depends on small invisible mouse-only SVG hit discs; make labels
> activate their systems, enlarge the effective targets, add accessible names
> and keyboard focus, and provide keyboard navigation or a searchable
> destination list.

Inbox is **INBOX**, not shipped. Census does **not** CONSUME.

---

## 3. Galaxy chart labels / hits / keyboard (`src/systems/galaxychart.js`)

Header **24–31**: KeyM toggle; chart **does not pause**; **does not intercept** key or pointer events (flight keys keep working). Close control is a real `<button>` in tab order. **Click a charted hit disc** to plot. Hover a **hit disc** to inspect. Hover does not plot.

`NODE_R = 8` (**43**). `HUB_RING_R = 15` (**44**). `HIT_CSS_DIAMETER = 24` (**46**).

`isHitDisc` (**77–85**): `getAttribute('class')` split; true iff a part equals `'rw-galaxy-hit'`. **Not** labels. **Not** painted nodes.

Root dialog **110–117**: `role='dialog'` `aria-modal='false'` `aria-labelledby` title `aria-describedby` desc. Gameplay continues underneath.

Header actions **133–163**: `Clear route` button (**133–136**, no `aria-label` — visible `textContent`). Autopilot button named (**148–154**). Close `aria-label` Close galaxy chart (**156–160**). **No** destination field.

Desc **170–173**: “Click a system to plot a route. M or Escape closes.” Copy does **not** mention labels or keyboard pick.

SVG **195–201**: `role='img'` `aria-label` `Map of ${ids.length} rim systems and their gate connections`. Children are typically presentational to AT.

Nodes (**256–263**): `circle.rw-galaxy-node` with `data-system-id`. CSS `pointer-events: none` (`hud.css` **2072–2077**). **Not** a hit.

Hits (**272–280**): `circle.rw-galaxy-hit` `cx/cy` same as node, `r: NODE_R` at build, `fill: transparent`, `fill-opacity: 0`, `pointer-events: all`, `data-system-id`. **No** `tabindex`. **No** `role`. **No** `aria-label`. **No** `<title>`.

Labels (**283–291**): only `AUTHORED_IDS` (**52**) ∪ `PINNED_IDS` (**53**) ∪ `sys.hub`. `text.rw-galaxy-label` `text-anchor=middle` at `(x, y + HUB_RING_R + 16)`. `textContent = sys.name ?? id`. **No** `data-system-id`. **No** `tabindex`. **No** `role`. **No** click listener.

Layer order **293–295**: `nodeLayer`, then `hitLayer`, then `labelLayer` (labels paint **on top** of discs). Labels `pointer-events: none` so discs still receive the mouse **through** the glyph.

`hitRadiusChart` / `updateHitRadii` (**443–460**): on open (**431**) and resize (**699–701**) set every `rec.hit` `r` to `max(NODE_R, 12 / scale)` so the disc is **24 CSS px** diameter. Invisible. Still mouse-only.

Click (**659–668**) — leftover plot path:

```
svg click → isHitDisc(t) else return
id = sanitizeSystemId(data-system-id)
id === currentSystem → clearRoute else plotRoute
retargetPlot(true)
```

Pointerover (**670–676**): same `isHitDisc` gate; `applyHoverId`. NAV-04 hover. **Do not rewrite** `hoverModel`. Later label activate **may** share a plot/hover target helper; must **not** call `plotRoute` on hover.

Window keydown (**698–713**): `KeyM` — if `open` then **always** `setOpen(false)` (**700–704**); else open if not docked/paused and not `playSurfaceBlocked` (**705–708**). `Escape` close (**710–712**). **No** `isTypingFocus` on close. **No** arrow/tab among systems. **No** typeahead dest. Does not `preventDefault` / `stopPropagation` (header **24–27**). Later dest `<select>` typeahead **M** would close the map unless PR1 adds the frozen skip on this **same** handler.

`sanitizeSystemId` / `plotRoute` / `clearRoute`: `nav.js` **30–36**, **271–300**. Uncharted / unknown dest fail closed. Current dest clears. **Do not rewrite** BFS. Later PR1 **calls** these.

`innerHTML` in this file: **none** (grep 0). `svgEl` uses `setAttribute` (**61–65**). Copy uses `textContent`. Keep.

`svgEl` iterates `Object.entries(attrs)` (**63**). Attr objects at build are authored literals. Later must **not** `for-in` a save blob into attrs.

---

## 4. CSS (`src/ui/hud.css`)

`.rw-galaxy-chart` **1899–1916**: `z-index: 30`; `inset: 0`; dim `0.82`. Overlay sibling owns stacking. **Do not raise z.**

`.rw-galaxy-node` **2072–2077**: `pointer-events: none`.

`.rw-galaxy-hit` **2110–2115**: transparent fill; `cursor: pointer`; `pointer-events: all`. Invisible disc.

`.rw-galaxy-label` **2126–2132**: `fill: var(--dim)`; `font-size: 15px`; `pointer-events: none`. **Not clickable.** Contrast restyle **2252–2254**.

Header buttons `:focus-visible` **2002–2012**. Hits/labels have **no** focus style (not focusable).

`body.rw-reduced-motion` **2265–2268**: zeros chart animation. Do **not** add a new motion rule for labels.

---

## 5. Catalog size (why labels-only is not enough)

| Bag | Live | Cite |
|---|---|---|
| Authored systems | **7** (`freehold` … `veil`) | `authored-systems.js` **31–234**; `AUTHORED_IDS` **52** |
| Generated | **94** | `state.js` **580–583** |
| `SYSTEMS` merge | authored then generated | `state.js` **583** |
| Pinned specials | 5 ids | `PINNED_IDS` **53** |
| Hubs with labels | authored hubs (`hub:` in authored-systems) | already inside authored 7 |
| Charted nodes | every `SYSTEMS[id]` with `chart` array | loop **251–292** |
| Visible labels | authored ∪ pinned ∪ hub | **283–291** ≈ **12** names |
| Unlabeled plot targets | generated charted discs | **94** minus any generated hub/pin overlap |

A later PR that **only** makes the 12 labels clickable still leaves generated destinations **mouse-disc-only** with **no name** and **no keyboard**. Inbox asked labels **and** names/keyboard **or** a searchable list. Census treats that as **one leftover**. Deputize the **smallest additive** that unblocks play + a11y: labels plot **plus** one named HTML destination `<select>` for **all charted** systems. Do **not** require SVG roving tabindex as PR1.

---

## 6. Sibling snapshot — Wave 120 PR1 chart-close-on-AP (do not steal)

Re-census at freeze. Sibling **may** insert `setOpen(false)` on the empty-token branch. **Do not** treat that insert as this leftover. **Do not** fight it.

| Symbol | Live at this census | This leftover |
|---|---|---|
| Autopilot click | **633–650** `tryEngage`; token → `showApLive(line)` + `commLine`; empty → `showApLive('')`; **no** `setOpen(false)` yet | **Do not edit** this branch |
| `showApLive` | **586–590** `textContent` only; `#rw-galaxy-ap-live` **137–142** | **Do not rewrite** |
| Cancel while open | **635–639** `disengage` + `showApLive(apLine('cancel'))` | **Do not edit** |
| Fly disengage | **727–737** `autopilotDisengaged` → `showApLive` | **Do not edit** |
| `setOpen` open-gate | **421–441** `canOpenPlayCard`; close blurs `activeElement` in root | **Do not rewrite** mutex. Later dest `<select>` must **not** block sibling blur-on-close |
| KeyM / Escape | **698–713** | Keep bind. **No** new KeyM listener. **No** remap. Later PR1 **does** add `isTypingFocus` skip on this **existing** close branch |
| Overlay helper | import **5**; `playSurfaceBlocked` **705–708** (open only) | **Do not write** `overlay-policy.js`. Later **call** `isTypingFocus` on close |
| WAVE117 stay pins | sibling chart-close later retunes **button** success | **Do not** retune from this leftover |

---

## 7. Sibling snapshot — Wave 120 PR1 toast-flood (do not steal)

| Symbol | This leftover |
|---|---|
| `hud.js` `pushToast` / linger | **none** |
| `save.js` `saveBlocked.source` | **none** |
| Extra `commLine` on label plot | **Forbidden** — `plotRoute` / `clearRoute` already emit (`nav.js` **275**, **294**, **299**) |
| Toast z | **Do not raise** |

---

## 8. Honor (live; do not steal)

| Surface | Live | This leftover |
|---|---|---|
| HUD-01 empty 80 px hub | `hud.css` aim glass | No dest pip on `.rw-reticle` |
| Digit 0 shipyard | station Digit map | **No new Digit** |
| Digit 8/9 | dock launch / epics | Stay |
| KeyM | chart toggle **682–693** | Stay |
| KeyJ | `controls.js` **302–304** `pendingDock` | Cite. Do **not** remap. Do **not** edit `controls.js` |
| NAV-05 `showApLive` | **586–590** | Cite. Do **not** steal |
| Overlay mutex | `overlay-policy.js`; chart z 30 | Do **not** raise z. Do **not** skip hail flush |
| `state.js` | `SYSTEMS` / `FACTIONS` import **1** | READ-ONLY later |
| Persist | `flags.chartOpen` session; `WORLD_FIELDS` has `nav` not chart-focus | **No** new key. **No** persist of dest `<select>` / focus |
| `innerHTML` | none in galaxychart | Keep none |

---

## 9. What already exists (do not undo)

| Mechanism | Leftover? |
|---|---|
| 24 CSS px hit disc on open | **Partial.** Size meets WCAG 2.5.8 number; still **invisible** and **mouse-only**. Inbox “small invisible” still live. Do **not** “fix” by growing discs over Autopilot / Close / overlay |
| NAV-01 `plotRoute` / `clearRoute` | **No** — call it |
| NAV-04 hover on discs | **No** — keep; do not plot on hover |
| Header Clear / AP / Close in tab order | **No** — keep |
| SVG `role=img` map name | **Keep** as the map summary. Do **not** turn ~100 circles into a tab trap as required PR1 |
| `sanitizeSystemId` proto-safe | **Keep** — dest list values must pass it |

There is **no** label click. There is **no** dest `<select>`. There is **no** system `tabindex`.

---

## 10. Proof (code wins — leftover REAL)

| Sequence | Live result |
|---|---|
| Click “Freehold Drift” glyph | Pointer falls through (`pointer-events: none`). Plot only if the invisible disc under the **node** is hit — **not** the label offset `y + 15 + 16` |
| Tab through open chart | Title is not a control. Tab hits Clear → Autopilot → Close. **Zero** systems |
| Keyboard user, generated dest | Cannot name or reach the disc. Must use a mouse on a 24 CSS px invisible circle |
| Screen reader | One `role=img` map. Hover readout `role=status` is pointer-driven (**314–318**, **670–676**). System names on labels are not a control list |
| Screen reader + hover | Hover needs a mouse on `isHitDisc`. Keyboard never fires `pointerover` |

Invisible mouse-only discs plus non-activating labels are **not** a feature. Treating 24 CSS px discs as CONSUME would leave generated destinations unnamed and unkeyboardable.

---

## 11. Verdict

**Leftover is real. Not CONSUME. Serial is not none.**

Named later serial: **PR1 chart-label**.

If a later census finds (a) labels activate the same `plotRoute` / `clearRoute` path as discs, (b) effective target includes the label box without stealing overlay / AP close, **and** (c) a named keyboard destination list covers **all charted** systems, re-open this leftover as CONSUME. Census today does **not**.
