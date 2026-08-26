## UI Audit: TGT-07 combat cycle leftover integrator

**Persona:** designer (parent pass). Review only. Did not edit product source. Did not edit `out/w130/tgtcycle/**`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `references\ui-audit.md`. Merge law: `out/w130/tgtcycle/shared-contract.md` wins over `docs/Tgt07CombatCycleDesign.md`. Worker self-audit `out/w130/tgtcycle/ui-audit.md` checked, not rubber-stamped. Live `cycleTarget` / HUD target chrome cited. No stills. [NO BROWSER COVERAGE].
**Graph:** `graph_resolve` (`claude/agent-claude`, namespace `codex`) → `proceed_unmodeled` (`r-mta6o3rp-99403310`). No binding workflow. Local markdown only. No Drive. No graph write.
**Scope:** later KeyT selection-priority (player-facing). Wave 130 ships no product UI. Focus: KeyT stays cycle; hostiles-first is behavior not a color-only cue; no hub PPI; no Incoming-fire selector steal; no HUD-07 layout steal; Q-ship cover; help copy.

### Summary

No product UI ships in Wave 130. The live hole is KeyT nearest-first while an in-envelope hostile fires. Integrator freeze is law (a) gated sort on KeyT, optional text help, no new key, no PPI, no toast lock, no HUD rewrite. Color is not the cycle cue. No Blocker. No Major remain in this freeze.

### What's done well

- Selection-priority is treated as player-facing. This audit is not skipped.
- Law (a) keeps one cycle key (T). Muscle memory stays (`controls.js` **49**, **324–325**, **457**; contract §0.3).
- HUD contacts already rank lock → hostile → dist (`hud.js` **1734–1751**). PR1 makes KeyT agree without a second instrument.
- Hostile on the arc is shape + color: amber triangle vs dim dash vs cyan diamond (`hud.js` **435–438**; `hud.css` **891–915**). Cycle must not become a paint job.
- TGT-03 Incoming fire. / Incoming dart. stay warning text on the HUD-04 stack (`npc-fire-toast.js` **8–64**; `hud.js` **680**). Toast stack is `pointer-events: none` (`hud.css` **700–710**). No shooter id. No click-to-lock.
- HUD-01 hub is 80 px, empty of pips (`hud.css` **184–190**; reticle build `hud.js` **935–939**). RANGE word only. No PPI.
- Context prompt already names `T` / `Target` when empty lock + in-range ship (`hud.js` **2556–2564**). Freeze does not rewrite that verb (HUD-07).
- Help is `textContent` via `el()` (`hud.js` **313–316**, **1225–1229**; `controls.js` **406**). `innerHTML` forbidden later. No second help key.
- `reducedMotion` already kills HUD motion (`hud.css` **1261–1266**). Cycle is input order, not a tween (contract §0.14).
- Q-ship cover class / cover name stay HUD-02 (`hud.js` **127–129**, **2417–2426**, **2498–2501**). Cycle hostility is `ai.intent` only.
- Rocks stay group-3 discoverability. Station/gate/pod/landmark stay KeyV (`controls.js` **128–134**, **148–151**).

### Honor (later PR1; freeze vs live chrome)

