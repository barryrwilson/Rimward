# RIMWARD TGT-03 remaining situational awareness

| Field | Value |
|---|---|
| **Title** | RIMWARD TGT-03 remaining situational awareness |
| **Author** | Wave 97 TGT-03 awareness integrator |
| **Date** | 2026-08-23 |
| **Status** | Wave 98 first impl landed |
| **Wave** | 98 — first impl landed (PR1–PR4 as one change). Remaining radar is a sibling (`docs/Tgt03RadarDesign.md` may not exist yet). |
| **Owner request** | Remaining TGT-03 after the scanner-gated bearing arc: off-screen directional cue for the **current lock**, and attacker-is-firing warning on an **existing** off-column channel (cannon/dart/psionic), distinct from `Incoming dart.` Inventory live code first. Do not add radar, subsystem targeting, lead, MATCH, or a missile gauge. |
| **Merge law** | [`out/w97/tgt03/shared-contract.md`](../out/w97/tgt03/shared-contract.md). If this brief and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty 80 px hub. FORE/AFT on `playerHit`. NAV-02 `.rw-nav-gate-cue`. TGT-05 `lockKind` + cone 12 px. NPC missiles pirate+ace toast+song pool 4. **Do not edit** those docs. Code wins where the wishlist still lists off-screen arrows as absent. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w97/tgt03/current-tgt03-inventory.md`](../out/w97/tgt03/current-tgt03-inventory.md) |
| Merge law | [`out/w97/tgt03/shared-contract.md`](../out/w97/tgt03/shared-contract.md) |
| Security review | [`out/w97/tgt03/security-review.md`](../out/w97/tgt03/security-review.md) |
| Design-doc review | [`out/w97/tgt03/code-review.md`](../out/w97/tgt03/code-review.md) |
| UI audit | [`out/w97/tgt03/ui-audit.md`](../out/w97/tgt03/ui-audit.md) |

Siblings NPC turrets and BIO-05 are **other workers**. **Do not edit** `docs/NpcTurretsDesign.md`, `docs/OwnerDecisionsWave97.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/Hud02IdentitiesDesign.md`, `docs/Bio*.md`, `docs/Shp*.md`, the wishlist, or `PROGRESS.md`. Those sibling files need not exist for this brief to stand.

---

## Overview

TGT-03 already shipped the scanner-gated thin bottom bearing arc (`.rw-contacts`). Wishlist leftover names still include radar, off-screen arrows, attacker warnings, missile warnings, subsystem targeting, and improved lead. **This brief owns only two leftovers.**

Live code already paints an amber **current-lock** edge triangle (`.rw-edge-arrow`) when the lock is off-glass or behind the camera, including TGT-05 `lockKind` wrappers. NAV-02 already paints a **different** chevron (`.rw-nav-gate-cue`) for the routed gate. NPC darts already toast `Incoming dart.` FORE/AFT already flashes on hull hits.

What is still missing is a **cannon-vs-player firing** line on the existing toast channel, distinct from the dart line, without a second glass widget. The lock arrow needs **reuse + park/a11y polish**, not a new instrument.

This brief is the integrator document for a **later** implementation wave. Wave 97 lands this markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. No lock box. No incoming gauge. `state.js` stays READ-ONLY. No new SKU. No new `WORLD_FIELDS` key. Digit 0 stays shipyard. Digit 8/9 stay papers. Do not invent UU or standing deltas.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w97/tgt03/current-tgt03-inventory.md`](../out/w97/tgt03/current-tgt03-inventory.md). Code wins over stale wishlist TGT-03 remaining bullets.

