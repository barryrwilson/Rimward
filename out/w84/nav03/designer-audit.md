# Designer audit: NAV-03 Autopilot / Cancel (Wave 84 freeze)

**Auditor:** designer pass (markdown freeze + live HUD/chart).  
**Review file:** `out/w84/nav03/designer-audit.md`  
**Status of this pass:** review only. No `src/` edits. No brief edits.  
**Live AP DOM:** none. Verdict is on the freeze against live occupancy.

| Field | Value |
|---|---|
| Brief | `docs/Nav03AutopilotDesign.md` |
| Contract (wins) | `out/w84/nav03/shared-contract.md` |
| Prior worker audit | `out/w84/nav03/ui-audit.md` |
| Live | `src/systems/galaxychart.js`, `src/systems/hud.js`, `src/ui/hud.css` |

## UI Audit: Autopilot chart button + in-flight Cancel chip

### Summary

Hub and jump-bar occupancy are frozen correctly: Autopilot lives on the chart header; in-flight Cancel is a separate chip, not the 80 px reticle hub and not `.rw-jump`. Digit 0–9 and KeyM stay. Two defects will make the **click** path fail or go silent in live chrome: MATCH/refuse `commLine` toasts sit under the chart overlay, and a header click leaves the reticle at full steer so `AP_STEER_BREAK` 0.65 can drop AP on the same gesture.

### What's done well

- Real `<button>`, `textContent`, `aria-label`; `innerHTML` forbidden (`shared-contract.md:250–263`; live pattern `galaxychart.js:97–101`, `hud.js:226–231`).
- Engage is click-only. No new letter. Digit 0–9 and KeyM stay (`shared-contract.md:289–298`; live KeyM `galaxychart.js:21–24, 240–250`; Digit1–4 `controls.js:41, 289–301`).
- In-flight Cancel is off `hud.js:1077` (80 px hub) and off `.rw-jump` (`hud.js:632–646, 741–745`). Jump overlay is `pointer-events: none`.
- Cancel remains valid during `gate.jumping` (`shared-contract.md:179–186, 261`). Gate fade is already inert (`gate.js:486` cited in contract).
- MATCH refuse policy is fail-closed with authored copy (`shared-contract.md:125`: `'Autopilot refused — MATCH is on.'`). Do not clear MATCH. Do not write throttle.
- Chip must not take `.rw-fade` (`shared-contract.md:262` vs live `#hud.in-combat .rw-fade` `hud.css:88`). Combat interrupt still drops AP.
- Pointer split is correct: chip `none`, button `auto` (`shared-contract.md:261`). Matches live CONTROLS toggle (`hud.js:897–900`; `hud.css:889–890`).
- Chart does not `preventDefault` on flight keys (`galaxychart.js:21–24, 240–250`).
- Tokens: reuse `--cyan` / `--dim`; later `.rw-autopilot` beside `.rw-jump` including `body.rw-contrast` (`shared-contract.md:264`; live contrast list `hud.css:958–965`).
- Names from `SYSTEMS[].name`, not raw ids (`shared-contract.md:259, 269`).
- Disabled Autopilot stays visible while a dest exists (`shared-contract.md:253`). Cancel is a button, not a Digit.

### Findings

#### 🔴 Blocker: MATCH / §6 refuse is not visible while the chart is open

**Location:** `out/w84/nav03/shared-contract.md:125, 220–227, 267`; `docs/Nav03AutopilotDesign.md:177`; `src/ui/hud.css:1421–1431`; `src/style.css:24–28`; `src/systems/hud.js:465–476, 723–731`
**Issue:** Engage is **chart Autopilot click only**. Refuse reasons go through `'commLine'`, which `toastForEvent` paints as `#hud .rw-toast`. `#hud` is `z-index: 10`. `.rw-galaxy-chart` is `position: fixed; inset: 0; z-index: 30` with a 0.82 scrim. The MATCH line `'Autopilot refused — MATCH is on.'` (and docked / jumping / combat / no dest / hull) lands **behind** the open chart. Sighted players get a silent no-op. Acceptance requires a visible MATCH refuse.
**Fix:** Keep `commLine` for when the chart is closed. Also print the refuse on the **chart** (header status / `aria-live="polite"` next to the button, 4 s). Do not rely on HUD toasts for chart-open refuse. Native `disabled` must not swallow the click if click-refuse is the reporter (see Major below).
**Status:** open

