# Designer recheck: NAV-03 Autopilot / Cancel (Wave 84 freeze)

**Auditor:** designer recheck (markdown freeze + live HUD/chart occupancy).  
**Review file:** `out/w84/nav03/designer-audit-recheck.md`  
**Status of this pass:** review only. No `src/` edits. No brief edits.  
**Live AP DOM:** none. Verdict is on the freeze against live occupancy.

| Field | Value |
|---|---|
| Brief | `docs/Nav03AutopilotDesign.md` |
| Contract (wins) | `out/w84/nav03/shared-contract.md` |
| Prior designer audit | `out/w84/nav03/designer-audit.md` |
| Worker UI audit | `out/w84/nav03/ui-audit.md` |
| Live | `src/systems/galaxychart.js`, `src/systems/hud.js`, `src/ui/hud.css`, `src/style.css`, `src/systems/controls.js`, `src/systems/gate.js` |

Recheck scope (owner): chart header live refuse above HUD `z-index` 10 / under chart `z-index` 30; ignore steer-break while chart open; clickable refuse; interrupt English; Cancel chip true top-center, not under `.rw-banner`.

## Prior Blocker / Major disposition

| Prior finding | Severity | Status | Where closed |
|---|---|---|---|
| MATCH / §6 refuse not visible while chart open | 🔴 Blocker | **Closed** | Contract §1.8, §3.3, §8.1; brief §7–8. Header `role="status"` `aria-live="polite"` is the visible reporter. `#hud` toasts (`style.css:28` `z-index: 10`) stay secondary under `.rw-galaxy-chart` (`hud.css:1421–1431` `z-index: 30`). |
| Chart Autopilot click can instantly cancel via steer-break | 🔴 Blocker | **Closed** | Contract §5 `input` row; brief §4 step 1 and closed Q6. Ignore steer arm while `flags.galaxyChart`. Re-arm after hypot stays below 0.65 for one frame. WASD / throttle / afterburner / drift still cancel. Live reticle still always writes steer (`controls.js:7–11, 384–398`); chart still does not pause (`galaxychart.js:21–24`). |
| `aria-disabled` is not a reason string; native `disabled` kills click-refuse | 🟠 Major | **Closed** | Contract §8.1; brief §7. Native `disabled` only for no dest / no route. MATCH and other dest-present §6 refuses stay clickable (`aria-disabled="true"` + intercept + `aria-describedby` live node). Do not dump English into `aria-disabled`. |
| Interrupt / refuse copy not frozen except MATCH | 🟠 Major | **Closed** | Contract §8.3 full player map. Tokens never print. Dest ids never print. Chart-open refuse = header live region **plus** `commLine`. Chart-closed = `commLine` + chip. No NAV-02 `NO ROUTE` toast on the aim column. |
| “Top-center under the system banner” names the wrong live slot | 🟠 Major | **Closed** | Contract §8.2 pin: `#hud .rw-autopilot { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); }`. Live `.rw-banner` is top-right (`hud.js:597–601` `top: 96px; right: 14px`). Toasts are `top: 14px; right: 168px` (`hud.css:589–593`). Not hub (`hud.js:1077`). Not `.rw-jump` (`hud.js:632–646`). Not `.rw-nav-readout`. |
| Space on focused Autopilot / Cancel also fires afterburner | 🟠 Major | **Closed** | Contract §8.1 and §10. Button `keydown` Space: `preventDefault` so the button does not activate. Click or Enter only. Afterburner may still fire (and `input`-cancel if flying). No Digit / KeyM bind. Live: Space is TRACKED + PREVENT_DEFAULT (`controls.js:20, 43–47, 253–260`); chart does not swallow Space (`galaxychart.js:21–24, 240–250`). |

## UI Audit: Autopilot chart button + in-flight Cancel chip

### Summary

The freeze now matches live occupancy on the five recheck items. Chart-open refuse lives on the overlay (child of `z-index` 30), not under HUD toasts. Header clicks are not helm. Refuse-worthy Autopilot stays clickable. §8.3 English is frozen. Cancel is pinned to the empty top-center band, not `.rw-banner`. No 🔴 or 🟠 remain. Verdict **CLEAN**.

