# Code Review: `out/w61/shared-contract.md` (HUD-02 shared contract)

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** Design brief vs locked HUD instruments and player/hull fields. No `src/` or `docs/` edits.  
**Pass:** 3 (re-apply after lead / restore / Q2 citation fixes).

### Summary

The brief is merge-ready. §1.1 Lead now matches `hud.js` 849–874 (mining or no lock hides; low `|relVel|` keeps the mark on the hull). §3.4 now matches `save.js` (`snapshot` wholesale + `Object.assign`; `sanitizeRestored` does not drop keys). §10 Q2 now matches the §3.1 fall-through `return 'bio'`. No Blockers remain.

### What's done well

- Glance table is an inventory of shipped nodes, not a new HUD.
- Switch reads `ship.js` (always living), `createShipState` (`faction` / `classKey`), `isBeautiful`, `ORIGINS.beautiful` effects, and the real player persist path.
- `#hud[data-family]` plus a ban on a second DOM honors the init-once / 5 Hz header.
- HUD-03 is mapped onto existing `settings.js` / `body.rw-*` only.
- Open questions are real owner calls. Q2 no longer claims only Beautiful + `hullKind: 'living'` are bio.

### Findings

#### 🔴 Blocker: none

#### 🟠 Major: Lead hide rule invented a low-speed hide (pass 2 / verifier)

**Location:** `out/w61/shared-contract.md` §1.1 Lead row  
**Issue:** Brief said hide when relative speed < ~6 or mining. Shipped: `showLead = shipTgt && wSpeed > 0`; `LEAD_MIN_SPEED` only skips the TOF offset (`hud.js` 849–874). Inventory §3.4 already had the correct rule.  
**Fix:** Applied. Hide for mining or no live ship lock. If `|relVel| ≤ ~6`, keep the mark on the hull.  
**Status:** resolved

#### 🟠 Major: §3.4 claimed `sanitizeRestored` drops `hullKind` (pass 2 / verifier)

**Location:** contract §3.4 (and former review minor)  
**Issue:** `snapshot()` writes `player: ctx.player`. `restore()` `Object.assign`s it. `sanitizeRestored` heals NaN numerics only. Extra keys **keep**.  
**Fix:** Applied. HUD must not write `hullKind`. SHP must copy + allowlist `living`|`built`.  
**Status:** resolved

#### 🟡 Minor: §10 Q2 misstated the §3.1 default (pass 2 / verifier)

**Location:** contract §10 Q2  
**Issue:** Text said only Beautiful + `hullKind: 'living'` are bio. Function returns `bio` for any unset `hullKind`.  
**Fix:** Applied. Q2 stays an owner call about Unknowables **purchased** hulls.  
**Status:** resolved

#### 🟠 Major: MATCH specified as a glance item without self-only (pass 1)

**Location:** `out/w61/shared-contract.md` §1.1 MATCH row  
**Issue:** Only `selfSpeed.set(..., matchSpeed && shipTgt)` lights the lamp (`hud.js` 1174 vs 1352).  
**Fix:** Applied in pass 1.  
**Status:** resolved

#### 🟡 Minor: A HUD write of `hullKind` would persist unsanitized

**Location:** contract §3.4; `src/game/save.js` 170, 359, 232–241  
**Issue:** Not “lost on load.” The opposite. Contract now forbids the HUD write.  
**Fix:** None this wave. SHP save wave allowlists.  
**Status:** open (correctly deferred to SHP)

#### 🟡 Minor: Live play cannot show `mech` until SHP or the session override

**Location:** contract §3.4, §10 Q1  
**Issue:** Integrators might think greenhand is mechanical. The brief forbids that lie.  
**Fix:** None. Owner Q1 decides whether to wait for SHP.  
**Status:** open (product)

#### 💡 Suggestion: Pin `hudFamily` in boot-test with explicit fixture objects

**Location:** contract §9.1  
**Issue:** Walking a live `ctx.player` after boot only exercises the bio default.  
**Fix:** Already listed: beautiful faction → bio; `hullKind: 'built'` → mech. Keep those fixtures when PR5 lands.  
**Status:** open (implementation wave)

### Cross-check vs verification target

| Check | Result |
|---|---|
| Information contract vs `hud.js` instruments | Pass. Lead hide/offset matches 849–874. MATCH self lamp. Scanner gates the arc only. Fade/geometry/cadence unchanged. |
| Switch cites real player/ship fields | Pass. Origin not a switch. Unset `hullKind` → `bio` for any faction. Restore keeps extra player keys. |
| PR plan not scheduled in wave 61 | Pass. Header + §8 + §9: design only. |
| No `src/` or `docs/` edits | Pass. This worker writes `out/w61/shared-*.md` only. |
| Open questions not silently decided | Pass. Three owner calls. Q2 wording matches §3.1. |

### Parallel-safety

Contract tells implementers `hud.js` + `hud.css` are not parallel-safe. Correct. Wave 61 itself is markdown-only and does not contend.

### Re-apply (pass 3)

- Blockers: 0
- Majors: 0 open (Lead, restore, MATCH closed)
- Minors: Q2 wording closed; persist-keep + ship-before-SHP deferred
- No further contract edits required for HIGH/CRITICAL.