| Check | Result | Cite |
|---|---|---|
| KeyT stays the cycle key | Pass | TRACKED `controls.js` **49**; pulse **324–325**; consumer **457**; help **406**; contract §0.3 |
| Hostiles-first is behavior, not color | Pass | later sort in `cycleTarget`; color forbidden as cycle cue (contract §0.15); contacts already use triangle + amber (`hud.css` **898–905**) |
| No hub PPI | Pass | `.rw-reticle` 80 px (`hud.css` **184–190**); no pip added; TGT-06 CONSUME stays |
| No Incoming-fire selector steal | Pass | toast copy only (`npc-fire-toast.js` **8–64**); `playerHit` omits shooter (`combat.js` **1797–1799**); stack not clickable (`hud.css` **710**) |
| No HUD-07 layout steal | Pass | later write-set is `controls.js` (+ help / ctx comment); contacts sorter stays display (`hud.js` **1738–1751**); prompt stays `T` / `Target` (`hud.js` **2556–2564`); `#hud .rw-yield` stays HUD-07 (`hud.css` **690–691**) |
| Q-ship cover | Pass | `lockClassToken` coverClass (`hud.js` **127–129`); masked name (`hud.js` **2417**, **2498**); intent still ranks a hunting Q-ship |
| Help copy | Pass (default-on, owner-overridable) | live `'T — cycle target'` (`controls.js` **406`); later `'T — cycle target (hostiles first in combat)'` (contract §0.1); `el()` `textContent` (`hud.js` **313–316**) |
| Color is not the only cue | Pass | order is the cue; help is text; tgt rail already names the lock (`hud.js` **2494–2512`) |
| `reducedMotion`: no new animation | Pass | contract §0.14; existing kill `hud.css` **1261–1266** |
| No new Digit / TRACKED attacker key | Pass | Digit 0/8/9 stay; V/X/K stay (`controls.js` **46–53**, **336–346**) |

### Copy map (player-facing)

| Surface | Live | Later PR1 (deputize) |
|---|---|---|
| Controls list | `T — cycle target` (`controls.js` **406**) | `T — cycle target (hostiles first in combat)` or keep live if owner overrides |
| Header comment | nearest first (`controls.js` **31**, **113**) | docs/comment only; not HUD |
| `ctx.input.targetPressed` | “cycle nearest hostiles” (**lie**) (`ctx.js` **88**) | comment fix with PR1; not HUD |
| Context prompt | `T` + `Target` when empty lock + in-range ship (`hud.js` **2556–2564**) | **unchanged** |
| Incoming toast | `Incoming fire.` / `Incoming dart.` (`npc-fire-toast.js` **8–9**) | **unchanged** |
| Tgt rail name | cover name until revealed (`hud.js` **2498–2501**) | **unchanged** |

Do not toast on each T. Do not name the selected hull in a new live region. Existing tgt rail names the lock.

### Findings

#### 🔴 Blocker

None open in this freeze.

#### 🔴 Blocker: T cycle ignores hostiles in a duel — **resolved as later sort**

**Location:** `src/systems/controls.js:139`; gather **114–142**; inbox playtest hauler → freighter → ace
**Issue:** Empty lock + nearer friendly + ace at 59 u: first T is the nearest any ship. Incoming fire. already warns (`npc-fire-toast.js:9`). Contacts already mark hostile (`hud.js:1734`). Selection does not follow.
**Fix:** PR1 gated hostiles-first then range. Live hole remains until PR1 (expected). Integrator must not CONSUME.
**Status:** leftover REAL / named PR1

#### 🟠 Major

None open in this freeze.

#### 🟠 Major: New attacker key as the default fix — **resolved in freeze**

**Location:** inbox alternative (b); TRACKED `src/systems/controls.js:46–53`; KeyV **339–340**; KeyX **336–337**; KeyK **345–346**
**Issue:** A second select key fights TGT-05 / MATCH / engine-select and splits combat UI. Digit 0/8/9 are not free.
**Fix:** Prefer cycle order. KeyT stays. Do not remap V/X/K. Do not add a Digit.
**Status:** freeze law (a) only

#### 🟠 Major: Color-only hostile cycle — **resolved in freeze**

**Location:** `src/ui/hud.css:898–905` `.rw-contact-pip.is-hostile`; contract §0.15; `src/ui/hud.css:1–4` (color always paired)
**Issue:** Painting the lock red / amber without changing T order (or without text help) would fail the inbox and fail a11y. Contacts already use amber + triangle for hostiles. That is display, not select.
**Fix:** Order is the cue. Optional help is text. Existing tgt rail still names the lock.
**Status:** freeze

#### 🟠 Major: Incoming toast / gauge as selector — **resolved in freeze**

**Location:** `src/game/npc-fire-toast.js:8–64`; `src/systems/combat.js:1797–1799`; `src/ui/hud.css:700–710`; TGT-03; HUD-01
**Issue:** Clickable toast, shooter-named line, or a hub pip would steal TGT-03, HUD-04 slots, and the empty hub. Toast has no ship id. `playerHit` has no shooter. Stack is not a target.
**Fix:** Toast stays warning-only. No incoming gauge. No PPI.
**Status:** freeze

#### 🟠 Major: HUD layout / contacts rewrite as this leftover — **resolved in freeze**

**Location:** `src/systems/hud.js:1738–1751` contacts sorter; `src/systems/hud.js:2556–2564` prompt; HUD-07 `.rw-yield` `src/ui/hud.css:690–691`
**Issue:** Changing arc glyphs, tgt-rail chrome, or the one-verb prompt to “fix” T would steal HUD-07 / HUD-06.
**Fix:** Later write-set is `controls.js` cycle (+ help / ctx comment). Contacts sorter stays display. Prompt stays `T` / `Target`.
**Status:** freeze

#### 🟡 Minor: Help panel fades in the firefight that needs the new line

**Location:** `src/systems/hud.js:1217–1220` `.rw-controls.rw-fade`; `src/ui/hud.css:89` `#hud.in-combat .rw-fade { opacity: 0.14 }`
**Issue:** Deputize help names hostiles-first, but CONTROLS is combat-faded. A player in Incoming fire. will not read the overlay. Help cannot be the combat cue.
**Fix:** Keep help as a calm-flight teaching line. Behavior on KeyT is the cue. Do not brighten `.rw-fade` (HUD-07 / combat deconfliction).
**Status:** accepted (order is the cue)

#### 🟡 Minor: Help may stay `'T — cycle target'` if owner overrides

**Location:** `src/systems/controls.js:406`; contract §0.1
**Issue:** Players who learned nearest-first will not read a changelog. Silent behavior still fixes the inbox from empty lock.
**Fix:** Deputize default-on help. Owner may keep the short line after playtest.
**Status:** accepted

#### 🟡 Minor: Help copy says “in combat”; gate is in-envelope `ai.intent`

**Location:** contract later literal `T — cycle target (hostiles first in combat)`; gate `src/game/state.js:27` vs **32** (800 vs 600); `src/systems/npc.js` combat flag unread by cycle
**Issue:** A hostile at 700 u can light `flags.combat` and an amber pip (contacts use encounter bubble) while T still sorts d2-only among 600 u ships. The phrase “in combat” is player-facing, not the 800 u bit.
**Fix:** Keep the authored line. Do not write “when Incoming fire.” or “when amber pip”. Do not retune `U.TARGET_RANGE`.
**Status:** accepted (copy is player language, not the gate)

#### 🟡 Minor: Long help line wraps in a 280 px panel

**Location:** `src/ui/hud.css:1169–1202` `.rw-controls` `max-width: 280px`; later string ~44 chars
**Issue:** `(hostiles first in combat)` wraps under `T — cycle target` at 10 px type. Readable. Do not shrink the list or add a tooltip.
**Fix:** Leave wrap. Do not steal layout.
**Status:** accepted

#### 🟡 Minor: Existing friendly lock does not snap to the ace

**Location:** wrap live `src/systems/controls.js:140–141`; contract wrap = `(idx + 1) % n`
**Issue:** From a hauler lock, one more T may pass other non-hostiles before wrap to hostiles. Contacts still show that lock as `is-lock` first (`hud.js:435–437`, **1743**).
**Fix:** That snap is law (b). Inbox playtest is from empty / nearest-first. Documented. Do not merge arc lock-first with cycle hostile-first (HUD-07).
**Status:** accepted

#### 🟡 Minor: Contacts envelope and KeyT envelope stay different

**Location:** contacts range `src/systems/hud.js:1718` (`ENCOUNTER_BUBBLE` or ×2); cycle `src/systems/controls.js:121` (`TARGET_RANGE` 600)
**Issue:** An amber pip at 700 u is not a T candidate today and will not become one in PR1. Players may still expect T to pick every hostile pip.
**Fix:** Do not grow the cycle envelope. Empty / out-of-list already cannot lock that hull with T.
**Status:** accepted (live; not this leftover)

#### 💡 Suggestion: Do not change the context prompt verb

**Location:** `src/systems/hud.js:2556–2564`
**Issue:** Empty lock already prompts `T` / `Target` when any ship is in 600 u. “Target attacker” or “cycle hostiles” would steal the one-verb slot and lie when the only in-range ships are friendlies.
**Fix:** Leave HUD-07. Help overlay is the named-order line.

#### 💡 Suggestion: Do not restyle hostile pips or tgt-rail band as this leftover

**Location:** `src/ui/hud.css:898–915`; tgt rail `src/systems/hud.js:2494–2512`
**Issue:** Extra red lock chrome would be a color cue and a HUD-07 fight.
**Fix:** Consume as-is. Cycle order + lock name.

#### 💡 Suggestion: Optional PR2 stills

One still: empty lock + nearer hauler + ace 59 u + first T on ace; Incoming fire. visible; hub empty; CONTROLS overlay if opened; Q-ship cover name if the hunter is unrevealed; no extra toast slot; no hub pip.

### Accessibility

- [x] KeyT remains the cycle key (keyboard reach unchanged)
- [x] Hostiles-first is list order, not a color-only cue
- [x] Optional help is authored text (`textContent` / `el()`)
- [x] Incoming warning stays existing `role="status"` toast text; no second live region; no click target
- [x] Contacts hostile already pairs color with triangle glyph
- [x] Tgt rail names the lock in text (cover name until revealed)
- [x] No new Digit
- [x] No new focus target
- [x] No new animation (`reducedMotion` unchanged)
- [x] HUD-01 hub stays empty (no PPI competing with the aim glass)
- [x] Q-ship class/name not used as a cycle cue

### Verdict

**CLEAN.** Later PR1 is a KeyT order change plus optional controls-list text. Live nearest-first hole stays until that serial. Freeze forbids a new key, a color-only hostile cue, a hub PPI, Incoming-toast lock, HUD-07 layout steal, and Q-ship unmask. No Blocker. No Major remain in this integrator freeze.
