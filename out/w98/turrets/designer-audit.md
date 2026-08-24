# UI Audit: Wave 98 NPC turrets HUD freeze

**Auditor:** `[designer]` (independent of `out/w98/turrets/ui-audit.md` — do not rubber-stamp)
**Scope:** Markdown-only HUD freeze after Wave 98 owner close of turret Q1 / Q2. Empty 80 px hub. No incoming turret gauge / pip / lock box. FORE/AFT on `playerHit` only. No turret toast. Digit 0/8/9 player papers. WPN groups 1–5. `Incoming fire.` is sibling TGT-03 law, not a turret toast. No new glass widget.
**Review file:** `out/w98/turrets/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live HUD baseline. No Playwright. No Vite. No Chrome. [NO BROWSER COVERAGE].
**Date:** 2026-08-23
**Product source:** review only (no `src/` edits). Wave 98 turret owner close does **not** ship UI.

Sources:

- Owner close: `docs/OwnerDecisionsWave98.md`
- Integrator brief (status bump): `docs/NpcTurretsDesign.md`
- Merge law (wins on conflict): `out/w98/turrets/shared-contract.md`
- Inventory (code wins): `out/w98/turrets/current-npc-turrets-inventory.md`
- Worker self-audit: `out/w98/turrets/ui-audit.md` (read; not copied)
- Live HUD glance: `src/systems/hud.js`, `src/ui/hud.css`
- Live toast matrix (sibling TGT-03, already live): `src/game/npc-fire-toast.js`
- Live combat / song / dock: `src/systems/combat.js`, `src/systems/song.js`, `src/systems/station.js`

Wave 97 independent pass: `out/w97/turrets/designer-audit.md`. This file is the Wave 98 re-audit after Q1/Q2 close. It does not reopen Wave 97 HUD-01.

---

## UI Audit: NPC turret HUD freeze (Wave 98)

### Summary
Wave 98 turret work is paper only. The freeze keeps HUD-01 closed: empty 80 px hub, hit-only FORE/AFT, no turret toast, no sixth WPN Digit, no new `#hud` child. Live glass already matches that law. Live `Incoming fire.` is sibling TGT-03 cannon-vs-player copy. It is not a turret widget. This wave ships no turret UI.

### Verdict
**CLEAN.** 0 blockers. 0 majors. 1 minor (stale inventory / contract toast cites vs live sibling matrix). 2 suggestions.

Worker self-audit (no turret toast / no pip / no new glance) is **confirmed**. It is not upgraded. Q1/Q2 close does not add chrome. Zero turret `npcFire` in live `src/` is correct.

---

### Freeze scorecard

| Law | Live + freeze | Pass? |
|---|---|---|
| Empty 80 px hub | `.rw-reticle` is 80×80 (`hud.css:184–190`). Clamp keeps the hub on glass (`hud.js:1194`). Brief forbids a turret diamond in the hub (`docs/NpcTurretsDesign.md:151`). | **Pass** |
| No incoming turret gauge | Contract §1.1 forbidden table (`shared-contract.md:36–44`). Live HUD has no inbound energy gauge. No `rw-incoming` / turret-gauge class in `src/`. | **Pass** |
| No new lock box / aspect ring | New inbound lock chrome is forbidden. Existing player `.rw-target-box` + `.rw-lead` stay TGT-05 (`hud.js:704–734`). | **Pass** |
| No turret aim-glass pip | Player `tryPlayerTurret` aims in combat and does not write HUD (`combat.js:1277–1296`). | **Pass** |
| No new glass widget / `#hud` child | Wave 98 is markdown only. `initHud` still creates nodes once (`hud.js:28–29, 688–842`). | **Pass** |
| FORE/AFT on `playerHit` only | Self flash arms only on `playerHit` (`hud.js:1131–1134`). `tgtFacing` is target aspect, not inbound (`hud.js:1357–1376`). | **Pass** |
| No turret toast | `npcFireToast` accepts only `missile` and `cannon` (`npc-fire-toast.js:39–40`). `weapon === 'turret'` returns null. HUD pass-through is literal-only (`hud.js:568–573`). | **Pass** |
| `Incoming fire.` is sibling, not turret | Live authored `INCOMING_FIRE_TOAST` (`npc-fire-toast.js:8, 53–58`). Owner + contract: do not design that toast here (`OwnerDecisionsWave98.md:73`; `shared-contract.md:13, 55, 231`). | **Pass** |
| Digit 0 / 8 / 9 player papers | Digit 0 = last dock service = shipyard (`station.js:186, 5917–5922`). Digit 8 launcher / Digit 9 player `auto` (`station.js:1683–1689, 5418–5448`). | **Pass** |
| WPN groups 1–5 | `weaponHudLabel` names groups 1–5 only (`hud.js:197–230, 841–842, 1822–1823`). Turret is not in `GROUP_WEAPON` (`combat.js:184–187`). | **Pass** |
| `reducedMotion` still ticks bolts | Energy pool integrates with no `reducedMotion` skip (`combat.js:1836–1852`). Seekers: combat, not decoration (`combat.js:1854`). | **Pass** |
| HUD never writes `hullKind` | Read only for family (`hud.js:82–83, 1688–1698`). Sets `root.dataset.family`, not `player.hullKind`. | **Pass** |
| `textContent` / `h()` / `el()` | Combat HUD `el()` (`hud.js:240–245, 1112`). Station `h()` (`station.js:4302–4307`). `innerHTML` absent in `hud.js`. | **Pass** |

