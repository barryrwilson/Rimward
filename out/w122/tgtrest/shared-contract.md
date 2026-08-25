# TGT remaining leftover shared contract

**Wave:** 122. Design only. No targeting feature ships in this wave.  
**Status:** MERGE LAW for `docs/Tgt06RemainingTgtDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Leftover:** **CONSUME.** Name: **no remaining TGT leftover.** Named TGT-01…TGT-05 slices already live. Wishlist TGT-03 candidate bullets are live instruments or owner omits (PPI, aim-glass gauges, incoming **gauge**, salvage kind). Do **not** invent a later serial that adds a hub PPI, an aim-glass gauge, a second incoming-fire live region, a new Digit, a new persist key, UU, SKU, or kit mutate.  
**Named serial:** **none**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt03*.md`, `docs/Tgt05*.md`, `docs/NpcTurretsDesign.md`, `docs/NpcMissilesDesign.md`, `docs/OwnerDecisions*.md`, Hud/Nav/Rep leftover docs. Do not write `docs/OwnerDecisionsWave122.md`. Do not steal sibling Wave 122 paths `out/w122/navrest/**`, `out/w122/represt/**` (read ok). Do not steal `out/w121/**`, `out/w116/**`, `out/w102/**`, `out/w101/**`, `out/w100/**`, `out/w99/**`, `out/w98/**` (read ok).  
**Locked sources:** live inventory `out/w122/tgtrest/current-tgt-remaining-inventory.md` (code wins); wishlist Initiative TGT (read only); named TGT briefs (cite, do not edit); Owner Wave 98/100/101 (cite).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale wishlist TGT-03 candidate names.

**This leftover is remaining TGT after named TGT slices.** It is **not** HUD-02 class tokens. It is **not** HUD-04 toast flood. It is **not** NAV-07 chart-label. It is **not** overlay mutex. It is **not** a hub PPI. It is **not** an incoming gauge.

