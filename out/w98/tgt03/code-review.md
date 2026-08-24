# Code Review: TGT-03 remaining awareness (Wave 98 impl)

**Scope:** `src/game/npc-fire-toast.js`, `src/systems/hud.js`, `scripts/boot-test.mjs` WAVE98, `docs/Tgt03AwarenessDesign.md` status bump.  
**Persona:** `reviewer.md` + `orchestrator/references/code-review.md`.  
**Pass:** 2 (HUD unknown helper text fail-closed).

### Summary

PR1–PR4 landed as one change. The helper matrix matches the Wave 97 contract. HUD still owns DOM. Dart WAVE83 source pins stay (`INCOMING_DART_TOAST = 'Incoming dart.'`, `DART_TOAST_GAP = 2.5`, case uses the named literal). No Blocker/Major remain.

### What's done well
- Pure helper has no DOM; boot/probe can pin without jsdom.
- Separate `lastIncomingFireAt` clock so dart then cannon can show two lines.
- Ace omit (`target` missing or null) toasts fire; live ship target does not.
- Lock arrow parks on dock/jump and does not write `targets.current`.
- WAVE83 missiles object was all `true` on `npm run test:boot`.

### Findings

#### 🟡 Minor: Dart gap constant is duplicated
**Location:** `src/systems/hud.js` (`DART_TOAST_GAP = 2.5`) and `src/game/npc-fire-toast.js:9`  
**Issue:** HUD keeps the WAVE83 source pin; the helper owns the live throttle.  
**Fix:** Leave both. WAVE83 `toastGap` greps hud.js. Do not delete the HUD const.  
**Status:** accepted (WAVE83 pin)

#### 💡 Suggestion: HUD dart/fire remap is intentional duplication
**Location:** `src/systems/hud.js` npcFire case  
**Issue:** HUD re-emits the named literals instead of passing helper `{text}` through.  
**Fix:** Keep. WAVE83 requires `INCOMING_DART_TOAST` in the case body; fail-closed rejects any other helper text.  
**Status:** accepted

### Verdict
Approve for Wave 98 first impl. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