---

### Confirm (owner close)

| Confirm | Result |
|---|---|
| No new glass widget | **Confirmed.** No `src/` turret HUD this wave. |
| No lock box | **Confirmed.** Forbidden. Existing TGT-05 box stays. |
| No incoming gauge | **Confirmed.** Forbidden. Not on glass. |
| No turret toast | **Confirmed.** Fail-closed for `weapon === 'turret'`. |
| FORE/AFT stays `playerHit` | **Confirmed.** Self flash on `playerHit` only. |
| Digit 0 / 8 / 9 stay player papers | **Confirmed.** Shipyard / launcher / `auto`. |
| Empty 80 px hub stays empty | **Confirmed.** Size + clamp + no hub child. |
| Later `Incoming fire.` is sibling toast law, not a turret toast | **Confirmed.** TGT-03 owns it. Already live for **cannon** vs player. Turret pack must not author or steal it. |

---

### What's done well
- **Hub stays empty.** 80 px reticle (`hud.css:188–189`) plus `cx - 44` clamp (`hud.js:1194`). Contract forbids a hub lamp, wedge, extra edge-arrow, and new `#hud` child (`shared-contract.md:36–44`).
- **FORE/AFT is not color-only.** Words + fill vs hollow (`hud.js:324–349`; `hud.css:231–291`). Hit flash keeps the word, fill, and red border (`hud.css:293–297`). `reducedMotion` drops the keyframe and adds a red outline (`hud.css:305–307`). Colorblind keeps inset white on lit (`hud.css:310–312`).
- **Hit-only inbound is honest for turret.** Self flash arms only on `playerHit` (`hud.js:1131–1134`). A turret toast would compete with `Incoming dart.` and would lie that turret is a seeker (`docs/NpcTurretsDesign.md:319–326`).
- **Dart channel stays exclusive.** Authored `Incoming dart.` (`hud.js:62`; `npc-fire-toast.js:7, 46–50`). 2.5 s gap. Song missile sting is `weapon === 'missile'` only (`song.js:68–69, 423`). Turret reuses cannon bark (`shared-contract.md:54, 84`).
- **Sibling `Incoming fire.` is not turret chrome.** Matrix is cannon vs player (or ace omit). Parked / jumping skips it (`npc-fire-toast.js:53–58`). HUD accepts only the two authored literals (`hud.js:568–573`). Unknown weapons fail closed.
- **WPN rail does not grow a sixth Digit.** Groups 1–3 cannon/disruptor/mining, 4 launcher, 5 psionic (`hud.js:197–230`). Player `auto` stays off the rail. Strain still reads shared heat (`hud.js:1824`) without naming turret.
- **Dock digits stay player papers.** Digit 9 is offer / seated note / no ammo (`station.js:1683–1689, 5424–5448`). Copy goes through `h()` → `textContent`. NPC fire must not steal Digit 0/8/9 (`shared-contract.md:24`).
- **Toasts are reachable to AT.** `role="status"` + `aria-live="polite"` (`hud.js:765–766`). Freeze does not add a third incoming line (`Incoming turret.`).
- **Tokens, not a new hue.** Lead and energy already share cyan. Freeze does not invent inbound-turret chrome that would collapse into LEAD.
- **Q1/Q2 closed does not ship fire.** Named class gate + vsPlayer later (`OwnerDecisionsWave98.md:26–58`). Live emit still none. Empty hub does not lie.

---

### Findings

#### 🔴 Blocker
None.

No new glance node. Live HUD-01 already matches the freeze. Inaccessible or unusable glass is not introduced. Wave 98 does not edit `src/` for turrets.

#### 🟠 Major
None.

Worker suggestions on toast theft and `reducedMotion` are already fail-closed in contract §1.1. Live `Incoming fire.` is sibling TGT-03, not a turret Major.

#### 🟡 Minor: Inventory and contract toast rows lag the live sibling matrix