| Surface | Today | Cite |
|---|---|---|
| Contacts arc | Scanner-gated `.rw-contacts`. Mk I bubble / Mk II 2× + lock glyph | `hud.js` 52–56, 1365–1372 |
| Lock off-screen | **LIVE** `.rw-edge-arrow`. Ship / rock / station / gate / pod / landmark | `hud.js` 732, 1197–1305 |
| Behind camera | `proj.z > 1` NDC flip | `hud.js` 1249–1250 |
| NAV-02 cue | **LIVE** `.rw-nav-gate-cue`. Park docked/jumping | `hud.js` 733–737, 1563–1624; `hud.css` 1001–1037 |
| Cone / kinds | `LOCK_CONE_PX` 12; `lockKind` allowlist | `reticle-aim.js` 15, 279–310 |
| KeyT / KeyV | Cycle / reticle lock. Do not steal | `controls.js` 265–266, 280–281 |
| FORE / AFT | Flash on `playerHit.fromAft` 0.4 s. Not a toast | `hud.js` 1122–1124, 1343–1362 |
| Dart toast | `Incoming dart.` on `npcFire` missile+player, 2.5 s gap | `hud.js` 61–62, 567–571 |
| Cannon toast | **Absent** (`npcFire` returns unless missile+player) | `hud.js` 567–568 |
| Ace cannon emit | `weapon:'cannon'` **no target**; combat vsPlayer | `npc.js` 1923; `combat.js` 1788 |
| Hunt cannon emit | `target: ai.target` (player **or** live ship) | `npc.js` 1547 |
| NPC dart | pirate+ace, one after telegraph, pool 4, vsPlayer | `npc.js` 1093–1099; `combat.js` 173 |
| NPC psionic | **Refused** in `spawnNpcShot` | `combat.js` 1302 |
| Telegraph | 3 s glow + `commLine` before first shot | `npc.js` 88, 1526–1537 |
| Toasts | Off column. `textContent`. 5 slots | `hud.js` 758–765, 1085–1104 |
| Empty hub | 80 px | `hud.js` 1184–1186 |
| Persist | No awareness `WORLD_FIELDS` key | `save.js` 76–101 |
| Digit 0 | Shipyard | `station.js` 186, 5920–5922 |
| Digit 8/9 | Launch/Standing; outfit launcher/turret | `station.js` 1622–1702 |
| `innerHTML` | **none** in `hud.js` | grep 0 |

The player can already find a lock that left the glass. The player still has no off-column **firing** line for cannon (only a dart toast, a song bark, and a FORE/AFT flash **after** a hit).

### Pain points

- Wishlist TGT-03 still lists off-screen arrows as remaining. A naive later PR that “adds arrows” would double-paint `.rw-edge-arrow` or steal `.rw-nav-gate-cue`.
- Reusing the gate chevron for a lock would mix **route** with **target**.
- A firing pip on the 80 px hub would reopen HUD-01 / HUD-02.
- Flashing FORE/AFT on `npcFire` would lie: that glance is **hit facet**, not muzzle.
- Toast on every cannon shot (~3 Hz) would smash the 5-slot channel.
- A toast that requires `target === 'player'` would miss **ace** cannon (omitted target) and might false-positive if someone later defaulted missile target.
- Interpolating the attacker name would put record strings into HUD (XSS / flood).
- NPC psionic does not exist. Inventing it here would fight Digit 5 / BIO-04.
- Incoming-missile **gauge** is closed. Do not reopen Q1/Q2 to “fix” awareness.

### Why now (design) / why not now (code)

