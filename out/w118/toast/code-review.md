# Code Review: HUD-04 leftover toast-flood (Wave 118)

Design-only. Inventory re-census: `TOAST_LIFETIME` **4** / `TOAST_SLOTS` **5** (`hud.js` **64–65**); `.rw-toasts` polite status (**813–816**); `pushToast` visible same-key only (**1155–1157**); expire clears `key` (**1197–1201**); `frameLines` same-frame (**532–539**, **1183**); `saveBlocked` copy no source (**568–569**); autosave emit `{ reason }` (`save.js` **1039–1041**); idle retry **5** s (**70**, **1588–1590**); hostile reason berth wording (**1028**); berth emits no source (**1414**, **1420**, **1527**, **1532**). Overlay sibling already imports `overlay-policy.js` (`save.js` **14**). MERGE LAW deputizes 8 s window + **key linger ring independent of chips** + expire `aria-hidden` + distinct copy; forbids extra slots, persist, pause, overlay steal, toast z, hail toasts, chip-tied linger. Census leftover is **real** (not CONSUME; serial **PR1 toast-flood**). No open 🔴/🟠. Designer Majors closed in this freeze.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **toast identical-repeat + autosave/berth mix**; smallest additive is a session **key linger ring** (not chip-tied) plus emit `source` plus expire `aria-hidden`; play loop **never** pauses; PR plan is named-only **PR1 toast-flood**. Overlay file-share on `save.js` is called out as emit-tag vs berth-panel.

### What's done well

- Re-census treats live 5 s blink + mix copy as leftover, not CONSUME.
- Does not treat wave-6 `frameLines` as the fix.
- Refuses extra slots (would not stop identical flood; would hide the inbox).
- Refuses pause-the-sim and persist linger.
- Write-set names `hud.js` **toast only** so HUD-02 rails stay sibling-owned.
- `save.js` limited to **emit payload**; overlay keeps KeyL / `setBerthOpen`.
- `controls.js` / KeyJ explicitly forbidden (CTL-01).
- Overlay z / hail toasts forbidden (CTL-02 sibling).
- P2 chart-label a11y and close-chart-on-AP called out.
- Digit 0/8/9 and HUD-01 hub frozen.
- Fail-closed table covers missing source, empty text, helper miss.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | §0.1 not CONSUME; serial not none | Match |
| Serial name | **PR1 toast-flood** | §3 | Match |
| Window | 8 s | §0.1 `TOAST_DEDUP_WINDOW = 8` | Match |
| Linger | last five **keys**, not chip index | §0.1 / formulas | Match |
| Expire a11y | `aria-hidden`; keep text | §0.19 | Match |
| Slots | 5 | §0.20 | Match |
| Autosave copy | AUTOSAVE HELD | formulas | Match |
| Persist | none | §0.6 | Match |
| Digit / hub / `state.js` | no | §0.2–0.5 | Match |
| `innerHTML` | no | §0.4 | Match |
| Overlay / toast z / hail toast | do not steal | §0.8 | Match |
| `showApLive` / close-chart-on-AP | do not steal | §0.9 | Match |
| KeyJ | cite only | §0.3 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Slot-tied linger loses pirate-bubble window

**Location:** prior contract “clear linger when the slot is reused.”

**Issue:** Four other lines reuse chips; AUTOSAVE HELD linger dies; 5 s retry restacks.

**Fix:** Linger ring of last five keys. Chip reuse does not clear. Designer re-dispatch Bug 1.

**Status:** closed in contract formulas.

#### 🟠 Major (closed in freeze): Expire leaves text in polite live region

**Location:** live expire `hud.js` 1197–1201; prior freeze omitted `aria-hidden`.

**Issue:** Faded chips stay in `aria-live=polite` with stale `textContent`.

**Fix:** expire `aria-hidden="true"`; real show unhide then write. Designer re-dispatch Bug 2.

**Status:** closed in contract §0.19 / §2.

#### 🟡 Minor: `save.js` is in both overlay and toast later write-sets (disjoint symbols)

**Location:** contract §4; overlay Wave 118 `save.js` berth panel + `overlay-policy.js` import (**14**); this leftover emit tag `save.js` 1039–1041, 1414, 1420, 1527, 1532.

**Issue:** Two named serials may edit one file. A sloppy overlay PR1 that reformats `trySave` could drop `source`. A sloppy toast PR1 that rewrites KeyL fights overlay.

**Fix:** Toast PR1 touches **emit payloads only**. Overlay PR1 touches **`setBerthOpen` / KeyL / update close only**. Re-grep `source:` and `setBerthOpen` after merge.

**Status:** documented; serial coupling, not a Wave 118 defect.

#### 🟡 Minor: Jump-pending 0.5 s `saveBlocked` still sings

**Location:** `save.js` 1570–1583; `song.js` 91.

**Issue:** HUD window suppresses visual blink while the 4 s chip is up; `song.js` still hears every emit. Cadence retune is **autosave math** (forbidden). Overlay also forbade autosave math.

**Fix:** Do not expand write-set to `song.js`. Record as residual. Optional later owner if the chirp is loud.

**Status:** documented residual. Not a freeze contradiction. Not CONSUME.

#### 🟡 Minor: Missing `source` fail-closed looks like today’s mix until tag lands

**Location:** contract §2 unknown/missing source → SAVE BLOCKED.

**Issue:** HUD-only merge would still collapse identical SAVE BLOCKED (window) but autosave would still **read** as berth.

**Fix:** PR1 lands **window + tag + copy** together (contract §2 partial merge).

**Status:** frozen.

#### 💡 Suggestion: Do not “fix” stale top-center toast copy in `HudUtilityChangeProposal.md`

**Location:** `docs/HudUtilityChangeProposal.md` ~67 vs live `hud.css` 635–646.

**Issue:** Utility proposal still says toasts sit top-center. This leftover must **not** edit that doc (honor Hud*).

**Fix:** Inventory records the drift. Leave the proposal to other workers.

**Status:** frozen.

### Verdict

Spec is consistent with live code. Leftover REAL. Serial named only. No src/. No open Blocker/Major.
