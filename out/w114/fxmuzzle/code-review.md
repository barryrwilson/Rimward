# Code Review: FX remaining muzzle design pack (Wave 114)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining FX-01 muzzle leftover.** Named serial has **no PR1**. Cites match today’s `combat.js` (including sibling scrape `spawnHitFx` at 1858–1860, which this pack correctly does not steal). Hard freezes (hub pip, Digit, `state.js`, persist, `innerHTML`, IMPACT, scrape steal, ripple-parent rewrite) are in merge law.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` and `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME.
- Fire-side vs hit-side vs ram-side is split: muzzle/bolts/lance vs `spawnFlash`/ripple vs scrape 1858–1860.
- Line cites use today’s files (`spawnMuzzle` 1008–1029, callers 1233/1294/1327/1387/1414, `PROJ_RADIUS` 187, hub 726–729).
- WAVE54 / WAVE55 pins cited from `scripts/boot-test.mjs` 11641–11680 without editing boot.
- Sibling law: do not wait, do not steal `out/w114/fxscrape/**` or scrape `spawnHitFx`.
- Serial plan names **no** implementation PR. Matches owner “do not invent work.”

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Scrape line cites can drift if sibling keeps editing `combat.js`

**Location:** inventory §0 scrape row; `combat.js` 1858–1860

**Issue:** Sibling Wave 114 scrape may still move the `bodyHit` block. Fire-side helper lines could shift too.

**Fix:** Inventory already says re-census if symbols move. Contract §0.27: do not wait. No pack fix required unless cites are already wrong — they match the file at review time.

**Status:** accepted with re-census rule.

#### 💡 Suggestion: Optional census PR is skippable

**Location:** contract §3 `PR-census (optional skip)`

**Issue:** A later worker might treat optional grep as required work.

**Fix:** Brief and contract already mark it optional skip. Orchestrator should not schedule it as Wave 114 `src/`.

**Status:** documented.

### Verdict

**Approve** as CONSUME integrator pack. Do not implement fire-side FX from this wave.
