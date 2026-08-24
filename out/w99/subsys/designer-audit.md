# Designer audit: Wave 99 TGT-03 remaining subsystem targeting (HUD freeze)

| Field | Value |
|---|---|
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Persona** | `orchestrator/assets/designer-persona.md` |
| **Checklist** | `orchestrator/references/ui-audit.md` |
| **Scope** | Markdown-only HUD freeze: `docs/Tgt03SubsystemDesign.md`, `out/w99/subsys/shared-contract.md`, inventory `out/w99/subsys/current-tgt03-subsystem-inventory.md`, worker `out/w99/subsys/ui-audit.md`. HUD-01 empty-hub law vs `out/w98/radar/shared-contract.md` and live hub size. |
| **Not in scope** | Product `src/` edits, Vite, Playwright, sibling `out/w99/radar/**` / `out/w99/turrets/**` writes, wishlist, `PROGRESS.md` |
| **Wave** | 99 design. Wave 99 does not ship HUD bindings. Findings are freeze vs live occupancy. |
| **Graph** | `graph_resolve` bound `claude/workflow-code-review` (generic review match). Owner already named this scratch path and forbade Vite / product edits. This pass stays a local HUD-brief audit. |
| **Verdict** | **CLEAN** — no Blocker, no Major |

Merge law: if the brief and the contract disagree, the contract wins (`out/w99/subsys/shared-contract.md` header). This pass is independent of worker `out/w99/subsys/ui-audit.md`. It does not upgrade that file.

---

## UI Audit: subsystem targeting picture (frozen HUD)

### Summary

The freeze names “subsystem targeting” as live peel + aft engine + the existing right tgt rail. It does not add an aim-glass gauge, lock box, hub pip, sixth WPN Digit, SKU/UU, or a steal of `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue`. Optional later bar emphasis stays on existing SCREEN/SHELL/hull meters off the 80 px hub. Wave 99 ships no chrome.

### Freeze checklist (must not reopen)

| Check | Result | Evidence |
|---|---|---|
| HUD-01 empty 80 px hub; no aim-glass gauge / lock box / hub pip | **Pass** | Live `.rw-reticle` is `80px` × `80px` (`src/ui/hud.css:184–191`). Clamp `cx - 44` keeps the hub on glass (`src/systems/hud.js:1194–1197`). Reticle children stay pupil / cilia / RANGE (`hud.js:699–702`). W98 radar law: empty hub, no lock box, no incoming gauge, no radar pip (`out/w98/radar/shared-contract.md:20, 72, 145`). This brief: no subsystem gauge on the 80 px hub, no lock box, no part pip (`docs/Tgt03SubsystemDesign.md:10, 36, 106, 134, 155, 165`; contract `out/w99/subsys/shared-contract.md:15, 82, 132`). |
| Optional later tgt-rail marks stay off the hub | **Pass** | Picture reuses `.rw-combat-target` bars + FORE/AFT (`docs/Tgt03SubsystemDesign.md:159–165`; contract §2 `shared-contract.md:70–84`). PR2: class on **existing** SCREEN/SHELL/hull only; no new hub child; no lock box; no ENGINE bar unless owner named it (`shared-contract.md:165`; brief `Tgt03SubsystemDesign.md:209–210`). Rails sit `top: 57%` and ±78 px off center (`hud.css:884–903`). |
| No sixth WPN Digit | **Pass** | Self-rail WPN is live groups 1–5 (`hud.js:842–844`; `controls.js:43, 295–309`). Brief: “Weapon 1–5 stay”; “No extra subsystem Digit” (`Tgt03SubsystemDesign.md:112, 188`). Contract: weapon groups 1–5 stay; do not steal Digit 0–9; do not invent a subsystem Digit (`shared-contract.md:19, 95, 133`). Inventory: no extra Digit unless owner names one that is not 0/8/9 and not weapon 1–5 (`current-tgt03-subsystem-inventory.md:145`). |
| Do not steal `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue` | **Pass** | Four jobs stay four classes (`Tgt03SubsystemDesign.md:167–176`). Do not put parts on contacts, edge-arrow, or inside `.rw-reticle` (`Tgt03SubsystemDesign.md:165`). W98 radar: traffic / lock / route stay three classes; all may show (`out/w98/radar/shared-contract.md:35–43, 103–113`). Live: contacts wrap `hud.js` contacts path; lock `hud.js:737–738`; gate `hud.js:739–743`. Contract §2 / §4: radar and lock arrow **Out** (`shared-contract.md:78–80, 111`). |
| Digit 0 / 8 / 9 stay | **Pass** | Digit 0 shipyard; Digit 8/9 launch+epics and papers (`Tgt03SubsystemDesign.md:64–66, 143`; contract `shared-contract.md:19`; inventory §6). PR3 still may not bind those keys (`shared-contract.md:166`; brief `Tgt03SubsystemDesign.md:197`). |
| No invented SKU / UU | **Pass** | Overview + Q3 default **no** (`Tgt03SubsystemDesign.md:36, 129, 228–229`). Contract §0.10 / §6: targeting-computer SKU not authorized; do not invent UU (`shared-contract.md:23, 136–137`). Inventory §9: picker absence does not authorize prices (`current-tgt03-subsystem-inventory.md:196`). |
| KeyT / KeyV / cone 12 | **Pass** | Untouched (`Tgt03SubsystemDesign.md:10, 54, 144–145`; contract `shared-contract.md:20–21, 91–97`). |
| FORE/AFT hit-only; toasts unchanged | **Pass** | FORE/AFT on `playerHit` 0.4 s, not a toast, not on fire (`Tgt03SubsystemDesign.md:58, 147`; contract `shared-contract.md:75, 109, 114`). `Incoming fire.` / `Incoming dart.` do not change (`Tgt03SubsystemDesign.md:105–109`; contract `shared-contract.md:105–106`). |
| `innerHTML` / names | **Pass** | No part list from blobs; rail name stays `textContent` (`Tgt03SubsystemDesign.md:139–140`; contract `shared-contract.md:17, 86`; `hud.js:2020–2024`). Grep innerHTML in `hud.js`: 0 (inventory). |
| Reduced motion / contrast | **Pass** | No new `@keyframes` (`Tgt03SubsystemDesign.md:141`; contract `shared-contract.md:84, 165`). Live global kill `hud.css:1173–1177`. FORE/AFT already words + fill vs hollow (`hud.js:326–351`; colorblind fill/hollow `hud.css:310–318`). SCREEN 3 px vs SHELL 9 px (`hud.css:112–117`). |

