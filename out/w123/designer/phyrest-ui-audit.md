# UI Audit: remaining PHY leftover after PHY-05 (Wave 123 CONSUME)

**Auditor:** `[designer]` (independent of `out/w123/phyrest/ui-audit.md`)
**Scope:** Wave 123 leftover census. Markdown only. Worker did **not** change live UI. Freeze leftover **CONSUME**: remaining PHY after named PHY-01..05 is **gone**. Specified later UI: **existing** bounce / sun-heat toast / NPC avoid. Named serial: **none**. Name: **no remaining PHY leftover.** This leftover adds **no** chrome.
**Review file:** `out/w123/designer/phyrest-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Phy06RemainingPhyDesign.md`, inventory `out/w123/phyrest/current-phy-remaining-inventory.md`, merge law `out/w123/phyrest/shared-contract.md`, worker self-audit `out/w123/phyrest/ui-audit.md` (read, not copied). Live bounce / heat toast / empty 80 px hub cites only: `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/ship.js`, `src/systems/combat.js`, `src/systems/npc.js`, `src/systems/station.js`, `src/game/physics.js`, `src/game/collision.js`. Did **not** steal `out/w123/astrest/**` or `out/w123/fxrest/**`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Graph: first `graph_resolve` `r-mt94ag2x-e605c7da` was `blocked_ambiguous` (Word / Slides / Open Knowledge, coverage 0.08). Second `r-mt94bu13-77dfb49d` bound Drive publishing on a negation of “Google Docs”. Parent scoped this pass to local scratch markdown. Drive stack was **not** followed. Did not `graph_approve` / `graph_propose`.

Merge law: `out/w123/phyrest/shared-contract.md` wins if the brief forks. This wave does not ship PHY chrome. Findings bind **later workers**: do not invent a hub collision pip, a keep-out ring, a heat gauge, a PHY Digit, a navmesh HUD, or a leftover PHY serial while live bounce / heat toast / avoid already meet PHY-01..05.

## UI Audit: remaining PHY player-facing bounce / heat / avoid (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**. Specified later UI is the **existing** bounce/slide, star-heat / star-kill toasts, and NPC two-sample avoid with **no** hub paint. CONSUME does **not** invent HUD chrome. Freeze does **not** steal HUD-01 hub, Digit 0/8/9, or invent a navmesh overlay. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; toast telegraph / no keep-out ring, not leftover holes), 2 suggestions. CONSUME freeze holds.

### What's done well

- Bounce is felt, not drawn. Player integrate then `resolveMover` with sun stripped (`ship.js` **905–937**). NPC `bounceLive` is the same net (`npc.js` **730–757**). Low-speed scrape is silent toast (`hud.js` **660–662** when `damage > 0`; combat skips below `IMPACT_MIN_SPEED` 8, `combat.js` **1848–1849**).
- Star danger reuses the existing toast live region, not a hub pip. Copy is English: `▲ STAR HEAT — turn away.` and `✕ The star took the ship.` (`hud.js` **656–659**). Heat is throttled 2.5 s (`combat.js` **164**, **1886–1888**). Lethal packet is once (`combat.js` **1890–1897**). Toasts write `textContent` (`hud.js` **1210**). `role="status"` / `aria-live="polite"` already sit on `.rw-toasts` (`hud.js` **845–847**).
- Avoid / pad-home add **no** DOM. Station keep-out + mid 20 u + frame hold are steering math (`npc.js` **557–581**, **605–617**, **643–703**, **781–839**). `planApPath` / `navmesh` absent in `npc.js`. Far 80 u sample absent.
- Empty 80 px hub stays empty (`.rw-reticle` `hud.css` **184–193**). Children stay pupil, cilia, RANGE (`hud.js` **778–781**). RANGE is TGT-01, not PHY leftover. Contract §0.2: no collision pip, keep-out ring, or heat gauge inside `.rw-reticle`.
- Digit 0 stays shipyard (`station.js` **188**, **6171–6173**). Digit 8/9 stay launch / epics (`DOCK_KEY_SERVICES` index 7 / 8; handler `station.js` **6175–6176**). PHY is not a dock verb. No new Digit.
- `innerHTML` on PHY surfaces: **none** (`physics.js` / `collision.js` / `world.js` / `traffic-feel.js` / `npc.js` avoid helpers; toast path uses `textContent` / `el()` `hud.js` **283–288**).
- Reduced-motion: NPC death chips skip when `reducedMotion` (`npc.js` **2232**). This leftover does not add motion chrome.
- Persist PHY extra: **none** (`save.js` **77–102**). `state.js` PHY keys: **none**. Pad-home heals existing `record.route` (`world.js` **709–735**).
- Contract §0.2 / §0.3 / §0.10 / §0.15 and brief Honor / Non-goals agree: later UI = **none**. Worker self-audit agrees independently. Serial: **PR1 remaining PHY does not exist**.

