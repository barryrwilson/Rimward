# UI Audit: Wave 97 NPC turrets HUD freeze

**Auditor:** `[designer]` (independent of `out/w97/turrets/ui-audit.md` — do not rubber-stamp)
**Scope:** Markdown-only HUD freeze for a later NPC turret energy hose. Empty 80 px hub. No incoming turret gauge / pip / lock box. FORE/AFT on `playerHit` only. No turret toast (do not steal `Incoming dart.`). Digit 0/8/9 player papers. WPN groups 1–5. `reducedMotion` still ticks bolts. No new glass widget.
**Review file:** `out/w97/turrets/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live HUD baseline. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits). Wave 97 does not ship UI.

Sources:

- Integrator brief: `docs/NpcTurretsDesign.md`
- Merge law: `out/w97/turrets/shared-contract.md`
- Inventory (code wins): `out/w97/turrets/current-npc-turrets-inventory.md`
- Worker self-audit: `out/w97/turrets/ui-audit.md` (read; not copied)
- Live HUD: `src/systems/hud.js`, `src/ui/hud.css`
- Live combat / song / dock: `src/systems/combat.js`, `src/systems/song.js`, `src/systems/station.js`

## UI Audit: NPC turret HUD freeze (Wave 97)

### Summary
The freeze keeps HUD-01 closed. NPC turret is an energy bolt like cannon: empty 80 px hub, hit-only FORE/AFT, cannon bark, no toast, no sixth WPN Digit, no new `#hud` child. Live glass already matches that law. This wave ships no product UI.

### Verdict
**CLEAN.** 0 blockers. 0 majors. 1 minor (cite the energy bolt loop for `reducedMotion`, not only the seeker comment). 2 suggestions.

Worker self-audit (no-toast / no-pip / `reducedMotion` combat pin) is **confirmed**. It is not upgraded: the freeze does not add a glance node, and live HUD-01 already rejects inbound turret chrome.

### Freeze scorecard

| Law | Live + freeze | Pass? |
|---|---|---|
| Empty 80 px hub | `.rw-reticle` is 80×80 (`hud.css:184–190`). Clamp keeps the hub on glass (`hud.js:1185`). Brief forbids a turret diamond in the hub (`docs/NpcTurretsDesign.md:148`). | **Pass** |
| No incoming turret gauge | Contract §1.1 forbidden table (`shared-contract.md:32–42`). Live HUD has no inbound energy gauge. | **Pass** |
| No new lock box / aspect ring | New inbound lock chrome is forbidden. Existing player `.rw-target-box` + `.rw-lead` stay TGT-05 (`hud.js:701–731`). | **Pass** |
| No turret aim-glass pip | Player `tryPlayerTurret` aims in combat and does not write HUD (`combat.js:1253–1296`). | **Pass** |
| FORE/AFT on `playerHit` only | Flash arming is `playerHit` (`hud.js:1122–1124`). `tgtFacing` is target aspect, not inbound (`hud.js:1343–1362`). | **Pass** |
| No turret toast | `npcFire` toasts only `weapon === 'missile'` and `target === 'player'` (`hud.js:567–571`). Authored `Incoming dart.` (`hud.js:61–62`). | **Pass** |
| Digit 0 / 8 / 9 player papers | Digit 0 = last dock service = shipyard (`station.js:186, 5917–5922`). Digit 8 launcher / Digit 9 player `auto` (`station.js:1683–1727, 5392–5448`). | **Pass** |
| WPN groups 1–5 | `weaponHudLabel` names groups 1–5 only (`hud.js:196–229, 837–838, 1808`). Turret is not in `GROUP_WEAPON` (`combat.js:184–187`). | **Pass** |
| `reducedMotion` still ticks bolts | Energy pool integrates with no `reducedMotion` skip (`combat.js:1836–1852`). Seekers: combat, not decoration (`combat.js:1854`). Sparks/muzzle may hide or snap (`combat.js:90–91, 950, 1874`). | **Pass** |
| No new glass widget | Wave 97 is markdown only. `initHud` still creates nodes once (`hud.js:27–29`). HUD never writes `hullKind` (`hud.js:1050–1056`). | **Pass** |
| `textContent` / `h()` / `el()` | Combat HUD `el()` (`hud.js:239–244, 1103`). Station `h()` (`station.js:4302–4307`). | **Pass** |

