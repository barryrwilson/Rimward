# UI Audit: Wave 117 NAV-05 PR1 `#rw-galaxy-ap-live`

Reviewer: designer (review only). Scope: `src/systems/galaxychart.js` fly-cancel live paint; `src/game/autopilot.js` `AP_LINES` / `BREAK_LINE` English. Did not start Vite. Did not use Playwright. Did not edit `src/`.

Honor: HUD-01 empty hub; no `innerHTML`; `textContent` of frozen literals; chart stays open on engage. Do not demand a chip reason paragraph (`hud.js` forbidden). Do not demand close-chart-on-engage (P2 inbox waits).

## Summary

PR1 closes the Wave 116 chart-open fly-cancel Major. Sighted cancel copy now lands on existing `#rw-galaxy-ap-live` while the chart stays open. No 🔴 Blocker. No 🟠 Major. Missing live-region name is a 🟡, not a DONE gate.

## Honor / a11y checklist

| Check | Verdict | Cite |
|---|---|---|
| HUD-01 empty hub | **Pass.** No hub child. Chip dest/next/rem unchanged. | `hud.js` 1032–1041 (read-only; not in write-set) |
| No `innerHTML` | **Pass.** | `galaxychart.js` (no `innerHTML`); `autopilot.js` (no `innerHTML`) |
| Frozen literals via `textContent` | **Pass.** `showApLive` writes `apLine(...)` only. Unknown token → `''`. Raw `reason` / dest / hop never painted. | `galaxychart.js:572–576, 623, 630, 717`; `autopilot.js:21–49, 230–234` |
| Chart stays open on engage | **Pass.** `tryEngage` does not close. Click path only `showApLive('')` on success. | `autopilot.js:209–222`; `galaxychart.js:627–636` |
| `#rw-galaxy-ap-live` name | **Fail (Minor).** `id` + `role="status"` + `aria-live="polite"`. No `aria-label` / `aria-labelledby`. Button uses `aria-describedby`. | `galaxychart.js:137–152` |
| Contrast | **Pass.** Live text uses `--dim` (`#7d93ab`) on chart `--panel`. Approx 6:1 vs panel (AA). `body.rw-contrast .rw-galaxy-chart` raises `--dim` to `#aec3d8`. | `hud.css:1902–1905, 1963–1971, 2240–2246` |
| `reducedMotion` | **Pass.** Live region has no CSS animation/transition. `AP_LIVE_LIFE` is a 4 s text clear, not motion. Chart is not under `#hud` reduced-motion kill; none needed. | `hud.css:1963–1971, 1183–1188`; `galaxychart.js:569–576` |

## What's done well

- `#rw-galaxy-ap-live` stays `role="status"` `aria-live="polite"` in the chart header (z-index 30), above the overlay scrim. Refuse, chart Cancel, and fly `disengage` share one slot.
- Chart Cancel paints immediately: `showApLive(apLine('cancel'))` while `chartOpen` (`galaxychart.js:619–624`).
- Fly path consumes same-frame `ctx.events` `autopilotDisengaged` after the 4 s timer check, so a new reason is not wiped in the same `update()` (`galaxychart.js:708–718`). Autopilot runs before the chart in `main.js` init order (`113` then `134`), so the emit is visible this frame.
- `restore` stays silent. Unknown tokens stay blank (`apLine` miss).
- Prefix split is player-readable: **refused** vs **cancelled** first, then hop / lookup / path / hub / wrap / missing gate / arrive (`autopilot.js:21–38`).
- Autopilot dim stays `aria-disabled` + `.is-dim` (not native `disabled`), so refuse click still speaks `apLive`. No-route stays native `disabled` with a named `aria-label`.
- Real `button`s, `:hover` / `:focus-visible` rings, `min-height`/`min-width` 24 px, Space `guardAutopilotSpace`.
- No new chrome. No overlay restyle. No HUD toast z-index steal.

## Findings

No 🔴 Blocker or 🟠 Major findings.

#### 🟡 Minor: AP live region has no accessible name

**Location:** `src/systems/galaxychart.js:137–142`
**Issue:** `#rw-galaxy-ap-live` has `id`, `role="status"`, and `aria-live="polite"`, but no `aria-label` or `aria-labelledby`. Assistive tech that lists live regions gets an unnamed status. The Autopilot control is named (`aria-label` + `aria-describedby="rw-galaxy-ap-live"` at `galaxychart.js:149–152`), so the button path still speaks. This is not unusable.
**Suggestion:** Set `aria-label="Autopilot status"` on the status node. Do not rewrite chart layout. Do not steal P2 chart-label a11y.
**Status:** open (quick win if a later chart touch). Not required to report DONE.

#### 🟡 Minor: HUD toast still sits under the chart scrim

