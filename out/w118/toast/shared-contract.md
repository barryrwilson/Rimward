# HUD-04 leftover toast-flood shared contract

**Wave:** 118. Design only. No toast-window or save-source tag ships in this wave.  
**Status:** MERGE LAW for `docs/Hud04ToastFloodDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1 toast-flood** (named only).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl02OverlayDesign.md`, `docs/Ctl01DockBindDesign.md`, `docs/Nav05HandoffDesign.md`, `docs/Nav*.md`, `docs/Hud02*`, `docs/Hud03*`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave118.md`. Do not steal sibling Wave 118 paths (`out/w118/overlay/**`, `out/w118/chartclose/**`). Do not steal `out/w117/**` or `out/w116/**`.  
**Locked sources:** wishlist IDEA (P1, FEEDBACK) autosave-refusal / encounter-line flood (**cite, do not edit**); live inventory `out/w118/toast/current-toast-inventory.md` (code wins); HUD-01 empty 80 px hub; Digit 0/8/9; CTL-01 KeyJ (**cite, do not remap**); NAV-05 `showApLive` (**cite, do not steal**); Wave 118 overlay sibling hail/chart/berth mutex (**cite, do not steal**; **do not raise toast z-index**; **do not add hail toasts**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale HUD-utility copy that still says toasts sit top-center on the aim column (live `.rw-toasts` is top-right, `hud.css` 635–646).

**This leftover is one toast-channel time-window for identical copy plus autosave-vs-manual save-block copy.** It is **not** CTL-01 KeyJ. It is **not** NAV-05 AP handoff. It is **not** P2 close-chart-on-AP. It is **not** P2 chart-label a11y. It is **not** CTL-02 overlay-priority. It is **not** HUD-02 combat rails. It is **not** HUD-03 `hudAlerts`.

**Live flood:** `TOAST_SLOTS = 5`, `TOAST_LIFETIME = 4`. `pushToast` only refreshes while a slot is still visible. Autosave idle retry is `BLOCK_RETRY = 5` s and re-emits `saveBlocked`. Autosave and berth share `'▲ SAVE BLOCKED — ' + reason`. Same-frame `mem.frameLines` is **not** a time window. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No toast pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Digit 0 stays shipyard. Digit 8 dock root stays launch. Digit 9 dock root stays epics.
3. KeyH stays hail. KeyM stays chart. KeyL stays berth. KeyP stays pause. KeyO stays settings. **Do not remap those keys.** CTL-01 **KeyJ** is a sibling dock/jump bind — **cite, do not remap**.
4. `innerHTML` forbidden later. Toast copy uses `textContent` only (live `pushToast` already `slot.el.textContent = text`, `hud.js` 1169). **No** `insertAdjacentHTML` / `document.write`. Live `el()` already uses `textContent` (`hud.js` 282–287).
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Kit mutate omit. Aim-glass gauges stay off.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Toast slot clocks and dedupe mem are **session** (hud.js closure). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. Fail closed:
    - Never freeze the sim. Toasts **must not** set `ctx.flags.paused`.
    - Never throw. Unknown event / missing text → skip toast. Keep flying.
    - If `pushToast` / `toastForEvent` miss, the rest of HUD update still runs. **Never stop** the loop.
    - Unknown `saveBlocked.source` → use the **manual** copy path (do not invent HTML). Authored source tokens only (`autosave` / `berth`).
    - Dedupe mem is a **five-row linger ring** `{ key, lastShown }`, **independent** of which chip paints that key. Never grow an unbounded Map. Do **not** clear a linger row because a chip was reused.
8. Overlay sibling (Wave 118 CTL-02 leftover): later write-set **must not** claim `hail.js`, `galaxychart.js`, overlay-policy helper, or berth **panel** mutex (`setBerthOpen` / KeyL / `canOpenPlayCard`). **Must not** raise `.rw-toasts` or `#hud` z-index. **Must not** add a hail toast (deferred hail stays silent on this channel). Census: `src/systems/overlay-policy.js` is **already in the tree** this wave (sibling). Toast PR1 must **not** revert those imports.
9. NAV-05: **must not** claim `galaxychart.js` `showApLive` / `#rw-galaxy-ap-live`. **Must not** claim `autopilot.js`. P2 close-chart-on-AP — **do not steal**.
10. Later write-set **must not** claim HUD-02 combat rails (reticle / brackets / facing) in `hud.js`. Toast channel + `toastForEvent` / `pushToast` only. **Must not** claim `src/systems/controls.js` KeyJ (CTL-01).
11. P2 chart-label a11y — **do not** make labels into hit targets here.
12. Wave 6 `mem.frameLines` same-frame clue/landmark/`commLine` skip **stays**. It is **not** the leftover fix.
13. Prototype-safe later helpers: authored toast classes (`comm` / `sting` / `warn` / `danger` / `good`) and authored `saveBlocked.source` tokens only. Never `for-in` a save blob into toast copy. Never parse untrusted HTML into `.rw-toast`.
14. CPU: **no** per-frame DOM alloc for toasts. Five `.rw-toast` nodes already exist. Linger is five `{ key, lastShown }` rows. Dedupe is boolean / number reads.
15. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`, `docs/Ctl02OverlayDesign.md`, `docs/Ctl01DockBindDesign.md`, `docs/Nav05HandoffDesign.md`. Do not write `docs/OwnerDecisionsWave118.md`. Deputize defaults live in **this** contract.
16. Do not steal `out/w118/overlay/**`, `out/w118/chartclose/**`, `out/w117/**`, `out/w116/**`.
17. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
18. `reducedMotion`: do **not** invent toast animation. Live toast already fades (`hud.css` 729). Do not add a new motion rule.
19. Accessibility: `.rw-toasts` stays `role="status"` `aria-live="polite"` (`hud.js` 815–816). **Do not** switch to `assertive`. **Do not** add a second live region. Color is not the only cue: keep glyph prefixes (`▲` / `✧` / `■`). Identical in-window refresh **must not** rewrite `textContent`. Distinct autosave vs berth copy **must** be readable as text, not color. On **expire**: `aria-hidden="true"` on that slot; **do not** clear `textContent`. On a **real show** (new allocation, not identical refresh): `aria-hidden="false"` **then** write `textContent`. Boot empty chips start `aria-hidden="true"`. Optional CSS `visibility: hidden` on `.rw-toast:not(.show)` is a **hide**, not a z raise — allowed. Do **not** raise z-index.
20. Do **not** add toast slots. `TOAST_SLOTS` stays **5**. Do **not** persist toast state. Do **not** pause. Do **not** innerHTML.

---

## 0.1 Wave 118 deputize (owner may override after playtest)

Pick a playable **toast-flood** default. Inventory proves **identical-repeat flood is LIVE** and **autosave vs manual mix is LIVE**. Do not park. Do not invent UU / SKU / Digit / persist key.

### Live knobs (do not retune as the fix except the named window)

| Knob | Live | Cite |
|---|---|---|
| `TOAST_LIFETIME` | 4 s | `hud.js` 64 |
| `TOAST_SLOTS` | 5 | `hud.js` 65, 818–819 |
| `.rw-toasts` | `role=status` `aria-live=polite`; under `#hud` z 10 | `hud.js` 813–816; `style.css` 24–29 |
| `.rw-toasts` place | top 14px, right 168px (off aim column) | `hud.css` 635–646 |
| `pushToast` same-key | refresh `until` **only while** `s.until > now` | `hud.js` 1151–1157 |
| Expire | clears `until` **and** `key` | `hud.js` 1197–1201 |
| `frameLines` | same **frame** only; clue/landmark/`commLine` | `hud.js` 532–539, 1183 |
| `saveBlocked` copy | `'▲ SAVE BLOCKED — ' + reason` — **no** source | `hud.js` 568–569 |
| Hostile reason | `'Hostiles within the encounter bubble — berth record refused.'` for **autosave and berth** | `save.js` 1028 |
| Autosave emit | `requestAutosave` `{ reason }` **no** `source` | `save.js` 1039–1041 |
| Idle retry | `BLOCK_RETRY = 5` s → `trySave()` → `requestAutosave` | `save.js` 70, 1588–1590 |
| Jump-pending retry | **0.5 s** while combat-blocked | `save.js` 1570–1583 |
| Berth emit | mid-jump / hostile `{ reason }` **no** `source` | `save.js` 1414, 1420, 1527, 1532 |
| npcFire window | 2.5 s (`npc-fire-toast.js`) | **keep**; not this leftover |
| sunHeat window | 2.5 s | `combat.js` 164, 1886 — **keep** |

Do **not** “fix” flood by adding slots, raising z-index over hail/chart/berth, pausing the sim, or adding a hail toast.

### Playable policy (smallest additive)

**Name:** identical toast text shares **one** slot inside a short **session** window. Autosave refusal copy is **not** berth/manual copy. Sim **stays live**. Overlay z **stays**.

| Piece | Freeze |
|---|---|
| Slot count | **5**. Do not add. |
| Lifetime for a **new** line | keep **4 s** (`TOAST_LIFETIME`). |
| Identical text+class **while visible** | keep live in-place refresh (`until = now + TOAST_LIFETIME`). **Do not** rewrite `textContent`. |
| Identical text+class **after visual expire**, inside window | **suppress**. Do not steal another slot. Do not blink-reopen. |
| Window | `TOAST_DEDUP_WINDOW = 8` s of `ctx.elapsed` from **last successful show or refresh**. Covers idle `BLOCK_RETRY` (5) after lifetime (4) so a 5 s autosave retry does not re-paint. |
| Key | `cls + '|' + text` (live). |
| Linger | session **five-row ring** `{ key, lastShown }` for the last **five keys shown**. **Independent** of which chip currently paints that key. Record linger on real show and on visible refresh. Overwrite the **oldest** linger row when a sixth distinct key is shown. Clear a linger row **only** when `now > lastShown + WINDOW`. **Do not** clear linger because a different line reused the chip. **No** unbounded Map. **No** persist. |
| Live region | expire → `aria-hidden="true"`; keep `textContent`. Real show → `aria-hidden="false"` then `textContent`. Identical refresh: no `textContent` write, no extra live-region churn. |
| Autosave copy | `'▲ AUTOSAVE HELD — hostiles near'` when `e.source === 'autosave'`. Do **not** concatenate the berth-refused reason. |
| Berth / manual copy | `'▲ SAVE BLOCKED — ' + reason` when `e.source === 'berth'` **or** source missing. Mid-jump reason stays authored `'Mid-jump — berth record refused.'`. |
| Emit tag (later `save.js`) | `requestAutosave` adds `source: 'autosave'`. Berth `saveBlocked` emit sites add `source: 'berth'`. Authored tokens only. **Do not** retouch `setBerthOpen` / KeyL / berth DOM (overlay sibling). |
| `frameLines` | **keep** same-frame skip. Window is **in addition**, not a replacement. |
| npcFire / sunHeat / mineBlocked | **keep** their existing throttles. Window still applies if copy matches. |
| Hail | **no** new toast. Overlay defer stays silent here. |
| Z-index | **no** change. Toasts stay inside `#hud` (10). Do **not** raise over hail (40) / chart (30) / berth (60). |
| Home | `hud.js` toast channel. Optional `save.js` **emit tag only**. |

Owner freeze (do not invert):

- Repeated identical autosave refusals and identical encounter toasts are a **bug**, not a feature. Not CONSUME.
- Do **not** pause the sim to fake a quiet HUD.
- Do **not** persist toast clocks.
- Do **not** steal KeyJ, Digit 0/8/9, NAV-05 `showApLive`, overlay mutex, or close-chart-on-AP.
- Do **not** raise toast z-index. Overlay sibling owns hail/chart/berth stacking.
- If allowlist skip fires, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// TOAST — identical cls|text shares one slot inside 8s elapsed
const TOAST_LIFETIME = 4
const TOAST_SLOTS = 5          // visual chips — do not change
const TOAST_DEDUP_WINDOW = 8   // covers BLOCK_RETRY 5 after lifetime 4
// linger ring: last five KEYS shown — NOT tied to chip index
linger = [{ key: '', lastShown: -1e9 }, ×5]

function pushToast(text, cls) {
  if (!text) return
  const now = ctx.elapsed
  const key = cls + '|' + text
  // 1. visible same key → extend until; do not rewrite textContent; bump linger lastShown
  // 2. any linger entry with that key and now < lastShown + 8 → suppress
  // 3. else allocate as live; record linger (same-key row if present, else overwrite oldest linger row)
  //    real show: aria-hidden='false' THEN textContent
}

function expire(slot) {
  slot.until = 0
  slot.el.classList.remove('show')
  slot.el.setAttribute('aria-hidden', 'true')
  // do NOT clear textContent
  // do NOT clear linger because this chip expired or will be reused
}

// Clear a linger row only when now > lastShown + WINDOW (lazy on scan)
// NEVER clear linger because a different line reused the chip

// SAVE BLOCKED copy
if (e.type === 'saveBlocked' && e.source === 'autosave')
  text = '▲ AUTOSAVE HELD — hostiles near'
else if (e.type === 'saveBlocked')
  text = '▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near')

// requestAutosave emit
ctx.emit('saveBlocked', { reason, source: 'autosave' })

// berth emit sites (save/load refuse only — not berth mutex)
ctx.emit('saveBlocked', { reason, source: 'berth' })

// NEVER
ctx.flags.paused = true
TOAST_SLOTS = 6
WORLD_FIELDS.push('toastMem')
slot.el.innerHTML = text
.rw-toasts { z-index: 70 }
new Map()  // unbounded toast keys
aria-live = 'assertive'
```

Do **not** persist the linger clocks. Do **not** write `showApLive`. Do **not** open or close hail/chart/berth. Do **not** add a hail toast.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — flood + mix live |
| Add toast slots | **Forbidden** §0.20 |
| Raise `.rw-toasts` / play-card z | **Forbidden** §0.8 |
| Hail toast for deferred hail | **Forbidden** §0.8 |
| Pause sim to quiet HUD | **Forbidden** §0.7 |
| Persist toast mem / WORLD_FIELDS | **Forbidden** §0.6 |
| `innerHTML` toast | **Forbidden** §0.4 |
| Unbounded key Map | **Forbidden** §0.7 |
| Tie linger to chip index / clear linger on chip reuse | **Forbidden** — pirate-bubble 8 s window must survive four other lines |
| Leave expired chip in polite region without `aria-hidden` | **Forbidden** |
| `aria-live=assertive` / second live region | **Forbidden** §0.19 |
| Clear `textContent` on expire | **Forbidden** §0.19 |
| Steal Digit 0/8/9 / hub pip | **Forbidden** §0.2 |
| Remap KeyH/M/L/J | **Forbidden** §0.3 |
| Claim `autopilot.js` | **Forbidden** §0.9 |
| Claim `galaxychart.js` / `showApLive` | **Forbidden** §0.9 |
| Close chart on AP engage | **Forbidden** — P2 inbox §0.9 |
| Chart-label a11y | **Forbidden** §0.11 |
| Overlay mutex / `hail.js` / overlay-policy | **Forbidden** §0.8 |
| `save.js` berth **panel** (KeyL / `setBerthOpen`) | **Forbidden** §0.8 — emit **tag** only |
| HUD-02 combat rails | **Forbidden** §0.10 |
| CTL-01 `controls.js` KeyJ | **Forbidden** §0.10 |
| `state.js` write | **Forbidden** §0.5 |
| New Digit / UU / SKU | **Forbidden** |
| Aim-glass gauges / kit mutate | **Forbidden** §0.5 |
| Replace `frameLines` | **Forbidden** §0.12 |
| Retune npcFire 2.5 s as the leftover | **Forbidden** — different throttle |
| Freeze the sim on toast miss | **Forbidden** §0.7 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `pushToast` window + 5-row linger ring | PR1 `hud.js` toast channel | events → toasts |
| Chip `aria-hidden` on expire / real show | PR1 `hud.js` toast channel | polite live region |
| `toastForEvent` `saveBlocked` copy | PR1 `hud.js` | `saveBlocked` events |
| `mem.frameLines` | **live** (keep) | same-frame `commLine` |
| `requestAutosave` `source: 'autosave'` | PR1 `save.js` **emit tag only** | HUD `toastForEvent` |
| Berth `saveBlocked` `source: 'berth'` | PR1 `save.js` **emit payload only** (lines that already emit) | HUD |
| Berth panel / KeyL / `setBerthOpen` | **none** (overlay sibling) | — |
| Hail / chart / overlay-policy | **none** (overlay sibling) | — |
| `showApLive` | **none** (NAV-05) | chart |
| `flags.paused` | **none** from this leftover | main loop |
| `state.js` / WORLD_FIELDS | **none** | — |
| Digit 0/8/9 / KeyJ | **none** | consume |
| HUD-02 combat rails | **none** | — |
| `autopilot.js` / `controls.js` | **none** | — |
| `.rw-toasts` z-index | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| Empty toast text | skip |
| Identical key, chip still visible | extend `until`; no `textContent` write; bump linger; no extra slot |
| Identical key on linger, `now < lastShown + 8` (chip may be reused) | **suppress**; no extra slot; no blink |
| Chip reused for a **different** line | linger row for the old key **stays** until WINDOW |
| Expire | `aria-hidden="true"`; keep `textContent`; do not clear linger |
| Real show (new allocation) | `aria-hidden="false"` **then** `textContent` |
| `saveBlocked.source === 'autosave'` | AUTOSAVE HELD authored copy |
| `saveBlocked.source === 'berth'` or missing | SAVE BLOCKED + reason (`textContent`) |
| Unknown `source` string | treat as berth/manual; never HTML |
| `e.reason` hostile / mid-jump | authored strings only; still `textContent` |
| Overlay hail defer | **no** toast from this leftover |
| Title / settings / models open | toasts may still paint under `#hud` z 10 (live). Do **not** raise z |
| `reducedMotion` | no new motion |
| Toast helper miss | skip that event; **never throw**; never pause |
| Partial merge (window without source tag) | identical SAVE BLOCKED still collapses; mix copy remains until tag lands — PR1 must land **window + tag + copy** |
| Partial merge (linger stored on chip `key` only) | pirate-bubble retry restacks — **forbidden**; PR1 must land the **key linger ring** |
| Overlay PR1 edits `save.js` berth open-gate | must **not** strip `source` tags |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 toast-flood** | `pushToast` 8 s identical-key window; **5-row linger ring independent of chips**; expire `aria-hidden`; real-show unhide then `textContent`; `saveBlocked` autosave vs berth copy; `save.js` emit `source` tag | extra slots; persist; pause; overlay mutex; hail toast; toast z; `showApLive`; close-chart-on-AP; chart-label a11y; KeyJ; HUD-02 rails; `innerHTML`; Digit steal; `state.js`; berth panel mutex; `aria-live` assertive |
| **PR2 stills (optional)** | Playtest stills: one AUTOSAVE HELD in a 10 s combat idle; berth SAVE shows distinct SAVE BLOCKED | Required if PR1 code is enough; overlay mutex; known FAILs |
| **PR3 census (optional skip)** | Re-grep: `source: 'autosave'`; `TOAST_DEDUP_WINDOW`; linger ring not slot-tied; expire `aria-hidden`; no `innerHTML` in `pushToast` | New world field |

---

## 4. Later write-set (named files; do not write this wave)

**Allowed (narrow):**

- `src/systems/hud.js` — **toast channel only**: `toastForEvent` `saveBlocked`; `pushToast` window; **five-row linger ring** `{ key, lastShown }` (not slot-tied); expire `aria-hidden`; real-show unhide then `textContent`. Forbidden: combat rails, reticle, hub, Digit, `innerHTML`
- `src/game/save.js` — **`saveBlocked` emit payload only** (`source` tag on `requestAutosave` + existing berth emit sites). Forbidden: WORLD_FIELDS; death overlay; autosave **cadence** math; berth panel / KeyL / `setBerthOpen` (overlay sibling)
- `src/ui/hud.css` — **optional only**: `.rw-toast:not(.show) { visibility: hidden; }` (hide, not z). Forbidden: z-index, stack geometry, aim-column move

**Forbidden:**

- `src/systems/hail.js`
- `src/systems/galaxychart.js` (all, including `showApLive`)
- `src/systems/overlay-policy.js`
- `src/game/autopilot.js`
- `src/systems/controls.js`
- `src/game/state.js`
- `src/systems/station.js` Digit map
- `src/ui/hud.css` z-index / toast stack geometry / aim-column move (optional `visibility: hidden` on `:not(.show)` is the **only** allowed CSS)
- `src/core/ctx.js` (comment-only `saveBlocked` payload is **not** required)
- `public/**`, `package.json`, wishlist, `PROGRESS.md`