#### 🔴 Blocker: Chart Autopilot click can instantly cancel via steer-break

**Location:** `out/w84/nav03/shared-contract.md:199`; `docs/Nav03AutopilotDesign.md:64–65, 205`; `src/systems/controls.js:7–11, 309–311, 384–398`; `src/systems/galaxychart.js:89–104`; `src/ui/hud.css:1429–1447, 1455–1460`
**Issue:** Reticle **always** writes `steerX/Y` from mouse vs screen center. Chart does not pause. Autopilot sits in the chart **header** (top of a centered panel). Header is far from center; after clamp, `hypot(steerX,steerY)` is ~1.0, which is above `AP_STEER_BREAK` **0.65**. Click Autopilot → engage → same/next frame `input` interrupt → stick back. Player sees a dead button. The freeze already warns that a non-zero-steer cancel would drop AP; 0.65 only filters small motion, not a header click.
**Fix:** While the chart is open, ignore the **steer** arm of `input` (WASD / throttle / afterburner / Cancel still apply). After the chart closes, arm steer-break only when hypot stays **below** 0.65 for one frame (or a short grace). Do not treat LMB on the chart button as fire-to-cancel (LMB is already not an AP cancel).
**Status:** open

#### 🟠 Major: `aria-disabled` is not a reason string; `disabled` kills click-refuse

**Location:** `docs/Nav03AutopilotDesign.md:177`; `out/w84/nav03/shared-contract.md:253`
**Issue:** Brief stores “Disabled reasons in `aria-disabled`”. `aria-disabled` is boolean (`true`/`false`). Reason text there is invalid AT. Native `disabled` also blocks `click`, so `commLine` on click-refuse never fires. MATCH refuse then has **no** reporter even after the toast z-index fix.
**Fix:** Keep the button in the tree. Use `aria-disabled="true"` **or** native `disabled`, not both if you need click. Preferred: no native `disabled`; `aria-disabled="true"`; intercept click; set `aria-describedby` to a chart-local reason node; still emit `commLine`. Visual disabled (opacity / `--dim`) plus `:focus-visible`.
**Status:** open

#### 🟠 Major: Interrupt / refuse copy is not frozen except MATCH

**Location:** `out/w84/nav03/shared-contract.md:125, 196–210, 267–269`; `docs/Nav03AutopilotDesign.md:181–183`
**Issue:** Tokens (`combat`, `missingGate`, `hull`, `blocked`, `hail`, `input`, `sun`, `arrive`, `pause`, `dock`) are computer ids. Player copy is “authored English” with no table. Chip `textContent` + `commLine` can leak tokens or dest ids. Empty / no-route has no line. NAV-02 already owns persistent NEXT/DEST/JUMPS in `.rw-nav-readout` and **forbids** toasting `NO ROUTE` onto the aim column (`out/w84/nav02/shared-contract.md:214`) — AP must not spam a second toast for the same fact.
**Fix:** Freeze a player map (examples, not live UI):

| Token / refuse | commLine + chip |
|---|---|
| MATCH | `Autopilot refused — MATCH is on.` (already frozen) |
| no dest / dest === here | `Autopilot refused — plot a destination first.` / `Autopilot refused — already in the destination system.` |
| docked / jumping / paused / combat / hull | `Autopilot refused — …` (one line each) |
| `cancel` | `Autopilot cancelled.` |
| `input` | `Autopilot cancelled — manual helm.` |
| `combat` / `hull` / `sun` / `impact` / `missingGate` / `blocked` / `dock` / `pause` / `hail` | one authored line each; names from `SYSTEMS[].name` only |
| `arrive` | `Arrived — autopilot off.` |
| `restore` | silent (already frozen) |

Do not print the token. Do not print dest ids. Do not put clue text on the chip.
**Status:** open

#### 🟠 Major: “Top-center under the system banner” names the wrong live slot

**Location:** `out/w84/nav03/shared-contract.md:260`; `docs/Nav03AutopilotDesign.md:178`; `src/systems/hud.js:597–601, 734–739`; `src/ui/hud.css:588–594, 875–878`
**Issue:** Live `.rw-banner` is **top-right** (`top: 96px; right: 14px`), under Manifest. Toasts are `top: 14px; right: 168px` (off the aim column). There is no top-center system banner. A literal “under the banner” chip sits on Manifest + arrival sting + toasts. True **top-center** is the empty band between CONTROLS (left) and toasts (right), above the 80 px hub and above `.rw-jump` — that is the right HUD-01 slot, but the freeze does not pin CSS.
**Fix:** Pin later CSS: `#hud .rw-autopilot { top: 14px; left: 50%; transform: translateX(-50%); }` (adjust if it collides with a future toast wrap). Not `top: 96px; right: 14px`. Not `.rw-jump`. Not `hud.js:1077`. Do **not** mount Cancel inside NAV-02 `.rw-nav-readout` (that readout **hides while jumping**).
**Status:** open

