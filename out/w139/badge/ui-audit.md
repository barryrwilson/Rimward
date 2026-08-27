# UI Audit: Agent play badge layout + a11y tokens leftover integrator

### Summary

No product UI ships in Wave 139. Audit is of the live body-child `.rw-agent-badge` vs Manifest / toasts / PWR / RANGE and of later CSS offset + token mirrors. Blocker/Major UI holes in **live** play (card covers UU / FEAR / CARGO and toast chips; colorblind/contrast do not retint the badge) are accepted as leftover **REAL** and frozen as PR1 in `src/style.css`. HUD child, z-index drop, bottom-right pin, and color-only ON/OFF are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Live ON/OFF is not color-only: solid vs dashed left border (`style.css` **61–67**) plus `on`/`off` text (`agent-api.js` **571–574**). PR1 keeps it.
- Live buttons are real `button` nodes, `type="button"`, min 44 px, hover + 2 px focus ring (`agent-api.js` **548–556**; `style.css` **105–126**).
- Live reduced-motion already kills animation/transition on the badge tree (`style.css` **128–132**). PR1 keeps it.
- Live status is `aria-live="polite"` (`agent-api.js` **530–532**). Paint is `textContent`.
- Previous pin already cleared PWR, hub RANGE, and market bottom rows. PR1 must not undo that.
- Body child, not HUD hub child. HUD-01 empty 80 px hub stays empty.
- Token list on the badge already matches HUD roles, so a body-class override can retint without a parent change.

### Findings

#### 🔴 Blocker: Manifest / toasts under the card — **resolved as later mint**

**Location:** live `style.css` **39–48**; `hud.css` **1172–1176**, **710–721**; `hud.js` **1263–1274**  
**Issue:** `?agent=1` flight hides UU / FEAR / CARGO and some toasts. Badge z-index 40 over HUD 10.  
**Fix:** PR1 `top: 140px` + `max-width: min(148px, calc(100vw - 32px))`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Colorblind / contrast skip the badge — **resolved as later mint**

**Location:** live `style.css` **33–37**; `hud.css` **1234–1248**; `settings.js` **70–71**  
**Issue:** `body.rw-colorblind` / `body.rw-contrast` retarget `#hud` (and screens). The body-child card keeps default cyan / panel.  
**Fix:** PR1 mirrors HUD token overrides on `.rw-agent-badge`. Do not move the node under `#hud`. Color stays not the only ON/OFF cue.

#### 🟠 Major: Bottom-right or z-drop “fixes” — **resolved in freeze**

**Location:** honor; PWR `hud.css` **1021–1025**; RANGE **207–220**; scrim `screens.css` **16**  
**Issue:** Pinning bottom-right hides PWR/RANGE. Dropping z-index below 20 buries Enable/Stop under the dock scrim. Parenting under `#hud` steals HUD-01 pointer-events.  
**Fix:** keep top-right, z-index **40**, body child. Retune `max-height` with `top`.

#### 🟠 Major: Offset without width (or width without offset) — **resolved in freeze**

**Location:** contract §2  
**Issue:** Inbox said “offset **or** narrow.” Clearing **both** Manifest and toasts needs both knobs.  
**Fix:** PR1 lands both plus PWR-safe max-height plus both palettes. Partial merge forbidden.

#### 🟠 Major: Remap keys / new Digit / pause chrome — **resolved in freeze**

**Location:** honor  
**Issue:** A “toggle badge slot” key or Digit would steal the map.  
**Fix:** CSS only. Digit 0/8/9 stay. KeyH/J/L/M/P stay. KeyD strafe. Do not pause.

### 🟡 Minor: Authored 140 px vs XL Manifest

**Location:** deputize `top: 140px`; HUD `--rw-text-scale` up to 1.5  
**Issue:** If Manifest chrome grows, 140 px may clip the last CARGO row.  
**Justification:** Census XL height ~111 px + `top: 14px` + gap. No JS measure. Optional still.

### 🟡 Minor: Narrow 148 px wraps copy

**Location:** `style.css` **48** later 148 px; buttons **107–108**  
**Issue:** Title `Agent play` and `Enable agent play` wrap more.  
**Justification:** Inbox allows narrow. Hit targets stay 44 px. `overflow-wrap: anywhere` already live (**92**).

### 🟡 Minor: Error line shares `--white` with hint

**Location:** `style.css` **87–93** (orch-fable t2 suggestion)  
**Issue:** Failures rely on `Error: ` prefix.  
**Justification:** Not this leftover. If `--rw-bad` is set on colorblind, do not make error color-only.

### 💡 Suggestion: Optional PR2 still

One still: `?agent=1`, Manifest three meters visible, toast visible, PWR visible, RANGE word visible when in-range, colorblind accent `#56B4E9`, contrast panel `rgba(4, 8, 17, 0.94)`, z-index 40, hub empty, no pause.

### 💡 Suggestion: Scroll clip of focus ring

`overflow-y: auto` + `outline-offset: 2px` (orch-fable t2). Padding 10/12 px is larger than the offset. No change unless a short-viewport still shows clip.

### States checklist (live CSS; PR1 keeps)

| State | Present | Notes |
| --- | --- | --- |
| Hover | yes | `style.css` **118–120** |
| Focus | yes | **122–126** |
| Disabled | n/a | do not demand JS |
| Empty | yes | `:empty` hides error **95–97** |
| Error | partial | prefix copy; color role optional later |
| Colorblind | **no** on badge | PR1 adds token override |
| Contrast | **no** on badge | PR1 adds token override |
| Reduced motion | yes | **128–132** |

### Constraints honored (freeze)

- Body child, not HUD hub child.
- 44 px minimum tap targets kept.
- `z-index: 40` kept.
- Color is not the only ON/OFF cue.
- `reducedMotion` kept.
- No JS. No `hud.css`. No Vite/Chrome this wave.

### Re-review (after freeze)

Live overlap and missing palette remain until PR1 (expected REAL). Freeze still forbids HUD child, z-drop, bottom-right, and color-only ON/OFF. HUD-06 home mark is cite-only. No new Blocker/Major in the integrator. Optional PR2 still is not required with PR1.
