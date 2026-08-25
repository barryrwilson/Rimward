## UI Audit: PR1 toast-flood (`.rw-toasts` / `pushToast`)

**Wave:** 120  
**Scope:** `src/systems/hud.js` toast channel; `src/ui/hud.css` `.rw-toasts` / `.rw-toast`; merge law `out/w118/toast/shared-contract.md`; `docs/Hud04ToastFloodDesign.md`.  
**Not product source.** Worker self-pass stays in `out/w120/toast/ui-audit.md` (not overwritten).  
**Product UI:** not edited.

### Summary
The toast channel meets the leftover contract. Five chips sit top-right, off the aim column. The live region stays polite. Linger tracks keys, not chip index. Expire hides from AT and keeps copy. Identical refresh does not rewrite `textContent`. Autosave vs berth is readable text plus a glyph. No Blocker. No Major.

### Verdict
**CLEAN**

### What's done well
- Boot chips start `aria-hidden="true"` (`hud.js:852`). Empty nodes are not in the polite region.
- `.rw-toasts` is one `role="status"` `aria-live="polite"` (`hud.js:846–847`). Not assertive. Chips have no second live region.
- Real show: `aria-hidden="false"` then `textContent` then class (`hud.js:1209–1211`).
- Identical visible refresh extends `until` and bumps linger only. No `textContent` write (`hud.js:1190–1195`).
- Expire: remove `show`, set `aria-hidden="true"`, keep `textContent`, do not clear linger (`hud.js:1240–1244`).
- Linger is a five-row `{ key, lastShown }` ring (`hud.js:849–854`, `531–555`). Chip reuse does not drop a key. Pirate-bubble 8 s can survive four other lines.
- `saveBlocked` copy is distinct text: `▲ AUTOSAVE HELD — hostiles near` vs `▲ SAVE BLOCKED — ` + reason (`hud.js:596–600`). Color is not the only cue.
- Glyph prefixes stay (`▲` / `✧` / `■` and siblings) in `toastForEvent`.
- `TOAST_SLOTS` stays 5 (`hud.js:65`, `850–855`). Place stays `top: 14px; right: 168px` (`hud.css:635–646`). `pointer-events: none` stays.
- No `.rw-toasts` z-index. `#hud` stays 10 (`style.css:28`). Hail 40 / chart 30 / berth 60 are not claimed.
- Optional hide `.rw-toast:not(.show) { visibility: hidden; }` (`hud.css:734`) is a hide, not a z raise.
- Toast colors use HUD tokens (`--cyan` / `--amber` / `--red` / `--green` / `--white`). Contrast override already includes `.rw-toast` (`hud.css:1168–1176`).
- Toasts are not controls. Missing hover/focus/disabled is correct. `textContent` only (no `innerHTML`).

### Findings

No 🔴 Blocker.  
No 🟠 Major.

#### 🟡 Minor: `:not(.show) { visibility: hidden }` skips the 0.35 s fade
**Location:** `src/ui/hud.css:734` with transition at `hud.css:729`  
**Issue:** Dropping `.show` sets `visibility: hidden` at once. Opacity/transform fade no longer plays.  
**Suggestion:** Allowed by merge law as a hide, not a z raise. Keep. Do not add a new motion rule (`reducedMotion` already kills HUD transitions at `hud.css:1186–1187`).  
**Status:** accepted — contract-allowed hide.

#### 💡 Suggestion: long berth reason may clip at XL text scale
**Location:** `src/ui/hud.css:730` (`white-space: nowrap`)  
**Issue:** Pre-existing nowrap. AUTOSAVE HELD is short. Hostile berth sentence can clip at high `--rw-text-scale`.  
**Suggestion:** Out of this leftover. Do not grow slots. Do not move the stack onto the aim column.  
**Status:** out of scope.

#### 💡 Suggestion: init comment still says top-center
**Location:** `src/systems/hud.js:843`  
**Issue:** Comment says “top-center toasts”. Live CSS is top-right, off the aim column. Not a player-facing defect.  
**Suggestion:** Align the comment on a later cleanup. Do not change geometry.  
**Status:** nit.

### Focus checklist (contract)

| Check | Result | Cite |
|---|---|---|
| Polite, not assertive | Pass | `hud.js:847` |
| No second live region on this channel | Pass (banner/nav polite regions are siblings, not added here) | `hud.js:844–847` vs `860`, `1012–1013` |
| Expire `aria-hidden=true`; keep `textContent` | Pass | `hud.js:1240–1244` |
| Real show unhide then text | Pass | `hud.js:1209–1210` |
| Identical refresh does not rewrite `textContent` | Pass | `hud.js:1190–1195` |
| Color not the only cue (glyph prefixes) | Pass | `hud.js:596–600` and other `toastForEvent` cases |
| Five slots; top-right off aim | Pass | `hud.js:65,850–855`; `hud.css:635–639` |
| No z-index raise over hail/chart/berth | Pass | `hud.css:635–646`; `#hud` `style.css:28` |
| Optional `visibility:hidden` on `:not(.show)` | Pass (hide, not z) | `hud.css:734` |
| Linger independent of chips (not Major) | Pass | `hud.js:531–555,849–854,1193,1212,1240–1244` |

### States
Toasts are output-only. Empty = hidden chips with `aria-hidden`. Error/warn is the line copy (`warn` / `danger` class + glyph + words). No loading or disabled control. Hover/focus not required (`pointer-events: none`).

### Method
Read `hud.js` toast init, `pushToast`, expire, linger, `toastForEvent` `saveBlocked`. Read `hud.css` stack and chip rules. Cross-check shared-contract §0.19 and HUD-04. Did not start Vite. Did not edit product UI.
