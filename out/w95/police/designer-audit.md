## UI Audit: police leave comm toast

### Summary
Wave 95 police leave adds no HUD chrome. The player-facing surface is the existing `commLine` toast with copy `Leave this space.` Layout stays off the aim glass. Reduced motion still shows the line at full opacity. No 🔴 Blocker or 🟠 Major findings.

### Scope checked
- `src/game/police-leave.js` — emit only
- `src/systems/npc.js` — `tickPoliceLeave(ctx)` call
- `src/systems/hud.js` — `toastForEvent` `commLine` case, `pushToast`, live region
- `src/ui/hud.css` — toast placement, tokens, reduced-motion
- Worker self-audit `out/w95/police/ui-audit.md` — verified, not copied blindly

### Focus results
| Check | Result |
| --- | --- |
| Toast readable, not covering aim glass | Pass |
| Reduced motion still shows the toast | Pass |
| Copy exact; HUD may uppercase | Pass (uppercase is existing HUD) |
| No hail card, no extra HUD chrome | Pass |
| `aria-live` if toasts already have it | Pass (existing polite status) |

### What's done well
- One existing channel: `ctx.emit('commLine', { text: POLICE_LEAVE_LINE })` at `src/game/police-leave.js:123` with `POLICE_LEAVE_LINE = 'Leave this space.'` at `:5`. No `hailOpened`, no song sting, no new overlay node.
- HUD maps `commLine` to `{ text, cls: 'comm' }` at `src/systems/hud.js:481-489`. Write path is `slot.el.textContent = text` at `:1103`. No innerHTML.
- Toast stack sits top-right, explicitly off the aim column: `src/ui/hud.css:634-646` (`.rw-toasts { top: 14px; right: 168px; left: auto; }`). Center reticle is `.rw-reticle` at `:184-193`. Combat rails sit at `top: 57%` (`:884-903`). Chip stack is the center-top band (`:648-658`). The leave line does not sit on the aim glass.
- Copy is short. `.rw-toast { white-space: nowrap; }` at `:730` does not clip this sentence.
- Type uses tokens and scale: `font-size: calc(11px * var(--rw-text-scale, 1))`, `.rw-toast.comm { color: var(--cyan); border-left-color: var(--cyan); }` (`:717-734`). High-contrast override already includes `.rw-toast` (`:1155-1164`).
- Live region is already on the stack: `role="status"` and `aria-live="polite"` at `src/systems/hud.js:761-762`. Pointer-events none on `.rw-toasts` (`hud.css:645`) so the toast does not steal aim input.
- Reduced motion kills HUD transitions (`hud.css:1171-1177`) but `.rw-toast.show { opacity: 1 }` (`:733`) still applies. Adding `show` sets opacity 1 with no fade and no extra pulse.
- Empty slots stay `opacity: 0` until `show`. Appear / expire is the only state this surface needs. No hover/focus/disabled contract: the toast is not a control.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 💡 Suggestion: Existing uppercase treatment
**Location:** `src/ui/hud.css:720`
**Issue:** `.rw-toast { text-transform: uppercase; }` displays `LEAVE THIS SPACE.` Event copy stays `Leave this space.` as required (`src/game/police-leave.js:5,123`). This is existing HUD behavior for all comm toasts, not a Wave 95 change.
**Suggestion:** Do not change HUD. Do not special-case this line.
**Status:** Accept as existing. No product change.

### Accessibility
- Contrast: comm toast uses `--cyan` (`#6ff2e0` via `--rw-accent`) on a dark scrim `rgba(2, 6, 13, 0.78)`. Readable.
- Semantic: status live region, no fake button, no extra card.
- Focus rings: not applicable (non-interactive).
- Screen readers: polite announcement of the same string the HUD writes via `textContent`.

### Theming
- Comm color is token `--cyan`, not a one-off hex on this feature.
- Toast panel/border still use existing hardcoded rgba (same as other HUD chips). Not introduced here. Do not treat as a Wave 95 defect.

### Responsive / hierarchy
- No `@media` in `hud.css`. Toast is a short nowrap chip, right-aligned, five-slot stack. Unlikely to reach the center reticle on a normal flight viewport.
- Visual rank: comm class (cyan) is the existing info voice, not warn/danger. Matches a leave order that is not a hunt.

### States
- Loading / error / empty / disabled / hover / focus: N/A for a non-interactive toast.
- Visible: `.show` for `TOAST_LIFETIME` (4s) at `src/systems/hud.js:59,1102-1104`.
- Hidden: `classList.remove('show')` at `:1135`. Reduced motion still reaches this opacity-1 shown state.

### Reduced motion
Still shows the toast. Transitions off. No extra pulse. Pass.

### Hail / extra chrome
`src/game/police-leave.js` has no hail emit. `src/systems/npc.js:2331` only calls `tickPoliceLeave(ctx)`. No new CSS class. No hail card.

### Re-review
HUD/CSS unedited for this wave. `textContent` path, top-right placement, live region, and reduced-motion opacity hold. Verdict: CLEAN.
