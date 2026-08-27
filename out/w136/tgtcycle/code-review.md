## Code Review: TGT-07 PR1 `cycleTarget` hostiles-first

### Summary

Gated sort matches merge law: hostiles-first then `d2` when an in-envelope cand is hostile; else live d2-only wrap. Empty lock takes the first of the sorted list. Rocks and kinds stay out of the hostile bucket. No Blocker/Major.

Persona: reviewer + orchestrator `code-review.md` (self-applied; no spawn).

### What's done well

- One candidate walk (`collectCycleCands`); gate and sort reuse `cands`.
- Hostile test is fail-closed (`object`, `state`, no `lockKind`, `ai.intent === true`).
- Wrap formula unchanged: `(idx + 1) % n`.
- Help is one `config.controls` string. TRACKED / KeyV/X/K / Digit 0/8/9 untouched.
- `ctx.js` comment only; input schema unchanged.
- Non-finite `d2` and missing `position` skip in the same walk.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor

None that need a fix in this PR. Equal `d2` has no id tie-break (contract). Modern JS sort is stable; live d2-only already had the same rule.

#### 💡 Suggestion: [Title]

**Location:** `src/systems/controls.js` ~179–184  
**Issue:** `isCycleHostile` runs again inside the sort comparator. Cost is tiny on the envelope list.  
**Fix:** Optional later: stamp a `hostile` bit while scanning for the gate. Not required for PR1.

### Contract trace

| Acceptance | Live |
|---|---|
| Empty lock + intent at 59 u + nearer friendly | first of sorted list = hostile |
| No in-envelope hostile | `cands.sort((a, b) => a.d2 - b.d2)` |
| Hostile bit | `ref.ai && ref.ai.intent === true` + live ship |
| Gate | cand list, not `flags.combat` |
| Wrap | `(idx + 1) % n`; `idx === -1` → index 0 |
| Rocks | group 3 collect; never hostile |
| Kinds | not gathered |
| Q-ship | intent only |
| Help | `'T — cycle target (hostiles first in combat)'` |
| Never throw | try/catch |

### Verdict

Approve PR1. No re-run required.
