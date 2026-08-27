## UI Audit: TGT-07 PR1 KeyT help line

**Persona:** designer (parent pass). Review only. Did not edit `src/`, boot-test, PROGRESS, wishlist, or `out/w136/tgtcycle/**`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `references\ui-audit.md`. Worker self-audit `out/w136/tgtcycle/ui-audit.md` checked, not rubber-stamped. Live HUD path cited. No stills. [NO BROWSER COVERAGE].
**Graph:** `graph_resolve` (no agent_id) `r-mtarftpi-1fb68180` → `execute_workflows`. Primary `omp/workflow-browser-assisted-work` (coverage 0.11). Required tool `omp/tool-browser-control` is not in this agent. Control `omp/workflow-approval-gating`: this write is local scratch markdown, not a graph write, not a product edit. Did not `graph_propose` / `graph_approve`. Did not drive a tab.
**Scope:** Wave 136 TGT-07 PR1 player-facing change is the KeyT help line in `src/systems/controls.js` `config.controls`. `src/core/ctx.js` `targetPressed` comment is not UI. Honor: HUD-01 empty 80 px hub; no PPI; no incoming gauge; no toast on T; color is not a cycle cue; Digit 0/8/9 stay; KeyT stays the cycle key.

### Summary

PR1 player chrome is one authored controls-list string. HUD still paints that list with `el(..., String(line))` → `textContent`. No new HUD node, no toast on T, no color cue, no Digit, no layout CSS. No Blocker. No Major.

### What's done well

- KeyT stays the cycle key. TRACKED still lists `KeyT`. Keydown still pulses `pendingTarget`. Muscle memory is unchanged (`controls.js` **51**, **482–483**, **585**, **618**).
- Help is a JS string, not markup: `'T — cycle target (hostiles first in combat)'` (`controls.js` **566**). Matches deputize copy.
- HUD helper `el()` writes `node.textContent = text` (`hud.js` **316–321**). Controls list is `for (const line of lines) el('li', '', controlsList, String(line))` (`hud.js` **1256–1261**). `hud.js` has no `innerHTML`.
- Only consumer of `ctx.config.controls` is that HUD loop. No second help key.
- Combat collapse/fade of CONTROLS is unchanged (`hud.js` **2213–2222**; `hud.css` **89**). Behavior on T is the combat cue. No T toast added.
- Context prompt still says `T` / `Target` when empty lock + in-range ship (`hud.js` **2601–2609**). HUD-07 one-verb slot is not rewritten.
- Incoming fire. / Incoming dart. stay TGT-03 warning copy (`npc-fire-toast.js` **8–9**). Toast stack is `pointer-events: none` (`hud.css` **710–720**). `pushToast` uses `textContent` (`hud.js` **1444**). `hud.js` has no `targetPressed` / `cycleTarget` toast path.
- HUD-01 hub stays 80 px, empty of pips (`hud.css` **184–190**; build `hud.js` **963–966** RANGE word only).
- Hostile on the arc is still triangle + amber, not a cycle cue (`hud.css` **908–915**; contacts sort lock → hostile → dist `hud.js` **1769–1781**).
- Q-ship cover class / cover name stay HUD-02 (`hud.js` **127–132**, **2540–2541**). Cycle hostility is `ai.intent` only (`controls.js` **151–160**).
- `reducedMotion` still kills HUD motion (`hud.css` **1271–1277**). Cycle is input order, not a tween.
- Digit 0/8/9 are not in TRACKED. TRACKED digits stay 1–5 (`controls.js` **48–55**).

### Honor (PR1 vs merge law)

| Check | Result | Cite |
|---|---|---|
| KeyT stays the cycle key | Pass | TRACKED `controls.js` **51**; pulse **482–483**; publish **585**; `cycleTarget` **618**; help **566** |
| Hostiles-first is behavior, not color | Pass | gated sort `controls.js` **171–184**; contacts already use triangle + amber (`hud.css` **908–915**) |
| No hub PPI | Pass | `.rw-reticle` 80 px (`hud.css` **184–190`); RANGE only (`hud.js` **963–966**); PR1 did not edit HUD |
| No incoming gauge | Pass | no hub child; toast stays off the aim column (`hud.css` **709–720`) |
| No toast on T | Pass | no `targetPressed` / cycle case in `toastForEvent` (`hud.js` **614+**); Incoming copy unchanged (`npc-fire-toast.js` **8–9**) |
| Color is not a cycle cue | Pass | order is the cue; help is text; tgt rail names the lock (`hud.js` **2540–2546`) |
| Digit 0/8/9 stay | Pass | TRACKED has Digit1–5 only (`controls.js` **48–55`) |
| Help is text, not innerHTML | Pass | string literal `controls.js` **566**; `el()` `textContent` `hud.js` **316–321**, **1256–1261** |
| HUD-01 empty 80 px hub | Pass | `hud.css` **184–190** |
| `ctx.js` comment is not UI | Pass | `targetPressed` comment only (`ctx.js` **88**) |
| `reducedMotion`: no new animation | Pass | existing kill `hud.css` **1271–1277**; no new motion |

