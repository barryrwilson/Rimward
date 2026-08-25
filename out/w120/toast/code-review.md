## Code Review: Wave 120 PR1 toast-flood

### Summary
`pushToast` matches merge-law order: visible extend, linger suppress, allocate, unhide then text. Expire and `saveBlocked` copy match the contract. No Blocker or Major findings.

### What's done well
- Linger ring is independent of chip index (`toastLinger` vs `toastSlots`).
- Lazy linger clear only when `now > lastShown + WINDOW`.
- Visible refresh does not rewrite `textContent`.
- Expire does not clear linger or `textContent`.
- Unknown / missing `source` uses the manual copy.
- `save.js` tags existing emit sites only; berth panel / KeyL untouched.
- `TOAST_LIFETIME`, `TOAST_SLOTS`, `frameLines` kept.

### Findings

No 🔴 Blocker.  
No 🟠 Major.

#### 🟡 Minor: equality at `lastShown + WINDOW` neither suppresses nor clears
**Location:** `src/systems/hud.js:534–539`  
**Issue:** Clear uses `now > lastShown + WINDOW`. Suppress uses `now < lastShown + WINDOW`. At exact equality the row stays and a new show is allowed.  
**Fix:** Acceptable. Window is 8 s of elapsed; a later retry is not frame-exact. No change required.

#### 💡 Suggestion: `slot.key` kept on expire
**Location:** `src/systems/hud.js:1240–1243`  
**Issue:** Live Wave 118 expire cleared `key`. Contract expire block keeps it. Visible match still requires `until > now`.  
**Fix:** Keep as-is (merge law).

### Method
Self-applied `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` plus `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. No subagent spawn.

### Second pass
Re-read `pushToast` / linger / expire / `toastForEvent` `saveBlocked`. Still no Blocker/Major. Probe pins passed.
