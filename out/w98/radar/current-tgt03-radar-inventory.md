# Wave 98 TGT-03 remaining radar inventory

**Wave:** 98. Design only. No `src/` in this worker.  
**Rule:** Code wins over stale comments, over wishlist TGT-03 “radar” as if a PPI disc were missing, and over Wave 97 `out/w97/tgt03/current-tgt03-inventory.md` (that pack **out-scoped** radar; its line numbers may also have drifted). Cites are live file:line as of this inventory.  
**Scope:** scanner-gated nearby-traffic picture. Prove reuse of `.rw-contacts` or prove a new class. Default: **reuse**.  
**Not inventory of:** subsystem targeting, improved lead (TGT-01), MATCH (TGT-02), incoming-missile **gauge**, NAV-02 next-gate law, KeyT/KeyV pick math, Digit 0/8/9 papers, power ledger / aim-glass pip, BIO-05, NPC turrets, Wave 97 lock-arrow polish, sibling `Incoming fire.` toast.

---

## 0. One-line result

**Radar is already live.** It is the scanner-gated thin bottom bearing arc (`.rw-contacts`). Tier 0 has no arc. Mk I uses `U.ENCOUNTER_BUBBLE`. Mk II uses 2× bubble + lock closure glyph. Shape is friend/foe. It is **not** a reticle ring and **not** a hub PPI. Off-screen lock is `.rw-edge-arrow`. Routed gate is `.rw-nav-gate-cue`. Do **not** add a second traffic picture, a new radar SKU, or a persist key. `ctx.world.contacts` is the **station NPC roster**, not the HUD arc.

---

## 1. Files read

| File | Why |
|---|---|
| `src/systems/hud.js` | Contacts arc, edge arrow, gate cue, toasts, FORE/AFT, empty hub |
| `src/game/npc-fire-toast.js` | Sibling `Incoming fire.` / `Incoming dart.` matrix (do not rewrite) |
| `src/ui/hud.css` | `.rw-contacts`, pips, enter keyframes, `.rw-edge-arrow`, `.rw-nav-gate-cue`, contrast / colorblind / reduced-motion |
| `src/systems/nav-guidance.js` | NAV-02 readout helper; does not paint contacts |
| `src/game/reticle-aim.js` | `LOCK_CONE_PX = 12`; `lockKind` wrappers |
| `src/systems/controls.js` | KeyT cycle, KeyV reticle lock |
| `src/game/state.js` | `U.ENCOUNTER_BUBBLE`; class `scanner` slot counts (READ-ONLY) |
| `src/game/save.js` | `WORLD_FIELDS` has `scanner` **and** NPC `contacts` |
| `src/game/hangar.js` | `healScanner` 0/1/2; mounted gear write-through |
| `src/core/ctx.js` | `world.contacts` = station NPCs; `hostileEnter` / `hudMechContact` |
| `src/game/contacts.js` | Named station NPC roster on `ctx.world.contacts` |
| `src/systems/station.js` | Digit 0 shipyard; Digit 8/9 papers; outfitting Digit 2/4 Wolfeye |
| `src/systems/settings.js` | `rimward-settings-v1`; `reducedMotion` |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | TGT-03 remaining list still names “radar” (read only) |
| `docs/Hud02IdentitiesDesign.md` | Contacts arc already named as scanner-gated (do not edit) |
| `docs/HudUtilityChangeProposal.md` | Wave F locked thin bottom arc vs FreeSpace disc (do not edit) |
| `out/w97/tgt03/current-tgt03-inventory.md` | Stale for this leftover (radar was out) |

Grep `innerHTML` in `src/systems/hud.js`: **0 hits**.  
Grep `Incoming fire.` : **LIVE** in `src/game/npc-fire-toast.js` (sibling Wave 98 awareness). Radar must not steal or rewrite that copy.  
Grep `is-aft` CSS in `src/ui/hud.css`: **0 hits** (JS toggles the class; yaw already maps aft to arc center).

---

## 2. HUD-01 / HUD-02 glass (closed)

