# UI Audit: CTL-04 PR1 Digit1–5 weapon-group skip (Wave 125)

Checklist: orchestrator `ui-audit.md`. Self-applied. Did not spawn `[designer]`.

## UI Audit: `src/systems/controls.js` (input scoping; no new chrome)

### Summary

PR1 adds no HUD nodes, no copy, no `innerHTML`. WPN rail still uses live `weaponHudLabel`. While dock / hail / chart / berth / settings / pause / title own Digit1–5, the rail **does not silently change**. Open-space 1–5 still cycle groups. No Blocker or Major.

### What's done well

- No “not available” string.
- Station legend still `1-9, 0`. Flight help still `1/2/3/4/5` weapon group (`controls.js` help push unchanged).
- Digit prefix in `weaponHudLabel` stays the group cue (HUD-01 empty hub; no new pip).
- Digit 0 / 8 / 9 stay station chrome. Controls does not steal them.
- Hail Digit1–3 still resolve intents when `hailDigitsAllowed`; WPN does not also jump.
- Keyboard reach: same Digit keys; ownership is scoped, not remapped.
- `reducedMotion` n/a. No new motion.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: No extra cue that dock digits are station-owned

**Location:** station overlay + HUD WPN rail (unchanged)

**Issue:** After PR1, tapping 5 at dock opens Repair and leaves WPN as-is. A player who expected to swap groups while docked sees no toast. Contract forbids “not available” and new chrome. Owner freeze: cannot change WPN while docked is the point.

**Fix:** None in PR1.

**Status:** accepted.

#### 💡 Suggestion: Hail.js still comments the old dual-bind

**Location:** `hail.js` **431–432** (out of write-set)

**Issue:** Comment can confuse a later HUD pass.

**Fix:** Other worker. Not UI chrome.

**Status:** accepted.

### Player-facing flows (spec check; Vite not started)

1. Dock. Snapshot WPN. Digit5 Repair. Group unchanged. Digit4 Feed. Group unchanged (must not become empty group 4).
2. Digit 0 shipyard. Digit 8/9 station. Open space Digit1–5 set WPN.
3. Hail open: Digit1–3 resolve hail; no `weaponGroup` write.
4. Chart / berth / settings / pause: Digit1–5 do not write `weaponGroup`.
5. Direct `ctx.input.weaponGroup = n` still works.

### Verdict

Pass. No new chrome. WPN rail no longer changes behind station menus.