### What's done well
- **Hub stays empty.** 80 px reticle (`hud.css:188–189`) plus `cx - 44` clamp (`hud.js:1185`). Contract forbids a hub lamp, wedge, extra edge-arrow, and new `#hud` child (`shared-contract.md:32–42`).
- **FORE/AFT is not color-only.** Words + fill vs hollow (`hud.js:323–349`; `hud.css:231–291`). Hit flash keeps the word, fill, and red border (`hud.css:293–297`). `reducedMotion` drops the keyframe and adds a red outline (`hud.css:305–307`). Colorblind keeps inset white on lit (`hud.css:310–312`).
- **Hit-only inbound is honest.** Self flash arms only on `playerHit` (`hud.js:1122–1124`). Cannon already has no toast. A turret toast would compete with `Incoming dart.` and would lie that turret is a seeker (`docs/NpcTurretsDesign.md:318–323`).
- **Dart channel stays exclusive.** Authored literal + 2.5 s gap (`hud.js:61–62, 567–571`). Song missile sting is `weapon === 'missile'` only (`song.js:68–69, 423`). Turret reuses cannon bark (`shared-contract.md:79–81`).
- **WPN rail does not grow a sixth Digit.** Groups 1–3 cannon/disruptor/mining, 4 launcher, 5 psionic (`hud.js:196–229`). Player `auto` stays off the rail. Strain still reads shared heat (`hud.js:1810–1811`) without naming turret.
- **Dock digits stay player papers.** Digit 9 is offer / seated note / no ammo (`station.js:1683–1689, 5424–5448`). Copy goes through `h()` → `textContent`. NPC fire must not steal Digit 0/8/9 (`shared-contract.md:22`).
- **Toasts are reachable to AT.** `role="status"` + `aria-live="polite"` (`hud.js:759–762`). Freeze does not add a second incoming line that would overwrite dart / sun / hull slots (`TOAST_SLOTS` 5, `hud.js:60`).
- **Tokens, not a new hue.** Lead and energy already share cyan (`hud.css:533–572`; `combat.js:189`). Freeze does not invent inbound-turret chrome that would collapse into LEAD.
- **Q1/Q2 default off.** Unpicked who-fires means no turret `npcFire` (`shared-contract.md:101–116`). Empty hub does not lie while the owner has not picked.

### Findings

#### 🔴 Blocker
None.

No new glance node. Live HUD-01 already matches the freeze. Inaccessible or unusable glass is not introduced.

#### 🟠 Major
None.

Worker suggestions on toast theft and `reducedMotion` are already fail-closed in contract §1.1. They are not majors for this markdown wave.

#### 🟡 Minor: Pin energy-bolt `reducedMotion` on the pool loop, not only the seeker comment

**Location:** `src/systems/combat.js:1836–1852` (energy pool tick); `combat.js:1854` (seeker comment the freeze cites); `combat.js:90–91, 950, 1874` (sparks hide / muzzle snap); contract §1.1 (`shared-contract.md:39`); brief merge table (`docs/NpcTurretsDesign.md:113`)
**Severity:** minor
**Status:** open for the later impl PR3 pin (markdown only this wave)

**Issue:** The freeze forbids hiding turret bolts under `reducedMotion` and cites `combat.js:1854`. That line is the **seeker** tick. Energy bolts already integrate in the 64-pool loop at `1836–1852` with **no** `reducedMotion` branch, which is the correct combat law. Sparks are decoration (`950`); muzzle/ripple snap one frame (`1874`). A later polish PR that greps only `1854` could hide `p.mesh.visible` on energy and leave song barking with a silent glass.

**Fix:** PR3 pins must name `combat.js:1836–1852` as the energy law: bolts still tick and stay visible. Keep spark suppress and muzzle snap as decoration. Do not hide turret/cannon meshes when `ctx.settings.reducedMotion` is true.

#### 💡 Suggestion: “No pip” must not strip shipped TGT-05 / scanner pips

**Location:** brief mermaid “no pip” (`docs/NpcTurretsDesign.md:139–148`); contract forbidden “lock box, aspect ring, turret lead pip” (`shared-contract.md:36–38`); live `.rw-lead` + `.rw-target-box` (`hud.js:701–731`; `hud.css:520–573`); contact lock pip (`hud.js:43–46, 1365–1366`)
**Severity:** suggestion
**Status:** optional — contract already means *new inbound turret* chrome

**Issue:** Live glass already has a target box, a `LEAD` ring, an edge arrow, and scanner contact pips. “No pip / no lock box” in the turret mermaid can be read as a strip order. Player turret aim is already invisible in combat (`combat.js:1253–1296`). Player gun LEAD is a different instrument.

**Fix:** Keep the freeze as **do not add** inbound turret chrome. Do not hide `.rw-lead`, `.rw-target-box`, or contact pips. PR3 “HUD tree unchanged” already covers this if the pin lists those class names as stay-put.

#### 💡 Suggestion: Keep toast slots free of a turret line

**Location:** `src/systems/hud.js:59–62, 567–571, 1093–1104`; `TOAST_SLOTS` 5
**Severity:** suggestion
**Status:** already frozen — keep

**Issue:** Five polite slots already share dart, sun, hull, comm, and world lines. A later `Incoming turret.` would fight `Incoming dart.` and would read as a seeker.

**Fix:** Contract already forbids a turret toast (`shared-contract.md:51–52`). Do not add one in PR1–PR3. Do not hail a turret spawn on `commLine`.

### Passed (HUD freeze)
- [x] Empty 80 px hub
- [x] No incoming turret gauge
- [x] No new lock box / aim-glass turret pip
- [x] FORE/AFT stays `playerHit` (self flash); target FORE/AFT stays aspect
- [x] No turret toast; `Incoming dart.` stays missile-only
- [x] Digit 0 shipyard; Digit 8/9 player launcher / turret papers
- [x] WPN groups 1–5; no `6 · Auto turret`
- [x] `reducedMotion` still ticks energy bolts; sparks/muzzle may snap
- [x] No new `#hud` glance node; HUD never writes `hullKind`
- [x] `textContent` / `h()` / `el()` only
- [x] No power-ledger chrome; no chaff Digit

### Worker self-audit
`out/w97/turrets/ui-audit.md` is aligned. Independent pass does not add a blocker or major. The energy-loop cite is the only extra pin.