### CONSUME steal check (Blocker if this leftover scheduled these)

| Forbidden later work | Brief / freeze | Live honor | Result |
|---|---|---|---|
| HUD-01 hub child / collision pip | Brief Honor + pain “hub pip reopens HUD-01”; contract §0.2 / §0.15; inventory §8 / §9 | `.rw-reticle` 80×80 (`hud.css` **184–193**). Children: pupil, cilia, RANGE (`hud.js` **778–781**). Bounce toast is top-center `.rw-toast` (`hud.js` **843–847**, **660–662**) | **Pass.** Not scheduled. |
| Keep-out ring on glass | Contract §0.2; PHY-04 freeze; inventory §9 | Keep-out is NPC math (`npc.js` **557–581**, **643–703**). No overlay class | **Pass.** |
| Aim-glass heat gauge | Brief Honor “aim-glass gauges stay off”; contract §0.2 | Heat is toast + combat DPS (`hud.js` **656–657**; `combat.js` **1882–1888**). Hub has no heat child | **Pass.** |
| Digit 0/8/9 theft / new PHY Digit | Contract §0.3; brief Digit freeze | Digit 0 → shipyard; 8 → launch; 9 → epics (`station.js` **188**, **6171–6176**) | **Pass.** |
| Navmesh HUD / A* overlay / `planApPath` in NPC | Contract §0.10 / §0.15; inventory §5 / §9 | `navmesh` / `planApPath` / `look * 2` absent in `npc.js` | **Pass.** Not scheduled. Owner omit, not a hole. |
| PHY-04 PR3 80 u leftover chrome | Contract §0.10; brief skippable | No far sample. Do not ship as leftover | **Pass.** |
| Kit mutate / UU / SKU | Contract §0.5 | Not proposed | **Pass.** |
| `innerHTML` PHY / toast names | Contract §0.4 | `textContent` / `el()` | **Pass.** |
| New persist key / PHY on `state.js` | Contract §0.5 / §0.6 | Session bounce/heat only; `record.route` already | **Pass.** |
| AST / FX leftover steal | Contract header; brief Honor | This pack did not write sibling dirs | **Pass.** |
| Pause sim for PHY | Contract §0.17 | Never | **Pass.** |

If a later worker adds a hub collision pip, a keep-out ring, a heat gauge, a PHY Digit, or a navmesh HUD while these surfaces exist, that **violates this freeze** and is a Blocker then. This pack does **not** schedule that work. Serial plan: **PR1 remaining PHY does not exist** (`docs/Phy06RemainingPhyDesign.md` **149–153**; contract §3).

### Does CONSUME invent HUD chrome?

**No.** Brief Goals / Non-goals and contract §1: later UI none. Specified picture is live:

| Spec (later = none) | Live |
|---|---|
| Bounce / slide | Player `resolveMover` after integrate; sun stripped (`ship.js` **905–937**). NPC `bounceLive` (`npc.js` **730**) |
| Body toast | `▲ Hull strike.` only if `damage > 0` (`hud.js` **660–662**) |
| Sun heat | Zone 1 DPS + `▲ STAR HEAT — turn away.` (`collision.js` **318–342**; `combat.js` **1882–1888**; `hud.js` **656–657**) |
| Sun kill | Zone 2 packet + `✕ The star took the ship.` (`combat.js` **1890–1897**; `hud.js` **658–659**) |
| NPC avoid | 40 u + mid 20 u; station path keep-out; frame hold outside D5 (`npc.js` **643–703**, **781–839**) |
| Hub | 80 px empty of PHY leftover (`hud.css` **184–193**) |
| Digit | none for PHY (`station.js` **188**, **6171–6176**) |