| Surface | Today | Cite |
|---|---|---|
| Empty hub | 80 px clamp `cx - 44` | `hud.js` 1194 |
| No lock box | Target is rails + bracket, not a hub card | HUD-01 / HUD-02 |
| FORE / AFT | Words + fill vs hollow. `playerHit.fromAft` flashes 0.4 s | `hud.js` 325–351, 1091–1092, 1131–1133, 1357–1377 |
| Lead / RANGE / MATCH | Core. Not this brief | TGT-01 / TGT-02 DONE |
| Contacts arc | Scanner-gated thin bottom arc `.rw-contacts` | `hud.js` 53–56, 791–813, 1379–1531 |
| Chart marks | `.rw-chartmark`; edge-clamp; hide docked | `hud.js` 743–760, 1533–1573 |
| Context prompt | `.rw-prompt` `bottom: 20%` — above the arc | `hud.css` 741–745 |
| HUD family | Reads `hullKind`; **never writes** it | `hud.js` 76–85 |

No PPI disc. No radar pip on the hub. Wave F comment in `hud.js` 52–56 already says the arc is not a reticle ring.

---

## 3. Nearby-traffic picture — LIVE as `.rw-contacts`

| Surface | Today | Cite |
|---|---|---|
| Node | `el('div', 'rw-contacts is-hidden', root)` | `hud.js` 791–792 |
| Aria | `aria-hidden="true"` on wrap + SVG | `hud.js` 793, 797 |
| Stroke | SVG path, fill none, viewBox `0 0 400 72` | `hud.js` 794–803; `hud.css` 787–809 |
| Layout | `left: 50%; bottom: 5.5%; width: min(400px, 46vw); height: 72px` | `hud.css` 787–795 |
| Pool | 24 pip slots created once | `hud.js` 68, 804–813 |
| Candidates | Scratch 48; sort lock > hostile > nearer | `hud.js` 70, 1406–1418, 1420–1433 |
| Who | Live `ctx.ships` except self and destroyed | `hud.js` 1404–1418 |
| Not on arc | Rocks, stations, gates, pods, landmarks, missiles, chart marks | same loop — ships only |
| Hostile | `live.ai && live.ai.intent` → chevron | `hud.js` 1416, 354–357, `hud.css` 832–840 |
| Civilian | tick (`is-civ`) | `hud.css` 825–830 |
| Lock pip | hollow diamond (`is-lock`) | `hud.css` 842–849 |
| Kind helper | lock wins over hostile | `hud.js` 354–357 |
| Geometry | Ship yaw → `u` in [-1,1]; forward at **ends**; aft at center | `hud.js` 176–178, 1450–1457 |
| Elevation | `contactRel.y / 40` clamped | `hud.js` 1455, 73 |
| Cap Mk I | 16 | `hud.js` 69, 1401 |
| Cap Mk II | 24 (`CONTACT_SLOTS`) | `hud.js` 68, 1401 |
| Range Mk I | `U.ENCOUNTER_BUBBLE` (800) | `hud.js` 1400; `state.js` 27 |
| Range Mk II | `2 * U.ENCOUNTER_BUBBLE` | `hud.js` 1400 |
| Closure | Mk II lock only: `«` inbound / `»` outbound | `hud.js` 1476–1491 |
| Far dim | Combat + civ + not lock + dist > 0.45× range | `hud.js` 1459, `hud.css` 861 |
| Enter pulse | 0.45 s `is-enter` + `rw-contact-enter` | `hud.js` 71, 1501–1513; `hud.css` 863–870 |
| Mech / bio emit | `hudMechContact` / `hostileEnter` (bio ≤1 / 0.5 s) | `hud.js` 1502–1508; `ctx.js` 249–250 |
| Docked | **Hide** (`showArc` requires `!ctx.flags.docked`) | `hud.js` 1383–1387 |
| Jumping | **Does not park.** `showArc` ignores `ctx.gate.jumping` | `hud.js` 1383 vs NAV-02 `hud.js` 1577 |
| Scanner 0 | No arc. Core DIST / edge / lead / MATCH stay | `hud.js` 1379–1383 |
| Pointer | `pointer-events: none` | `hud.css` 794 |

Wishlist TGT-03 still lists “radar” as remaining (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 391). **Code wins:** the nearby-traffic picture **is** this arc. HUD-02 already names it. The Wave F proposal already rejected a FreeSpace green disc.

---

## 4. Scanner ladder — LIVE, persist already exists