### Copy map (player-facing)

| Surface | Live PR1 | Note |
|---|---|---|
| Controls list | `T — cycle target (hostiles first in combat)` (`controls.js` **566**) | painted via `textContent` (`hud.js` **1256–1261`) |
| Header comment | hostiles first in combat (`controls.js` **33**) | docs/comment; not HUD |
| `ctx.input.targetPressed` | cycle; hostiles first when one is in envelope (`ctx.js` **88`) | comment only; not HUD |
| Context prompt | `T` + `Target` (`hud.js` **2601–2609**) | **unchanged** |
| Incoming toast | `Incoming fire.` / `Incoming dart.` (`npc-fire-toast.js` **8–9**) | **unchanged**; not a T cycle toast |
| Tgt rail name | cover name until revealed (`hud.js` **2540–2541**) | **unchanged** |

Do not toast on each T. Do not name the selected hull in a new live region. Existing tgt rail names the lock.

### Worker self-audit check

`out/w136/tgtcycle/ui-audit.md` verdict (no Blocker/Major; textContent path; no T toast) is correct. Cite drift: worker pointed HUD paint at `hud.js` ~1225–1229. Live loop is **1256–1261**. Helper `el()` is **316–321**. Product path is safe. Worker wrap note is not a defect.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor

None that need a PR1 UI fix. The longer help line may wrap in `.rw-controls` `max-width: 280px` at 10 px type (`hud.css` **1179–1212**; string `controls.js` **566**). Wrap is readable. Do not shrink the list. Do not add a tooltip.

Combat fade still hides the new words in a firefight (`hud.js` **2213–2222**; `hud.css` **89**; collapse **1214**). Help is a calm-flight teaching line. Order on KeyT is the cue. Do not brighten `.rw-fade`. Do not add a T toast. Accepted.

Phrase “in combat” is player language. Gate is in-envelope `ai.intent`, not `flags.combat` (`controls.js` **151–177**). Do not rewrite to “when Incoming fire.” or “when amber pip.” Accepted from freeze.

#### 💡 Suggestion: Do not add a T toast

**Location:** `src/systems/controls.js:566`; `src/systems/hud.js:614`, **1035–1044**, **1444**
**Issue:** Players who keep CONTROLS collapsed will not see the new words. A cycle toast would steal TGT-03 slots and fight HUD-07.
**Fix:** None in this PR. Leave Incoming fire. as the warning. Leave tgt rail as the lock name.

#### 💡 Suggestion: Do not change the context prompt verb

**Location:** `src/systems/hud.js:2601–2609`
**Issue:** Empty lock already prompts `T` / `Target`. “Target attacker” would steal the one-verb slot and lie when the only in-range ships are friendlies.
**Fix:** Leave HUD-07. Help overlay is the named-order line.

### Accessibility

- [x] Help string is authored text, not `innerHTML`
- [x] HUD paints controls via `textContent` (`el()`)
- [x] KeyT remains the cycle key (keyboard reach unchanged)
- [x] Hostiles-first is list order, not a color-only cue
- [x] Incoming warning stays existing `role="status"` toast text; no second live region; no click target
- [x] Contacts hostile already pairs color with triangle glyph
- [x] Tgt rail names the lock in text (cover name until revealed)
- [x] No new Digit (0/8/9 stay)
- [x] No new focus target
- [x] No new animation (`reducedMotion` unchanged)
- [x] HUD-01 hub stays empty (no PPI)
- [x] Q-ship class/name not used as a cycle cue
- [x] Screen-reader path is the same `ul`/`li` list of control strings

### Verdict

**CLEAN.** PR1 player UI is one `config.controls` string painted with `textContent`. Honor holds: empty 80 px hub, no PPI, no incoming gauge, no toast on T, color is not the cycle cue, Digit 0/8/9 stay, KeyT stays cycle. No Blocker. No Major. No re-run required for UI.