CONSUME adds **no** UI. Live bounce, heat toast, and avoid already cover the specified later picture. Wishlist “full path planning” / far 80 u stay **owner omit / skippable**.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Bounce/slide | `resolveMover` / `bounceLive` | PHY-01 | **Must not** replace or add a scrape pip |
| `bodyHit` toast | Damage > 0 only | PHY-01 / Wave 112 curve | **Must not** toast every slide |
| Star heat / kill toasts | Existing HUD mapping | PHY-03 | **Must not** add a hub heat gauge |
| Two-sample avoid | `look * 0.5`; no `look * 2` | PHY-04 | **Must not** add a keep-out ring or 80 u leftover |
| Frame hold | Dest only; no `record.route` | PHY-04 | **Must not** persist avoidHits |
| Pad-home | `record.route` heal | PHY-05 | **Must not** add padHome HUD |
| Empty hub | 80 px | HUD-01 | **Must not** add a collision pip or keep-out ring |
| Digit 0/8/9 | shipyard / launch / epics | Honor | **Must not** bind PHY |
| Navmesh | Absent | Owner omit | **Must not** invent a planner HUD |
| Toast `textContent` | `hud.js` **1210** | XSS freeze | **Must not** `innerHTML` PHY copy |

### Accessibility / theming / states (live HUD, static)