### What's done well

- Empty-hub law is repeated, not implied: owner request, non-goals, merge table, picture, risks, and acceptance (`docs/Tgt03SubsystemDesign.md:10, 36, 106, 134, 165, 245, 267`; `out/w99/subsys/shared-contract.md:15, 82, 132`).
- Live occupancy already matches the picture. Target vitals are the right rail (`hud.js:846–855, 2014–2034`), not a hub card. Player ENGINE stays Plant (`hud.js:883–885`).
- Three of four channels already have non-color structure: thin SCREEN vs thick SHELL, hull petals + LOW/CRIT (`hud.css:112–117, 880–883`). FORE/AFT uses the word plus fill vs hollow.
- Sibling surfaces stay named and distinct. Radar jump-park stays the other worker’s `.rw-contacts`. Lock off-glass stays `.rw-edge-arrow`. NAV-02 stays `.rw-nav-gate-cue`.
- Fail-closed defaults block the usual “complete TGT-03” cheat: no picker, no Digit, no SKU, no peel skip, no ENGINE bar unless the owner names it.
- Keyboard reach for live jobs stays: Digit 0/8/9, weapon 1–5, KeyT cycle, KeyV reticle lock. No new interactive hub control in this wave.
- Empty/error for the picture is already fail-closed: tgt rail hides with no ship lock (`hud.js:846`; brief `Tgt03SubsystemDesign.md:163`). Docked hides the combat glance as today.

---

### Findings

No 🔴 Blocker. No 🟠 Major. The freeze does **not** reopen the named HUD-01 / Digit / class-steal / SKU laws.

Closed reopeners (do not treat as open defects):

#### 🟠 Major (closed in freeze): Aim-glass gauge / lock box / hub pip

**Location:** live hub `src/ui/hud.css:184–191`, `src/systems/hud.js:1194–1197, 699–702`; HUD-01 law `out/w98/radar/shared-contract.md:20, 145`; this pack `docs/Tgt03SubsystemDesign.md:36, 106, 165`; `out/w99/subsys/shared-contract.md:15, 82`  
**Issue:** A part pip, lock box, or “engines targeted” gauge on the 80 px glass would smash HUD-01 empty hub and reopen the closed missile/radar gauges.  
**Fix:** Reuse tgt-rail bars. Hub stays empty.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Steal `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue`

**Location:** `docs/Tgt03SubsystemDesign.md:167–176`; `out/w99/subsys/shared-contract.md:78–80`; W98 `out/w98/radar/shared-contract.md:35–43`  
**Issue:** One class for parts + traffic, lock, or route would mix four jobs.  
**Fix:** Keep four classes. Parts glance is `.rw-combat-target` only.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Sixth WPN Digit or Digit 0/8/9 steal