#### 🟠 Major: Space on a focused Autopilot / Cancel button also fires afterburner

**Location:** `out/w84/nav03/shared-contract.md:198, 255, 298`; `src/systems/controls.js:20, 43–47, 253–260`; `src/systems/galaxychart.js:21–24`
**Issue:** Chart does not swallow Space. Space is afterburner (`TRACKED` + `PREVENT_DEFAULT`). A focused `<button>` also activates on Space. Tab → Autopilot → Space can **engage then `input` cancel** in one key. In-flight Cancel + Space both cancel (benign) but still dumps afterburner. Keyboard Cancel is supposed to be the **button**, not a Digit; Enter is safe (not TRACKED). Primary path is click, so this is Major not Blocker.
**Fix:** On Autopilot / Cancel `keydown` Space: `preventDefault()` so the button does not activate; afterburner may still fire (and cancel AP if flying). Activate the control with **click** or **Enter** only. Document that. Do not bind Digit or KeyM.
**Status:** open

#### 🟡 Minor: Empty / no-route chart state is hide-optional, so Autopilot can vanish

**Location:** `out/w84/nav03/shared-contract.md:220–221, 253`; `docs/Nav03AutopilotDesign.md:177`; `src/systems/galaxychart.js:97–104`
**Issue:** “Do not hide the control while a dest exists” allows hiding when NAV-01 has no dest. Chart header then has only ×. Player cannot learn Autopilot exists. §6 still lists no dest as a refuse.
**Fix:** Always show **Autopilot** in the header when the chart is open. If no dest: visual disabled + click-refuse line above. Hide only with the chart (`is-hidden` on `.rw-galaxy-chart`).
**Status:** open

#### 🟡 Minor: Combat fade already covered; confirm chip classes

**Location:** `out/w84/nav03/shared-contract.md:262, 265`; `src/ui/hud.css:88, 586`; `src/systems/hud.js:1487–1495`
**Issue:** Worker audit is right: `.rw-fade` and `.rw-chartmark` go to 0.14 in combat. Cancel must stay readable that frame. Freeze already forbids `.rw-fade`. Impl can still inherit it from a wrapper.
**Fix:** Chip root class `.rw-autopilot` only. No `.rw-fade`, `.rw-aux` (0.38), or `.rw-chartmark`. Combat token still disengages.
**Status:** open (freeze OK; pin in PR6)

#### 🟡 Minor: Hit target and header layout shift

**Location:** `src/ui/hud.css:1455–1488`; `out/w84/nav03/ui-audit.md` suggestion; `out/w84/nav03/shared-contract.md:250–252`
**Issue:** `.rw-galaxy-close` is `padding: 2px 10px` / 14 px type (~18–22 px). “Cancel autopilot” is wider than “Autopilot” and will shove × on small `92vw` panels. Header is `space-between` with a single close control today (`galaxychart.js:103–104`).
**Fix:** Wrap Autopilot + × in a header cluster (`display: flex; gap: 8px`). Min height ~24 px at `--rw-text-scale: 1`. Same hover / `:focus-visible` border as `.rw-galaxy-close` (`hud.css:1484–1488`). Keep `type="button"`.
**Status:** open

#### 💡 Suggestion: Keyboard Cancel in flight is Tab/Enter or helm, not a letter

**Location:** `out/w84/nav03/shared-contract.md:198, 298`; `src/systems/controls.js:7` (no pointer lock); `src/systems/hud.js:897–900`
**Issue:** No pointer lock, so Tab can reach Cancel. Most pilots never Tab. Helm (WASD / R F / Space / steer-break) is the keyboard cancel. That matches “no new letter” and keeps Digit 0–9 / KeyM. Worker audit said in-flight Cancel is mouse-only; contract also asks keyboard **on the button**. Both can be true: button is in tab order; helm is the eyes-on-glass cancel.
**Fix:** Tab order: CONTROLS toggle, then chip Cancel (when engaged). `aria-label="Cancel autopilot"`. Do not add KeyM / Digit. Do not `preventDefault` Digit 0–9 on the chart.
**Status:** open (no freeze change required if Tab+Enter is documented)