**Census:** leftover is **CONSUME**. If a later census finds lead, RANGE, MATCH, `.rw-contacts`, `.rw-edge-arrow`, `Incoming fire.` / `Incoming dart.`, CLOS, KeyK ENGINE, player `auto`, NPC darts, NPC turret vsPlayer/vsNPC, or KeyV `lockKind` **gone**, re-open the **named slice** that died. Do **not** invent TGT-06 PR1 while those surfaces exist.

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Because leftover is **CONSUME**, there is **no** named implementation PR1. Do **not** land remaining-TGT work in `src/` from this pack. Optional later census is named only.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No** radar pip on the hub. **No** PPI disc. **No** incoming gauge. **No** lock box.
3. Digit 0 stays **shipyard** (`station.js` **188**, **6171–6173**). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. Outfit Digit 8/9 stay launcher / turret papers. **No new Digit.** KeyT cycle ships (rocks group 3). KeyV reticle. KeyK engine. KeyX MATCH.
4. `innerHTML` forbidden later. HUD copy uses `textContent` / `el()` only. Live `innerHTML` in `hud.js`: **none**.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. **No** invented UU. **No** invented SKU. Player turret SKU stays `auto`. Scanner stays `world.scanner` 0/1/2.
6. Persist: **no** new `WORLD_FIELDS` key. Lock, CLOS, MATCH, `targets.part` stay **session / live**. Autosave stays `rimward-save-v1`. `contacts` field stays the station people roster — **not** the HUD arc.
7. Fail closed later (if owner re-opens after a **true** missing-instrument census): unknown `lockKind` drop; missing turret target drop; parked jump/dock hide contacts and lock arrow; corrupt scanner heals 0. **Never** freeze the sim. **Never** set `ctx.flags.paused` for targeting leftover.
8. Prototype-safe later helpers: authored `lockKind` allowlist only (`station` / `gate` / `pod` / `landmark`). Authored `npcFire.weapon` tokens only (`cannon` / `missile` / `turret`). Reserved `__proto__` / `constructor` / `prototype` fail closed. No `for-in` merge of a raw lock blob.
9. Do **not** invent a hub PPI, an aim-glass gauge, a second incoming-fire live region, a new Digit, a new persist key, UU, SKU, kit mutate.
10. Do **not** steal HUD-02 `classKeyToken`. Do **not** retune HUD-04 linger 8 s. Do **not** steal NAV-07 labels. Do **not** raise toast z (overlay mutex).
11. Reuse live instruments only: `.rw-contacts`, `.rw-edge-arrow`, tgt-rail DIST/CLOS/ENGINE, MATCH lamp, lead/RANGE, KeyT/V/K/X, toast `Incoming dart.` / `Incoming fire.`
12. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave122.md`.
13. Do not “fix” known boot FAILs (REDMARCH castMatches flake; WAVE4 fence; WAVE26 ferry/haul; WAVE35 haul).
14. Bindings do not change here.
15. `reducedMotion`: live already kills HUD animation (`hud.css` **1186–1189**). Do **not** invent a radar sweep keyframe as leftover.
16. Overlay sibling: later write-set **must not** claim `hail.js` or overlay-policy. **Must not** add a hail toast for targeting leftover.

---

## 0.1 Wave 122 deputize (owner may override after playtest)

Pick playable targeting defaults **only if leftover is real**. Census proves leftover is **not** real. **Do not park. Do not invent work.** Do not invent PPI / gauge / Digit / SKU.

### Live knobs (copy; do not retune as a leftover)

| Knob | Live | Cite |
|---|---|---|
| Cone | 12 px | `reticle-aim.js` **15** |
| Contacts Mk I / II | bubble / 2× + «/» floor 4 u/s | `hud.js` **77**, **1515** |
| CLOS format | `+N` / `-N` / `0 u/s` | `hud.js` **291–296** |
| Toast dart / fire | `Incoming dart.` / `Incoming fire.` gap 2.5 s | `npc-fire-toast.js` **8–11** |
| Engine part | `'engine'` only | `subsys-aim.js` **5** |
| Turret SKU | `auto` | `weapon-fit.js` **47** |
| NPC turret classes | heavy / ace / frigate | `canSeat` |
| Digit 0 | shipyard | `station.js` **6171–6173** |
| Empty hub | 80 px | `hud.css` **184–193** |

### Smallest additive punch

**None.** Named slices already punch.

| Piece | Freeze |
|---|---|
| Verdict | **CONSUME** — no remaining TGT leftover |
| Fail-closed | unknown kind drop; missing turret target drop; scanner 0 hides arc only |
| Additive PR1 | **None.** Do not add PPI. Do not add incoming gauge. Do not add salvage kind. |
| Not a leftover PR | HUD-02 tokens; HUD-04 linger; NAV-07; overlay; kit mutate |
| Persist | existing `scanner` / hangar `turret` only |
| Serial | **none** |

Owner freeze (do not invert):

- Do **not** invent remaining TGT work while named slices exist.
- First remaining serial (if owner re-opens after a true missing-instrument census) must **not** steal Digit 0/8/9, KeyT/V/K/X, must **not** write `state.js`, must **not** add a hub child.
- If CLOS is `0 u/s` on a rock lock, that is fail-closed non-ship. **Never** persist rate.
- **Never** freeze the sim.

### Formulas (later impl; named only — **do not implement**; leftover CONSUME)

```
// LIVE today — consume. Do not add a second picture.
contactsGate(scanner, docked, jumping) === scanner in {1,2} && !docked && !jumping
formatClosRate(along) → '+N u/s' | '-N u/s' | '0 u/s'
LOCK_CONE_PX = 12
npcFireToast missile+player → Incoming dart.
npcFireToast cannon player|omit | turret+player → Incoming fire.
```

Do **not** persist CLOS, MATCH, `targets.part`, or contacts pips into `WORLD_FIELDS`.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| Invent REAL leftover despite LIVE named slices | **Forbidden** — CONSUME |
| Hub PPI / radar pip | **Forbidden** §0.2 |
| Aim-glass gauge | **Forbidden** §0.2 |
| Incoming gauge / second live region | **Forbidden** §0.2 / §0.10 |
| Salvage / cargo / anomaly `lockKind` | **Forbidden** Wave 82 omit |
| Selectable hull/screen as leftover | **Forbidden** Wave 100 engine only |
| New Digit / Key steal | **Forbidden** §0.3 |
| New persist key / `WORLD_FIELDS` | **Forbidden** §0.6 |
| `state.js` write | **Forbidden** §0.5 |
| Steal HUD-02 `classKeyToken` | **Forbidden** §0.10 |
| Retune HUD-04 8 s / AUTOSAVE HELD | **Forbidden** §0.10 |
| Steal NAV-07 labels | **Forbidden** §0.10 |
| `innerHTML` lock names | **Forbidden** §0.4 |

---

## 1. DONE — named TGT slices (consume)

Inventory §3. Do **not** add a second arc, arrow, toast line, CLOS widget, engine key, turret SKU, or reticle command.

| Slice | Live owner |
|---|---|
| TGT-01 | lead + RANGE on selected weapon |
| TGT-02 | MATCH lamp + KeyX; rock rest-frame |
| TGT-03 arc | `.rw-contacts` scanner-gated |
| TGT-03 awareness | Incoming fire. + lock arrow park |
| TGT-03 radar | reuse `.rw-contacts`; jump park; no PPI |
| TGT-03 CLOS | tgt rail next to DIST |
| TGT-03 subsystem | KeyK engine + ENGINE bar |
| TGT-04 | player `auto`; NPC darts; NPC turret vsPlayer/vsNPC |
| TGT-05 | KeyV + station/gate/pod/landmark cone 12 |

---

## 2. Serial PR plan

| Serial | Exists? |
|---|---|
| **PR1 remaining TGT** | **Does not exist.** CONSUME. Do not invent work. |

Optional later census: if a named slice **disappears** from `src/`, re-open **that named slice**, not a new TGT-06 serial, unless the hole is a **new** player-facing targeting job outside those slices and outside standing omit.

---

## 3. PR-census (if owner re-opens)

Grep only. Do not add a probe this wave.

- `rw-contacts`, `rw-edge-arrow`, `Incoming fire.`, `Incoming dart.`, `CLOS`, `toggleEnginePart`, `LOCK_CONE_PX`, `tryPlayerTurret`, `canNpcTurret`
- PPI / incoming-gauge class still **absent**
- Digit 0 still shipyard

---

## 4. Sibling walls

| Sibling | Wall |
|---|---|
| HUD-02 | `classKeyToken` / `data-class-key` — cite only |
| HUD-04 | toast linger / AUTOSAVE HELD — cite only |
| NAV-07 | chart labels — do not steal |
| CTL-02 | overlay mutex — do not raise z |
| Wave 122 navrest / represt | other workers |

---

## 5. Accessibility (live consume)

- `.rw-contacts` `aria-hidden=true` (bearing picture, not a live region)
- `.rw-edge-arrow` `aria-hidden=true`
- Incoming lines ride `.rw-toasts` `role=status` `aria-live=polite`
- **Do not** add assertive. **Do not** add a second incoming live region as leftover
- Color is not the only cue: MATCH text, RANGE word, CLOS signed number, contact **shape**, FORE/AFT words