**Location:** `docs/Tgt03SubsystemDesign.md:112, 188`; `out/w99/subsys/shared-contract.md:19, 95–97, 133`; live `controls.js:43, 295–309`  
**Issue:** A subsystem Digit would smash shipyard, launch, epics, papers, or weapon groups 1–5.  
**Fix:** No extra Digit. Weapon 1–5 stay.  
**Status:** addressed in freeze

#### 🟠 Major (closed in freeze): Invented SKU / UU

**Location:** `docs/Tgt03SubsystemDesign.md:228–229`; `out/w99/subsys/shared-contract.md:23, 136–137`  
**Issue:** A targeting-computer buy would impersonate the owner and desync hangar/yard.  
**Fix:** Fail-closed. No SKU. Geometry + rails only.  
**Status:** addressed in freeze

#### 🟡 Minor: Lock ENGINE has no tgt-rail bar

**Location:** live tgt rail `src/systems/hud.js:846–855` vs Plant ENGINE `hud.js:883–885`; owner Q `docs/Tgt03SubsystemDesign.md:231–232`; contract `out/w99/subsys/shared-contract.md:77, 189–190`  
**Issue:** Three of four channels sit on the lock rail. Engine on the lock is geometry + toast (`hud.js:540–545` per inventory). A player who expects four lock bars will not see ENGINE there.  
**Fix:** Default **do not add** a fourth bar. Do not compensate with a hub pip. Leave Q5 fail-closed.  
**Status:** accepted — freeze, not a Wave 99 reopen

#### 💡 Suggestion: PR2 emphasis must keep shape/word cues

**Location:** contract `out/w99/subsys/shared-contract.md:84, 165`; SCREEN/SHELL thickness `src/ui/hud.css:112–117`; FORE/AFT `src/systems/hud.js:326–351`  
**Issue:** A color-only “this layer is peeling” pulse would fail colorblind and reduced-motion.  
**Fix:** If PR2 ships later, toggle an existing class on the meter **row** (labels stay SCREEN/SHELL/hull). Do not add `@keyframes`. Do not bypass `body.rw-reduced-motion #hud *` (`hud.css:1173–1177`). Do not move the mark onto `.rw-reticle`.  
**Status:** accepted — optional later polish, off-hub only

#### 💡 Suggestion: PR3 picker still has no new glance node

**Location:** `docs/Tgt03SubsystemDesign.md:157, 209–211`; `out/w99/subsys/shared-contract.md:166`  
**Issue:** PR3 is named “damage retarget / picker” after owner numbers. A later worker could read “picker” as a new list or hub widget.  
**Fix:** Already frozen: no part list from blobs, no new `#hud` child, hub still empty in PR4 (`shared-contract.md:86, 165–167`; `Tgt03SubsystemDesign.md:139`). If PR3 ever opens, selection stays rail class + geometry, not a sixth Digit and not the 80 px hub.

---

### HUD-01 / a11y checklist (later impl; freeze only)

- [x] Freeze: no widget in the 80 px hub (`hud.css:184–191`; `hud.js:1194`; W98 `out/w98/radar/shared-contract.md:145`)
- [x] Freeze: no lock box
- [x] Freeze: no aim-glass incoming / subsystem gauge
- [x] Freeze: optional tgt-rail class marks not on the hub
- [x] Freeze: no sixth WPN Digit; weapon 1–5 stay
- [x] Freeze: Digit 0/8/9 untouched
- [x] Freeze: `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue` not reused for parts
- [x] Freeze: no invented SKU / UU
- [x] Freeze: FORE/AFT hit-only (not on fire)
- [x] Freeze: contrast/colorblind vars stay on bars; FORE/AFT is fill vs hollow plus the word
- [x] Freeze: rail name stays `textContent`
- [x] Freeze: no new `@keyframes`; reduced-motion kill stays
- [x] Keyboard: do not steal T/V or Digit 0/8/9 or Digit 1–5

---

### Agreement with prior `ui-audit.md`

Worker `out/w99/subsys/ui-audit.md` already called this freeze **CLEAN**. This designer pass agrees. ENGINE-bar absence stays an accepted owner default, not a defect to “fix” with hub chrome. PR2 remains optional and off-hub.

### Pass verdict

Wave 99 markdown freeze is **CLEAN** for UI/UX. Later impl must keep the 80 px hub empty, reuse `.rw-combat-target` for the part glance, leave `.rw-contacts` / `.rw-edge-arrow` / `.rw-nav-gate-cue` to their live jobs, leave Digit 0/8/9 and WPN 1–5, invent no SKU/UU, and put any optional peel mark on existing tgt-rail bars only.
