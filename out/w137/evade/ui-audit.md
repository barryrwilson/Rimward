# UI Audit: Agent evade leftover integrator

### Summary

No product UI ships in Wave 137. Audit is of the **later** freeze: Agent play badge last-intent plus unchanged human Space / HUD burner aux. Blocker/Major UI holes in **live** agent play (no flee verb; Fable forged keys) are accepted as leftover **REAL** and frozen as PR1 afterburner. Pad chrome, SLOW steal, hub pip, badge move, and Fear HUD rewrite are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Player-facing freeze is audited (this file is **not** skipped).
- One verb: `afterburner` matches the live Space help line (`controls.js` **573**).
- Badge chrome stays Wave 134/Fable top-right (`style.css` **32–43**). Last line already shows `Last: {name}` (`agent-api.js` **571–573**).
- HUD-01 80 px hub stays empty. No evade pip. No aim-glass gauge.
- Human Space binding stays. No new Digit. KeyH/J/L/M/P stay. KeyD strafe.
- NAV-10 SLOW stays the **human pad cue**. Agent flee does not reuse SLOW copy.
- `reducedMotion`: no new animation (`style.css` **128–131** already none).
- Color is not the only cue: badge title + on/off + last text; HUD burner READY/COOLDOWN/BURNING is existing text (`hud.js` **2291–2301**).
- Buttons stay real `<button type="button">` with ≥44 px hit (`style.css` **105–108**).
- Manifest overlap remains a **sibling inbox** (wishlist **303–305**). This pack does not “fix” it by moving the badge onto PWR.

### Findings

#### 🔴 Blocker: Agent has no flee control — **resolved as later named act**

**Location:** live `COMMAND_NAMES` `agent-schema.js` **17–40**; inbox Fable two hull losses  
**Issue:** The watch user sees combat and a READY burner bar. The outer loop cannot tap Space. Humans can. That is an agent-play hole, not a missing HUD lamp.  
**Fix:** PR1 `act afterburner`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: New evade Digit / key as the default fix — **resolved in freeze**

**Location:** TRACKED `controls.js` **48–55**; Digit 0/8/9 honor  
**Issue:** A sixth Digit or remapped Space fights station map and muscle memory.  
**Fix:** Space stays human. Agent uses `window.rimward.act`. No new TRACKED code.

#### 🟠 Major: Badge copy / pin rewrite as this leftover — **resolved in freeze**

**Location:** `style.css` **32–43**; `BADGE_COPY` `agent-api.js` **457–467**; sibling Manifest overlap  
**Issue:** Moving the badge or adding `AGENT EVADE` jargon would cover PWR/range or steal the Manifest inbox.  
**Fix:** pin stays. Copy stays. `Last: afterburner` is enough. Hint stays `Stop does not cancel Autopilot.` (disable() law; afterburner still steals AP like Space — do not lie by saying Stop cancels AP).

#### 🟠 Major: NAV-10 SLOW / MATCH as agent flee cue — **resolved in freeze**

**Location:** `hud.js` **2280–2288**; `docs/Nav10DockApproachDesign.md`  
**Issue:** Painting SLOW on combat flee would steal pad approach UI.  
**Fix:** do not claim HUD SLOW. Burner aux already names BURNING.

#### 🟠 Major: Hub PPI / fear-safe pip — **resolved in freeze**

**Location:** HUD-01 80 px hub  
**Issue:** A SAFE / FLEE hub child would fill the empty glass and steal HUD-06/07.  
**Fix:** no hub child. Fear meter stays Manifest (sibling overlap).

#### 🟠 Major: Color-only “you can flee” — **resolved in freeze**

**Location:** honor a11y  
**Issue:** A red badge without a named act fails the inbox.  
**Fix:** the act is the control. Badge last-intent is text.

### 🟡 Minor: Hint does not mention afterburner steal

**Location:** `BADGE_COPY.hint` `agent-api.js` **467**  
**Issue:** Stop does not cancel AP; Space/afterburner **does**. Players who only read the badge may think agent burn keeps AP.  
**Justification:** hint is about **Stop**. Human Space already steals. Do not grow badge copy in PR1. Owner may add a one-line hint later.

### 🟡 Minor: Cooldown has no agent-specific toast

**Location:** human burner COOLDOWN on aux  
**Issue:** Outer loop may re-pulse while COOLDOWN.  
**Justification:** HUD already shows COOLDOWN. Optional observe `burnerReadyAt`. Do not toast each refuse (HUD-04).

### 🟡 Minor: Manifest still under the badge

**Location:** wishlist **303–305**; `z-index` 40  
**Issue:** Last: afterburner does not make overlap worse than Last: plotRoute.  
**Justification:** sibling inbox. Do not move the pin onto PWR.

### 💡 Suggestion: Optional PR2 stills

One still: `?agent=1` badge top-right Last: afterburner; burner BURNING; hub empty; SLOW off (not in pad band); Manifest readable or overlap unchanged; no extra toast slot.

### 💡 Suggestion: Keep Enable / Stop labels

Do not rename Enable to “Evade mode”. Opt-in is play, not a combat stance.
