# Wave 118 HUD-04 leftover — toast-flood

## Verdict

**Leftover is real.** Serial name: **PR1 toast-flood**. Serial is **not** none. **Not CONSUME.**

Deputize: 8 s identical-key window; **five-row linger ring of keys** (not chip-tied; do not clear on chip reuse); in-place refresh while visible; suppress linger hits; expire **`aria-hidden="true"`** (keep `textContent`); real show unhide then write text; distinct **AUTOSAVE HELD** vs **SAVE BLOCKED**; `save.js` emit `source` tag only; **never pause**; **do not raise toast z**; **do not add hail toasts**. Owner may override after playtest. Do not park.

Designer re-dispatch (Wave 118): two Majors frozen in contract — slot-tied linger would lose the pirate-bubble 8 s window; expired chips stay in the polite region. PR1 must land both.

## Census (code wins)

- `hud.js` 64–65: `TOAST_LIFETIME = 4`; `TOAST_SLOTS = 5`.
- `hud.js` 813–816: `.rw-toasts` `role=status` `aria-live=polite`.
- `hud.js` 532–539 / 1183: `mem.frameLines` same-frame clue/`commLine` skip (wave 6). **Not** a time window.
- `hud.js` 568–569: `saveBlocked` → `'▲ SAVE BLOCKED — ' + reason`. No `source`.
- `hud.js` 1151–1157: visible same-key refresh only. Expire 1197–1201 **clears `key`**, removes `show`, **no** `aria-hidden`.
- `hud.js` 1169: `textContent` (no `innerHTML`).
- `hud.css` 635–646: toasts top-right, not aim-column (stale utility-proposal copy).
- `style.css` 24–29: `#hud` z 10. Toasts live under hail 40 / chart 30 / berth 60.
- `save.js` 70 / 1588–1590: idle `BLOCK_RETRY = 5` re-emits `saveBlocked`.
- `save.js` 1028: hostile reason always **berth record refused**.
- `save.js` 1039–1041: `requestAutosave` emit `{ reason }` only.
- `save.js` 1414, 1420, 1527, 1532: berth emit `{ reason }` only.
- `save.js` 1570–1583: jump-pending retry **0.5 s** (song `saveBlocked` residual).
- npcFire 2.5 s and sunHeat 2.5 s already exist — **keep**; not this leftover.
- Overlay helper / hail mutex: **sibling already in tree** (`overlay-policy.js`; `save.js` 14). Do not claim. Do not revert mutex when tagging emits.

Idle 5 s > lifetime 4 s is a **blink flood**. Mix copy is **live**. Treating that as CONSUME would keep retries hiding new chips.

## Deputize

- `TOAST_SLOTS` stays 5. `TOAST_LIFETIME` stays 4 for **new** lines.
- `TOAST_DEDUP_WINDOW = 8` s `ctx.elapsed` from last show/refresh.
- Visible identical → extend `until`; **do not** rewrite `textContent`; bump linger.
- Linger hit (`now < lastShown + 8`) → **suppress** even if the chip was reused for another line.
- Linger = five `{ key, lastShown }` rows. Overwrite oldest row on a sixth distinct key. Clear a row **only** when `now > lastShown + WINDOW`. **Do not** clear because a chip was reused. No Map. No persist.
- Expire → `aria-hidden="true"`; **do not** clear `textContent`. Real show → `aria-hidden="false"` then `textContent`. Optional CSS `visibility:hidden` on `:not(.show)`. Not `aria-live=assertive`. No second live region.
- Autosave: `'▲ AUTOSAVE HELD — hostiles near'` when `source === 'autosave'`.
- Berth/manual: `'▲ SAVE BLOCKED — ' + reason` when `source === 'berth'` or missing.
- `requestAutosave` emit `source: 'autosave'`. Existing berth emit sites `source: 'berth'`.
- Do **not** edit KeyL / `setBerthOpen` / berth DOM (overlay sibling).
- Do **not** add hail toasts. Do **not** raise `.rw-toasts` z-index.
- Keep `frameLines`. Keep npcFire / sunHeat gaps.
- No hub pip, no Digit steal, no `state.js` write, no new persist key, no `innerHTML`, no pause.

## Later PR1 may write

- `src/systems/hud.js` **toast channel only** (`toastForEvent` `saveBlocked`, `pushToast` window, 5-row key linger, expire `aria-hidden`)
- `src/ui/hud.css` **optional** `.rw-toast:not(.show) { visibility: hidden }` only (not z)
- `src/game/save.js` **`saveBlocked` emit payload only** (`source` tag)

Must **not** claim `hail.js`, `galaxychart.js` (including `showApLive`), overlay-policy, `controls.js` KeyJ, `autopilot.js`, `state.js`, HUD-02 rails, `hud.css` z-index (optional `:not(.show)` visibility hide only), or berth **panel**. This worker wrote **no** `src/`. Linger must **not** be slot-tied. Expire must set `aria-hidden`.

## Honor

- Wishlist Idea inbox P1 FEEDBACK — cite, do not edit.
- `docs/Ctl02OverlayDesign.md` — overlay sibling; cite, do not rewrite.
- `docs/Ctl01DockBindDesign.md` — KeyJ sibling; cite, do not remap.
- `docs/Nav05HandoffDesign.md` — `showApLive`; cite, do not steal.
- P2 close-chart-on-AP — do not steal.
- P2 chart-label a11y — do not solve.
- `docs/OwnerDecisions*.md` — cite, do not edit. No `docs/OwnerDecisionsWave118.md`.
- Do not steal `out/w118/overlay/**`, `out/w118/chartclose/**`, `out/w117/**`, `out/w116/**`.
- No wishlist. No `PROGRESS.md`.

## Coupling for orchestrator

- Overlay sibling later write-set includes `src/game/save.js` **berth overlay only** and already imports `overlay-policy.js` (**14**). This leftover later write-set includes `save.js` **emit `source` tag only** (sites **1040 / 1414 / 1420 / 1527 / 1532**). **Disjoint symbols.** Re-grep `source:` after merge. Overlay must not strip tags. Toast must not touch `setBerthOpen` / KeyL / `canOpenPlayCard`.
- Overlay sibling **forbids** `hud.js` toasts. This leftover **claims** `hud.js` toast channel only. Overlay must not raise toast z. Toast must not add hail toasts.
- `flags.chartOpen` / hail Digit / NAV-05 `showApLive` stay sibling-owned.
- Jump-pending 0.5 s `saveBlocked` **song** can still tick. Not this write-set (`song.js` forbidden). Residual, not CONSUME.
- Wave 6 `frameLines` stays; do not delete it as “replaced by the window.”

## Graph note

`graph_resolve` returned `codex/workflow-drive-artifact-publishing` (score ~41, coverage 0.11 on terms `doc`/`edit`). That stack wants Google Drive publish + external-share gate. This task is a **local** markdown freeze under `docs/Hud04ToastFloodDesign.md` and `out/w118/toast/**`. Drive tools are not on this worker. Owner write-set forbids other paths. **No Drive share. No new external artifact.** Treated as a false match; local pack only.

## Ports / processes

This worker did not start Vite or Chrome. No ports claimed. `[NO BROWSER COVERAGE]` is correct for this markdown freeze.
