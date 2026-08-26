# Wave 126 Hail01 pirate demand lifecycle — verifier report

**Domain:** data (markdown freeze). No Vite. No Chrome. No `npm run test:boot`. No formatter. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` `r-mt9haw0v-07ef9990` decision `execute_workflows` (primary `omp/workflow-software-delivery`, control `omp/workflow-approval-gating`). Agent `omp/agent-omp`, namespace `omp`. Calendar / CRM / Activar did **not** bind. Did not `graph_propose`. Owner data-domain gates: no browser, no boot-test.  
**Verdict:** **CLEAN**

## Status

CLEAN

## What I tested

1. Leftover REAL vs live `hail.js` / `npc.js` / `hud.js` demand toast. HEAVE-TO is hunt telegraph `commLine` `'Heave to. Cargo or hull.'`. Wave 30 still opens a pay-or-fight card for pirates in 600 u. Illyx is ace duel and does not emit demand. Jump hides the card with no `hailClosed`.
2. Pack write-set: markdown only. `git status --short` on Hail01 + `out/w126/demand` + hail/npc/hud/controls/agent-api. No `src/` in this pack.
3. Contract names source / timer / compliance / outcome. Does not steal Agent API or HUD-06. HUD later = `toastForEvent` listeners only. Does not claim `hud.js` layout.
4. This worker did not edit `docs/AgentApiDesign.md` or `docs/Hud06HomeMarkerDesign.md` (sibling untracked packs; Hail01 file list omits them).
5. Merge law: `out/w126/demand/shared-contract.md` wins. Design doc agrees. No material freeze conflict.
6. Leftover is not CONSUME. Named serial is **PR1**, not none.
7. Later write-set freeze: `hail.js` + `npc.js`. HUD listeners only. Do not claim `controls.js` or `agent-api.js`.
8. Did not start Vite or Chrome. Did not run `npm run test:boot`.

Non-blocking (does **not** invert CLEAN): live `demandPeaceAt` is open-time for void-on-hit (`npc.js` **252–252**, **2030**, **2528**). Contract timer is 20 s from emit and cites that stamp as start. PR1 must keep a separate expiry (or `demandPeaceAt + 20`) and must **not** overwrite `demandPeaceAt` to `now + 20`. Inventory groups `refuseFight` with pirate `commLine`; live refuse path stamps `'refused'` and emits `hailClosed` with **no** `commLine` (`hail.js` **294–309**).

## Bugs found

None. Leftover is **REAL**. Named serial **PR1**. Not CONSUME. Serial is not none.

## Environmental issues

- Graph expected `proceed_unmodeled`. This pass bound software-delivery + approval gating. Not calendar / CRM / Activar. Followed owner data-domain gates (no Chrome / Vite / boot-test).
- Working tree also has dirty `src/` from **other** Wave 126 work: `npc.js`, `controls.js`, `jump.js`, `main.js`, `overlay-policy.js` (and more outside this pack). `git diff` on `npc.js` has **no** Hail01 PR1 strings (`docked` / `jumped` / `expired` demand outcomes, 20 s timer, HEAVE-TO suppress). `hail.js` and `hud.js` are clean.
- Sibling untracked docs: `docs/AgentApiDesign.md` (Agent leftover, merge law `out/w126/agentapi/shared-contract.md`), `docs/Hud06HomeMarkerDesign.md` (HUD-06 leftover). Hail01 honor forbids those edits. Hail01 worker file list does not include them.

## Evidence

### 1. Write-set (this pack)

Worker-listed paths (all markdown; `out/w126/demand/verify/**` was empty until this pass):

- `docs/Hail01DemandLifecycleDesign.md` (untracked)
- `out/w126/demand/current-hail-demand-inventory.md`
- `out/w126/demand/shared-contract.md`
- `out/w126/demand/security-review.md`
- `out/w126/demand/code-review.md`
- `out/w126/demand/ui-audit.md`
- `out/w126/demand/notes.md`

No pack file under `src/`. Contract header: no `src/` / `scripts/` / `public/` / `index.html` / `package.json` this wave.

`git status --short` on scoped paths:

```
 M src/game/jump.js
 M src/main.js
 M src/systems/controls.js
 M src/systems/npc.js
 M src/systems/overlay-policy.js
?? docs/AgentApiDesign.md
?? docs/Hail01DemandLifecycleDesign.md
?? docs/Hud06HomeMarkerDesign.md
?? out/w126/demand/
```

`src/systems/hail.js` — clean. `src/systems/hud.js` — clean. `src/systems/agent-api.js` — not in the short list.

### 2. Leftover line / serial / name

| Surface | Leftover | Named serial | Name |
|---|---|---|---|
| Brief Status | **REAL**. Markdown freeze | **PR1** | incoming pirate demand lifecycle |
| Contract header | **REAL.** Not CONSUME. Serial is **not** none | **PR1** | source + timer + compliance + dock/jump-safe visible outcome |
| Inventory §0 / §6 | **REAL.** Not CONSUME | **PR1** | same |
| Notes | **REAL.** Named serial is **not** none | **PR1** | same |

CONSUME required all of: named source, timer, card-or-equal, dock/jump-safe visible outcome, no orphan HEAVE-TO. Census: **not** live. CONSUME path is documented as unexpected and **not** taken.

### 3. Inventory vs live (data)

| Claim | Live |
|---|---|
| Telegraph `'Heave to. Cargo or hull.'` `npc.js` **1686–1688** | `say(...)` pirate line at **1688**; `demanding` returns first **1682–1685** |
| `say` emits `from` `npc.js` **354–355** | `ctx.emit('commLine', { text, from: live.state.name })` |
| HUD `commLine` drops `from` `hud.js` **560–568** | `{ text: e.text ?? e.line ?? '', cls: 'comm' }` — no ship name |
| `hailOpened` not toasted `hud.js` **677–678** | `default: return null` — no `hailOpened` case |
| Toast life 4 s / linger 8 s `hud.js` **64–66**, **1186–1212**, **1237–1244** | `TOAST_LIFETIME = 4`; `TOAST_DEDUP_WINDOW = 8`; expire silent |
| Demand emit pirate + 600 u `npc.js` **2018–2036** | `ai.role === 'pirate'`; dist `< U.TARGET_RANGE`; line `'Your cargo or your hull.'` |
| `U.ENCOUNTER_BUBBLE` 800 / `U.TARGET_RANGE` 600 `state.js` **27**, **32** | live |
| Telegraph 3 s `npc.js` **93**, **1691** | `TELEGRAPH_SECONDS = 3` |
| Cooldown 300 s `npc.js` **107**, **2024** | `DEMAND_COOLDOWN = 300` |
| One demand per instance `npc.js` **249**, **2027** | `demandSent` reset never |
| Intents `npc.js` **1477–1482** | `payTribute`; `showTeeth` iff `concealedMounts === true`; `refuseFight` |
| Card open `hail.js` **341–429**, **454–470** | `HAIL — ${speaker}` **369**; buttons **406–421** |
| Digit 1..n `hail.js` **431–447**; `overlay-policy.js` **175–185** | live; cite of `controls.js` overlap **431–432** only |
| Other-card steal `hail.js` **459** | `if (open) continue` — drop, no defer |
| Jump ships empty `jump.js` **121–126**; `systemLoaded` **166** | `ctx.ships.length = 0` |
| Hail silent hide `hail.js` **497–500** | `closeCard()`; **zero** `systemLoaded` listeners |
| Update order jump before hail `main.js` **122–129**, **153** | `initJump` … `initNpc` … `initHail`; `system.update` in that array |
| Dock: no new demand; open card stays `npc.js` **1619–1623**, **1913–1915** | `breakOff` does not clear `demanding`; hail has no dock listener |
| Overlay never `paused` `overlay-policy.js` **4**; hail **18–20** | live |
| Illyx ace duel `world.js` **408–414**; `npc.js` **230–232**, **2042–2189** | `role: 'ace'` → `mode = 'duel'`; `updateDuel` has **no** demand `hailOpened`; ace line `'Run if you like.'` **2158** |
| Ninth Tooth pirate `world.js` **227** | `PIRATE_NAMES.freehold` includes `'Ninth Tooth'` |
| `demandMin` 50 `state.js` **343** | live |
| NaN cargo → NaN demand `state.js` **1134–1136**; emit **2032–2035**; pay **253** | `cargoValue` uses raw `c.units`; `cargoValueSafe` (`data-trade.js` **114–122**) returns 0 only for non-arrays; `Math.max(50, NaN)` is NaN |
| Void-on-hit `npc.js` **2525–2530** | `hailClosed`; no `demandOutcome` stamp |
| Player resolve `hail.js` **248–310** | pay / teeth / refuse emit `hailClosed` **309** |
| Overlay defer chart/berth `overlay-policy.js` **107–116**, **130–146** | live |
| `berthHold` session `overlay-policy.js` **187–204**; `ctx.js` **211** | not pause; not demand close |
| Starter grace on demand `npc.js` **1755–1777**, **2023** | `starterGraceBlocksAcquire` |
| `innerHTML` in `hail.js` | **zero** |

Inbox all-caps `HEAVE TO. CARGO OR HULL.` is **not** a hail card line. Live orphan surface is the nameless telegraph toast. Wave 30 card is a **second** channel.

### 4. Contract (source / timer / compliance / outcome) — no Agent / HUD-06 steal

`shared-contract.md` §0.1 names:

- **Source:** speaker in text (`record.pilot ?? state.name`). Demand-specific toast, not a rewrite of all `commLine`.
- **Timer:** 20 s session from emit. Visible on card. 0 → `expired` = refuse.
- **Compliance:** Wave 30 card intents `payTribute` / `showTeeth` / `refuseFight`. `hailDigitsAllowed` stays.
- **Outcome:** `paid` / `bluffed` / `failed` / `refused` / later `expired` / `docked` / `jumped` / `voided`. Dock closes. Jump resolves `jumped` before silent hide.

Agent: §0.10 forbids `agent-api.js` and off-card `payTribute`. HUD-06: §0.12 forbids home marker and `hud.js` **layout**; later HUD is `toastForEvent` listeners only (`§1`).

Hail01 design Neighbours / Ownership / PR1 table match. Contract wins; no material disagreement.

### 5. Honor: AgentApiDesign / Hud06

Hail01 honor: do **not** edit `docs/AgentApiDesign.md` or `docs/Hud06HomeMarkerDesign.md`. Worker file list omits them. Those files are sibling leftover packs (Agent merge law `out/w126/agentapi/shared-contract.md`; HUD-06 `out/w126/homemarker/shared-contract.md`). Hud06 honor forbids editing Hail01. Timestamps: Hud06 10:27, Agent 10:28, Hail01 design 10:30.

### 6. Later write-set (named only)

**Writers:** `src/systems/hail.js`, `src/systems/npc.js`.  
**Listeners only:** `src/systems/hud.js` `toastForEvent` (demand announce / outcome).  
**Do not claim:** `controls.js`, `agent-api.js`, `state.js` write, overlay pause/mutex rewrite, HUD layout, Illyx tribute.

See `out/w126/demand/verify/write-set.txt`.
