## UI Audit: Agent evade leftover (later player-facing freeze)

**Persona:** designer (parent pass). Review only. Did not edit product source. Did not edit `out/w137/evade/**`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `references\ui-audit.md`. Merge law: `out/w137/evade/shared-contract.md` wins over `docs/AgentApiEvadeDesign.md`. Worker self-audit `out/w137/evade/ui-audit.md` checked, not rubber-stamped. Live Agent badge / Space afterburner / HUD burner aux / NAV-10 SLOW / hub RANGE cited. No stills. [NO BROWSER COVERAGE].
**Graph:** `graph_resolve` (`codex/agent-codex`) → `proceed_unmodeled` (`r-mtayvt1c-4cc2c463`). No binding workflow. Local markdown only. No Drive. No graph write.
**Scope:** Wave 137 leftover pack. **No product UI ships this wave.** Audit the later player-facing freeze: Agent badge/copy if any; afterburner `act` must not steal HUD. Worker freeze: leftover **REAL**, named serial **PR1**, one named `act({ name: 'afterburner' })` Space pulse. No new Digit. Do not move Agent badge. Do not steal NAV-10 SLOW. Do not grow hub. Pad **2B** not stolen. Manifest overlap is a sibling inbox.

### Summary

No product UI ships in Wave 137. The live agent-play hole is a missing Space-equivalent `act`, not a missing lamp. The integrator freeze is one named afterburner pulse, reuse of live `ship.js` burn chrome, no badge move, no third helm UI, no pad-approach chrome, no Fear mute as feedback. Color is not the flee cue. No Blocker. No Major remain in this freeze.

### What's done well

- Player-facing freeze is treated as UI. This parent pass is not skipped because the wave is markdown-only.
- One verb: `afterburner` matches the live help line (`controls.js` **573**). No jargon `AGENT EVADE`. No dual `evade` / `flee` name in PR1 (`shared-contract.md` §0.10, §0.1 later copy).
- Badge chrome stays Wave 134/Fable pin: body child, top-right 16 px, `z-index` 40 (`style.css` **31–43**). Freeze forbids chrome, copy, and z-index change (`shared-contract.md` §0.14).
- Last-intent already paints `Last: {name}` via `BADGE_COPY.lastPrefix` (`agent-api.js` **457–467**, **571–572**). `Last: afterburner` needs no new string.
- HUD-01 hub stays 80 px empty glass (`.rw-reticle` `hud.css` **184–193**; keep-open `hud.js` **1527**). RANGE word is already on the hub (`hud.js` **966**; `hud.css` **207–219**). Freeze adds no evade pip.
- Human Space binding stays (`controls.js` **29**, **54**, **490–492**, **573**). TRACKED does not gain a Digit (`controls.js` **48–55**). KeyH/J/L/M/P stay.
- NAV-10 SLOW stays the human pad cue (self SPD lamp `hud.js` **1118–1120**, **2280–2288**; prompt `DOCK_SLOW_VERB` **78**, **2574–2581**). Agent flee does not reuse SLOW copy.
- Burner aux already names READY / COOLDOWN / BURNING with bar + text (`hud.js` **1176–1180**, **2291–2301**; `hud.css` **170–173**). Color is paired with words.
- `reducedMotion`: no new animation. Badge already kills animation/transition (`style.css` **128–131**). HUD already kills motion (`hud.css` **1271–1274**). Contract §0.16: no badge pulse.
- Accessibility: Space remains the human afterburner key. Agent name is text on the last-intent line. Status region is `aria-live="polite"` / `aria-atomic` (`agent-api.js` **524–525**). Buttons are real `<button type="button">` with ≥44 px hit (`style.css` **105–108**; `agent-api.js` **541–549**). `innerHTML` forbidden later; badge uses `textContent` / `createElement` (`agent-api.js` **504–572**).
- Theming: badge local tokens match HUD (`style.css` **33–37**; `hud.css` **12–21**). Freeze does not retune palette or invent a flee color.
- Manifest overlap remains a **sibling inbox**. This pack does not “fix” it by moving the badge onto PWR (`shared-contract.md` §0.14; inventory **176–177**).

### Honor (later PR1; freeze vs live chrome)