| Surface | Today | Cite |
|---|---|---|
| Ladder | 0 / 1 / 2 only | `hangar.js` 44–46; `save.js` 1079–1082 |
| Mk I buy | Outfitting Digit **2**, `SCANNER_COST` 400 UU | `station.js` 200, 4384–4390, 5347–5350 |
| Mk II buy | Outfitting Digit **4**, needs Mk I, `SCANNER2_COST` 900 UU | `station.js` 201, 4392–4399, 5361–5366 |
| Write | `writeMountedGear(ctx, { scanner })` — hangar row + world mirror | `hangar.js` 494–496; `station.js` 4388, 4397 |
| Restore heal | Unknown / `'2'` / 99 → **0** | `save.js` 1079–1082 |
| Default | `ctx.world.scanner ??= 0` at dock overlay | `station.js` 4239 |
| Starter | Hangar starter copies `scanner` onto world | `hangar.js` 453 |
| `WORLD_FIELDS` | `'scanner'` already listed | `save.js` 79 |
| Mk III | **Absent** | heal allowlist 0/1/2 |

A later “radar SKU” that wrote `scanner: 3` would **heal to 0** on restore. That is proof the ladder is closed unless the owner opens Mk III (default: **no**).

Class tables in `state.js` 67–72 list `scanner: 1` as a **slot count** on hull roles. That is not a HUD SKU. This brief does not retune it.

---

## 5. Do not confuse `world.contacts` with the HUD arc

| Surface | Today | Cite |
|---|---|---|
| `ctx.world.contacts` | Named station NPCs (§12.9). Array of people. | `ctx.js` 162; `contacts.js` 176, 510–544 |
| Persist | `'contacts'` is already in `WORLD_FIELDS` | `save.js` 80 |
| HUD arc | Ephemeral pip pool on `.rw-contacts`. Not saved. | `hud.js` 800–817, 1365–1516 |

A naive later PR that “persists radar contacts” into `world.contacts` would smash the dock people roster. **Fail-closed:** HUD never writes `ctx.world.contacts`. Picture is live `ctx.ships` + `ctx.world.scanner`.

---

## 6. Current-lock off-screen cue — LIVE, must not be stolen

| Surface | Today | Cite |
|---|---|---|
| Node | `el('div', 'rw-edge-arrow is-hidden', root)` | `hud.js` 735 |
| CSS | Amber CSS triangle `::before`; `var(--amber)` | `hud.css` 575–594 |
| Who | Current `ctx.targets.current` when `lockOk` | `hud.js` 1206–1212 |
| Behind camera | `proj.z > 1` flips NDC | `hud.js` 1258–1259 |
| Off-glass | Hide bracket + lead; show arrow; `EDGE_MARGIN = 84` | `hud.js` 65, 1299–1318 |
| Scanner | **Not gated.** Core | `hud.js` 1379–1380 |
| Docked / jump | **Parks** (`lockPark`). Does not clear lock | `hud.js` 1303–1306 |
| Aria | `aria-hidden="true"` (sibling awareness polish **LIVE**) | `hud.js` 736 |
| Keyframes | **None** on `.rw-edge-arrow` | `hud.css` 575–594 |

This is **one current lock**, not nearby traffic. Sibling Wave 98 awareness owns this class (aria + park already live). Radar must not restyle it.

---

## 7. NAV-02 gate cue — LIVE, must not be stolen

| Surface | Today | Cite |
|---|---|---|
| Class | `.rw-nav-gate-cue` + ticks + notch | `hud.css` 1001–1037; `hud.js` 737–741 |
| When | Plotted next-gate pos, not docked, not jumping, **off-glass** | `hud.js` 1575–1633 |
| Math | Same NDC flip + `EDGE_MARGIN` as lock arrow | `hud.js` 1609–1633 |
| Park | `navPark = docked \|\| jumping` | `hud.js` 1577 |

Three jobs, three classes. Contacts = traffic (scanner). Edge arrow = current lock (core). Gate cue = plotted hop (NAV-02). Do **not** merge.

---

## 8. Toast channel (sibling / shipped; radar does not own)

| Surface | Today | Cite |
|---|---|---|
| `.rw-toasts` | Top-right, off column. `role="status"` `aria-live="polite"`. 5 slots. `textContent` | `hud.js` 763–770, 1094–1113 |
| Dart | `Incoming dart.` missile+player, 2.5 s | `hud.js` 62; `npc-fire-toast.js` 7, 46–50 |
| Cannon toast | **LIVE** `Incoming fire.` via `npcFireToast` (sibling Wave 98) | `hud.js` 14, 568–573; `npc-fire-toast.js` 8, 53–58 |
| FORE/AFT | Hit-only `playerHit` | `hud.js` 1131–1133 |

Radar later serial does **not** add a toast, a missile warning gauge, or FORE/AFT-on-muzzle.

---

## 9. TGT-05 lock (read only)

