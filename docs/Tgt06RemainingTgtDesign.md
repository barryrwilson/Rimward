# RIMWARD remaining TGT leftover after named slices

| Field | Value |
|---|---|
| **Title** | RIMWARD remaining TGT leftover after named slices |
| **Author** | Wave 122 TGT leftover integrator |
| **Date** | 2026-08-25 |
| **Status** | leftover **CONSUME**. Wave 122 markdown only. Named serial: **none**. Name: **no remaining TGT leftover.** |
| **Wave** | 122 — no `src/`. Bindings do not change here. |
| **Owner request** | Census **remaining TGT leftover after named TGT slices shipped**. Live TGT already shipped TGT-01 lead+RANGE; TGT-02 MATCH; TGT-03 arc / awareness / radar jump-park / CLOS / engine-select; TGT-04 auto + NPC missiles + NPC turrets vsPlayer/vsNPC; TGT-05 KeyV + remaining lock cats. Wishlist TGT-03 still lists candidate capabilities (radar, off-screen arrows, attacker warnings, distance/closure, missile warnings, subsystem targeting, improved lead). Code wins: census whether any of those is still a **player-facing hole**. If remaining leftover is **already gone** (named slices live; remaining wishlist bullets live or owner-omitted), freeze leftover **CONSUME** and named serial **none**. If census finds a **real** remaining hole that is not a named skippable omit, freeze leftover **REAL** and name later serial **PR1** (named only). Do **not** implement `src/`. Do **not** invent a hub PPI, an aim-glass gauge, a second incoming-fire live region, a new Digit, a new persist key, UU, SKU, kit mutate unless inventory proves a real hole. |
| **Merge law** | [`out/w122/tgtrest/shared-contract.md`](../out/w122/tgtrest/shared-contract.md). If this brief and that file conflict, **the contract wins**. |
| **Honor** | HUD-01 empty 80 px hub. Digit 0 shipyard. Digit 8/9 stay. KeyT cycle ships (rocks group 3). KeyV reticle. KeyK engine. KeyX MATCH. `state.js` READ-ONLY later. No new persist key. `innerHTML` forbidden later. Kit mutate omit. Aim-glass gauges stay off. Incoming **gauge** stay off. Overlay mutex cite-only. HUD-02 class tokens sibling. HUD-04 toast sibling. Do **not** write `docs/OwnerDecisionsWave122.md`. Do **not** edit wishlist, `PROGRESS.md`, `docs/Tgt03*.md`, `docs/Tgt05*.md`, `docs/NpcTurretsDesign.md`, `docs/NpcMissilesDesign.md`, `docs/OwnerDecisions*.md`, Hud/Nav/Rep leftover docs. Do **not** steal `out/w122/navrest/**`, `out/w122/represt/**`, `out/w121/**`, `out/w102/**`, `out/w101/**`, `out/w100/**`, `out/w99/**`, `out/w98/**` (read ok). |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 122 census) | [`out/w122/tgtrest/current-tgt-remaining-inventory.md`](../out/w122/tgtrest/current-tgt-remaining-inventory.md) |
| Merge law | [`out/w122/tgtrest/shared-contract.md`](../out/w122/tgtrest/shared-contract.md) |
| Wave 122 security review | [`out/w122/tgtrest/security-review.md`](../out/w122/tgtrest/security-review.md) |
| Wave 122 design-doc review | [`out/w122/tgtrest/code-review.md`](../out/w122/tgtrest/code-review.md) |
| Wave 122 UI audit | [`out/w122/tgtrest/ui-audit.md`](../out/w122/tgtrest/ui-audit.md) |
| Wave 122 notes | [`out/w122/tgtrest/notes.md`](../out/w122/tgtrest/notes.md) |

Siblings named TGT briefs, NPC turret/missile docs, HUD-02 tokens, HUD-04 toast, NAV-07, overlay, wishlist, and `PROGRESS.md` are **other workers**. **Do not edit** those paths. **Do not write** `src/`.

**This is not HUD-02 class tokens.** **This is not HUD-04 toast-flood.** **This is not NAV-07.** **This is not a hub PPI.** Wishlist TGT-03 candidate names are **stale vs code**. Named slices **already ship** the player-facing jobs.

---

## Overview

