# UI Audit: Msn04 job-posting identity leftover (Wave 130)

**Auditor:** `[designer]` (independent of `out/w130/jobdedup/ui-audit.md`)
**Scope:** Wave 130 MSN-04 job-dedup brief. Markdown only. Confirm later PR1 keeps Digit 2 Jobs, paints distinct mining rows in **text**, omits slot 1 honestly when the ore table cannot supply a second key, stays `textContent` / `h()`, does not use color-only identity, does not dual-stack scanner-as-feedback, and does not hide unique four.
**Review file:** `out/w130/designer/jobdedup-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Live cites: `src/systems/station.js` Digit 2 Jobs render, `src/ui/screens.css` job-card, `src/game/state.js` hardness-1 names/prices, `src/systems/hud.js` lock-card ore readout (cite only). Pack: `docs/Msn04JobDedupDesign.md`, merge law `out/w130/jobdedup/shared-contract.md`, inventory `out/w130/jobdedup/current-msn04-job-dedup-inventory.md`. Worker self-audit `out/w130/jobdedup/ui-audit.md` read, not copied. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-26
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w130/jobdedup/shared-contract.md` wins if the brief forks. This wave does not ship Jobs chrome. Findings bind **later workers**: do not CONSUME the live twin hole; do not remap Digit 2; do not HTML ore names; do not tint cards as identity; do not teach twins on the scanner; do not hide unique four.

## UI Audit: Digit 2 Jobs mining-row identity (REAL leftover, named PR1)

### Summary

No product UI ships in Wave 130. Audit is of the live Digit 2 Jobs board plus the integrator freeze for later mining identity. Live play can still paint two identical `Mine Raw ore` rows with the same UU. That hole is leftover **REAL**, not CONSUME. The freeze names later serial **PR1**: distinct commodity text, or honest omit of slot 1. Color-only distinction, merged ids, Digit remap, hidden unique four, `innerHTML`, and scanner-as-feedback are forbidden. No 🔴 Blocker. No 🟠 Major remain **in the integrator freeze**.

### Verdict

**CLEAN.** 0 blockers remaining, 0 majors remaining, 3 minors (passenger twins stay; clock text is not identity; omit shortens Digit indices), 2 suggestions. Live twin rows stay until PR1 (expected). Freeze must not CONSUME.

### What's done well

- Digit 2 is already Jobs. `DOCK_KEY_SERVICES[1] === 'jobs'` (`station.js` **188**). Dock-root Digit 2 selects that key (`station.js` **6169–6176**). Menu copy is `2 — Jobs board` (`station.js` **6034–6037**). The brief does not add a Digit and does not remap Digit 0/8/9.
- Jobs pane already names rows in **text**. Mining title rewrite is `Mine ${oreName}` (`station.js` **5150–5156**). Pay line is `Deliver ${need} ${oreName} here — pays ${est} UU` (`station.js` **5242–5251**). Digit index is painted on the title (`station.js` **5214**) and on `Accept (i + 1)` (`station.js` **5343**). Color is not the identity channel.
- `h()` writes `textContent` (`station.js` **4464–4468**). `innerHTML` / `insertAdjacentHTML` / `document.write` are **none** in `station.js`. Ore names from `COMMODITIES[key].name` (`state.js` **354–355**) stay strings. Later uniqueness can ride the same rows.
- Unique four stay on the board while offered or accepted (`boardJobs` `station.js` **3673–3678**; `makeJobs` **2098–2130**). Unique `DONE` is hide-without-splice (`station.js` **3680–3684**). PR1 write-set is mining helpers only. That keeps career landmarks visible.
- Player-visible identity for this leftover is commodity + need + reward + origin (inventory §2). Live need is always `FERRY_UNITS` **4** (`station.js` **210**, **2276**). Origin is the posting dock. Reward follows commodity. Distinct **ore name** is the honest cue. Slot number is hidden from copy (inventory §2). The freeze does not invent slot badges.
- Omit-if-exhausted is an honest shorter board, not a ghost duplicate (`shared-contract.md` §0.1; design Picture / Player outcome). Live table size is **2** (`rawOre`, `livingRock`). Omit is the size-1 future path. Espionage already omits slot 1 when dest list length is 1 (inventory §5) — same empty pattern.
- `reducedMotion`: freeze adds **no** new animation (contract §0.13). HUD-01 hub stays empty; no job pip (contract §0.2).
- Scanner / lock-card ore readout stays a **field** tool (`hud.js` **2449–2471**). Contract forbids dual-stacking that readout as board feedback (contract §0.1, §0.9). Inbox twins are Jobs copy, not glass copy.
- Offered-twin heal runs on next `renderJobs` sync (`shared-contract.md` §0.1). Player who opens Digit 2 sees the healed board. No extra toast. No pause write.

