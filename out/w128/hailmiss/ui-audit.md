## UI Audit: Hail02 miss-feedback leftover integrator

### Summary

No product UI ships in Wave 128. Audit is of later copy + toast channel. Blocker/Major UI holes in **live** play (silent KeyH, lying bargain prompt, silent KeyJ) are accepted as leftover **REAL** and frozen as PR1 toast copy. Color-only cue, second toast stack, fake card, and pause-as-feedback are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Copy shape matches inbox: `Cinder Halvard — hail out of range (732 u)` (subject — verb — reason — distance).
- Salvage vs hail verb distinction (disabled hull vs live lock).
- Overlay refuse names **chart** / **berth** in text, not color.
- `reducedMotion`: no new animation.
- HUD-04 8 s identical-key linger reused; 5 slots unchanged.
- Skip toast on title / typing / models / settings so miss copy does not fight owner surfaces.
- Skip toast when a real card/dock/jump is the outcome.
- Fear toast (`They learn to fear you`) is **not** the miss channel.

### Findings

#### 🔴 Blocker: Silent miss / no named subject — **resolved as later copy**

**Location:** live `hail.js` **652–667**; `hud.js` prompt **2390–2396**  
**Issue:** Player tap has no subject, eligibility, or outcome when no card opens.  
**Fix:** PR1 named toast. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Color-only miss — **resolved in freeze**

**Location:** honor `reducedMotion` / a11y  
**Issue:** A pip or toast class without text would fail the inbox.  
**Fix:** text names ship + reason. `cls: 'warn'` is extra, not the only cue.

#### 🟠 Major: Second toast stack / extra slots — **resolved in freeze**

**Location:** `hud.js` **69–70**, **1293–1317**  
**Issue:** A new overlay would collide HUD-01 hub and HUD-07.  
**Fix:** existing `pushToast` / `toastForEvent` only.

#### 🟠 Major: Fake hail card as feedback — **resolved in freeze**

**Location:** `hail.js` `openCard`  
**Issue:** A dummy card would steal combat HUD and Digit 1..n.  
**Fix:** toast only.

#### 🟠 Major: Bargain prompt `H — Hail` vs player agency — **documented, not stolen**

**Location:** `hud.js` **2394–2396**  
**Issue:** Prompt teaches a KeyH combat hail that does not exist.  
**Fix this wave:** do not rewrite the prompt block (HUD-07 / layout). PR1 toast `{name} — no hail` is the truth line. Owner may override after playtest.

### 🟡 Minor: Overlay miss uses verb `hail` even on a hulk

**Location:** contract copy table `overlay-chart`  
**Issue:** Disabled lock + chart open says `hail blocked (chart)` not `salvage blocked`.  
**Justification:** smallest additive; one overlay sentence. Owner may split later.

### 🟡 Minor: Jump miss has no distance clause

**Location:** `{name} — jump not in zone`  
**Issue:** Inbox example includes `(732 u)` for hail range. Jump zone is a gate bubble, not TARGET_RANGE.  
**Justification:** avoid inventing a second range number. Named dest + reason is enough.

### 🟡 Minor: `No lock — hail` does not name a ship

**Location:** token `none`  
**Issue:** Inbox wants a named subject.  
**Justification:** there is no selected contact. Naming an unseen hull would violate inbox “never appear to affect an unseen or unselected contact”.

### 💡 Suggestion: Align HUD prompt after playtest

If PR1 toast is enough, leave `H — Hail` on bargain locks. If playtest still taps H expecting a card, a later HUD-07 slice can hide that prompt. Not Hail02 PR1 layout.

### 💡 Suggestion: Optional PR2 stills

One still: friendly lock + KeyH + named toast, hub empty, no pause, no extra toast slot.
