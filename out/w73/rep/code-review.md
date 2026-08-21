# Code Review: REP faction-standing design (Wave 73)

### Summary

The brief matches live standing: `RANK_LADDER` six rungs, Digit 9 epics pane, wholesale unsanitized `'reputation'`, patrol hardcoded `freehold += 5`, mining employer +2, rescue 4/1, POD sale, BIO −10 cap, hunt ≤ −10, no police leave hail, no kill attrib. First-pass holes (crime score, new Digit, invented police/UU, silent patrol retarget, extra ladder rungs, BIO/POD retune, locker rung mis-cite) are closed. Remaining notes are implementation cautions, not design blockers. Self-applied; no separate designer agent.

### What's done well

- Inventory cites `file:line` and states code wins.
- First slice is **explain-only** on live Standing Digit 9 — no new economy numbers.
- No universal crime score; persist stays `'reputation'`.
- `RANK_LADDER` frozen; `state.js` READ-ONLY.
- Digit 0 shipyard; `DOCK_KEY_SERVICES` unchanged.
- BIO −10 and POD 160/240 / `RESCUE` 4/1 cited, not retuned.
- Patrol `freehold` named as freeze + later serial, not silently retargeted.
- Espionage is a **rule freeze** for later MSN, not a shipped `kind`.
- Police leave and restitution UU are defer / needs-owner, matching “do not invent police AI.”
- MSN mining employer-only is the remedial grind (no new mission family).
- Serial PRs put sanitize before UI before optional kill attrib.
- XSS `textContent`; proto `RESERVED_IDS` + `hasOwn`.
- No TGT-05 / EXP file coupling.

### Findings

#### 🔴 Blocker (resolved): Universal crime score / extra persist key

**Location:** wishlist REP-04; owner freeze  
**Issue:** A wanted flag or `crimeScore` would fight local attribution and add a `WORLD_FIELDS` fork.  
**Fix applied:** Contract §0.2, §5.1. Brief non-goals.

#### 🔴 Blocker (resolved): First impl invents police AI and restitution UU

**Location:** wishlist REP-03; `hail.js` 47 has no leave intent  
**Issue:** Designing a patrol AI beat without a live hail path, or guessing a fine, would invent economy and NPC law.  
**Fix applied:** Contract §0.6, §4. Defer leave; restitution **proposed, needs owner**.

#### 🔴 Blocker (resolved): `RANK_LADDER` extra rungs / `state.js` rewrite

**Location:** owner freeze; BIO gift already uses Sworn 50  
**Issue:** Adding “Exiled” or splitting Stranger would desync hunt −10, yard discounts, and epics `rankTier`.  
**Fix applied:** Contract §0.12. Six rungs stay.

#### 🟠 Major (resolved): Silent patrol retarget off `freehold`

**Location:** `station.js` 1825; Msn inventory; owner “do not silently retarget”  
**Issue:** Explain copy that said “dock faction +5” would lie; changing the write in a REP PR would break Freehold-centric boot tests.  
**Fix applied:** Freeze live write. Named serial `patrol-employer-faction`. Standing copy may tell the truth: patrol credits **Freehold**.

#### 🟠 Major (resolved): New dock Digit / HUD family

**Location:** `DOCK_KEY_SERVICES` `station.js` 132; HUD-02 closed  
**Issue:** A “Contacts” reputation Digit would shove Shipyard or People.  
**Fix applied:** Digit 9 is the dedicated screen. Digit 0 shipyard. HUD toasts only.

#### 🟠 Major (resolved): BIO/POD number retune

**Location:** `hangar.js` 111; `trafficking.js` 8; `RESCUE` `state.js` 289–291  
**Issue:** “Simplify standing” could flatten graft −10 or sale 160/240.  
**Fix applied:** Contract §0.9. Neighbour freeze.

#### 🟠 Major (resolved): Restricted locker cited as Suspect

**Location:** first draft inventory §5; live `station.js` 1435 `freehold < -25`  
**Issue:** −25 is Suspect (`rankFor(-25)`). The gate is **strict `< -25`**, which is **Marked**. Copy that said “Suspect opens the locker” would mis-teach REP-01.  
**Fix applied:** Inventory, contract §3, brief §2: Marked only; −25 does not open.

#### 🟠 Major (resolved): Espionage numbered as a shipped family

**Location:** wishlist REP-04; MSN “waits on REP brief”  
**Issue:** Drop % / recon tables here would pre-empt MSN-02 and invent economy.  
**Fix applied:** Rule freeze only (secret success / exposed failure). Not a `kind`. No numbers.

#### 🟠 Major (resolved): NaN `rankFor` → Marked; missing-key `+=` NaN

**Location:** security review; `state.js` 680–682; `station.js` 1825  
**Issue:** Unsanitized bag plus patrol `+=` can NaN Freehold.  
**Fix applied:** Contract §1.2–1.3 sanitize + finite writers.

#### 🟡 Minor: Two `standingOf` helpers

**Location:** `hangar.js` 119 (faction string); `npc.js` 1021 (live hull)  
**Issue:** Different signatures. Hunt lacks `RESERVED_IDS`.  
**Fix:** Do not merge in explain PRs. Optional later shared `standingRead(bag, key)`. Documented.

#### 🟡 Minor: Hunt at −10 is still named Stranger

**Location:** `RANK_LADDER` Stranger min −10; `HOSTILE_STANDING` ≤ −10  
**Issue:** The name “Stranger” includes the hunt floor. Players may think Stranger is safe.  
**Fix:** REP-01 copy must say patrols hunt at **≤ −10** (bottom of Stranger). Not a ladder change.

#### 🟡 Minor: Default bag omits most banners

**Location:** `ctx.js` 128 four keys  
**Issue:** Beautiful/gilded/ferrous reads miss as 0 until writers create keys. Correct per freeze.  
**Fix:** none. PR5 pins missing Beautiful until graft.

#### 🟡 Minor: Greenhand `for…in` on the bag

**Location:** `world.js` 1093  
**Issue:** Inherited keys if sanitize ever fails.  
**Fix:** After PR1 bag is own-keys only. Later origin polish may iterate `FACTIONS`. Out of first impl.

#### 💡 Suggestion: Standing pane length

**Location:** `renderEpics` already lists stages + effects  
**Issue:** Ladder + how-it-moves + live consequences may overflow the two-level dock rule.  
**Fix:** Keep one pane; short notes; no third menu level. `reducedMotion` copy-only.

#### 💡 Suggestion: PR3 may no-op if writers already `commLine`

**Location:** mining/rescue/sale/patrol already emit comm  
**Issue:** Reason-line PR might only add “(+2 Veridian)” to existing lines.  
**Fix:** Allowed. Do not add a new event to justify the PR.

### Re-run

Self-reapplied after locker-rung fix and contract freeze of patrol/espionage/police. No open 🔴 Blocker or 🟠 Major.

### Verdict

**APPROVE** for Wave 73 markdown. Later impl must obey `out/w73/rep/shared-contract.md`.