### What's done well

- Refuse reporter is a chart header live region, not `#hud .rw-toast`. Live stacking still matches the original defect (`style.css:24–28` vs `hud.css:1421–1431`; chart root is on `document.body`, `galaxychart.js:227`).
- Steer-break suppress is explicit while `flags.galaxyChart` (§3.4 writer `galaxychart.js` only). Header hypot ~1 is no longer an engage-then-cancel trap.
- Native `disabled` is reserved for empty plot. MATCH with a dest still receives a click and a reason node.
- §8.3 covers MATCH, no dest, already-there, docked, jumping, paused, combat, hull, missing hop, cancel, input, combat/hull/sun/impact/missingGate/blocked/dock/pause/hail interrupts, arrive, and silent restore.
- Chip CSS is a literal pin, not “under the banner”. Occupancy vs CONTROLS (`hud.css:882–887` `top: 14px; left: 14px`), toasts (`hud.css:589–593`), banner (`hud.js:597–601`), jump (`hud.js:632–646` `pointer-events: none`), and 80 px hub (`hud.js:1077`) is named.
- Space / Enter split is frozen. Digit 0–9 and KeyM stay (`galaxychart.js:240–250`; `controls.js:41, 289–301`).
- Autopilot stays in the header with no dest (`§8.1`). Combat chip classes are forbidden (`.rw-fade` `hud.css:88`, `.rw-chartmark` `hud.css:586`, `.rw-aux` `hud.css:814–815`).
- Jump-charge Cancel stays on the top chip. Gate fade is already inert (`gate.js:484–486` `z-index: 40; pointer-events: none`).

### Findings

No 🔴 Blocker or 🟠 Major remain in this freeze.

#### 🟡 Minor: Header cluster + live region still share one `space-between` row

**Location:** contract §8.1; live `.rw-galaxy-chart-header` `hud.css:1455–1460`; close control `hud.css:1472–1488`; `galaxychart.js:89–104`  
**Issue:** Freeze wraps Autopilot + × in `display: flex; gap: 8px`. It does not pin the 4 s status node off that row. “Cancel autopilot” + MATCH line + × on a `92vw` panel can wrap or shove the title.  
**Fix:** PR6: cluster on the right (Autopilot + ×). Put `role="status"` on a second header line or under the title, not between the buttons. Keep min height ~24 px and copy `.rw-galaxy-close:focus-visible`.  
**Why open:** impl not landed.

#### 🟡 Minor: Chip must not inherit combat fade from a parent

**Location:** contract §8.2; `hud.css:88, 586, 814–815`  
**Issue:** Wrapper `.rw-fade` / `.rw-aux` / `.rw-chartmark` would hide or dim Cancel the same frame combat drops AP. Freeze already forbids those classes on the root.  
**Fix:** PR6 pin: chip root `.rw-autopilot` only, mounted on `#hud`, not inside `.rw-bottom` aux.  
**Why open:** impl not landed.

#### 🟡 Minor: Sun heat at engage has interrupt English, not a refuse line

**Location:** contract §5 `sun` (“Also refuse engage if already in heat”); §6 engage list omits sun; §8.3 has only `Autopilot cancelled — star heat.`  
**Issue:** A chart click while already in heat can print the cancel line or a token. Rare. Not silent MATCH.  
**Fix:** PR6: add `Autopilot refused — star heat.` or reuse the cancel line only after engage. Do not print `sun`.  
**Why open:** copy hole, not occupancy.

#### 💡 Suggestion: Contrast + reduced-motion + sole-interactive comment in PR6

**Location:** `hud.css:6, 889–890, 958–965`; `hud.js:897–898`  
**Issue:** Contrast list names `.rw-jump` / `.rw-banner`, not `.rw-autopilot`. Live comment still says CONTROLS is the only `pointer-events: auto` HUD control.  
**Fix:** List `.rw-autopilot` beside `.rw-jump` under `body.rw-contrast`. No pulse. Copy close `:focus-visible`. Update the comment when Cancel lands.

#### 💡 Suggestion: Narrow viewports — chip vs CONTROLS / toasts