| Check | Result | Cite |
|---|---|---|
| No product UI this wave | Pass | Wave 137 markdown only; later write-set is schema / dispatch / latch (`shared-contract.md` §1) |
| One named Space pulse, not a third helm UI | Pass | Public verb `afterburner`; same `input.afterburnerPressed` as Space (`shared-contract.md` §0.10–0.12; live burn `ship.js` **755–766**) |
| Do not steal NAV-10 SLOW | Pass | Write-set omits `hud.js`; SLOW stays pad (`hud.js` **2280–2288**; `hud.css` **231–239**) |
| Do not grow hub | Pass | 80 px reticle (`hud.css` **184–190**); no SAFE/FLEE child |
| Do not move Agent badge | Pass | pin `top`/`right` 16 px (`style.css` **38–42`); PR1 must not change `style.css` |
| Badge does not cover PWR | Pass (live pin) | PWR is bottom-right aux (`hud.js` **1193–1195**; `.rw-bottom` / `.rw-side-col` `hud.css` **1021–1039**). Badge is top-right, not over the bar. |
| Badge does not cover RANGE marker | Pass (live pin) | `.rw-reticle-range` sits under the 80 px hub (`hud.css` **207–219**; `hud.js` **966**). Top-right badge does not sit on that word. |
| Pad 2B / pad-approach chrome | Pass (out) | Owner **2A**; write-set omits `station.js` / AP dests; tests place 45 u |
| Fear mute as the only feedback | Pass (out) | Fear observe already `world.fear` (`agent-observe.js` **450**). No Fear HUD rewrite. Prefer the act. |
| No new Digit / key remap | Pass | Digit 0/8/9 stay; Space stays human (`controls.js` **48–55**, **573**) |
| Color is not the only cue | Pass | act name is text; BURNING is text (`hud.js` **2293–2300`); on/off is text + dashed/solid border (`style.css` **61–66**) |
| `reducedMotion` | Pass | no new animation (`shared-contract.md` §0.16; `style.css` **128–131**) |
| No toast on each burn | Pass | later copy **none required**; do not steal HUD-04 |

### Copy map (player-facing)