| Check | Result |
|---|---|
| Contrast / tokens | Heat / hull toasts use `.rw-toast.warn` (amber bar; body color `--white`, `hud.css` **717–737**). Kill uses `.rw-toast.danger` `--red` (`hud.css` **738**). Contrast restyle already includes `.rw-toast` (`hud.css` **1168**). No new leftover color. |
| Keyboard | Bounce / heat / avoid are output, not controls. Digit 0/8/9 stay dock. |
| Names | Visible English: `STAR HEAT — turn away.`, `The star took the ship.`, `Hull strike.` Color is not the only cue. |
| Focus | Toasts are not focus targets. Correct. Hub `pointer-events: none` (`hud.css` **191**). |
| Semantic HTML | Toast stack is `role="status"` `aria-live="polite"` (`hud.js` **845–847`). No leftover `role` invention. |
| Empty | Low-speed slide: no toast (`hud.js` **661**). Avoid: no chrome. Hub stays empty of PHY. |
| Error | Fail-closed: missing bag / `!_phyOn` → dest copy (`npc.js` **643–650**). Missing heal → live dest. Never pause. |
| Disabled | N/A (output). Bounce skipped when docked / jumping / dockPressed (`ship.js` **906**). Heat skipped when jumping (`combat.js` **1874**). |
| Loading | No spinner. Do not add one. |
| Hover | Not required. |
| Reduced motion | Death chips skip (`npc.js` **2232**). Toast CSS still fades (`hud.css` **729**). Do not add a PHY overlay as leftover. |
| Responsive | Toasts are top-center, off the 80 px hub (`hud.js` **843**). Hub is 80×80 centered (`hud.css` **184–193**). |
| Hub | 80 px stays empty of PHY leftover chrome. RANGE remains TGT-01. |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Star heat is toast, not an aim-glass gauge

**Location:** `src/systems/hud.js:656-659` vs empty hub `src/ui/hud.css:184-193`

**Issue:** Wishlist PHY-03 wants danger telegraphed clearly enough to escape. Live telegraph is a throttled toast plus lethal packet, not a hub heat pip.

**Why it is not leftover:** HUD-01 empty hub and “aim-glass gauges stay off” forbid a heat gauge. Toast + zone-2 packet already telegraph. A hub thermometer would steal the 80 px glass.

**Fix:** Do not invent leftover chrome. CONSUME stands.

**Status:** accepted — not a missing PHY-03 hole.

#### 🟡 Minor: Avoid has no visible keep-out ring

**Location:** `src/systems/npc.js:557-703`; hub `src/ui/hud.css:184-193`

**Issue:** A later worker could “help” traffic by drawing station cylinders or a planner overlay on the glass.

**Why it is not leftover:** Collision is the safety net; avoid is steering. Contract §0.2 / §0.10 forbid a keep-out ring and a navmesh HUD. PHY-04 PR3 80 u is skippable, not a chrome hole.

**Fix:** Do not add a keep-out overlay, collision pip, or navmesh HUD as leftover.

**Status:** accepted — CONSUME stands.

#### 💡 Suggestion: `bodyHit` with damage 0 stays silent

**Location:** `src/systems/hud.js:660-662`; `src/systems/ship.js:933-936`; `src/systems/combat.js:1848-1849`

**Issue:** Low-speed slides have no toast. Player still slides. Wave 112 keeps the linear curve (`IMPACT_MIN_SPEED` 8).

**Fix:** Do not add a scrape pip as leftover. Camera shake already reads silent scrapes (`ship.js` **1223–1228**).

**Status:** accepted — out of scope.

#### 💡 Suggestion: Digit 8/9 honor cite is the generic Digit handler

**Location:** inventory `out/w123/phyrest/current-phy-remaining-inventory.md` §8 (`station.js` **188**, **6171–6176**); live `station.js` **188**, **6169–6176**

**Issue:** Digit 0 is explicit (`d === 0` → last service = shipyard). Digit 8/9 are `i = d - 1` into `DOCK_KEY_SERVICES` (`launch` / `epics`). Brief table compresses 8/9 onto **6171–6176**.

**Fix:** Do not treat cite shorthand as Digit theft. Honor still holds. Do not bind PHY.

**Status:** documentation nit — not leftover chrome.

### Census cite check (code wins)

| Claim | Live | Notes |
|---|---|---|
| Empty hub 80 px | `hud.css` **184–193** | Match. `.rw-reticle` 80×80, `pointer-events: none` |
| RANGE on hub | `hud.js` **778–781** | Match. TGT-01 token, not PHY. Phy04’s 709–712 is stale; this pack cites **781** |
| `sunHeat` / `sunKill` copy | `hud.js` **656–659** | Match |
| `bodyHit` toast if damage > 0 | `hud.js` **660–662** | Match |
| Toast `textContent` | `hud.js` **1210** | Match |
| Heat gap 2.5 s | `combat.js` **164**, **1886–1888** | Match |
| Lethal packet | `combat.js` **1890–1897** | Match |
| Player bounce + sun strip | `ship.js` **905–937** | Match. Emit starts `damage: 0`; combat may fill |
| NPC avoid 40 / mid 20 | `npc.js` **653–660**, **643–703** | Match. `mid = look * 0.5` |
| Frame hold | `npc.js` **781–817**, **835–839** | Match |
| Navmesh / `planApPath` in NPC | none | Match |
| Far 80 u | none (`look * 2` absent) | Match. Skippable, not leftover |
| Digit 0 shipyard | `station.js` **188**, **6171–6173** | Match |
| Digit 8/9 launch/epics | `station.js` **188**, **6175–6176** | Index 7/8 via `d - 1`. Honor holds |
| PHY table | `physics.js` **6–23** | Match. Comment forbids `state.js` dup |
| `WORLD_FIELDS` avoid/padHome | none (`save.js` **77–102**) | Match |
| `innerHTML` physics/collision/world/traffic-feel | none | Match |

None of the cites reopen leftover. Inventory line numbers hold on this census date.

### Visual hierarchy

Hub empty → existing RANGE token (TGT) → top-center toasts (`STAR HEAT` / `Hull strike` / star-kill) → no avoid overlay. CONSUME keeps that split. A hub collision pip, keep-out ring, heat gauge, PHY Digit, or navmesh HUD would flatten hierarchy onto HUD-01 / dock keys.

### Worker self-audit

`out/w123/phyrest/ui-audit.md` is accurate on CONSUME, later UI = live bounce / heat / avoid, Digit/hub not stolen, and “do not add collision pip / keep-out ring / heat gauge.” Independent live read agrees. Do not copy that file as the designer record; this file is the parent `[designer]` pass.

### Verdict close

**CONSUME freeze is the UI-correct outcome.** Remaining PHY leftover is gone. Live bounce, star-heat toasts, and NPC avoid already paint the jobs. Do not add HUD chrome, a hub collision pip, a keep-out ring, Digit 0/8/9 theft, or a navmesh HUD as this leftover.