**Location:** contract §8.2; `hud.css:589–593, 882–887`  
**Issue:** Dest name + hop name + remaining + Cancel at `top: 14px; left: 50%` can meet CONTROLS (`max-width: 280px`) and toasts (`right: 168px`) under ~800 px. HUD-01 closed; do not move those slots.  
**Fix:** PR6: wrap chip text, ellipsis names from `SYSTEMS[].name`, keep Cancel as the last flex child. Do not slide under `.rw-banner`.

### Recheck: five owner items

| Item | Verdict | Evidence |
|---|---|---|
| Chart header live refuse (not under HUD `z-index` 10) | Pass | §8.1 status node on the chart. Live overlay `hud.css:1431` covers `#hud` `style.css:28`. |
| Ignore steer-break while chart open | Pass | §5 + §3.4. Header click is not helm. WASD still cancels. |
| Clickable refuse | Pass | §8.1 native `disabled` only no dest. MATCH stays clickable. Tests §12 last two rows. |
| Interrupt English | Pass | §8.3 table. Tokens and dest ids forbidden. |
| Cancel chip top-center, not under banner | Pass | §8.2 `top: 14px; left: 50%`. Live banner is top-right `hud.js:597–601`. |

### Focus checklist (this freeze)

| Topic | Verdict |
|---|---|
| Autopilot on chart | Pass (placement + refuse surface + click/steer). |
| In-flight Cancel off 80 px hub | Pass (`hud.js:1077` forbidden). |
| Cancel off jump bar | Pass (not `.rw-jump`; jump `pointer-events: none`). |
| Cancel during jump | Pass (`cancel` token still live; fade inert `gate.js:486`). |
| MATCH refuse visible | Pass (header live region). |
| Interrupt messaging | Pass (§8.3). Sun engage refuse is 🟡 only. |
| Keyboard vs click | Pass (Space `preventDefault` on the button; Enter/click activate). Digit/KeyM unstolen. |
| Digit 0–9 stay | Pass. Hail interrupt keeps hail digits. |
| KeyM stays | Pass. Chart toggle untouched. |
| Disabled / empty (no route) | Pass (always visible; native `disabled` + aria-label). |

### Accessibility checklist (design)

- [x] Named controls (Autopilot / Cancel); `aria-label` tracks `textContent`
- [x] Chart-open refuse visible/audible (header `aria-live`, not HUD toast)
- [x] Keyboard: no Digit / KeyM steal; Enter activates; Space does not
- [x] `aria-disabled` is boolean; reason lives in `aria-describedby` node
- [x] Native `disabled` only for no dest
- [x] Contrast tokens named; high-contrast hook named for later CSS
- [x] No hub / jump-bar / banner overlap
- [x] Names from `SYSTEMS[].name`
- [x] No `innerHTML`
- [ ] Focus rings: copy close button in PR6 (not a freeze defect)

### Theming / states / hierarchy

| State | Freeze | Live gap |
|---|---|---|
| Hover | Copy `.rw-galaxy-close` | Close has hover (`hud.css:1484–1487`) |
| Focus | Copy `:focus-visible`; Space does not activate | CONTROLS toggle has hover only (`hud.css:902`) |
| Disabled | Native only no dest; MATCH clickable | — |
| Empty (no dest) | Show Autopilot, native `disabled` | Header is title + × today |
| Loading | N/A | — |
| Error / refuse | Chart live region + `commLine` | No AP DOM yet |
| Jumping | Hold heading; Cancel live | Do not hide chip (NAV-02 readout **does** hide) |
| Combat | No `.rw-fade` / `.rw-aux` / `.rw-chartmark` | Pin in PR6 |

### Verdict

**CLEAN.** No 🔴 Blocker or 🟠 Major remain. Both prior Blockers and all four prior Majors are closed in the contract. Hub / jump / Digit / KeyM / cancel-during-jump still pass. PR6 may land against this freeze. Remaining 🟡/💡 are impl pins, not occupancy defects.

Worker `out/w84/nav03/ui-audit.md` agrees: no 🔴/🟠 in the freeze. This recheck does not reopen those items.
