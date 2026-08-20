# Code Review: HUD-02 PR1 family hook (`src/systems/hud.js`)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** `src/systems/hud.js` export + init + 5 Hz path; `scripts/boot-test.mjs` WAVE62; `out/w62/hook/probe.mjs`.  
**Pass:** 2 (re-apply after `last.kind` rename so the required `hullKind =` grep is clean).

### Summary

The hook matches §3.1: exported `hudFamily`, init write, 5 Hz write-on-change, fail-closed `rw-hair-off`, no tree rebuild. Probe and WAVE62 pins are all-true. No blockers or majors.

### What's done well

- `hudFamily` matches the specified token order: session override, missing player, `built` / `living`, `isBeautiful`, default `'bio'`.
- Dataset write is init-once plus 5 Hz token change only. Per-frame path is untouched.
- No new objects on the 5 Hz path (scalars + existing `last` fields).
- Restore-after-`initHud` is pinned: `hullKind = 'built'` then `update` / `tick` > 0.2 s sets `data-family="mech"`.
- Export surface is `hudFamily` only. `sessionHudFamilyOverride` stays private.
- Zero visual CSS. `rw-hair-off` is class prep only.

## Code Review: HUD-02 PR1 family hook

### Findings

#### 🟡 Minor: Cache key is `last.kind`, not `last.hullKind`

**Location:** `src/systems/hud.js:691`, `697`, `1157–1158`  
**Issue:** Design says compare `last.hullKind`. The cache stores the same value on `last.kind` so `hud.js` never contains a `hullKind =` assignment token (required grep pin).  
**Fix:** Keep `last.kind` unless the orchestrator prefers the law name and a grep exception.  
**Status:** documented — intentional for the no-write grep pin

#### 💡 Suggestion: `sessionHudFamilyOverride` runs twice when inputs change

**Location:** `src/systems/hud.js:1156` and `64` via `hudFamily`  
**Issue:** On an input change the 5 Hz path reads storage, then `hudFamily` reads it again. Cost is one extra `getItem` at 5 Hz on hull swap.  
**Fix:** Not required. Avoid sharing a module cache that would skip a later override flip.  
**Status:** accepted — no per-frame cost

#### 💡 Suggestion: Dataset is not rewritten if an outside caller clears it

**Location:** `src/systems/hud.js:1157–1165`  
**Issue:** If something else deleted `data-family` without changing hull/faction/override, the 5 Hz path would not restore until an input changed. Nothing in-tree does that.  
**Fix:** Optional always-recompute `hudFamily` at 5 Hz and write on token mismatch only.  
**Status:** accepted — HUD owns the attribute

### Verdict

Approve. 5 Hz write-on-change, init-once, no per-frame alloc, restore-after-initHud refresh, and export surface all hold.

### Re-apply notes (pass 2)

- No HIGH/CRITICAL from pass 1.
- `last.kind` rename is the only follow-up (grep-pin cleanliness). Behavior unchanged.
- Probe re-run: `PROBE PASS`.