| Surface | Live | Later PR1 (deputize) |
|---|---|---|
| Badge title | `Agent play` (`agent-api.js` **458**) | **unchanged** |
| Enable / Stop | `Enable agent play` / `Stop agent play` (**465–466**) | **unchanged**. Do not rename Enable to Evade mode. |
| Hint | `Stop does not cancel Autopilot.` (**467**) | **unchanged** in PR1 (see Minor) |
| Last line | `Last: ` + `lastIntent.name` or `Last: none` (**461–462**, **571–572**) | `Last: afterburner` via live lastPrefix. No new literal. |
| Error line | `Error: ` + token (`**464**, **574**) | live tokens (`opt-in` / `paused` / `held` / `docked` / `unknown`). No `cooldown` token (inner no-op). |
| Controls help | `Space — afterburner` (`controls.js` **573**) | **unchanged**. No Agent help Digit. |
| Flight aux | `BURN` + READY/COOLDOWN/BURNING (`hud.js` **1176–1178**, **2291–2301**) | **unchanged** |
| Pad SLOW | self lamp + `Dock · SLOW — approach under 20 u/s` (`hud.js` **78**, **1119**, **2579–2580**) | **unchanged** |
| Hub RANGE | `RANGE` (`hud.js` **966**) | **unchanged** |

Do not toast on each burn. Do not ship `AGENT EVADE`. Do not paint SLOW on combat flee.

### Findings

#### 🔴 Blocker

None open in this freeze.

#### 🔴 Blocker: Agent has no flee control — **resolved as later named act**

**Location:** live `COMMAND_NAMES` `src/game/agent-schema.js:17–40`; `dispatchLive` default `src/systems/agent-api.js:432`; `agentPulse` `src/systems/controls.js:64`, **252–276**; inbox Fable two hull losses
**Issue:** The watch user sees combat and a READY burner bar (`hud.js:2291–2301`). The outer loop cannot tap Space. Humans can (`controls.js:490–492`). That is an agent-play hole, not a missing HUD lamp. A new helm panel or Fear mute would not close it honestly.
**Fix:** PR1 `act({ name: 'afterburner' })` queues the live Space edge. Live hole remains until PR1 (expected). Integrator must not CONSUME.
**Status:** leftover REAL / named PR1

#### 🟠 Major

None open in this freeze.

#### 🟠 Major: Third helm UI / pad-approach chrome as the default fix — **resolved in freeze**

**Location:** inbox “reach a pad”; owner **2A**; `AgentApiDesign.md` honor (do not edit); live dock in-zone `agent-api.js:399–404`; AP dests are systems
**Issue:** A pad-seeker HUD, approach chrome, or agent-only helm would steal pad **2B** and grow a third stick. That would also steal NAV-10 SLOW if flee reused pad copy (`hud.js:2280–2288`, **2574–2581**).
**Fix:** One Space-equivalent pulse. No pad chrome. Tests place hull in 45 u. Do not claim `hud.js` / `station.js`.
**Status:** freeze law (a) only

#### 🟠 Major: New evade Digit / key as the default fix — **resolved in freeze**

**Location:** TRACKED `src/systems/controls.js:48–55`; Digit 0/8/9 honor; help **573**
**Issue:** A sixth Digit or remapped Space fights station map and muscle memory.
**Fix:** Space stays human. Agent uses `window.rimward.act`. No new TRACKED code.
**Status:** freeze

#### 🟠 Major: Badge copy / pin rewrite as this leftover — **resolved in freeze**

**Location:** `src/style.css:32–43`; `BADGE_COPY` `src/systems/agent-api.js:457–467`; sibling Manifest overlap
**Issue:** Moving the badge or adding `AGENT EVADE` jargon would cover PWR (`hud.js:1194–1195`; `hud.css:1021–1039`) or the hub RANGE word (`hud.js:966`; `hud.css:207–219`), or steal the Manifest inbox.
**Fix:** pin stays. Copy stays. `Last: afterburner` is enough. Hint stays `Stop does not cancel Autopilot.` (disable() law; afterburner still steals AP like Space — do not lie by saying Stop cancels AP).
**Status:** freeze §0.14; `style.css` not in write-set

#### 🟠 Major: NAV-10 SLOW / MATCH as agent flee cue — **resolved in freeze**

**Location:** `src/systems/hud.js:2280–2288`; `DOCK_SLOW_VERB` **78**, **2579–2580**; `src/ui/hud.css:222–239`
**Issue:** Painting SLOW on combat flee would steal pad approach UI. MATCH is a different lamp (`hud.css:222–226`).
**Fix:** do not claim HUD SLOW. Burner aux already names BURNING.
**Status:** freeze §0.23

#### 🟠 Major: Hub PPI / fear-safe pip — **resolved in freeze**

**Location:** HUD-01 80 px hub `src/ui/hud.css:184–193`; `hud.js:1527`, **2094**
**Issue:** A SAFE / FLEE hub child would fill the empty glass and steal HUD-06/07.
**Fix:** no hub child. Fear meter stays Manifest (sibling overlap). Observe `world.fear` is enough (`agent-observe.js:450`).
**Status:** freeze

#### 🟠 Major: Fear mute or color-only “you can flee” as the only feedback — **resolved in freeze**

**Location:** inbox “and/or pace Fear”; honor a11y; `npc.js` not in write-set
**Issue:** A red badge or muted Fear without a named act fails the inbox. Color-only flee fails `hud.css:1–4` (color always paired).
**Fix:** the act is the control. Badge last-intent is text. BURNING is text. Do not retune Fear as UI.
**Status:** freeze §0.1 / §0.17

### 🟡 Minor: Hint does not mention afterburner steal

**Location:** `BADGE_COPY.hint` `src/systems/agent-api.js:467`
**Issue:** Stop does not cancel AP; Space/afterburner **does** (`autopilot.js` honor; contract §0.11). Players who only read the badge may think agent burn keeps AP.
**Justification:** hint is about **Stop**. Human Space already steals. Do not grow badge copy in PR1. Owner may add a one-line hint later.

### 🟡 Minor: Cooldown has no agent-specific toast; last line omits `queued`

**Location:** human burner COOLDOWN `src/systems/hud.js:2294–2301`; badge last paints name only `agent-api.js:571–572`; `afterControls` queued `agent-api.js:188–191`
**Issue:** Outer loop may re-pulse while COOLDOWN. Badge still shows `Last: afterburner` because the act queued. Inner `ship.js` no-ops (`ship.js:758–766`).
**Justification:** HUD already shows COOLDOWN + bar. Optional observe `ship.burnerReadyAt`. Do not toast each refuse (HUD-04). Do not add a `cooldown` token in PR1 (deputize off). Same last-name pattern as dock/hail.

### 🟡 Minor: Manifest still under the badge

**Location:** wishlist **303–305** (cite, do not edit); badge `z-index` 40 `src/style.css:43`
**Issue:** `Last: afterburner` does not make overlap worse than `Last: plotRoute`.
**Justification:** sibling inbox. Do not move the pin onto PWR or RANGE.

### 💡 Suggestion: Optional PR2 stills

One still: `?agent=1` badge top-right `Last: afterburner`; Flight aux `BURNING`; hub empty; SLOW off (not in pad band); RANGE word visible; PWR bar not covered; Manifest readable or overlap unchanged; no extra toast slot.

### 💡 Suggestion: Keep Enable / Stop labels

Do not rename Enable to “Evade mode”. Opt-in is play, not a combat stance (`agent-api.js:458`, **465–466**).

### Worker self-audit

`out/w137/evade/ui-audit.md` already closes the same Blocker/Major set (no flee act; no Digit; no badge move; no SLOW steal; no hub pip; no color-only). This parent pass agrees after independent live cites (PWR bottom-right vs badge top-right; RANGE under hub; burner text+bar; Space help). Extra designer checks: third-helm UI, pad-approach chrome, Fear mute as only feedback, badge covering PWR/RANGE. None of those land in the freeze.

### Verdict

**CLEAN.** No open Blocker. No open Major. Later PR1 must keep this freeze: one afterburner act, no HUD steal, no badge move, no new Digit, no pad chrome, no Fear mute UI.