The owner asked for the remaining TGT-03 awareness brief after the bearing arc shipped. Inventory and merge law can exist without touching `hud.js`. Implementation waits so class steal, FORE/AFT duplication, dart-copy collision, Digit theft, and persist keys are frozen before the first toast branch changes. Wave 97 does not ship `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live lock edge arrow, NAV-02 cue, contacts arc, dart toast, FORE/AFT, `npcFire` matrix, Digit 0/8/9, and persist from **live code**.
2. Freeze **reuse** of `.rw-edge-arrow` for the current lock. Distinct from `.rw-nav-gate-cue`. Both may show.
3. Freeze attacker-is-firing as toast `Incoming fire.` on cannon-vs-player (including ace omit). Distinct from `Incoming dart.`
4. Freeze fail-closed: no lock → no arrow; NPC-vs-NPC → no fire toast; unknown weapon → no toast; docked/jumping → park / no fire toast.
5. Freeze no new SKU, no `state.js` write, no `WORLD_FIELDS` key, no `innerHTML`, no glass gauge.
6. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 97.
- No radar scope / new scanner SKU / TGT-03 upgrade ladder change.
- No subsystem targeting. No improved lead (TGT-01 DONE). No MATCH (TGT-02 DONE).
- No incoming-missile **gauge** on the aim glass. NPC missiles stay Wave 83 toast+song.
- No NAV-02 next-gate redesign. Do not reuse `.rw-nav-gate-cue` for lock.
- No KeyT / KeyV steal. No cone rewrite. No Digit 0/8/9 steal.
- No power ledger / aim-glass pip (Wave 93/94 out).
- No BIO-05. No NPC turrets (siblings). No NPC psionic emit.
- No UU or standing deltas. No `state.js` weapon retune.
- Do not edit the wishlist, `PROGRESS.md`, or sibling design files.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No** | Live lock + events; inventory: none required |
| New SKU / `state.js`? | **No** | Reuse lock + toast |
| Lock CSS class? | Keep `.rw-edge-arrow` | Already distinct from NAV-02 |
| Gate CSS class? | Keep `.rw-nav-gate-cue` | Do not steal |
| Both off-screen? | **Both may show** | Different jobs |
| Word on lock arrow? | **No** | Shape + rotation; name is on bracket |
| Scanner-gate lock arrow? | **No** | Core (HUD-02) |
| Park lock arrow docked/jump? | **Yes** (later polish) | Match NAV-02; do not clear lock |
| Firing channel? | Existing toast | HUD-01 closed; dart precedent |
| Firing copy? | `Incoming fire.` | Static; ≠ `Incoming dart.` |
| Dart copy? | Keep `Incoming dart.` | Q2 closed |
| Ace cannon omit target? | Treat as vs player | `combat.js` 1788 |
| Hunt cannon at a trader? | **No toast** | Not vs player |
| Unknown `npcFire.weapon`? | **No toast** | Do not copy `spawnNpcShot` cannon default |
| Missile missing target? | **No dart toast** | Combat drops the shot |
| Throttle? | 2.5 s, separate from dart clock | `npc.js` ~0.33 s cadence |
| FORE/AFT on fire? | **No** | Hit-only |
| New `ctx.emit` type? | **No** | Consume `npcFire` |
| NPC psionic? | **Do not emit** | `spawnNpcShot` refuses |
| `innerHTML`? | **No** | `textContent` / `el()` / `h()` |
| HUD-01 hub? | Closed | Empty 80 px; no gauge |
| Digit 0 / 8 / 9? | Untouched | Shipyard / papers |
| KeyT / KeyV? | Untouched | Cycle / reticle lock |
| WAVE4 / WAVE26 / WAVE35? | Do not “fix” | Orchestrator law |

### 2. Player outcome

Lock a ship, rock, station, gate, pod, or landmark with KeyV (or cycle a ship with KeyT). If that lock leaves the glass or sits behind the camera, an amber triangle on the screen edge points toward it. If a plotted next gate is also off-screen, the **gate chevron** still shows; it does not replace the lock triangle. If a pirate or ace fires **cannon** at the player, a toast reads `Incoming fire.` If they fire a **dart**, the toast still reads `Incoming dart.` Hits still flash FORE or AFT. The aim glass stays empty.

### 3. Off-screen lock cue

See contract §1.

Read `ctx.targets.current` only. Reuse live `lockOk` + project + behind flip + `EDGE_MARGIN`. Fail-closed if no lock.

Later polish: `aria-hidden="true"`; hide while docked or jumping; no `@keyframes`. Color uses `--amber` so `body.rw-colorblind` / `body.rw-contrast` already remap. Do not add a glance node on the hub.

Do not point at unlocked hostiles (contacts arc already does, scanner-gated).

### 4. Attacker-is-firing

See contract §3.

Extend `toastForEvent` `'npcFire'`:

```
missile + target player     → Incoming dart.   (keep)
cannon  + target player     → Incoming fire.
cannon  + target omitted    → Incoming fire.
cannon  + live ship         → null
unknown / missing weapon    → null  (do not default to cannon)
```

`pushToast(text, 'warn')`. Separate 2.5 s memo from the dart gap. Suppress while docked or jumping. No ship names. No FORE/AFT write. No new song.

Psionic: not a live NPC weapon. If a later sibling emits `npcFire` `{ weapon:'psionic', target:'player' }`, reuse `Incoming fire.` Do not add `Incoming psionic.`

### 5. Security / emit / persist

See contract §5.

No `WORLD_FIELDS` key. No `ctx.emit` addition. No `innerHTML`. No proto merge. Toast payload is two static strings. HUD compares `e.weapon === 'cannon'|'missile'` only; it does not index `WEAPONS[e.weapon]`.

### 6. Closed HUD / lock / digits

- Do not write `ctx.targets.current` except via existing KeyT/KeyV.
- Do not change HUD-01 rails, MATCH, lead, RANGE, contacts math, chart marks, power pips.
- Digit 0 shipyard. Digit 8/9 papers. Weapon 1–5 stay.
- Cone 12 px stays.

---

## Ownership (later impl)

See contract §7.

Prefer a tiny `npcFireToast` helper so PR1 pins do not need jsdom. `hud.js` owns DOM. `npc.js` / `combat.js` / `reticle-aim.js` / `state.js` / `save.js` stay untouched unless a sibling turret serial emits cannon `npcFire` (toast law still applies).

---

## Serial PR plan (later wave — named only)

Do **not** land these in Wave 97. See contract §8.

1. **PR1** `npcFireToast` pins (no UI).
2. **PR2** Cannon-vs-player toast + throttle + dock/jump suppress; dart unchanged.
3. **PR3** Lock cue aria + park; both cues may show; no class steal.
4. **PR4** Boot / reduced-motion / contrast; FORE/AFT still hit-only.

---

## Open owner questions

Defaults are in the contract. Do not invent SKUs while waiting.

1. **Rename `.rw-edge-arrow` to a lock-specific class?** Live class is already not the gate cue.  
   **Default: keep.**

2. **Print a LOCK word on the edge glyph?**  
   **Default: no.** Bracket/rail already name the lock when on-glass.

3. **Scanner-gate `Incoming fire.`?**  
   **Default: no.** Core, like `Incoming dart.`

4. **Use `commLine` instead of toast?**  
   **Default: no.** Dart Q2 was toast+song.

5. **NPC psionic fire this serial?**  
   **Default: no.** Combat refuses it.

Do not treat class steal, glass gauge, Digit theft, `innerHTML`, a second persist key, or FORE/AFT-on-muzzle as open.

---

## Risks (wishlist regressions)

| Risk | Freeze |
|---|---|
| Second lock arrow | Reuse `.rw-edge-arrow` only |
| Gate cue stolen | Class stay `.rw-nav-gate-cue` |
| Both off-screen collide in meaning | Different glyphs; both may show |
| Aim-glass gauge | Toast only; hub stays empty |
| FORE/AFT lies on miss | Flash stays `playerHit` |
| Dart and cannon same copy | `Incoming dart.` vs `Incoming fire.` |
| Toast flood | 2.5 s fire gap, separate memo |
| Ace silent | Omitted cannon target counts |
| Trader duel toasts the player | Live ship `target` → no toast |
| XSS names | Static literals; `textContent` |
| Digit 0/8/9 steal | Untouched |
| KeyV cone change | Read lock only |
| New SKU | Forbidden |
| Radar of all hostiles | Out; contacts arc already exists |
| WAVE4 / ferry / haul boot | Do not touch |

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. With a current lock off-glass or behind the camera, `.rw-edge-arrow` points toward it. No lock → hidden.
2. `.rw-nav-gate-cue` never receives lock duty. A plotted off-screen gate still uses that class. Both cues may be visible together.
3. KeyV cone stays 12 px. KeyT still cycles ships (rocks in group 3). Digit 0/8/9 unchanged.
4. `npcFire` missile+player still toasts **only** `Incoming dart.`
5. `npcFire` cannon vs player (explicit or ace omit) toasts `Incoming fire.` not more often than ~2.5 s. NPC-vs-NPC cannon does not toast.
6. FORE/AFT still flashes only on `playerHit`. The hub stays empty. No innerHTML.
7. Docked or jumping: lock arrow parked; no firing toast.
8. Reduced motion: no new lock `@keyframes`. Contrast/colorblind CSS vars still color the triangle.

---

## References

- [`out/w97/tgt03/shared-contract.md`](../out/w97/tgt03/shared-contract.md)
- [`out/w97/tgt03/current-tgt03-inventory.md`](../out/w97/tgt03/current-tgt03-inventory.md)
- [`docs/Hud02IdentitiesDesign.md`](Hud02IdentitiesDesign.md) (edge arrow already core; do not edit)
- [`docs/Nav02GuidanceDesign.md`](Nav02GuidanceDesign.md) (gate cue; do not edit)
- [`docs/NpcMissilesDesign.md`](NpcMissilesDesign.md) (dart toast; do not edit)
- [`docs/Tgt05LockCatsDesign.md`](Tgt05LockCatsDesign.md) (`lockKind`; do not edit)