**Location:** `out/w98/turrets/current-npc-turrets-inventory.md:74–75`; `out/w98/turrets/shared-contract.md:55` (“npcFire toasts **only** missile”); worker `out/w98/turrets/ui-audit.md:12` (cites `hud.js:61–62, 567–571` as dart-only). Live: `src/game/npc-fire-toast.js:39–58`; `src/systems/hud.js:14, 62, 568–573`.
**Severity:** minor
**Status:** paper drift only — freeze law is still correct. Do not “fix” with a turret toast.

**Issue:** Inventory still says cannon / turret toast is **none** and that default non-missile `npcFire` returns null at `hud.js:567–568`. Live HUD routes `npcFire` through `npcFireToast`. Cannon vs player now toasts authored `Incoming fire.` (sibling Wave 98 TGT-03). Turret still returns null (`weapon !== 'missile' && weapon !== 'cannon'`). Contract §0.13 / §1.1 already name the sibling. The §1.2 “only missile” row and inventory §1.3 rows are stale. A later impl PR that greps only those stale rows could either (a) add `Incoming turret.` or (b) strip live `Incoming fire.` as if it were turret chrome.

Line cites also drifted: empty hub is `hud.js:1194` (not 1185); `playerHit` flash is `1131–1134` (not 1122–1124); WPN node is `841–842` (not 837–838).

**Fix:** Later serial (or a paper refresh) retarget inventory toast rows to `npc-fire-toast.js`: dart = missile+player; `Incoming fire.` = cannon sibling; turret = **null**. Keep contract “do not design `Incoming fire.` here.” Do not add `weapon === 'turret'` to the matrix in the turret pack. If TGT-03 later treats vsPlayer cannon-family energy as the same toast, that sibling owns the change.

#### 💡 Suggestion: Keep toast slots free of a turret line

**Location:** `src/systems/hud.js:59–63, 568–573, 1094–1114`; `src/game/npc-fire-toast.js:7–10, 39–40`; `TOAST_SLOTS` 5
**Severity:** suggestion
**Status:** already frozen — keep

**Issue:** Five polite slots already share dart, fire, sun, hull, comm, and world lines. A later `Incoming turret.` would fight `Incoming dart.` and `Incoming fire.` and would read as a seeker.

**Fix:** Contract already forbids a turret toast (`shared-contract.md:43–44, 55`). Do not add one in PR1–PR3. Do not hail a turret spawn on `commLine`. Do not steal Digit toast or banner (`systemLoaded`).

#### 💡 Suggestion: “No pip / no lock box” must not strip shipped TGT-05 / scanner pips

**Location:** brief mermaid “no pip” (`docs/NpcTurretsDesign.md:142–151`); contract forbidden “lock box, aspect ring, turret lead pip” (`shared-contract.md:38–40`); live `.rw-lead` + `.rw-target-box` (`hud.js:704–734`; `hud.css` lead tokens); contact lock pip (`hud.js:53–56`)
**Severity:** suggestion
**Status:** optional — contract already means *new inbound turret* chrome

**Issue:** Live glass already has a target box, a `LEAD` ring, an edge arrow, and scanner contact pips. “No pip / no lock box” in the turret mermaid can be read as a strip order. Player turret aim is already invisible in combat (`combat.js:1277–1296`). Player gun LEAD is a different instrument.

**Fix:** Keep the freeze as **do not add** inbound turret chrome. Do not hide `.rw-lead`, `.rw-target-box`, or contact pips. PR3 “HUD tree unchanged” already covers this if the pin lists those class names as stay-put.

---

### Passed (HUD freeze)
- [x] Empty 80 px hub
- [x] No incoming turret gauge
- [x] No new lock box / aim-glass turret pip
- [x] No new glass widget / `#hud` glance node
- [x] FORE/AFT stays `playerHit` (self flash); target FORE/AFT stays aspect
- [x] No turret toast
- [x] `Incoming fire.` is sibling TGT-03 (cannon vs player), not turret copy
- [x] `Incoming dart.` stays missile-only
- [x] Digit 0 shipyard; Digit 8/9 player launcher / turret papers
- [x] WPN groups 1–5; no `6 · Auto turret`
- [x] `reducedMotion` still ticks energy bolts; sparks/muzzle may snap
- [x] HUD never writes `hullKind`
- [x] `textContent` / `h()` / `el()` only
- [x] No power-ledger chrome; no chaff Digit; no fire-percent chrome

### Worker self-audit
`out/w98/turrets/ui-audit.md` is aligned on the freeze (no Blocker / Major; no turret toast; sibling owns `Incoming fire.`). Independent pass does not add a blocker or major. Extra pin: retarget stale “cannon toast none” inventory rows to live `npc-fire-toast.js` without treating that sibling line as turret UI.

### Out of scope
- Do not edit `src/`.
- Do not write `out/w98/tgt03/**` or `out/w98/radar/**`.
- Do not reopen NPC missiles Q1/Q2.
- Do not implement NPC turret fire. Live zero turret `npcFire` is correct until a later serial.
