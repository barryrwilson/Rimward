## UI Audit: TGT-07 combat cycle leftover integrator

### Summary

No product UI ships in Wave 130. Audit is of later KeyT selection-priority (player-facing). Blocker/Major UI holes in **live** play (T picks nearest friendly while an ace fires) are accepted as leftover **REAL** and frozen as PR1 sort order. New key, hub PPI, Incoming-toast lock, color-only “hostile” cue, and HUD layout steal are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Selection-priority is treated as player-facing (this audit is **not** skipped).
- Law (a) keeps **one** cycle key (T). Muscle memory stays.
- HUD contacts already rank hostiles (`hud.js` **1734–1751**); PR1 makes KeyT **agree** without a second instrument.
- TGT-03 Incoming fire. stays the **warning**; cycle stays the **select**. Two jobs, two surfaces.
- HUD-01 80 px hub stays empty. No PPI. No aim-glass gauge.
- Optional help string names the new order in **text**, not color.
- `reducedMotion`: no new animation.
- Rocks / KeyV kinds keep their existing discoverability (mining group 3; V under reticle).

### Findings

#### 🔴 Blocker: T cycle ignores hostiles in a duel — **resolved as later sort**

**Location:** live `controls.js` **139**; inbox playtest hauler → freighter → ace  
**Issue:** The player who taps T in a firefight does not get the shooter first. Warning exists; selection does not.  
**Fix:** PR1 gated hostiles-first then range. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: New attacker key as the default fix — **resolved in freeze**

**Location:** inbox alternative (b); TRACKED `controls.js` **46–53**; KeyV/X/K live  
**Issue:** A second select key fights TGT-05 / MATCH / engine-select and splits combat UI.  
**Fix:** prefer cycle order. KeyT stays. Do not remap V/X/K. Do not add a Digit.

#### 🟠 Major: Color-only hostile cycle — **resolved in freeze**

**Location:** honor `reducedMotion` / a11y  
**Issue:** Painting the lock red without changing T order (or without text help) would fail the inbox.  
**Fix:** order is the cue. Optional help is text. Existing tgt rail still names the lock.

#### 🟠 Major: Incoming toast / gauge as selector — **resolved in freeze**

**Location:** `npc-fire-toast.js` **8–64**; TGT-03; HUD-01  
**Issue:** Clickable toast or a hub pip would steal TGT-03, HUD-04 slots, and the empty hub.  
**Fix:** toast stays warning-only. No incoming gauge. No PPI.

#### 🟠 Major: HUD layout / contacts rewrite as this leftover — **resolved in freeze**

**Location:** `hud.js` contacts; HUD-07 sibling  
**Issue:** Changing arc glyphs or tgt-rail chrome to “fix” T would steal HUD-07 / HUD-06.  
**Fix:** later write-set is `controls.js` cycle (+ help). Contacts sorter stays display.

### 🟡 Minor: Help may stay `'T — cycle target'` if owner overrides

**Location:** deputize help line  
**Issue:** Players who learned nearest-first will not read a changelog.  
**Justification:** smallest additive is sort; help is default-on, owner-overridable. Controls overlay already lists T.

### 🟡 Minor: Existing friendly lock does not snap to the ace

**Location:** wrap live, not skip-to-attacker  
**Issue:** From a hauler lock, one more T may not be the ace.  
**Justification:** that snap is law (b). Inbox playtest is from cycling onto the nearest ships (empty / nearest-first). Documented.

### 🟡 Minor: Contacts arc and KeyT could still disagree on **lock-first** vs **hostile-first**

**Location:** HUD sort is lock → hostile → dist; cycle will be hostile → dist when gated  
**Issue:** The locked friendly stays on the arc as lock-first while T jumps hostiles.  
**Justification:** lock-first on the **arc** is “where is my current lock”. Cycle is “who is next threat”. Do not merge (HUD-07).

### 💡 Suggestion: Align HUD prompt after playtest

No combat prompt today teaches T order. If playtest still expects “target attacker” as a named verb, owner may pick law (b) **instead** of stacking it. Not PR1.

### 💡 Suggestion: Optional PR2 stills

One still: empty lock + nearer hauler + ace 59 u + first T on ace; Incoming fire. visible; hub empty; help overlay if opened; no extra toast slot.
