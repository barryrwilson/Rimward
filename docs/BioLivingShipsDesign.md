# RIMWARD BIO living ships, growth, and Abominations

| Field | Value |
|---|---|
| **Title** | RIMWARD BIO living ships, growth, and Abominations |
| **Author** | Wave 70 BIO integrator |
| **Date** | 2026-08-20 |
| **Status** | Accepted. Wave 70 is design. A later wave ships serially. |
| **Wave** | 70 — design only. Later — first impl. |
| **Owner request** | BIO design brief. Do not ship living-fleet meshes, grafts, seeds, or `src/` in this wave. |
| **Merge law** | [`out/w70/bio/shared-contract.md`](../out/w70/bio/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w70/bio/current-bio-inventory.md`](../out/w70/bio/current-bio-inventory.md) |
| Merge law | [`out/w70/bio/shared-contract.md`](../out/w70/bio/shared-contract.md) |
| Security review | [`out/w70/bio/security-review.md`](../out/w70/bio/security-review.md) |
| Design-doc review | [`out/w70/bio/code-review.md`](../out/w70/bio/code-review.md) |

---

## Overview

Every origin already flies one living `light` hull: `makeLivingHull` with swim, breath, heartbeat, and vein skin. Beautiful Ones NPC ships use GLBs plus a weaker GPU swim. Yards already sell living `light` / `cutter` / `heavy` at Beautiful docks and living `light` at Unknowables docks. Companion growth is a +15% visual scale. There is no seed gift, no pirate seed, no Gilded graft, and no psionic gun.

Wishlist BIO still needs extra ways to obtain a living hull, class evolution, a Beautiful fleet that matches the player benchmark, psionic weapons, and Abominations (plated hulls with living grafts) that make the Beautiful Ones immediate enemies.

This brief is the integrator document for a **later** implementation wave. It freezes the living-starter preserve, hangar-row persist, obtain paths, growth vs `switchTo`, Abomination flags and warning, living-frigate omit, HUD-02 read-only `hullKind`, and a serial PR plan. Wave 70 lands this markdown only. Meshes and grafts do not ship here.

HUD-02 already reads `ctx.player.hullKind`. SHP writes that field. HUD never writes it. Do not reopen HUD-02 owner answers Q1–Q3. SHP-03 already allows conventional guns on living hulls; do not require a growth-center to keep the starter cannon.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “BIO today”: [`out/w70/bio/current-bio-inventory.md`](../out/w70/bio/current-bio-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Player mesh | Living manta/whale. `makeLivingHull`. Four CPU motion fields. Remount rebuilds them | `ship.js` 257–306, 353–428, 502–542, 888–933 |
| Growth visual | `bio.growth` 0..1 → `flesh.scale` up to +15%. Also applies to plated flesh wrapper | `bio.js` 156–161; `ship.js` 97, 978–986 |
| Player identity | `createShipState('light')`, faction `independent`. `hullKind` living on starter migrate | `ship.js` 589–590; `hangar.js` 259–264 |
| Envelope | `switchTo` calls `applyFlightEnvelope`. Live: `maxSpeed = cruise`, `creep = creep`, `afterburner.multiplier = burn / cruise` (cruise 0 → 2), `damping = 1 / stopTime`, accel = cruise × (90/120). Do not set `multiplier = burn` | `hangar.js` 467–482, 611–632 |
| Yards | Beautiful `LIVING_STOCK` light/cutter/heavy. Unknowables light only. No living frigate buy | `shipyard.js` 16–72 |
| `isBeautiful` | `faction === 'beautiful'`. Not a player-hull flag | `organic.js` 67–69 |
| NPC Beautiful | GLB + GPU swim 0.7 Hz + idle clip. Not `makeLivingHull` | `ship-assets.js` 33, 136–170 |
| Origin | Beautiful: bond 0.35, hunger 0.4, 2× livingRock. No mesh change | `state.js` 716–719; `origins.js` 50–83 |
| Companion | Hunger / wounds / mood / bond / growth. Survives death and remount | `bio.js`; `save.js` 517–525 |
| HUD | `hullKind` living → bio, built → mech. HUD never writes | `hud.js` 67–75 |
| Hostility | Patrols hunt at standing ≤ **−10** | `npc.js` 87, 1065–1072 |
| Grafts / psionics / seed SKU | Absent | hangar allowlist; `WEAPONS` |

`SHIP_CLASSES` keys remain `light` `heavy` `freighter` `ace` `cutter` `frigate` (`state.js` 35–42). Feature workers do not add rows.

### Pain points

- Wishlist BIO-01: extra obtain (gift, pirate, expensive seed) does not exist. Origin does not add a hull; the starter is already living.
- Wishlist BIO-02: growth is scale, not class. A naive growth-center that remounts `classKey` without envelope copy would leave a heavy on the light 120/30 cruise — Wave 64 already fixed that for hangar swap.
- Wishlist BIO-03: Beautiful NPC magic is weaker than the player living hull.
- Wishlist BIO-04: no psionic family. Inventing one here would fight SHP-03 and `state.js` READ-ONLY.
- Wishlist BIO-05: no grafts; no warning; no Beautiful hostility on tissue sale.
- Wave 67 plated leftover added **frigate** to `CORE_STOCK` only. A drive-by living frigate SKU would skip the BIO decision.

### Why now (design) / why not now (code)

The owner asked for the BIO brief after SHP hangar, HUD-02 skins, and SHP-03 mounts. Inventory and merge law exist. Implementation waits for a later serial wave so grafts, gifts, and fleet art land against a frozen contract instead of a drive-by `hullKind: 'living'` on a plated ship.

---

## Goals & Non-Goals

### Goals

1. Document the live living starter and name it the quality benchmark.
2. Freeze BIO-01 obtain: yards already in; gift/pirate/commodity deferred with persist shape (hangar row, no nested loadout).
3. Freeze BIO-02: visual growth stays; class evolution later uses `applyFlightEnvelope` + living remount; no growth-center required for the starter cannon.
4. Freeze BIO-03 as later visual+motion; this wave does not ship meshes.
5. Name BIO-04 psionics as a **non-goal** for the first impl wave. Do not invent a triad.
6. Freeze BIO-05 Abomination = `built` + `grafted: true`; Gilded sells; two-step warning; Beautiful standing `min(current, -10)`.
7. Freeze Beautiful / Unknowables **frigate buy omit**.
8. Freeze HUD-02: living → bio; HUD never writes `hullKind`.
9. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/`, meshes, grafts, or seeds in Wave 70.
- No missiles, launchers, lock-box, or power/heat-per-fit ledger (SHP-03 closed).
- No HUD-02 reopen. No Abomination HUD family. No HUD write of `hullKind`.
- No psionic weapons and no G/S/E triad in the first BIO impl.
- No living frigate (or Unknowables frigate) yard SKU in the first BIO impl.
- No nested hangar `loadout`. No new autosave key.
- No factory-reset of `ctx.bio` on hull work.
- No conventional starter as the boot default.
- No weakening `makeLivingHull` swim / breath / heartbeat.
- No `innerHTML` world strings. No new frozen event unless an existing emit truly cannot carry the line.
- No `state.js` feature rewrite.
- Do not edit the wishlist or `PROGRESS.md` in this wave.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Does Beautiful origin grant a living ship? | It already does — **every** origin does. Origin must not remount or write `hullKind` | Inventory §6. Contract §3.1 |
| How is a seed persisted? | Hangar row, `hullKind: 'living'`. Not cargo `livingRock`. Not nested loadout | Contract §3.3, §0.4 |
| Gift / pirate / commodity in first impl? | Yards in. Gift/pirate/commodity **deferred** (gift shape frozen if a later PR lands it) | Prefer freeze-or-defer. No invented drop % |
| Growth vs `switchTo`? | Visual growth now. Class evolution later = same row `classKey` + envelope + living remount | Wave 64 remount. Contract §4 |
| Growth-center required for starter cannon? | **No** | SHP-03 §6; wishlist regression |
| BIO-03 in this wave? | Markdown only. No GLB claim | Contract §5 |
| Psionics? | **Out** of first impl. No triad | Contract §6 |
| What is an Abomination? | `hullKind === 'built' && grafted === true` | Contract §7.1 |
| Who writes `hullKind`? | SHP hangar / yard / save / Unknowables force. BIO writes `grafted` only | Contract §2 |
| Hostility number? | Live `HOSTILE_STANDING` **−10**, as an **ownership invariant** (any grafted hangar row) | Do not invent Marked; tamper must not skip it |
| Warn before graft sale? | Mandatory two-step `textContent` | Wishlist regression; contract §7.4 |
| Living frigate buy? | **Keep omit** | BIO decision, not Wave 67 leftover |
| HUD family for grafts? | `mech` (built) | HUD-02 closed |

---

### 2. Preserve: living player ship

The shipped player living hull **is** the product.

`makeLivingHull` sculpts a manta/whale sphere. Each frame the living rig mutates vertices: swim along the spine (idle 0.5 Hz → cruise 2.3 Hz), wing flap, ~4 s breath, 1.1 Hz heartbeat, amoeba shimmer, mood-tinted veins. Thrust is a bioluminescent surge, not a nozzle. `GROWTH_SCALE_MAX` 0.15 scales `flesh` from `ctx.bio.growth`.

Later work must:

- Rebuild that path on every living remount (`buildLivingVisual`).
- Keep Unknowables on that path (`meshKindFor` / force `'living'`).
- Keep boot `buildLivingVisual` before any hangar restore overlay.

Later work must not:

- Replace player living with Beautiful NPC GPU swim “for consistency.”
- Skip vertex swim when `classKey` evolves.
- Treat `isBeautiful(player.faction)` as the living test (starter is `independent`).

---

### 3. BIO-01 — obtain

#### 3.1 Shipped

- Living starter on boot and `freshStart`.
- Beautiful origin: warmer companion + two living rock. Not a second hull.
- Beautiful yard: buy living light / cutter / heavy into the hangar (list 8000 / 11000 / 20000 UU). Confirm papers. No remount-on-buy.
- Unknowables yard: living light only.

#### 3.2 Later obtain (deferred, persist frozen)

See contract §3.3. Gift at Sworn (≥50) as reserved hangar id `hull_seed_gift`. Pirate seed and seed commodity stay deferred. `livingRock` remains food.

---

### 4. BIO-02 — growth and evolution

Live `bio.growth` is care made visible. It must not change `classKey` by itself.

Hangar `switchTo` is the only class remount today. It already calls `applyFlightEnvelope` (`hangar.js` 467–482): multiplier is **`burn / cruise`**, not `burn`. A later Beautiful training action must call that function + living remount, keep cargo, and let existing launcher/turret heal drop illegal seats. It must not require a center visit before the starter can fire cannon. It must not copy a wrong envelope table.

First impl does **not** add six career class keys or a new dock Digit.

---

### 5. BIO-03 — Beautiful NPC fleet

Rebuild is visual + motion language: alien grown skins, speed-responsive swim, class identity by shape and size, marine vibes as inspiration.

Wave 70 does **not** ship those meshes. A later visual serial owns GLBs / shaders. Player CPU `makeLivingHull` stays unique to the player living rig for performance and for the preserve rule.

---

### 6. BIO-04 — psionic weapons

Named hole. Out of the first implementation wave. Conventional guns stay on living hulls and Abominations per SHP-03. Do not design a three-resource triad in this brief.

---

### 7. BIO-05 — Abominations

Gilded Chain sells living grafts. A graft marks a **built** hangar row `grafted: true` and leaves `hullKind: 'built'`. HUD stays mechanical. Mesh stays plated (tissue overlay may come in a later visual PR). Living remount is forbidden for this object.

Confirm flow (first impl):

1. Gilded dock, mounted built hull, not already grafted.
2. Arm pending. Warning line: Beautiful Ones become immediate enemies.
3. Confirm: set `grafted`, then apply the ownership invariant (Beautiful standing `min(current, -10)`).
4. Cancel: no write, no debit.

**Ownership invariant:** while any hangar row is `grafted`, Beautiful standing is capped at live `HOSTILE_STANDING` (−10) on sanitize, restore, remount, and graft confirm. Save tamper cannot own tissue without the hostility. Stripping the last graft later does not auto-heal standing.

Graft price is **proposed, needs owner**. Until an authored constant exists, do not debit a guessed UU.

NPC Abominations and “destroy Abomination → Beautiful friend” are later. Do not invent the standing delta.

---

### 8. Living frigate

Beautiful and Unknowables buy lists **keep omit** of `frigate`. Persist may still store a living frigate row if one exists. Adding a living frigate SKU is a future BIO catalog decision with owner sign-off.

---

### 9. Persist and HUD

| Object | Persist | Notes |
|---|---|---|
| Hangar rows | `WORLD_FIELDS.hangar` | Allowlist + `grafted` boolean later |
| `player.hullKind` | Wholesale player + heal | `'living'\|'built'` else delete |
| `ctx.bio` | Wholesale bio | Heal non-finite; never reset on graft |
| `reputation.beautiful` | Existing reputation object | May be missing today; graft creates it |
| HUD family | Derived | 5 Hz reread. No event |
| `ctx.config.ship` | **Do not persist** | Envelope from classKey |

No new `localStorage` key. New Game stays `clearAutosave` only.

---

### 10. Serial PR plan

Matches contract §12.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 persist + pins** | `grafted` allowlist; living remount pins | Meshes, hostility, prices |
| **PR2 obtain pins** | Beautiful/Unknowables buy still living; starter preserved | Pirate %, commodity, frigate SKU |
| **PR3 Abomination desk** | Gilded warning + `grafted` + standing −10 on confirm and on restore/sanitize | Psionics, NPC grafts, living remount |
| **PR4 growth (optional)** | Visual growth kept; class evolution only if owner wants it | New dock service, new classes |
| **PR5 boot pins** | Starter swim; warning-before-debit; HUD does not write kind | Wishlist / PROGRESS.md |

BIO-03 fleet art is a separate visual serial.

`state.js` stays untouched unless a named serial owner must land a tiny constant. Prefer authored graft price on `shipyard.js` next to `YARD_LIST_UU`.

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave (not this worker).

---

### 11. Non-goals (expanded)

- Psionic bolts, mind lock, or a third resource triad.
- Literal squid/octopus/whale copies for NPC class identity.
- Selling grafts at Beautiful docks.
- Marking a living hull `grafted` (sanitize drops it).
- Using `livingRock` as a ship seed.
- Reopening Digit layout, HUD-02 skins, or SHP remount-on-buy.

---

### 12. Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Weaken player living animation | Contract §1; remount rebuilds `makeLivingHull`; BIO-03 must not replace it |
| Literal marine copies | BIO-03: vibes, not copies |
| Conventional parts vs tissue | Abomination stays plated `built`; living stays living + conventional guns |
| Hostility without warning | Two-step confirm; no debit until confirm |
| Growth strips guns/cargo | No class change from `bio.growth`; evolution uses hangar heal + keep cargo; starter cannon ungated |
| `hullKind` smuggle | Allowlist; HUD never writes; Unknowables force living |
| Proto on hangar / reputation | `RESERVED_IDS`; `hasOwn`; no `for…in` blob merge |
| XSS | `textContent` only |

---

### 13. Ownership

| Object | Writer | Reader |
|---|---|---|
| Player living mesh | `ship.js` remount | cameras, combat, HUD |
| `player.hullKind` | hangar / shipyard / save / Unknowables force | HUD `hudFamily` |
| Hangar `grafted` | BIO graft desk (later) | hostility, mesh overlay later |
| `ctx.bio` | `bio.js` + station feed/tend | `ship.js` visuals, HUD Bio, song |
| `reputation.beautiful` | graft desk (later); existing station/world writers | `standingOf`, yard `rep < 0` |
| Beautiful NPC GLB | ship-assets (later BIO-03 owner) | npc spawn |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |
| HUD family | derived in `hud.js` | CSS `#hud[data-family]` |

`bio.js` still must not write `hullKind`. `hud.js` still must not write `hullKind` or `grafted`.

---

## Acceptance direction (implementation wave)

From the wishlist, made testable:

1. Boot: player living hull still swims, breathes, and beats at idle. Vein skin present.
2. Beautiful origin: still living light; faction still not forced Beautiful; bond/hunger/livingRock still apply.
3. Beautiful yard buy: hangar gains a `hullKind: 'living'` row; mounted starter stays mounted and living.
4. Remount a living row: `makeLivingHull` path, not plated.
5. Graft (when PR3 lands): Gilded only; warning visible; confirm writes `grafted` and Beautiful standing ≤ −10; HUD `mech`; mesh not `makeLivingHull`. Restore of a grafted row also caps Beautiful standing (ownership invariant).
6. Cancel graft: no standing change, no `grafted`.
7. Unknowables row cannot be grafted; `hullKind` stays `'living'`.
8. No living frigate in Beautiful/Unknowables `listYardOffers`.
9. HUD never assigns `player.hullKind`.
10. Boot BIO section PASS. Glance HUD geometry unchanged.

---

## Open owner questions

Defaults in the contract §14 stand unless the owner overrides.

1. Graft list price (authored UU).
2. Destroy-Abomination Beautiful standing delta.
3. Sworn gift in first impl vs deferred.
4. Pirate seed rate and signal.
5. Whether a living frigate buy SKU ever exists.
