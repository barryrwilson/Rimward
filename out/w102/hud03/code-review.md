## Code Review: HUD-03 remaining optional audio-alerts design pack (Wave 102)

### Summary

Design-only. Inventory cites live KeyO `FIELDS` (`settings.js` 28–36), mute math (`song.js` 451–453), family `CUES` (`song.js` 114–130), Incoming copy (`npc-fire-toast.js` 8–9), Digit 0 at `station.js` 6023–6025 (not the stale Wave 101 5920 cite). MERGE LAW reuses cues, fail-closes mute, prefers `song.js` over `hud.js`. No 🔴/🟠 remain.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + orchestrator `code-review.md`. Self-applied (no `src/` diff). Design-doc review also applied (`design-doc-reviewer.md` checklist: completeness, live cites, alternatives, serial named only).

### What's done well

- Visual HUD-03 is treated as **DONE**; leftover is the missing checkbox, not a second scale control.
- Mute-all and HUD alerts stay distinct jobs.
- Incoming freeze is XOR: cue the event via live `npcFire*`, never a second toast string, never a double `CUES` row.
- Default-off vs Wave 65 always-on family ticks is stated, not hidden. Owner may override to `true`.
- Parallel-safety: later gate prefers `song.js`; this pack forbids `hud.js` / `shipyard-desk.js` / Tgt03 docs.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Default-off changes live Wave 65 family-audio-on until the player opts in

**Location:** `shared-contract.md` §1.1, §1.3; live ticks play whenever unmuted (`song.js` 417–442) with no `hudAlerts` field.

**Issue:** Deputize `false` is a behavior change for RANGE/MATCH/contact/hull/lock ticks.

**Fix:** None this wave. Owner may set default `true` after playtest. Contract already records that override. Do not park.

**Status:** documented deputize.

#### 🟡 Minor: Dock Digit 9 “Standing” comment is stale and correctly treated as non-binding

**Location:** `station.js` 1621 vs `DOCK_KEY_SERVICES` `station.js` 185.

**Issue:** Comment says Digit 9 is Standing. Live Digit 9 dock root is `epics` (index 8). Digit 0 is shipyard.

**Fix:** None this wave. Do not edit `station.js`.

**Status:** documented.

#### 💡 Suggestion: PR1 checkbox without PR2 is inert

**Location:** `shared-contract.md` §8.

**Fix:** Later serial still ships PR2. Named-only this wave.

**Status:** frozen.

### Inventory cite check (live code)

| Claim | Live | Result |
|---|---|---|
| Settings key `rimward-settings-v1` | `settings.js` 23 | OK |
| `FIELDS` seven keys, no hudAlerts | `settings.js` 28–36 | OK |
| `CHECKBOXES` copy | `settings.js` 38–44 | OK |
| Body classes | `settings.js` 67–69 | OK |
| Persist `JSON.stringify(s)` | `settings.js` 75 | OK |
| Load `Object.keys(FIELDS)` | `settings.js` 55–56 | OK |
| KeyO | `settings.js` 227 | OK |
| Mute math | `song.js` 451–453 | OK |
| Family CUES + FAMILY_CUES | `song.js` 114–130 | OK |
| npcFire / npcFireMissile | `song.js` 68–69, 423 | OK |
| Incoming strings | `npc-fire-toast.js` 8–9 | OK |
| hud.js npcFire toasts | `hud.js` 571–576 | OK |
| emitFamilyTick reducedMotion | `hud.js` 1073–1076 | OK |
| Hub 80 px | `hud.css` 184–191; `hud.js` 1198 | OK |
| hullKind read | `hud.js` 80–87 | OK |
| Digit 0 shipyard | `station.js` 185, 6023–6025 | OK |
| Digit 8/9 launch/epics | `station.js` 185, 6027–6028 | OK |
| Outfit Digit 8/9 papers | `station.js` 6100–6102 | OK |
| KeyT/V/X/K TRACKED | `controls.js` 41–48, 268–289 | OK |
| KeyO not TRACKED | `controls.js` 41–48 | OK |
| WORLD_FIELDS no alerts | `save.js` 76–101 | OK |
| innerHTML settings/song/hud | grep **0** | OK |
| ctx.settings defaults | `ctx.js` 214–221 | OK |
| Wishlist HUD-03 leftover | `PLAYER-EXPERIENCE-WISHLIST.md` 352–364 | OK (read only) |

### Verdict

Approve design pack. Later serial must not weaken `shared-contract.md` §0 mute fail-closed, Incoming copy freeze, or cue-reuse XOR (no double `npcFire` bark).
