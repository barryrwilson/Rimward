## Code Review: NAV-10 docking approach leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `hud.js` **2535–2536** (`J — Dock` with no speed), `station.js` **6321–6330** (no speed gate), and `ship.js` **907–939** (PHY bounce). Contract forbids CONSUME, KeyJ hold, bounce rewrite, pad AP, Agent dock, HUD-06 steal, Hail02 toast reuse, MATCH reuse, target-rail SLOW, persist mute, and `innerHTML`. Designer Major (shared `makeSpeed` MATCH node) is **resolved in freeze**. No Blocker/Major remain.

### What's done well

- Code-wins inventory with file:line for KeyJ, snap, `inZone`, bounce skip, SPD, Hail02 miss, NAV-03, HUD-06, Agent unknown `act`.
- CONSUME test applied honestly: cue **and** governor both required to consume; neither live.
- Deputize picks the **smaller** HUD cue; KeyJ stays a tap.
- Physics window (~0.088 s) is cited so PR1 is not in-zone-only.
- Snap 2× left as the only legal pull-in.
- Sibling write-sets listed (PHY / NAV-03 / Hail02 / HUD-06 / TGT-07 / MSN-04).

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `hud.js` **2535–2536**; `station.js` **6321–6330**  
**Issue:** J prompt and 2× snap exist. That is not a named speed cue or a cruise-bounce governor. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: In-zone-only cue cannot brake cruise — **resolved in freeze**

**Location:** inventory §10; `U.DOCK_RANGE` 45 vs hull 34.4  
**Issue:** 10.6 u at 120 u/s is ~0.088 s; light `stopTime` is 2 s.  
**Fix:** PR1 SPD lamp at 3 × `DOCK_RANGE` **and** in-zone verb. Partial merge forbidden.

#### 🟠 Major: J-held governor remaps CTL-01 — **resolved in freeze**

**Location:** `ctx.js` **90**; `controls.js` **426**  
**Issue:** KeyJ is a one-frame edge. Hold-to-approach is a third helm.  
**Fix:** PR1 HUD cue only. Optional PR2 is still **tap** clamp-then-dock.

#### 🟠 Major: 20 u/s vs creep 30 — **resolved in freeze**

**Location:** `state.js` **38**  
**Issue:** Player cannot hold 20 while creeping without fullStop.  
**Fix:** do not write `state.js`; cue warns; double-tap F already zeros.

#### 🟠 Major: Hail02 miss is not this leftover — **resolved in freeze**

**Location:** `hail.js` **369**; `hud.js` **808**  
**Issue:** Reusing `hailMiss` for SLOW would flood and steal Hail02.  
**Fix:** do not claim `hail.js`; no `warn|hailmiss|*` keys.

#### 🟠 Major: Bounce-off as “assist” — **resolved in freeze**

**Location:** `ship.js` **907–939**  
**Issue:** Skipping `resolveMover` while `inZone` is a ram cheat.  
**Fix:** PHY-01 stays; PR1 is HUD.

#### 🟠 Major: MATCH lamp / target SPD reuse — **resolved in freeze** (designer re-dispatch)

**Location:** `hud.js` **378–401**, **1089**, **1101**, **2243–2244**, **2524**; `hud.css` **222–229**  
**Issue:** `makeSpeed()` is a shared factory with one MATCH node. Worker v1 ranked MATCH+SLOW as Minor chrome. That under-ranks the factory: swapping MATCH text steals Wave D; stuffing SLOW into `makeSpeed` can light the **target** rail.  
**Fix:** contract §0.23 / §0.1: distinct `.rw-slow-lamp` on **self** SPD only; MATCH `textContent` stays `MATCH`; do not pass SLOW into `tgtSpeed.set`; independent hide; do not grow the 80 px hub.

### 🟡 Minor: Jump zone vs approach lamp

**Location:** `hud.js` **2537–2546**  
**Issue:** A station-approach lamp could overlap a gate bubble.  
**Justification:** contract hides lamp when jump owns the verb (`gate.inZone && !station.inZone`).

### 🟡 Minor: Optional PR2 governor still not a bounce preventer without a tap

**Location:** inbox “governor on J”  
**Issue:** Playtest bounce is often **no tap**. Governor-on-J cannot fire.  
**Justification:** HUD cue is the loop-closer for “J prompt appears.” Owner may override.

### 🟡 Minor: Two text lamps on a 220 px self rail

**Location:** `hud.css` **950–955**; self `.rw-speed .rw-value`  
**Issue:** MATCH + SLOW + integer + `u/s` can overflow at high text scale.  
**Justification:** Not a mix-up once nodes are distinct. Overflow: tighten lamp letter-spacing, not the hub. Watch in PR1 CSS.

### 💡 Suggestion: Optional PR2 stills

Skippable after playtest. Do not block PR1.

### 💡 Suggestion: Keep prompt as one string

Do not add a third prompt child node if `promptVerb.textContent` can hold the addendum (live salvage already uses a long verb).
