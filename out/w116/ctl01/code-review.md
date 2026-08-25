# Code Review: CTL-01 remaining dock/jump bind (Wave 116)

Design-only. Inventory re-census: `KeyD` sets `pendingDock` (`controls.js` **274–276**) **and** `strafeX` (**440**); HUD help **343 / 353**; `dockPressed` publish **370**; `ctx.js` **76 / 88**; human jump `gate.js` **648**; AP `wantJump` OR **643–647**; station **6250–6259**; prompt `hud.js` **2127–2138** + `textContent` **2184–2185**; onboarding **50 / 53**; WAVE21 `dispatchKey('KeyD')` **706 / 732**; WAVE6 `'D — dock'` **1732**. MERGE LAW deputizes **KeyJ**, keeps `dockPressed`, forbids AP file and HUD-02 rails. Census leftover is **real** (not CONSUME; serial not none). No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent. Did **not** run project-wide formatters.

### Summary

Document and contract agree: leftover is **dedicated non-movement dock/jump bind**; smallest additive is remap `pendingDock` KeyD → KeyJ; world keeps `ctx.input.dockPressed`; AP `wantJump` stays independent; PR plan is named-only **PR1 dedicated dock/jump bind**. Boot KeyD jump pins are called out for a later **intentional** update.

### What's done well

- Re-census treats live dual-bind as leftover, not CONSUME.
- Refuses a new `jumpPressed` name so `gate.js` / `station.js` stay readers.
- Refuses AP write of `dockPressed` and refuses requiring KeyJ for AP hops.
- Unused-key census is explicit (I/J/U unused; Z harness; Enter title/death).
- Deputize KeyJ is unused **and** mnemonic; owner override named.
- Later write-set excludes `src/game/autopilot.js` and HUD-02 combat rails.
- Helm tables: KeyJ must **not** join AP/AM `inputBreak`; D remains helm via `strafeX`.
- Boot coupling is a first-class regression, not a surprise.

### Contract vs document consistency

| Topic | Integrator | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover | real; not CONSUME | §0.1 not CONSUME; serial not none | Match |
| Deputize | KeyJ | §0.1 KeyJ | Match |
| Edge name | keep `dockPressed` | §0.7 | Match |
| Dock vs jump | same key | §0.8 | Match |
| AP | `wantJump` independent | §0.9 | Match |
| Digit / hub / persist / `state.js` | no | §0.2–0.6 | Match |
| `innerHTML` | no | §0.4 | Match |
| Boot KeyD jump | later pin on purpose | §0.11 | Match |
| HUD-02 rails | prompt copy only | §0.10 | Match |
| Serial | **PR1 dedicated dock/jump bind** | §3 | Match |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Help list is init-time; live `config.controls` rewrite would not refresh HUD `<li>`

**Location:** `controls.js` 340–360; `hud.js` 1019–1023.

**Issue:** HUD copies help strings once at `initHud`. PR1 that only mutates `config.controls` **after** HUD init would leave stale “D — dock” on screen. Live fill is at `initControls` **before** `initHud` (`main.js` 112 vs 136), so a source-string edit is enough.

**Fix:** PR1 edits the **source literals** in `controls.js`. Do not “live rewrite” the array each frame. Do not `innerHTML` the list.

**Status:** documented; not a Wave 116 defect.

#### 🟡 Minor: WAVE21 comments and `dispatchKey('KeyD')` will fail the impl wave if forgotten

**Location:** `scripts/boot-test.mjs` 706, 732; contract §0.11.

**Issue:** Jump pins dispatch KeyD, not `dockPressed`. Direct dock helpers (1137) will keep working.

**Fix:** Impl wave updates jump pins **on purpose**. This wave does not edit `scripts/`.

**Status:** documented for the implementation wave. Required, not optional.

#### 🟡 Minor: `gate.js` header still says “dock input (KeyG)”

**Location:** `gate.js` 35–36 vs listener 577–585.

**Issue:** Stale comment. KeyG cycles; jump is `dockPressed`.

**Fix:** Optional comment hygiene in a later gate touch. **Not** this leftover’s required PR1. Do not steal NAV-05 files to fix a comment.

**Status:** accepted; census only.

#### 💡 Suggestion: Hub prompt `pKey = 'G'` with “J — Jump” in the verb

**Location:** `hud.js` 2132–2135.

**Issue:** After remap, chip shows G (cycle) and verb must name J for jump. Do not set `pKey = 'J'` on hub if G is still the cycle key — players need both. Verb already embeds the jump key today (`D — Jump`).

**Fix:** PR1: keep `pKey = 'G'`; change embedded `D — Jump` → `J — Jump`. Optional PR2 could show two chips; not required.

**Status:** frozen in integrator picture; not a dual-chip requirement.

### Verdict

**Approve markdown pack.** Leftover real. Deputize KeyJ. Serial named. No open Blocker/Major.
