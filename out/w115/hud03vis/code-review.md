# Code Review: HUD-03 remaining visual accessibility design pack (Wave 115)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining HUD-03 visual leftover.** Named serial has **no PR1**. Cites match today’s `settings.js` `FIELDS` / `CHECKBOXES` / `apply()`, `ctx.js` defaults, `hud.css` `body.rw-*`, and both-family extras. Hard freezes (hub pip, Digit, `state.js`, persist, `innerHTML`, free skin, HUD-02 class-token steal, Wave 103 audio rewrite) are in merge law.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` and `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME.
- Visual vs audio vs HUD-02 is split: four visual FIELDS vs Wave 103 `hudAlerts` vs sibling `data-class-key`.
- Line cites use today’s files (`settings.js` 29–38, 70–73; `ctx.js` 215–222; `hud.css` 1145–1189, 184–193; `hud.js` 80–89, 1100, 1105–1107; Digit `station.js` 188, 6098–6106).
- Both families inherit `body.rw-* #hud` (not family-gated). Extra family CSS is listed as consume, not leftover.
- Sibling law: do not steal `out/w115/hud02tgt/**` or `hud.js` class tokens.
- Audio law: cite `docs/Hud03AlertsDesign.md`; do not rewrite.
- Serial plan names **no** implementation PR. Matches owner “do not invent work.”

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist initiative line still says “visual settings remain”

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` 422–425 vs HUD-03 subsection 488–502

**Issue:** Initiative status is stale relative to HUD-03 subsection and live `FIELDS`. A later worker could treat the initiative sentence as a REAL leftover.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.14. No pack fix required.

**Status:** accepted — CONSUME named; wishlist edit is other worker.

#### 🟡 Minor: Galaxy chart `--rw-text-scale` fallback is 1

**Location:** `hud.css` 1781; `settings.js` 73 sets the var on `#hud` only

**Issue:** Chart is not under `#hud`, so TEXT SIZE does not scale the KeyM overlay. Wishlist HUD-03 is HUD families, not the chart.

**Fix:** Contract §0.17 forbids scheduling chart scale as this leftover. Do not invent a second `setProperty` as PR1.

**Status:** accepted — not a HUD-03 visual leftover.

#### 💡 Suggestion: Optional census PR is skippable

**Location:** contract §3 `PR-census (optional skip)`

**Issue:** A later worker might treat optional grep as required work.

**Fix:** Brief and contract already mark it optional skip. Orchestrator should not schedule it as Wave 115 `src/`.

**Status:** documented.

### Verdict

**Approve** as CONSUME integrator pack. Do not implement visual HUD-03 from this wave.
