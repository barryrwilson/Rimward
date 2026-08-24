# RIMWARD BIO-05 remaining Abominations

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO-05 remaining Abominations |
| **Author** | Wave 96 BIO-05 integrator; Wave 97 owner close |
| **Date** | 2026-08-23 |
| **Status** | remaining closed by Wave 97 owner line (NPC off, plated, no badge, no ungraft). Design freeze. Wave 97 does not ship grafts. |
| **Wave** | 97 — owner close. Later — impl (serial) only if a successor owner file opens PR3. Wave 97 does not ship grafts. |
| **Owner request** | Remaining BIO-05: Gilded sell grafted living parts; grafts turn a conventional hull into an Abomination; Beautiful Ones become immediate enemies while tissue is owned; destroying an Abomination grants Beautiful friend standing. Inventory live code first. Much of this already shipped (Wave 72 / Wave 82). Do not re-design grafts as if they were absent. Wave 97 binds leftover NPC / overlay / badge / ungraft. |
| **Owner line** | [`docs/OwnerDecisionsWave97.md`](OwnerDecisionsWave97.md). Binding. |
| **Merge law** | [`out/w97/bio05/shared-contract.md`](../out/w97/bio05/shared-contract.md). If this brief and that file conflict, the contract wins. Wave 96 pack: [`out/w96/bio05/shared-contract.md`](../out/w96/bio05/shared-contract.md) (superseded on §2.1–2.4). |
| **Honor** | [`docs/BioLivingShipsDesign.md`](BioLivingShipsDesign.md) §7 Abomination = `built` + `grafted: true`. **Do not edit** that file. Code wins where §7 still says NPC destroy standing is later (Wave 82 shipped +5). |

**Verifier record:**

| Note | Path |
|---|---|
| Owner close | [`docs/OwnerDecisionsWave97.md`](OwnerDecisionsWave97.md) |
| Inventory (code wins) | [`out/w96/bio05/current-bio05-inventory.md`](../out/w96/bio05/current-bio05-inventory.md) |
| Inventory note (Wave 97 grep) | [`out/w97/bio05/current-bio05-inventory.md`](../out/w97/bio05/current-bio05-inventory.md) |
| Merge law | [`out/w97/bio05/shared-contract.md`](../out/w97/bio05/shared-contract.md) |
| Security review | [`out/w97/bio05/security-review.md`](../out/w97/bio05/security-review.md) |
| Design-doc review | [`out/w97/bio05/code-review.md`](../out/w97/bio05/code-review.md) |
| UI audit | [`out/w97/bio05/ui-audit.md`](../out/w97/bio05/ui-audit.md) |

Siblings BIO-01 / BIO-02 / BIO-03 / BIO-04 / NAV-04 are **other workers**. **Do not edit** `docs/Bio01ObtainDesign.md`, `docs/Bio02EvolutionDesign.md`, `docs/Bio03FleetDesign.md`, `docs/Bio03ClassLookDesign.md`, `docs/Bio04PsionicsDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/Nav*.md`, the wishlist, or `PROGRESS.md`.

---

## Overview

Wave 72 already marks a **built** hangar row `grafted: true` at a Gilded Hangar. Wave 82 already prices that graft at **4000 UU** and already adds Beautiful **+5** when the kill helper sees a grafted victim (then recaps Beautiful to **−10** if the player still owns tissue). Beautiful standing is already `min(current, −10)` while any grafted hangar row exists. HUD already paints grafted built as **mech**. Digit 5 already fires on living, unset `hullKind`, or own-key grafted built. Unknowables already miss the bolt.

Wishlist BIO-05 still reads as if those beats were future work. They are not. This brief is the integrator document for a **later** implementation wave that must **not** reopen the player graft loop. Remaining NPC Abomination traffic, plated tissue overlay, hangar badge, and ungraft SKU are **closed by Wave 97** (NPC off, plated, no badge, no ungraft). Wave 97 lands owner markdown only. Bindings do not change in `src/`.