| Surface | Today | Cite |
|---|---|---|
| Cone | `LOCK_CONE_PX = 12` | `reticle-aim.js` 15, 321 |
| KeyV | `pendingReticleLock` | `controls.js` 280–281 |
| KeyT | Cycle ships; rocks in group 3 | `controls.js` 55–83, 265–266 |
| Allowlist | `station` `gate` `pod` `landmark` | `controls.js` 90–94; `reticle-aim.js` 279–310 |

Radar **reads** live ships for pips. It does **not** set `targets.current`. Lock pip on the arc is a **mark** on an already-locked ship, not a pick control.

---

## 10. Digits, persist, DOM law

| Surface | Today | Cite |
|---|---|---|
| Digit 0 dock | Shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 186, 5918–5922 |
| Digit 8/9 dock | Launch / Standing at level-1 | `station.js` 1622–1623 |
| Digit 8/9 outfit | Player launcher / turret papers | `station.js` 1699–1702 |
| Outfitting 1 | Hold rack | `station.js` 5341–5345 |
| Outfitting 2 | **Wolfeye Mk I** (the radar buy) | `station.js` 5347–5350 |
| Outfitting 3 | Concealed mounts | `station.js` 5353–5357 |
| Outfitting 4 | **Wolfeye Mk II** | `station.js` 5361–5366 |
| `WORLD_FIELDS` | `scanner`, `contacts` (NPC), `nav`, … **no radar key** | `save.js` 76–101 |
| Settings | `rimward-settings-v1` only | `settings.js` 7, 23 |
| `el()` | `textContent` | `hud.js` 240–245 |
| `innerHTML` | Forbidden; **0** in `hud.js` | grep |
| `state.js` | `U` / `WEAPONS` / class slots — **READ-ONLY this wave** | orchestrator law |
| Reduced motion | `body.rw-reduced-motion` kills `#hud *` animation | `hud.css` 1173–1177; `settings.js` 69 |
| Contact enter | Extra `animation: none` under reduced motion | `hud.css` 872–874 |
| Colorblind | `--rw-warn` → Okabe-Ito `#E69F00`; `--amber` aliases it | `hud.css` 23, 1134–1138 |

---

## 11. Pain points (honest)

1. Wishlist TGT-03 still names “radar.” A naive later PR that **adds** a PPI disc, a hub pip, or a second `.rw-radar` class would double-paint Wave F.
2. `WORLD_FIELDS` already has `'contacts'` for **people**. Reusing that key for pips would destroy the roster.
3. Contacts hide docked but **not** while jumping. Lock arrow and NAV-02 now park on jump (sibling). Easy later over-scope: restyle the arc into a disc “because jump looks odd” instead of hiding it.
4. Pip `shipId` is internal slot state. Printing `record.name` on a pip would put save strings on the HUD.
5. `is-aft` has **no** CSS. Yaw mapping already puts aft in the arc bowl. Do not invent a second aft glyph as “radar.”
6. Enter pulse already has `@keyframes rw-contact-enter`. A later “radar sweep” animation would fight reduced-motion law.
7. Mk III / new SKU would desync `healScanner` (unknown → 0).
8. Putting rocks, gates, or missiles on the arc would duplicate chart marks, the gate cue, or a closed missile gauge.
9. Scanner-ungating the arc would give every starter hull a fake radar and steal the Wolfeye buy.
10. Sibling `Incoming fire.` / shipped `Incoming dart.` are **not** radar copy. Do not retune them here.

---

## 12. What this brief may still freeze (later serial)

**Picture:** reuse `.rw-contacts`. Do not add a class. Do not put a disc on the 80 px hub. Keep scanner gate and live Mk I / Mk II math.

**Optional polish only:** park the arc while jumping (match NAV-02 hide, do not clear scanner). No new `@keyframes`. No pip names.

**Persist:** no new `WORLD_FIELDS` key. Do not write `world.contacts`. Scanner already persists.

---

## 13. Explicitly out

New radar SKU / Mk III. Hub PPI / reticle ring. Second contacts class. Subsystem targeting. Improved lead. MATCH. Missile warning gauge. NAV-02 redesign. Lock-arrow redesign. `Incoming fire.` / `Incoming dart.` copy. KeyT/KeyV steal. Digit 0/8/9. Outfitting Digit 2/4 steal or extra radar Digit. Power ledger / aim-glass pip. BIO-05. NPC turrets (sibling). WAVE4 fence / WAVE26 ferry / WAVE35 haul boot FAILs.
