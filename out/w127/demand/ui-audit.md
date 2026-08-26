## UI Audit: Hail01 pirate demand card and toasts

### Summary
The demand card names the speaker, the UU, the seconds, and the three live verbs. Outcome toasts use authored literals and a stable key. No new hub child. Home marker layout is unchanged. Boot re-dispatch keeps mixed-case toast `textContent` (`{name} — heave to.`).

### What's done well
- Card header stays `HAIL — {speaker}`. Demand line is `{name} heaves to — {n} UU or hull. {t}s.`
- Buttons keep Wave 30 verbs: `Pay tribute — {n} UU` / `Show teeth — reveal the hidden mounts` / `Refuse — and fight`.
- Announce toast: `{name} — heave to. Pay {n} UU or fight. {t}s.` (`warn`).
- Outcome toasts match the contract table (`good` for paid/bluffed; `warn` for the rest).
- Color is not the only cue: name, seconds, and verbs are text.
- Toast path is `textContent` / `el()` only. No `innerHTML`. Slot count stays 5. Linger stays 8 s.
- No aim-glass demand pip. HUD-06 `.rw-home-mark` / POS HOME / hide-on-hail untouched.

### Findings

None Blocker or Major.

#### 🟡 Minor: Card uses existing uppercase style
**Location:** `src/systems/hail.js` hail card `text-transform:uppercase`
**Issue:** The demand line renders in uppercase on the card. Toast copy stays mixed case.
**Why it stays:** Live hail card already uppercases all hail copy. Do not restyle the card in this PR.
**Status:** accepted

#### 💡 Suggestion: Announce toast is a 4 s snapshot
**Location:** HUD toast lifetime 4 s vs card timer 20 s
**Issue:** Toast seconds do not tick after announce. The card line does tick.
**Why it stays:** Re-toasting each second would flood HUD-04. Card is the live timer.
**Status:** accepted

### A11y
- Named source in header, line, and toast.
- Deadline in the card line as `{t}s`.
- Compliance verbs named on buttons with Digit 1..n.
- No new Digit. Hail digits stay resolution on an open card.
