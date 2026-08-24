# TGT-03 remaining target closure-rate shared contract

**Wave:** 101. Design only. No TGT-03 closure-rate feature ships in this wave.  
**Status:** MERGE LAW for `docs/Tgt03ClosureDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt03AwarenessDesign.md`, `docs/Tgt03RadarDesign.md`, `docs/Tgt03SubsystemDesign.md`, `docs/Tgt05*.md`, `docs/Nav*.md`, `docs/NpcMissilesDesign.md`, `docs/NpcTurretsDesign.md`, `docs/Hud*.md`, `docs/HudUtilityChangeProposal.md`, `docs/Shp*.md`, `docs/Bio*.md`, `docs/OwnerDecisions*.md`, `docs/Bio02CareerDesign.md`. Do not write sibling `out/w101` packs owned by vsNPC turret or career workers.  
**Locked sources:** wishlist TGT-03 leftover (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~425 “target distance and closure rate”); live inventory `out/w101/closure/current-tgt03-closure-inventory.md` (code wins); `src/systems/hud.js`; `src/ui/hud.css`; `src/core/ctx.js`; `src/systems/controls.js`; `src/game/reticle-aim.js`; `src/game/save.js`; `src/systems/station.js`; `src/game/contacts-gate.js`; `src/game/state.js` (READ-ONLY).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist “target distance and closure rate” as if DIST were missing. **DIST is live.** The remaining aid is a **core tgt-rail LOS rate** next to DIST.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 101 closure worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. Serial PR plan is **named only**.
2. HUD-01 empty **80 px hub**. No closure gauge, pip, tape, or number on the aim glass. No lock box. No incoming gauge. **Do not** put CLOS inside `.rw-reticle` or next to RANGE.
3. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 80–87).
4. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. Inventory does **not** prove a new table. Do **not** invent a closure SKU. Do **not** invent UU.
5. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. Do **not** persist a last rate. Do **not** write HUD into `ctx.world.contacts` (station NPCs).
6. Digit 0 stays **shipyard** at dock level-1 (`station.js` 186, 5920–5922). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** (live array; do not “fix” the Standing comment). Outfitting Digit 8/9 stay player **launcher / turret** papers (`station.js` 1622–1702, 5983–5985). Do not steal Digit 0–9. Do not invent a closure Digit.
7. KeyT stays cycle. KeyV stays reticle lock. KeyX stays MATCH. KeyK stays engine-select. Do not steal those keys. `LOCK_CONE_PX = 12` stays. This serial does **not** rewrite pick math.
8. `innerHTML` forbidden. `textContent` / `h()` / `el()` only. SVG nodes stay `createElementNS` + attributes. CLOS is a number + static unit + optional static «/» chars.
9. Do **not** reopen TGT-01 lead / RANGE, TGT-02 MATCH, TGT-03 radar class (`.rw-contacts` reuse / jump-park sibling), TGT-03 awareness toast, TGT-03 subsystem picker / ENGINE bar law, TGT-05 cone/`lockKind` allowlist, NAV-02 gate cue, HUD-01 empty hub, HUD-02 identities, NPC-missile Q1/Q2, NPC turret vsNPC (sibling), power ledger, aim-glass incoming gauge, BIO-05.
10. Prototype-safe persist: `SAFE_ID`, `RESERVED_IDS`, `hasOwn` / `hasOwnProperty`. No `for-in` merge of a raw blob. Do not index `WEAPONS` / `SYSTEMS` with a rate string.
11. Do not edit sibling Tgt/Nav/Shp/Bio/Hud/Npc docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave101.md`.
12. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
13. Fail-closed: no live ship lock → **hide** the tgt rail (already) or show em-dash on CLOS; **never** copy player SPD or ship scalar SPD into CLOS. Rock / station / gate / pod / landmark → **no** ship LOS rate.
14. Scanner does **not** gate DIST today. Rail CLOS **follows DIST**: core on a live ship lock. Mk II contacts «/» stays scanner-gated on the **arc**. Do not merge those jobs.

---

## 1. DONE — DIST is the distance aid

Inventory §2–§3. Do **not** add a second distance meter.

| Readout | Live owner |
|---|---|
| DIST `N u` | tgt rail; live ship lock |
| Bracket `dist + 'u'` | any `lockOk` on-glass |
| SPD `N u/s` | tgt rail scalar **speed** (not LOS) |
| RANGE pop | hub TGT-01; weapon envelope |

---

## 1.1 Remaining — signed LOS rate on the tgt rail

**Picture (Wave 101 deputize; owner may override after playtest):** reuse `.rw-combat-target` **next to DIST**. One new meter row:

- Label **`CLOS`** via `el()` / `textContent`.
- Value: **one authored format**. Glyph XOR sign — **not both**.
- **Deputize (signed, no rail glyph):** `textContent` is `+N u/s` / `-N u/s` / `0 u/s` after `Math.round` like SPD (`hud.js` 313–316). Recede (`n > 0`) always has ASCII `+`. Approach uses ASCII hyphen-minus from `String(n)`. Zero is `0 u/s` with no sign and no «/».
- **Forbidden strings:** `«-12 u/s`, `«+12 u/s`, `»+12 u/s`, `« 12 u/s` on the **signed** deputize, any «/» plus a `+`/`-`.
- **Glyph-only override (owner only, not deputize):** unsigned magnitude, exclusive live contacts inequalities (`hud.js` 1490–1491): `along < -CONTACT_CLOSE_FLOOR` → `« N u/s`; `along > CONTACT_CLOSE_FLOOR` → `» N u/s`; else no «/» (at `|along| == 4` Mk II shows **no** «/»). Never combine that glyph with a numeric sign.
- Copy live floor **4** (`hud.js` 75). Copy live sign of `along` (`hud.js` 1490–1491): negative `along` = approach (distance decreasing). Copy **exclusive** `<` / `>` for any glyph band. Do **not** invent inclusive inequalities.
- New class on the **rail** only, e.g. `.rw-combat-clos`. **Forbidden:** `.rw-contacts`, `.rw-contact-close`, `.rw-contact-pip`, `.rw-edge-arrow`, `.rw-nav-gate-cue`, `.rw-reticle`, `.rw-lead`.
- Call existing `measureRails()` after the row exists so bio hair-off boxes stay honest (`hud.js` 863–874).

**Not** the 80 px hub. **Not** a lock box. **Not** a second contacts class.

---

## 1.2 Formula (copy live contacts math; do not mint)

Let `relVel = targetVel - ctx.ship.velocity` (already `hud.js` 1285).  
Let `los = targetPos - fromPos`.  
Let `along = relVel · los / |los|` when `|los| > ε`, else 0.  
That `along` is `d(dist)/dt`. Negative = approach.

Reuse the live target-vel estimate (`hud.js` 1245–1256). Do **not** use `targetSpeedNow` (`targetVel.length()`) as CLOS. Do **not** use player `SPD`. Do **not** use `npc.js` `ENVELOPE_CLOSE_RATE = 40` (`npc.js` 112).

Prefer a tiny pure helper `losCloseRate(fromPos, targetPos, relVel)` so PR1 pins do not need jsdom.

---

## 1.3 Visibility / fail-closed

| Condition | CLOS |
|---|---|
| Live ship lock (`shipTgt`) | Show with DIST |
| No lock / destroyed | Rail hidden (already) |
| Rock | Rail hidden. **No** rate on bracket |
| station / gate / pod / landmark | Rail hidden. **No** rate |
| Docked / jumping | Follow DIST (core). Do **not** invent a scanner park that DIST does not use |
| Scanner 0 / 1 / 2 | Rail CLOS still shows on live ship lock |
| Glyph band (Mk II + glyph-only alt) | Exclusive: `along < -4` in, `along > 4` out (`hud.js` 1490–1491). `|along| == 4` → **no** «/» |
| Deputize signed CLOS | Always `+N` / `-N` / `0` `u/s`. No rail «/». No pulse |
| First frame / no vel yet | Em-dash `—` or `0 u/s`. Do not flash a huge hiccup (`dt` already clamped 0.1) |

---

## 2. Picture — four (plus) surfaces stay distinct

| Job | Class | Gate | This serial |
|---|---|---|---|
| Nearby ships | `.rw-contacts` | Scanner ≥ 1, not docked | **Untouched** |
| Mk II lock «/» | `.rw-contact-close` | Scanner ≥ 2 + lock pip | **Untouched** |
| Current lock off-glass | `.rw-edge-arrow` | Core; lockOk; park docked/jump | **Untouched** |
| Next gate off-glass | `.rw-nav-gate-cue` | NAV-02 plot | **Untouched** |
| Lock vitals + DIST | `.rw-combat-target` | Live ship lock | **Add CLOS sibling of DIST** |
| RANGE / lead | `.rw-reticle` / `.rw-lead` | TGT-01 | **Untouched** |

Do not merge.

---

## 3. Controls / digits / cone / SKU

- KeyT / KeyV / KeyX / KeyK / KeyN stay.
- `LOCK_CONE_PX = 12` stays. Do not rewrite `pickReticleLock`.
- Digit 0 shipyard. Digit 8/9 dock + papers stay. Weapon groups 1–5 stay.
- **No** new `TRACKED` key. Closure is a **readout**, not a mode.
- **No** extra Digit.
- **No** SKU. Scanner already gates the **arc** glyph. Rail CLOS is core, like DIST.
- Do not bind CLOS to Digit 0/8/9 or to KeyT/KeyV/KeyK.

---

## 4. Closed — toasts, FORE/AFT, MATCH, lead, radar, subsystem

| Moment | Channel | This serial |
|---|---|---|
| NPC dart vs player | toast `Incoming dart.` | **Do not change** |
| Cannon vs player | toast `Incoming fire.` | **Do not change** |
| Hull hit hemisphere | FORE/AFT on `playerHit` | **Do not change** |
| MATCH | KeyX + lamp | **Out** |
| Lead / RANGE | TGT-01 | **Out** |
| Incoming missile widget | closed | **Out** |
| Radar / `.rw-contacts` | sibling | **Out** |
| ENGINE part / KeyK | Wave 100 | **Out** |

No closure toast. No hub incoming pip. No FORE/AFT-on-rate.

---

## 5. Security / emit / persist

- Rate is live simulation. Do not snapshot it into save.
- No new world field. No `for-in` merge. Scanner heal stays `[0, 1, 2]` else 0 (untouched).
- Do not put ship `record` blobs or faction strings on the CLOS row. Numeric only.
- Do **not** add a new `ctx.emit` type for closure. Do **not** add `ctx.targets.closure`.
- Do not assign `innerHTML` on rails, hub, SVG, or toasts.
- Reserved ids: do not use raw record ids as object keys.
- Q-ship cover names stay on the **name** row with `stripHudText`. CLOS must not concatenate those strings.

---

## 6. Closed HUD / keys / digits / SKU

- 80 px hub stays empty of new children. RANGE stays TGT-01.
- Do not set `ctx.targets.current` except via existing KeyT/KeyV (and live jump/npc clears).
- Digit 0 shipyard. Digits 1–9 station services stay. Weapon groups 1–5 stay.
- Do not steal KeyT / KeyV / KeyX / KeyK / KeyN / Digit 8/9.
- `state.js` stays unread-for-write. Do not add a `closure` or `targetingComputer` gear field.
- No new SKU. Inventory proves Wolfeye already exists **for the arc**. Rail CLOS reuse of that SKU as a **gate** is a lie — DIST is ungated.

---

## 7. Ownership (later impl)

| Piece | Owner |
|---|---|
| LOS rate helper | new tiny pure module **or** `hud.js` local; prefer extract for pins |
| Target-rail CLOS row | `hud.js` (DOM already) |
| Target vel estimate | `hud.js` (already) |
| Player velocity | `ship.js` — **read only** |
| Pick math | **untouched** (`reticle-aim.js` / `controls.js`) |
| `state.js` numbers | **untouched** |
| Persist | **untouched** (`save.js` / `hangar.js`) |
| Digit 0/8/9 | **untouched** (`station.js`) |
| Contacts «/» / jump park | **not this serial** (sibling `.rw-contacts`) |
| ENGINE bar / KeyK | **not this serial** |
| NPC turrets vsNPC | **not this serial** (sibling Wave 101) |

`reducedMotion`: **number stays**. Do **not** add a pulsing animation or new `@keyframes`. `body.rw-reduced-motion` already kills HUD animation (`hud.css` 1181–1184).

---

## 8. Serial PR plan (later wave — named only)

Do **not** land these in Wave 101. Name of later serial: **TGT-03 remaining target closure-rate serial**.

1. **PR1** — pins (no UI, no `state.js` write): `losCloseRate` sign + units; `|los|~0` → 0; copy floor 4 for glyph band; rock/station/gate/pod/landmark **no** ship rate; DIST still ungated by scanner.
2. **PR2** — HUD: `CLOS` meter on `.rw-combat-target` next to DIST; `el()` / `textContent` authored `+N u/s` / `-N u/s` / `0 u/s`; new rail class; `measureRails()`; hide with `shipTgt`; em-dash/0 fail-closed; **no** hub child; **no** `.rw-contact-close` steal; **no** rail «/».
3. **PR3** — a11y / motion / contrast: no new `@keyframes`; reducedMotion keeps the number; color never the only cue (`CLOS` label + `+N`/`-N`/`0` + `u/s`); `innerHTML` still 0; Digit 0/8/9 unchanged.
4. **PR4** — boot: hub 80 px empty; RANGE/lead/MATCH/ENGINE/contacts «/» unchanged; no persist key.

If PR1 pins already match a helper extracted from live contacts math, still ship PR2 — the **rail number** is the missing picture.

---

## 9. Owner questions (Wave 101 deputize — fail-closed)

Do not treat Digit theft, hub gauge, `innerHTML`, new persist key, SKU/UU, or KeyT/KeyV steal as open.

Owner may override after playtest. **Do not park the later serial** for missing owner numbers. Copied live numbers below.

1. **Core vs buy?** **Core.** No SKU. No extra Digit. No persist. Follows DIST.
2. **Picture?** **Tgt rail next to DIST.** Not hub. Not `.rw-contacts`.
3. **Format?** **XOR.** Deputize **signed only:** `CLOS` + `+N u/s` / `-N u/s` / `0 u/s`. **No** rail «/». Never `«-12`. Glyph-only is an owner override and must copy exclusive `along < -4` / `along > 4` (`hud.js` 1490–1491).
4. **Sign?** Copy contacts: negative `along` = approach (`hud.js` 1490–1491). Mk II « = in, » = out stays on the **arc**, not the rail deputize.
5. **Floor?** Copy `CONTACT_CLOSE_FLOOR = 4` (`hud.js` 75). Exclusive `<` / `>` for glyphs. Do not copy NPC `40` (`npc.js` 112).
6. **Non-ship locks?** Hide / no rate. Do not lie with player speed.
7. **Scanner-gate rail CLOS?** **No.**
8. **reducedMotion?** Number stays. No pulse.
9. **New ctx field?** **No.**
10. **Rewrite Mk II contacts glyph?** **No.**