**Location:** `#hud` z-index 10 vs `.rw-galaxy-chart` z-index 30 (`src/ui/hud.css:1908`)
**Issue:** `disengage` still `sayLine`s `BREAK_LINE` (`autopilot.js:202–205`). Chart-open, that toast is under the scrim. Sighted leftover law is `#rw-galaxy-ap-live`, not a toast z-index steal.
**Suggestion:** Do not raise toast z-index. Do not edit `hud.js` / `hud.css`. Optional later: skip `commLine` when `chartOpen` (duplicate AT announce; see Suggestion below).
**Status:** accepted. Contract §0.15. Do not reopen as NAV-03 leftover.

#### 🟡 Minor: Header live region shares the header row

**Location:** `src/systems/galaxychart.js:165–167`; `src/ui/hud.css:1932–1971`
**Issue:** Long cancel lines (`Autopilot cancelled — next gate is not in this system.`) share the title/actions row. `flex: 1; min-width: 0` lets text wrap. Pre-existing refuse layout. Contract forbids a chart layout rewrite.
**Suggestion:** Keep flex shrink. Do not add `nowrap`. Do not restyle overlay CSS in this leftover.
**Status:** accepted live pattern (Wave 85 wrap). No PR1 CSS write.

#### 💡 Suggestion: Keep `AP_LIVE_LIFE` at 4 s

**Location:** `src/systems/galaxychart.js:569–576, 708`
**Issue:** Four-second clear is existing refuse behavior (`ctx.elapsed` is seconds). Polite live may queue; the visual line still sits for 4 s. Contract allows the existing timer.
**Suggestion:** Do not retune unless playtest PR2 asks.
**Status:** keep.

#### 💡 Suggestion: “hub spoke cycle failed” is shop jargon

**Location:** `src/game/autopilot.js:33`
**Issue:** Distinct from hub-not-listed and missing-gate. “Spoke cycle” is KeyG modulo, not a player word. Design freeze allows this jargon.
**Suggestion:** Optional PR2: `Autopilot cancelled — hub route cycle failed.` Keep token `hubWrap`.
**Status:** optional. Do not block PR1.

#### 💡 Suggestion: Chart-open cancel can announce twice

**Location:** `src/systems/galaxychart.js:623, 717`; `src/game/autopilot.js:203–205`
**Issue:** Fly/cancel paints `#rw-galaxy-ap-live` and still emits `commLine`. Screen readers may hear the same sentence from chart `aria-live` and HUD toasts (toasts are visually hidden under the scrim, still in the a11y tree).
**Suggestion:** Optional: skip `commLine` for chart-open disengage only. Do not drop `commLine` when the chart is closed.
**Status:** optional. Not required to keep the Major closed.

## Closed from Wave 116 designer Major

#### 🟠 Major: Fly-path cancel English is under the chart overlay — **closed in src**

**Location:** `src/systems/galaxychart.js:619–624, 709–718`; `src/game/autopilot.js:21–49, 191–206`
**Issue (prior):** Chart Cancel did not `showApLive`. Fly `disengage` only `commLine`d under z-index 10.
**Fix landed:** `showApLive(apLine('cancel'))` on chart Cancel while `chartOpen`. Fly `autopilotDisengaged` paints `showApLive(apLine(reason))` while `chartOpen`. Chart stays open on engage.
**Status:** closed.

## Copy table (player-facing)

| Token | Family | Line | Live path |
|---|---|---|---|
| `match` / `noDest` / `here` / `docked` / `jumping` / `paused` / `missingHop` / `missingLookup` | refuse | `Autopilot refused — …` | click `tryEngage` → `showApLive` |
| `cancel` | break | `Autopilot cancelled.` | chart click + fly event |
| `input` | break | `Autopilot cancelled — manual helm.` | fly event |
| `lookupFail` | break | `Autopilot cancelled — next gate is not in this system.` | fly event |
| `missingPath` | break | `Autopilot cancelled — approach path failed.` | fly event |
| `missingHub` | break | `Autopilot cancelled — hub does not list the next hop.` | fly event |
| `hubWrap` | break | `Autopilot cancelled — hub spoke cycle failed.` | fly event |
| `missingGate` | break | `Autopilot cancelled — next gate is missing.` | fly event |
| `arrive` | break | `Arrived — autopilot off.` | fly event |
| `restore` | silent | (none) | skipped |

`missingLookup` / `lookupFail` share the second clause; diagnosis is the prefix. Accepted deputize.

## Recheck after review

No UI product fix required for DONE. Do not demand chip reason. Do not demand close-chart-on-engage. Worker self-audit (`out/w117/nav05/ui-audit.md`) agrees on no 🔴/🟠; this pass adds the unnamed live-region Minor and the honor checklist (name / contrast / reducedMotion).
