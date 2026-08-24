## Code Review: TGT-03 remaining target closure-rate design pack (Wave 101, re-dispatch)

### Summary

Design-only. Re-dispatch fixes three freeze bugs: glyph band now copies exclusive live contacts math (`hud.js` 1490–1491); `ENVELOPE_CLOSE_RATE` cite is `npc.js` 112; CLOS format is XOR signed `+N`/`-N`/`0` with no rail «/». DIST cites 855–857 and 2018–2035 still match. No 🔴/🟠 remain.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + orchestrator `code-review.md`. Self-applied (no `src/` diff).

### What's done well

- MERGE LAW now forbids invented inclusive glyph inequalities. Live tests are exclusive `<` / `>`.
- Deputize format is one authored string; `«-12 u/s` is forbidden by name.
- NPC 40 stays AI-only at the live line.
- SPD is still not CLOS (`hud.js` 1261).

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Dock Digit 9 “Standing” comment is stale and correctly treated as non-binding

**Location:** `station.js` 1623 vs `DOCK_KEY_SERVICES` `station.js` 186.

**Issue:** Comment says Digit 9 is Standing. Live index 8 is `epics`.

**Fix:** None this wave. Do not edit `station.js`.

**Status:** documented.

#### 💡 Suggestion: Extract `losCloseRate` in PR1 as specified

**Location:** `shared-contract.md` §1.2, §8.

**Fix:** Later PR1; not this wave.

### Inventory cite check (live code, re-grep)

| Claim | Live | Result |
|---|---|---|
| DIST row create | `hud.js` 855–857 | OK |
| DIST write `N u` | `hud.js` 2018–2035 | OK |
| Core, not scanner | `hud.js` 1385–1386 | OK |
| Mk II glyph exclusive | `hud.js` 1490–1491 `along < -4` / `along > 4` | OK — contract copies exclusive |
| `|along| == 4` no «/» | follows exclusive tests | OK |
| `CONTACT_CLOSE_FLOOR = 4` | `hud.js` 75 | OK |
| NPC close rate | `npc.js` 112 `ENVELOPE_CLOSE_RATE = 40`; 111 is `ENVELOPE_CLOSE_DIST` | OK |
| Hub 80 px | `hud.css` 184–191; `hud.js` 1198 | OK |
| `LOCK_CONE_PX = 12` | `reticle-aim.js` 15 | OK |
| Digit 0 shipyard | `station.js` 186, 5920–5922 | OK |
| Digit 8/9 launch/epics | `station.js` 5918–5926 | OK |
| `innerHTML` in `hud.js` | grep **0** | OK |
| `world.contacts` people | `ctx.js` 163 | OK |

### Verdict

Approve design pack after re-dispatch. Later serial must not weaken `shared-contract.md` §1.1 format XOR or exclusive glyph inequalities.
