# Code Review: TGT-03 remaining radar (design-doc)

**Scope:** inventory vs live `src/`, freeze vs siblings, serial PR realism. No `src/` diff.  
**Persona:** `reviewer.md` + `orchestrator/references/code-review.md`.  
**Pass:** 2 (after sibling awareness landed `Incoming fire.` + lock park/aria; cites refreshed).

## Code Review: docs/Tgt03RadarDesign.md + out/w98/radar/*

### Summary

The brief matches live HUD: nearby traffic is already `.rw-contacts`; radar is not a missing PPI. Lock arrow, gate cue, and toast channel are correctly left to other owners. Persist collision with `world.contacts` is frozen. PR plan is serial and does not schedule `src/` in Wave 98. No Blocker/Major remain after pass-1 cite refresh.

### What's done well
- Inventory says **code wins** over wishlist “radar” instead of designing a duplicate disc.
- Default **reuse** `.rw-contacts`; exception to a new class is not proven.
- `WORLD_FIELDS` `'contacts'` is named as the people roster, not a hole to fill.
- Three-class coexistence avoids a false mutex with lock/NAV-02.
- Digit 0/8/9, outfitting 2/4 Wolfeye, KeyT/KeyV, cone 12, empty hub are explicit non-goals.
- Sibling awareness files are not required to exist; live `npc-fire-toast.js` is cited as do-not-touch.

### Findings

#### 🔴 Blocker: None (pass 2)

#### 🟠 Major: Stale “Incoming fire. absent” / lock-arrow no-aria
**Location:** first inventory draft vs live `hud.js:14,568–573,736,1303–1306`; `npc-fire-toast.js`  
**Issue:** Sibling Wave 98 awareness landed during this inventory. A freeze that still said those were absent would tell a later radar PR to re-implement toast/lock.  
**Fix:** Inventory §6 / §8, brief table, contract §0.14 / §2 / §4 now say **LIVE** and **not this serial**.  
**Status:** addressed

#### 🟠 Major: `world.contacts` name collision
**Location:** `save.js:80`; `ctx.js:162`  
**Issue:** Later impl that “persists radar contacts” would smash NPC people.  
**Fix:** Contract §0.3 / §5.  
**Status:** addressed

#### 🟡 Minor: Contacts still visible while jumping
**Location:** inventory §3 `hud.js:1383` vs NAV-02 `hud.js:1577`  
**Issue:** Live arc does not park on jump; lock arrow now does. Easy to over-scope PR2 into a restyle.  
**Fix:** Contract already: jump park hide only; no second class.  
**Status:** documented — later PR2 discipline  
**Justification:** not a freeze hole; explicit “if live is correct, ship jump park only.”

#### 🟡 Minor: Line numbers will drift
**Location:** inventory cites  
**Issue:** Sibling waves already shifted `hud.js` during this pack.  
**Fix:** Later impl re-reads; Wave 98 inventory dated 2026-08-23 after the awareness land.  
**Status:** accepted  
**Justification:** design-only; code-wins rule is written.

#### 💡 Suggestion: Extract `contactsGate` in PR1
Already in contract §7–§8. Pins without jsdom are the right first PR.

### Live-cite spot checks (pass 2)

| Claim | Live | Verdict |
|---|---|---|
| `.rw-contacts` node | `hud.js` 791–793 | OK |
| Scanner hide docked, not jumping | `hud.js` 1383 | OK |
| Mk I / Mk II range + cap | `hud.js` 1400–1401 | OK |
| Ships-only loop | `hud.js` 1404–1418 | OK |
| `contactKind` lock > hostile > civ | `hud.js` 354–357 | OK |
| Closure glyphs `textContent` | `hud.js` 1491 | OK |
| `.rw-edge-arrow` + aria | `hud.js` 735–736 | OK |
| Lock park dock/jump | `hud.js` 1303–1306 | OK |
| `.rw-nav-gate-cue` | `hud.js` 737; `hud.css` 1003 | OK |
| `Incoming dart.` / `Incoming fire.` | `npc-fire-toast.js` 7–8 | OK |
| Empty hub 44 px | `hud.js` 1194 | OK |
| Digit 0 shipyard | `station.js` 186, 5920–5922 | OK |
| Digit 8/9 papers | `station.js` 1699–1702 | OK |
| Outfitting 2/4 Wolfeye | `station.js` 5347–5366 | OK |
| `LOCK_CONE_PX` 12 | `reticle-aim.js` 15 | OK |
| KeyT / KeyV | `controls.js` 265, 280 | OK |
| `WORLD_FIELDS` has `scanner` and NPC `contacts` | `save.js` 79–80 | OK |
| `healScanner` 0/1/2 | `hangar.js` 44–46 | OK |
| `innerHTML` in hud.js | grep 0 | OK |
| FORE/AFT on playerHit | `hud.js` 1131–1133 | OK |

No inventory lie found vs live code after the cite refresh.

### Sibling freeze
- Does not require `out/w98/tgt03/**` or `out/w98/turrets/**` to exist.
- Does not edit Tgt03Awareness / Tgt05 / Nav / NpcMissiles / Hud02 / Bio / Shp / wishlist / PROGRESS.
- Awareness sibling: lock arrow + fire toast already live — radar must not duplicate.
- Turret sibling: if they emit cannon `npcFire` vs player, existing toast law applies — no SKU design here.

### PR plan realism
PR1 gate pins → PR2 jump park → PR3 class/persist confirm → PR4 a11y is ordered so a new PPI cannot sneak in and pick math is never opened. Wave 98 does not land `src/`. Realistic.

### Pass 2
No new Blocker/Major. Reuse of `.rw-contacts` held in both brief and contract. No hub PPI. Subsystem targeting and missile gauges remain out.

### Pass 3 (cite repair)
Verifier: brief “Park arc docked?” pointed at `hud.js` 1368 (`selfFacing.set` in FORE/AFT). Live contacts hide is `hud.js` 1382–1386 (`showArc` + `is-hidden`). Brief now cites 1382–1386. Other brief `hud.js` cites still match live (contacts 791–813 / 1379–1531, scanner 0 1379–1383, jumping 1383 vs 1577, hub 1194). Inventory §3 already had 1383–1387. Freeze unchanged. No `src/`.