HUD never writes `hullKind`. Grafted built stays plated. `makeLivingHull` stays the player living quality bar. `state.js` stays READ-ONLY. Digit 0 stays shipyard. Do not invent UU or standing deltas.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w96/bio05/current-bio05-inventory.md`](../out/w96/bio05/current-bio05-inventory.md). Wave 97 grep pointer: [`out/w97/bio05/current-bio05-inventory.md`](../out/w97/bio05/current-bio05-inventory.md). Code wins over stale Wave 70 / Wave 72 comments and over Living-ships §7 “later” destroy standing.

| Surface | Today | Cite |
|---|---|---|
| Abomination | `hullKind === 'built'` + own `grafted === true` | `hangar.js` 105–110, 743–775 |
| Living / Unk drop flag | Sanitize deletes `grafted` | `hangar.js` 98–110 |
| Gilded sale | Two-step Hangar papers; debit 4000 UU; no remount | `shipyard-desk.js` 190–198, 360–418; `shipyard.js` 26 |
| Warn | Immediate Beautiful enemies; patrols at −10 | `shipyard-desk.js` 67–69 |
| Standing cap | `min(current, −10)` while any grafted row | `hangar.js` 151–167 |
| Destroy +5 | Kill helper; Beautiful victim skip; then recap | `kill-standing.js` 6–9, 169–172 |
| NPC `grafted` | **Absent** (Wave 97 keeps **off**) | `npc.js` / `src/game/traffic.js` grep 0 |
| HUD family | Reads `hullKind`; grafted stays mech | `hud.js` 76–85 |
| Digit 5 | Living / unset / grafted; Unknowables miss | `psionic.js` 27–32; `combat.js` 1544, 1813 |
| Digit 0 | Dock shipyard; yard Digit 0 = hangar row 8 | `station.js` 186, 5920–5922 |
| Mesh | Built plated; living `makeLivingHull` | `ship.js` 274, 535–560 |
| Persist | `WORLD_FIELDS.hangar`; no graft world key | `save.js` 76–101, 951–957, 1216 |
| `innerHTML` | Desk uses `h()` `textContent` | `station.js` 4302–4305 |

### Pain points

- Wishlist BIO-05 still lists Gilded grafts and Beautiful hostility as if they were missing. A naive later PR that “adds grafts” would double-write standing or steal Digit 0.
- Living-ships §7 still says destroy-Abomination standing is later. Inventing a second delta would fight Wave 82.
- NPC traffic has no `grafted` flag, so live +5 almost never fires. Wave 97 keeps that world look **player-only**. Do not spawn NPC Abominations.
- Painting grafted built with `makeLivingHull` would weaken the player living quality bar and fight HUD-02 mech. Wave 97 **omits** a plated overlay.
- A new persist key for “abomination” would fight hangar allowlist law.

### Why now (design) / why not now (code)

Wave 96 asked for **DONE vs OPEN**. Wave 97 **closes** the leftover owner questions so a later serial does not wait on NPC / overlay / badge / ungraft. Wave 97 is markdown. The freeze (no new UU, Digit 0, no `innerHTML`, player loop closed, NPC off, plated) exists before anyone touches `hangar.js` again.

---

## Goals & Non-Goals

### Goals

1. Document live graft helpers, standing cap, Gilded copy, persist sanitize, kill +5, HUD family, Digit 5 grafted path, and NPC absence from **live code**.
2. Freeze the player graft loop as **closed**. Do not reopen sale, warn, UU, or the −10 cap.
3. Freeze destroy-Abomination **+5** as named. Do not change it.
4. Freeze NPC grafted traffic as **off** (player-only world). Closed by [`docs/OwnerDecisionsWave97.md`](OwnerDecisionsWave97.md).
5. Freeze visual overlay as **omit / keep plated**. Do not replace `makeLivingHull`. Closed by Wave 97.
6. Freeze Digit 0 shipyard, HUD never writes `hullKind`, no new persist key, `textContent` only.
7. Freeze a serial PR plan that schedules **no** Wave 97 BIO-05 `src/` PRs and **no** player graft desk PRs.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 97.
- No BIO-01 gift/pirate, BIO-02 train dests, BIO-03 bake, BIO-04 psionic numbers.
- No NAV-04, police leave, Unknowables dock, power ledger, aim-glass gauge.
- No Wave 72 graft redesign. No HUD write of `hullKind`.
- No invented UU or standing delta. Pointer: [`docs/OwnerDecisionsWave82.md`](OwnerDecisionsWave82.md).
- No `state.js` write this wave. No `state.js` write later unless a **successor** owner file opens a new SKU. Ungraft is **forbidden**.
- No `innerHTML`. No new `localStorage` key. No new `WORLD_FIELDS` key.
- No ungraft commodity. No hangar grafted badge. Wave 97 omits both.
- Do not edit the wishlist, `PROGRESS.md`, Living-ships, or sibling BIO/NAV/SHP files.
- Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Wave 97 `src/`? | **No.** Markdown only. No BIO-05 PRs scheduled | Task; contract §0.1 |
| Player graft sale/warn/cap? | **Closed.** Do not reopen | Inventory §3–5 |
| New persist key? | **No.** Ride `hangar` | `save.js` 94 |
| New UU / standing? | **No.** Wave 82 integers | Owner Wave 82 / 97 |
| Destroy +5? | Keep `ABOMINATION_DESTROY_BEAUTIFUL_DELTA` | `kill-standing.js` 9 |
| Recap while player wears tissue? | +5 then `min(current, −10)` | Inventory §7 |
| NPC grafted hulls? | **Off.** Closed by Wave 97. Player-only | Owner Wave 97; inventory note |
| Player grafted mesh? | Keep **plated**. Overlay **omit** | Owner Wave 97; `ship.js` 558–560 |
| Replace `makeLivingHull`? | **No** | Quality bar |
| HUD `hullKind`? | HUD never writes. Grafted stays `mech` | HUD-02 |
| Digit 0? | Untouched (shipyard) | `station.js` 5920–5922 |
| Digit 5 numbers? | Closed (BIO-04) | `psionic.js` 27–32 |
| `innerHTML`? | **No** | `textContent` / `h()` |
| `state.js`? | READ-ONLY this wave. No later write unless successor SKU | Contract §0.2 / §2.4 |
| Hangar badge? | **Omit.** Closed by Wave 97 | Contract §2.3 |
| Ungraft SKU? | **Forbidden** | Contract §2.4 |
| Player graft PRs later? | **None** | Contract §1.7 |

### 2. Player outcome

**Already live (do not re-stage):** Dock a **Gilded** station with a **mounted plated** hull. Open Shipyard Hangar (Digit 0 at the dock, then Digit 1 Hangar). Offer graft. Confirm papers. The yard debits **4000 UU**, marks the row `grafted: true`, and caps Beautiful at **−10**. The mesh stays plated. HUD stays mech. Digit 5 may fire. Living hulls and Unknowables cannot take the graft. Esc cancels with no write.

**Helper-ready, not current traffic:** Destroy a grafted civilian/patrol hull as last attacker: Beautiful **+5**, unless the victim is Beautiful (kill −5 only). If the player still owns tissue, sanitize recaps Beautiful to **−10**. Live NPC spawn does **not** set `grafted`, so this bonus does not fire on current traffic. Do not change the integers. Wave 97 keeps NPC Abominations **off**. Do not spawn them unless a **successor** owner file opens contract §2.1.

### 3. Leftover (closed by Wave 97)

NPC Abomination traffic: **off**. Plated tissue overlay: **omit**. Hangar badge: **omit**. Ungraft SKU: **forbidden**. Not Wave 97 `src/`. Not a player desk rewrite. See [`docs/OwnerDecisionsWave97.md`](OwnerDecisionsWave97.md) and contract §2 and §5. A successor owner file may reopen NPC / overlay. This wave does not.

---

## Serial PR plan (later impl wave — not Wave 97)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 inventory pins** | Optional boot pins for live graft law | Product copy, new UU |
| **PR2 player leftover** | **Skipped.** Loop complete | Gilded papers, standing cap |
| **PR3 NPC / visual** | Only after a **successor** owner file opens §2.1 / §2.2 | `makeLivingHull` replace, new Digit, persist key. Wave 97 does **not** open this |

Wave 97 does not schedule these into `src/`. PR1 stays optional. PR2 stays skipped. PR3 stays skipped until a successor owner file (not Wave 97) opens it.

---

## Security & persist (freeze)

Threats this freeze exists to kill: XSS via desk copy, proto hull ids, persist-smuggled `grafted` on a living row, emit smash, invented economy numbers, Digit theft, HUD writing `hullKind`, double standing deltas, replacing the living CPU mesh.

| Control | Rule |
|---|---|
| Copy | Static literals; `textContent` |
| Ids | `SAFE_ID` + reserved skip |
| Graft flag | Own-key boolean `true` only |
| Standing | `FACTIONS` + `hasOwn`; recap after kill |
| Emit | No hangar blob; kill `commLine` primitives |
| Persist | Hangar row only |

---

## Acceptance (player loop live; leftover closed unless a successor opens it)

Player loop already accepts:

- Gilded confirm writes `grafted` on built, debit 4000, Beautiful ≤ −10.
- Living / Unknowables / already-grafted / Esc: no flag.
- HUD mech; HUD did not write `hullKind`.
- Digit 5 fires on grafted built; Unknowables miss.
- Destroy helper +5 exists; recap holds while the player owns tissue.
- Digit 0 still shipyard.

Leftover accepts only after a **successor** owner file opens them. Wave 97 does **not** open them:

- NPC grafted spawn: **off**.
- Plated overlay: **omit**. Never living remount for this object.
- Hangar grafted badge: **omit**.
- Ungraft SKU: **forbidden**.

---

## Open questions

None. Wave 96 defaults are **closed** by [`docs/OwnerDecisionsWave97.md`](OwnerDecisionsWave97.md). Answers live in [`out/w97/bio05/shared-contract.md`](../out/w97/bio05/shared-contract.md) §6. Do not invent numbers. Do not wait on a further owner line for NPC / plated / badge / ungraft.