### Focus check (must hold in PR1)

| Focus | Live | Freeze | Result |
|---|---|---|---|
| Identical mining rows | Independent `pickMiningCommodity` (`station.js` **2238–2242**); count fill (`2293–2314`); ids-only `nextMiningId` (`2244–2263`). Twin title+UU expected at table size 2. | PR1: exclude sibling live commodity at origin; remint **offered** twin on sync; do not CONSUME | **Pass freeze.** Live hole stays until PR1. |
| Honest omit of slot 1 | Fill forces count 2 (`2306–2313`). Empty pick falls through to `'rawOre'` (`2239–2240`). | If remaining keys are used, **omit** the card. Cap 2 is max, not a forced fill. Do not paint a blank twin. | **Pass freeze.** |
| `textContent` not `innerHTML` | `h()` `textContent` (`4464–4468`, **5214**) | `innerHTML` forbidden later (contract §0.4) | **Pass freeze.** |
| Digit 2 stays Jobs | `DOCK_KEY_SERVICES[1]` + Digit 2 (`188`, **6169–6176**, **6034**) | No new Digit. Digit n still accepts `boardJobs[n-1]` (`6230–6232`) | **Pass freeze.** |
| No color-only identity | Job cards share one chrome (`screens.css` **230–266**). Pay uses `var(--rw-good)` for **all** rewards (`250–254`). | Distinct **title + pay text**. Color is extra, not the only cue (contract §0.13–§0.14) | **Pass freeze.** |
| No scanner-as-feedback | Lock-card names ore in flight (`hud.js` **2449–2471`) | Do not add scanner filter / field marker / toast as the twin fix (contract §0.9) | **Pass freeze.** |
| Unique four still visible | `boardJobs` keeps offered/accepted unique four (`3673–3678`) | Do not hide unique four. Do not splice unique `DONE` here | **Pass freeze.** |

If a later worker CONSUMEs the twin hole, remaps Digit 2, HTML-paints ore names, tints cards from `ORE_TYPES.sparkColor` as the only cue, teaches twins on the scanner, or drops unique four to make room, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

### Freeze confirmation (later serial PR1)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Digit 2 dock root | Jobs (`station.js` **188**, **6169–6176**) | contract §0.2 | **Must not steal** |
| Digit 0 / 8 / 9 dock | shipyard / launch / epics (`188`, **6034–6037**) | §0.2 | **Must not steal** |
| Digit n on Jobs | `boardJobs(...)[n-1]` (`6230–6232`) | keep index paint | **Must not compact** the list to “fix” 8 and 9 |
| Mining title / pay | `Mine ${oreName}` + `pays ${est} UU` (**5150–5156**, **5242–5251**) | distinct commodity **text** | **Must not** rely on color, slot badge, or id tooltip |
| Slot 1 exhausted | Forced fill to 2 today | **omit** card | **Must not** paint a duplicate or a fake origin/need |
| Unique four | four fixed ids (`2098–2130`, **3673–3678**) | stay visible | **Must not hide** |
| `h()` channel | `textContent` (`4464–4468`) | no `innerHTML` | **Must not** interpolate save strings into HTML |
| Scanner / hub | ore meta on lock card (`hud.js` **2449–2471**); 80 px hub empty | not this leftover | **Must not** dual-stack as board feedback |
| Pay formula | `4 * 140 * 1.4 = 784` book raw ore | unchanged | **Must not** retune UU to fake difference |
| Ids | `mine-<sys>-<n>` monotonic | do not merge | **Must not** collapse two slots into one Digit target |

### Accessibility / theming / states (spec)

| Check | Result |
|---|---|
| Contrast / tokens | No new color. Reuse live `.job-card` / `.job-title` / `.job-detail` / `.job-reward` / `.screen-btn`. Identity is ore **name** + pay **number**, not hue. |
| Keyboard | Live Digit 2 opens Jobs. Digit n accepts the painted index. `Accept (n)` is a named `button` (`station.js` **4471–4475**, **5343**). No new control. |
| Focus | Live `.screen-btn:focus-visible` (`screens.css` **89–97**). No new overlay. |
| Empty | Omit slot 1 = shorter `boardJobs` list. Do not add “slot 1 missing” chrome. Unique four and other families still paint. |
| Error | Unknown commodity already maps to `'ore'` without throw (`miningOreName` **2345–2347**; pay **5243–5247**). Freeze: skip / omit, never throw. |
| Disabled | No new disabled mining control. Accepted cards already drop Accept and show `ACCEPTED — deliver …` (`5363–5371`). |
| Loading | No mining JSON spinner. Dedup at mint/sync, not a per-frame HUD alloc (contract §0.15). Do not add a scanner toast as “loading uniqueness”. |
| Hub | 80 px stays empty of job pips. |
| Responsive | No new overlay. Station panel scroller unchanged (`render` **6011–6021**). |
| Reduced motion | No new `@keyframes`. Color is not the only cue. |
| Screen reader / names | Title and pay already include ore name. Digit index is in the title string. Do not leave identity in CSS class only. |

### Findings

#### 🔴 Blocker: Identical mining rows — **resolved as later mint**

**Location:** `src/systems/station.js:2238`, `src/systems/station.js:2293`, `src/systems/station.js:5150`, `src/systems/station.js:5242`
**Issue:** Two mining slots can pick the same hardness-1 key. Digit 2 then paints two rows with the same title and the same UU (playtest: jobs 8 and 9, `Mine Raw ore`, 784 UU). Digit accept on those indices is a coin flip with the same payload. Distinct `mine-<sys>-<n>` ids are not player-visible.
**Suggestion:** PR1 exclude sibling live commodity (offered or accepted) at that origin. If the table cannot supply a different key, omit the card. Heal offered twins on `syncMiningJobs`. Do not CONSUME. Do not merge ids. Do not hide unique four to make room.
**Status:** accepted leftover **REAL**. Live hole remains until PR1 (expected). Not remaining in the freeze.

#### 🟠 Major: Color-only or slot-only distinction — **resolved in freeze**

**Location:** `src/ui/screens.css:230`, contract §0.13–§0.14; `src/game/state.js:387`
**Issue:** A later tint from `ORE_TYPES.sparkColor` / `dustColor`, a CSS ore class, a hidden slot `0/1` badge, or an id tooltip would fail the inbox. The player saw title + UU. Color-blind / `reducedMotion` players would still see twins.
**Suggestion:** Distinct **ore name** in title and pay line (`Mine Living rock` vs `Mine Raw ore`). Color is extra, never the only cue. Do not paint internal slot numbers.
**Status:** frozen. Not remaining.

#### 🟠 Major: Renumber / Digit remap to “fix” jobs 8 and 9 — **resolved in freeze**

**Location:** `src/systems/station.js:3659`, `src/systems/station.js:5214`, `src/systems/station.js:6169`, `src/systems/station.js:6230`
**Issue:** Inbox “jobs 8 and 9” is `boardJobs` paint order (`i + 1`), not the `mine-*-n` suffix. Compacting the list, stealing Digit 2, or remapping Digit 8/9 (dock launch/epics; outfitting papers **6248–6250**) would break dock chrome and unique-four positions.
**Suggestion:** Keep index paint. Make the two **mining** rows differ in text. Digit 2 stays Jobs. Digit 0/8/9 stay.
**Status:** frozen. Not remaining.

#### 🟠 Major: Scanner / lock-card as board feedback — **resolved in freeze**

**Location:** `src/systems/hud.js:2449`; inbox P2 MSN/AST (other item)
**Issue:** Teaching ore type on the scanner, aim glass, or a toast would look like a UI fix for twins. That is a different leftover. It also fails docked Jobs review: the glass is empty while Digit 2 is open.
**Suggestion:** Msn04 does not touch scanner, aim glass, lock card, or AST-02 markers.
**Status:** frozen. Not remaining.

#### 🟠 Major: Fake second origin / fake need / pay retune to differentiate copy — **resolved in freeze**

**Location:** `src/systems/station.js:2276`, `src/systems/station.js:2280`, `src/systems/station.js:204`, `src/systems/station.js:210`
**Issue:** Changing need, origin text, or 784 UU so twins “look different” lies about the contract. Inbox asked generation uniqueness.
**Suggestion:** Real different commodity, or omit. Pay formula stays.
**Status:** frozen. Not remaining.

#### 🟠 Major: `innerHTML` ore name — **resolved in freeze**

**Location:** `src/systems/station.js:4464`; contract §0.4
**Issue:** Interpolating commodity / title into HTML is XSS and is unnecessary. Live pane already uses `textContent`.
**Suggestion:** Keep `h()` / `textContent`. Never `innerHTML` / `insertAdjacentHTML` / `document.write` on Jobs.
**Status:** frozen. Not remaining.

#### 🟠 Major: Hide unique four to make room — **resolved in freeze**

**Location:** `src/systems/station.js:2098`, `src/systems/station.js:3673`
**Issue:** Dropping bounty/patrol/haul/ferry pins would steal Msn03 / boot landmarks and change Digit indices for mining. The player would lose career rows, not gain honest mining copy.
**Suggestion:** Do not touch `makeJobs` / `uniqueFourId` / unique-four `DONE` hide. Mining slots may stay two; they must differ in commodity or slot 1 is omitted.
**Status:** frozen. Not remaining.

#### 🟡 Minor: Two passenger `Escort passengers` rows stay identical after PR1

**Location:** `src/systems/station.js:5170`
**Issue:** Player may still see two identical escort cards (same dest, same UU). Digit accept still splits two seats, but copy matches.
**Suggestion:** Leave as authored family. Optional PR2 after playtest. Do not invent fake passenger names in PR1.
**Status:** documented. Out of mining PR1.

#### 🟡 Minor: Time-left label is not part of identity

**Location:** `src/systems/station.js:2355`, `src/systems/station.js:5347`
**Issue:** Twins minted a frame apart could differ by `Ns left` while title and pay match. Inbox cited title + UU. Clock text is a weak, moving cue.
**Suggestion:** Commodity uniqueness is the cue. Do not depend on deadline copy. Do not add a second clock to “fix” twins.
**Status:** documented. Freeze already uses commodity.

#### 🟡 Minor: Omit slot 1 leaves a shorter board

**Location:** contract §0.1 omit-if-exhausted; `src/systems/station.js:5214`
**Issue:** Digit indices after mining shift vs a two-card board. A player who memorized “9 is the second mine” will see a different card at 9.
**Suggestion:** Honest. Better than a duplicate. Do not paint a disabled ghost card. Live table size is 2, so omit is the size-1 future path. Heal-in-place of offered twins keeps count 2 and does not shift later indices.
**Status:** accepted. Honest empty, not a missing desk.

#### 💡 Suggestion: Optional PR3 still

One still after PR1: Freehold Digit 2, two mining rows with **different** ore names (or one mining row if table size 1), unique four visible, hub empty, no pause, no scanner filter, `textContent` rows.

#### 💡 Suggestion: Do not add slot chrome or ore-tint cards

Players do not need internal slot `0/1`. Do not tint `.job-card` from `ORE_TYPES` spark/dust colors as identity. Distinct ore names in title and pay are enough. Same UU with different names is allowed (contract §0.1).

### Steal check (Blocker if the brief scheduled these)

| Forbidden later work | Brief / contract | Live honor | Result |
|---|---|---|---|
| CONSUME / serial none | leftover **REAL**; serial **PR1** | independent pick live | **Pass.** Not scheduled. |
| New Digit / Digit 2 theft | Honor; contract §0.2 | Digit 2 Jobs (`188`, **6169–6176**) | **Pass.** |
| `innerHTML` Jobs rows | contract §0.4 | `h()` `textContent` | **Pass.** |
| Color-only identity | §0.13–§0.14 | shared job-card chrome | **Pass.** |
| Scanner / AST-02 / ore filter | §0.9 | `hud.js` **2449–2471** cite only | **Pass.** |
| Hide unique four | §0.7 | `boardJobs` **3673–3678** | **Pass.** |
| Fake origin / need / pay retune | §0.8, §0.20 | live `FERRY_UNITS` / `HAUL_MARGIN` | **Pass.** |
| Force two cards at table size 1 | §0.12 omit | would recreate inbox hole | **Pass.** omit frozen. |
| Agent `acceptJob` cheat | §0.10 | not live | **Pass.** |
| HUD job pip | HUD-01 honor | empty 80 px hub | **Pass.** |

### Notes vs worker self-audit

Worker `out/w130/jobdedup/ui-audit.md` already flags identical rows as later mint and forbids color-only / Digit remap / scanner / fake origin. This pass agrees. Extra designer checks: unique-four visibility (`3673–3678`), live `textContent` (no `innerHTML` in `station.js`), honest omit vs ghost card, and lock-card ore readout (`hud.js` **2449–2471**) as a steal surface. No new Blocker/Major.

Graph resolve for this designer pass selected `codex/workflow-catalog-maintenance` (false bind: this task does not change harness/tool/workflow/approval nodes). Did **not** `graph_propose` / `graph_approve`. Local review file only.