#### 💡 Suggestion: Update HUD “sole interactive” comment; add contrast + reduced-motion

**Location:** `src/ui/hud.css:6, 889–890, 958–965, 1619–1622`; `src/systems/hud.js:897–898`
**Issue:** Live comment says CONTROLS is the only `pointer-events: auto` HUD control. PR6 adds Cancel. Contrast sheet lists `.rw-jump` but not `.rw-autopilot` yet (contract already asks to add it). Chart reduced-motion already kills animation on the overlay.
**Fix:** In PR6, list `.rw-autopilot` next to `.rw-jump` under `body.rw-contrast`. Keep reduced-motion: no extra pulse on the chip. Chip hop text can update without animation.
**Status:** open (later CSS)

#### 💡 Suggestion: Chart label swap must update `aria-label`

**Location:** `out/w84/nav03/shared-contract.md:251–252`; `src/systems/galaxychart.js:99–100`
**Issue:** One control, two names: **Autopilot** vs **Cancel autopilot**. Live close already sets `aria-label` separately from `textContent` (`×` vs “Close galaxy chart”).
**Fix:** When flying, `textContent` and `aria-label` both become `Cancel autopilot`. When idle, both `Autopilot`.
**Status:** open (later PR6)

### Focus checklist (this freeze)

| Topic | Verdict |
|---|---|
| Autopilot on chart | Pass as placement. Fail as refuse visibility + click/steer-break until Blockers freeze. |
| In-flight Cancel off 80 px hub | Pass (`hud.js:1077` forbidden). |
| Cancel off jump bar | Pass (not `.rw-jump`; jump is `pointer-events: none`). |
| Cancel during jump | Pass (`cancel` token still live; hold heading ≠ ignore Cancel). |
| MATCH refuse visible | Fail while chart open (Blocker). Copy string itself is good. |
| Interrupt messaging | Policy pass. Player English not frozen (Major). |
| Keyboard vs click | Click-only engage is correct. Space/afterburner clash (Major). Digit/KeyM unstolen (Pass). |
| Digit 0–9 stay | Pass. Hail interrupt exists so hail digits stay hail. |
| KeyM stays | Pass. Chart toggle untouched. |
| Disabled / empty (no route) | Dest-present disabled: pass. No-dest hide: weak empty state (Minor). |

### Accessibility checklist (design)

- [x] Named controls (Autopilot / Cancel) — freeze
- [ ] Chart-open refuse audible/visible — **fail** (toast under z-index 30)
- [x] Keyboard: no Digit / KeyM steal
- [ ] Autopilot/Cancel Space vs afterburner — **fail**
- [x] Contrast tokens named; high-contrast hook named for later CSS
- [ ] `aria-disabled` used as boolean, not a reason dump — **fail in brief wording**
- [x] No hub overlap
- [x] Names from `SYSTEMS[].name`
- [x] No `innerHTML`
- [ ] Focus rings on chip Cancel — not specified; copy `.rw-galaxy-close:focus-visible`

### Theming / states / hierarchy

| State | Freeze | Live gap |
|---|---|---|
| Hover | Not named for AP; close has hover | Copy close (`hud.css:1484–1487`) |
| Focus | Not named for chip | Copy close `:focus-visible`; CONTROLS toggle has hover only (`hud.css:902`) |
| Disabled | Named | Must remain clickable or show reason without click |
| Empty (no dest) | Ambiguous hide | Show disabled Autopilot |
| Loading | N/A (no async plot in this feature) | — |
| Error / refuse | MATCH line only | Chart-local live region |
| Jumping | Hold heading; Cancel live | Do not hide chip (NAV-02 readout **does** hide) |
| Combat | No `.rw-fade`; Cancel readable | Do not use `.rw-aux` either if Cancel must stay primary |

### Verdict

**Do not implement PR6 until the two Blockers are written into the contract.** Hub/jump/Digit/KeyM/cancel-during-jump are ready. MATCH refuse must appear **on the chart**. Chart click must not count as steer-break. Then freeze refuse English and pin the chip to true top-center, not under `.rw-banner`.

Worker `ui-audit.md` findings (combat fade, jump vs Cancel, label swap, hit target) still stand and stay 🟡/💡. This pass adds the chart-overlay and click/steer defects those notes did not treat as occupancy.