Named TGT slices already fly: lead + RANGE, MATCH + X, scanner-gated `.rw-contacts`, Incoming fire. + lock `.rw-edge-arrow` park, jump-park of the same arc (no PPI), CLOS next to DIST, KeyK engine + ENGINE bar, player `auto`, NPC darts, NPC turret vsPlayer and vsNPC, KeyV reticle with station/gate/pod/landmark at cone 12 px.

Wishlist TGT-03 still **lists** radar / arrows / attacker warnings / distance-closure / missile warnings / subsystem / improved lead. Census (code wins): those jobs are **live instruments** or **standing omit** (PPI, aim-glass gauges, incoming **gauge**). Salvage / cargo / anomaly extra `lockKind` is Wave 82 **omit**, not a remaining hole.

This leftover is **CONSUME**. Name: **no remaining TGT leftover.** Do **not** freeze a remaining-TGT serial. Wishlist still **says** candidate capabilities; live HUD **ships** them.

This brief is the integrator document. Wave 122 this worker lands markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. Do not invent UU. Do not steal HUD-02 tokens. Aim-glass gauges stay off.

Wave 122 deputize (recorded here and in the contract; owner may override after playtest): **do not invent remaining TGT work**. Fail closed to today’s named slices. Never freeze the sim.

If census had proved a real remaining hole that is not a named skippable omit, this pack would freeze **REAL** and name serial **PR1**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w122/tgtrest/current-tgt-remaining-inventory.md`](../out/w122/tgtrest/current-tgt-remaining-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Lead + RANGE | LIVE ungated | `hud.js` **813–815**, **1387–1407**, **1457–1468** |
| MATCH + KeyX | LIVE; rock rest-frame + lamp | `controls.js` **308–309**; `hud.js` **356**, **1896** |
| Contacts arc | LIVE scanner-gated `.rw-contacts` | `hud.js` **876**, **1497–1501**; `hud.css` **787** |
| Radar jump-park | LIVE `contactsGate(..., jumping)`; no PPI | `contacts-gate.js` **18–19** |
| Lock edge-arrow | LIVE; dock/jump park; `aria-hidden` | `hud.js` **816–817**, **1418–1420** |
| Incoming fire. / dart. | LIVE toast matrix | `npc-fire-toast.js` **8–64**; `hud.js` **649–654** |
| DIST + CLOS | LIVE core rail | `hud.js` **937–942**, **2143–2151** |
| KeyK ENGINE | LIVE engine-only | `subsys-aim.js`; `hud.js` **934**, **2159–2162** |
| Player `auto` | LIVE SKU | `weapon-fit.js` **47**; `combat.js` **1372–1390** |
| NPC dart / turret | LIVE vsPlayer + vsNPC | `npc.js` **1207–1235**, **1679–1686** |
| KeyV + cats | LIVE cone 12 | `reticle-aim.js` **15**, **279–310** |
| Empty hub | 80 px | `hud.css` **184–193** |
| Digit 0 / 8 / 9 | shipyard / launch / epics | `station.js` **188**, **6171–6173** |
| Persist targeting extra | **none** | `save.js` **77–101** |
| `innerHTML` hud.js | **none** | grep 0 |
| Incoming gauge / PPI | **absent** | grep + WAVE83/98/99 inbound false |
| HUD-02 token | sibling `classKeyToken` | `hud.js` **102** |

The player who flies a Wolfeye already sees nearby ships on the bottom arc, including aft, and loses that picture while jumping. The player who locks an off-glass ship already gets an amber edge triangle. The player who takes cannon or turret fire already reads `Incoming fire.` The player who takes a dart already reads `Incoming dart.` DIST and CLOS already sit on the tgt rail. KeyK already selects engine after shields. KeyV already locks station/gate/pod/landmark. Lead and RANGE already follow the selected weapon. Wishlist candidate names are **stale vs code**.

### Pain points

- A naive later PR that “adds radar” would put a PPI on the 80 px hub or double `.rw-contacts`.
- A naive later PR that “adds off-screen arrows” would double `.rw-edge-arrow` or steal `.rw-nav-gate-cue`.
- A naive later PR that “adds attacker warnings” would add a second live region or an incoming gauge HUD-04 and TGT-03 already forbade.
- A naive later PR that “adds closure” would double CLOS or steal Mk II «/».
- A naive later PR that “adds subsystem targeting” would steal KeyT/V or add `'engine'` as `lockKind`.
- A naive later PR that “improves lead” as leftover would retune TGT-01 ungated math.
- A naive later PR that adds salvage `lockKind` fights Wave 82 (disabled ships are ships).
- A naive later PR that persists CLOS or `targets.part` into `WORLD_FIELDS` lies after jump.
- A naive later PR that `innerHTML`s lock names is XSS.
- A naive later PR that steals Digit 0/8/9 smashes shipyard, launch, epics, or arms papers.
- Inventing “CONSUME is boring, add a PPI” invents work the owner forbade.

### Why now (design) / why not now (code)

The owner asked for a leftover census so later serials do **not** invent a hub PPI, a second toast region, or a new Digit while chasing holes named slices already closed. Inventory shows remaining TGT leftover **gone**. Merge law can exist without touching `src/`. Implementation does **not** wait — it **does not ship**. Wave 122 this worker does not write `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live named TGT slices from **live code**.
2. Freeze leftover as **CONSUME** (not REAL). Name **no remaining TGT leftover.** Serial **none**.
3. Freeze **reuse** of live contacts / edge-arrow / toasts / DIST+CLOS / ENGINE / lead / MATCH / KeyT V K X. No second instrument. No new persist key.
4. Freeze standing omit: PPI, aim-glass gauges, incoming gauge, kit mutate, salvage kind.
5. Freeze HUD-02 / HUD-04 / NAV-07 / overlay as **sibling — do not steal**.
6. Freeze no new Digit, no `state.js` write, no UU, no hub pip.
7. Freeze a serial PR plan with **no implementation PR1**.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No hub PPI. No radar pip. No aim-glass gauge. No incoming gauge.
- No second `.rw-contacts` class. No second edge-arrow class.
- No second incoming-fire live region. No `aria-live=assertive`.
- No salvage / cargo / anomaly `lockKind`.
- No selectable hull/screen as leftover (engine only).
- No HUD-02 class-token steal. No HUD-04 linger retune. No NAV-07 steal.
- No new Digit. No extra toast.
- No `WORLD_FIELDS` CLOS / part / MATCH key.
- Do not pause the sim.
- Do not edit the wishlist, `PROGRESS.md`, sibling Tgt/Npc/Hud/Nav/Owner docs.
- Do not write `docs/OwnerDecisionsWave122.md`.
- Do not steal `out/w122/navrest/**`, `out/w122/represt/**`, `out/w121/**`, `out/w102/**`–`out/w98/**`.
- Do not fix known boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **No. CONSUME.** | Inventory §0: named slices LIVE; wishlist bullets live or omit |
| Named PR1? | **None** | CONSUME |
| New persist key? | **No** | Lock / CLOS / part session |
| `state.js` write? | **No** | Contract §0.5 |
| Hub PPI / radar pip? | **No** | HUD-01 empty hub; Tgt03RadarDesign |
| Incoming gauge? | **No** | Toast live |
| Second live region? | **No** | HUD-04 freeze |
| Salvage kind? | **No** | Wave 82 omit |
| New Digit? | **No** | Digit 0/8/9 live |
| Fail closed? | skip unknown; never pause | Live targeting + contract |

### 2. Current targeting motion (do not break named slices)

Player flies. Scanner 0: DIST, CLOS, lead, RANGE, MATCH, edge-arrow still work; contacts hide. Scanner 1/2: bottom arc paints nearby ships. Jump or dock: arc and lock arrow park. KeyT cycles ships. KeyV locks the object under the pip (ships, rocks, station, gate, pod, landmark). KeyX MATCH. KeyK engine after shields. NPC dart → `Incoming dart.` NPC cannon/turret vs player → `Incoming fire.` Player seated `auto` fires on its own clock. Do not add a sixth picture.

### 3. Serial plan

**PR1 remaining TGT does not exist.** Do not invent work.

---

## Open questions

None for this leftover. Owner may override CONSUME after playtest by a successor census, not by this pack shipping `src/`.

---

## Risks

- A later worker treats stale wishlist bullets as REAL and doubles live chrome.
- A later worker “fixes” WAVE99 boot-block naming (TURRETS vs RADAR) by adding a PPI pin that invents a disc.
- A later worker persists CLOS into `WORLD_FIELDS`.

Mitigation: this contract + inventory file:line. Code wins.
