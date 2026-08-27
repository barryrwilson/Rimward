## Status
CLEAN

## Design audit
- Method: designer checklist
- Resolved: Title, origin, and agent-badge visuals match the prior overlay. API hooks reuse the same close/choose paths as click and key. No Blocker. No Major.
- Open: none
- File: out/w136/api/ui-audit.md

## UI Audit: title overlay, origin overlay, agent badge

### Summary
The worker added programmatic APIs only. Overlay DOM, CSS, copy, focus, and badge paint did not change. `src/style.css` is not in the diff.

### What's done well
- `titleApi.start()` calls the existing CONTINUE or NEW GAME `run()` closures, so close and confirm visuals stay on the same path as a click (`src/systems/title.js:84-97`, `src/systems/title.js:258-277`).
- `originsApi.choose()` calls the same `choose(id)` as click and Digit1-5, so the overlay still removes, unpauses, and emits `originChosen` (`src/game/origins.js:124-134`, `src/game/origins.js:162-170`).
- Title markup, classes, aria, button labels, and legend are unchanged (`src/systems/title.js:143-186`).
- Origin overlay inline styles, title copy, row copy, hover, and footer copy are unchanged (`src/game/origins.js:104-151`).
- Agent badge still paints opt-in state, last command name, and error only (`src/systems/agent-api.js:438-449`, `src/systems/agent-api.js:542-555`).

### Visuals unchanged (citations)

| Surface | Evidence |
| --- | --- |
| Title overlay DOM/CSS/copy | `src/systems/title.js:143-186` — same `screen-overlay title-overlay`, `role="dialog"`, `aria-label`, buttons, legend. Diff adds `closedTitleApi`, `titleOpen`, and `ctx.titleApi` only. |
| Title close | `src/systems/title.js:249-256` — still `root.remove()` plus key listener teardown. New `titleOpen` guard does not change markup. |
| Origin overlay DOM/CSS/copy | `src/game/origins.js:104-151` — same inline styles, `RIMWARD — who are you?`, row labels, hover, footer. Diff adds `closedOriginsApi`, `overlayOpen`, and `ctx.originsApi` only. |
| Origin close | `src/game/origins.js:125-134` — still `root.remove()`, unpause, `originChosen`. |
| CSS | `src/style.css` — no diff. Badge rules `.rw-agent-badge*` unchanged. |
| Agent badge paint | `src/systems/agent-api.js:542-555` — still `Last:` + name and `Error:` + error. `BADGE_COPY` has no queued string (`src/systems/agent-api.js:438-449`). |
| Observe session phase | `src/game/agent-observe.js:289-307` — observation payload only; no HUD or overlay node. |

### Findings

No 🔴 Blocker.
No 🟠 Major.

Pulse/dock/hail may store `lastIntent.status = 'queued'` (`src/systems/agent-api.js:188-192`, `src/systems/agent-api.js:393-407`). Badge paint does not read `status` (`src/systems/agent-api.js:552-555`). This is not a visual regression: the badge still shows the last command name, same as before this field existed.

#### 💡 Suggestion: queued status stays off the badge
**Location:** `src/systems/agent-api.js:552-555`
**Issue:** `status: 'queued'` is stored but never painted.
**Fix:** Leave as-is unless a later pass needs a queued label. Do not change overlay copy for this.
