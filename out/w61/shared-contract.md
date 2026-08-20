# HUD-02 shared contract

**Wave:** 61. Design only. No skins ship in this wave.  
**Status:** MERGE LAW for the integrator. Conventional-family and living-family notes must obey this file.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`, or `docs/`.  
**Locked sources:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` (HUD-02 / HUD-03 / TGT), `docs/HudUtilityChangeProposal.md` §6 and Later — HUD-02, `src/systems/hud.js` header + instruments, `src/ui/hud.css`, `src/systems/settings.js`, `src/core/ctx.js`, `src/systems/ship.js`, `src/systems/organic.js` `isBeautiful`, `src/game/origins.js` / `ORIGINS`, `src/game/state.js` `createShipState`, `PROGRESS.md` HUD utility waves A–F closeout.

Integrator rule: if a family note and this file conflict, this file wins.

---

## 0. Law in one page

1. Same glance set. Same places. Same data. Same cadence.
2. Hull decides family. Origin does not. Settings do not.
3. One `#hud` tree. Two skins via `#hud[data-family]`.
4. Living paint must not win a duel.
5. Existing HUD-03 overrides apply to both families. No new settings keys.
6. Family audio is quieter than FX-02 weapons / impact / engine.
7. World strings stay in `textContent`. No new persistence keys.
8. This wave writes briefs only. Implementation is a later serial wave.

---

## 1. Information contract

Both families must present the **shipped glance set** below. Neither family may hide, delay, gate, rename into a private synonym, or move these readouts.

Source of truth: `src/systems/hud.js` init + 5 Hz text path, `src/ui/hud.css` glance geometry, `docs/HudUtilityChangeProposal.md` keep-list.

### 1.1 Must-show glance set (both families)

| Instrument | Where it lives today | Data / rule | Gate |
|---|---|---|---|
| **Screen** | Self rail `.rw-combat-self` + target rail `.rw-combat-target` | Outer shield layer. Thin bar. `makeBar(..., 'SCREEN', 'rw-screen')`. | None. Core ship. |
| **Shell** | Both rails | Inner shield layer. Thick bar. `makeBar(..., 'SHELL', 'rw-shell')`. | None. |
| **Hull petals + LOW/CRIT** | Both rails | 10 petals (`HULL_PETALS`). Flag text `LOW` when frac ≤ 0.5 and > 0.25; `CRIT` when ≤ 0.25; hidden when ok. Color is never the only cue. | None. |
| **SPD** | Both rails | Rounded u/s. Self uses `ctx.ship.speed`. Target uses sampled lock speed. | None. |
| **WPN** | Self rail only | `weaponGroup · name`. Group 3 uses installed `miningLaserFor(ctx.world.miningLaser).name`. | None. |
| **DIST** | Target rail only | Rounded `targetDistNow` + ` u`. Standard HUD-01 readout. | None. Not scanner-gated. |
| **Name** | Target rail `.rw-combat-name` | `record.name` / `state.name` / `CONTACT`. Q-ship uses `coverName` until scanner ≥ 2 pierce. | None. |
| **FORE / AFT** | Both rails (`makeFacing`) | Word + fill vs hollow. Self: lock in player forward/rear hemisphere. No lock → both self ends dim. Lock: player in lock forward/rear. `playerHit.fromAft` flashes AFT. | None. |
| **Lead** | `.rw-lead` + `LEAD` label | Selected-weapon TOF, `relVel = targetVel − playerVel`. Hide for mining group (`wSpeed === 0`) or no live ship lock. Cannon/disruptor on a live on-glass ship always show the mark. If `|relVel| ≤ LEAD_MIN_SPEED` (~6), keep the mark on the hull (no TOF offset). Off-glass or `leadProj` off NDC hides it. Not auto-aim. | None. Core ship (TGT-01). |
| **RANGE** | `.rw-reticle-range` on the hub | Shape + the word `RANGE` when `targetDistNow` is inside selected weapon range. Mining uses installed head range. | None. |
| **MATCH** | **Self** SPD lamp `.rw-match-lamp` only | Visible while `ctx.flags.matchSpeed` and a live ship lock exist. `selfSpeed.set(ctx.ship.speed, !!(ctx.flags.matchSpeed && shipTgt))`. Target rail calls `tgtSpeed.set(targetSpeedNow)` with no lamp. `ship.js` owns the flag and must not write `ctx.input.throttle`. | None. Core ship (TGT-02). |
| **Contacts arc** | `.rw-contacts` bottom bearing arc | Thin stroke. Friend/foe by **shape** (tick / chevron / hollow diamond). Not a reticle ring. Hidden while docked. | **Scanner-gated.** `ctx.world.scanner` 0 = no arc. Mk I (`≥ 1`): ships in `U.ENCOUNTER_BUBBLE`, cap 16. Mk II (`≥ 2`): 2× bubble, cap 24, lock closure `«` / `»`. |
| **Edge arrow** | `.rw-edge-arrow` | Off-glass lock pointer. Core ship. | None. |
| **Combat fade of career chrome** | `#hud.in-combat` | `.rw-fade` → opacity **0.14** (Manifest, Controls, Bio, POS). `.rw-aux` → **0.38** (Plant, Flight, Heat). Chart marks → **0.14**. Fade, do not delete. Controls collapse on the **rising edge** of combat to `CONTROLS ▸`; exit does not force-open. | `ctx.flags.combat`. |

Neither family may:

- delay any row in this table behind a skin intro, pulse warmup, or “organism wake”;
- hide Screen / Shell / petals behind a pretty silhouette that lacks the numbers/shapes;
- replace LOW/CRIT, FORE/AFT, RANGE, MATCH, LEAD, DIST, or WPN with icon-only chrome;
- show a fake contacts arc on scanner 0;
- keep Manifest / Controls / Bio / POS / chart marks at career opacity during combat.

### 1.2 Locked adjacent instruments (stay; do not restyle into a second glance)

These already ship. Families may re-skin stroke vs living accent. They must stay in place and keep the same data.

- Thin reticle hub, 80 px empty middle. Living iris = **small** accent (pupil + three cilia). Mech may swap that accent for a thin mechanical tick of the **same bounding box**.
- Target bracket + resolve band words (`DEFIANT` / `SHAKEN` / `BARGAINING` / `CAPITULATE`) + Q-ship pierce + ore `NEEDS` / `.ore-blocked`.
- Context prompt (Dock / Jump / Hail / Target) above the contacts slot.
- Jump charge, arrival banner (off aim column), toasts (off aim column).
- Three cameras, **one** overlay. `C` cycles chase → third → first → chase. First-person recenters the reticle only.

### 1.3 Glance geometry (do not move)

From `src/ui/hud.css` after waves A–F:

- Rails: `top: 57%`, `left: 50%`. Self `translate(calc(-100% - 78px), 0)`. Target `translate(78px, 0)`.
- Contacts: bottom center, not a 22–28% reticle ring.
- Aim glass stays empty. No new instrument in the glance table of proposal §4.

HUD-02 may change **stroke language** (mechanical vs living). HUD-02 may **not** change these positions.

### 1.4 Cadence (performance contract)

`hud.js` header is law:

- Create every DOM node **once** in `initHud`.
- Per-frame: transforms only (reticle / bracket / lead / edge arrow).
- Text and bar writes: ~5 Hz (`TEXT_UPDATE_INTERVAL = 0.2`) and only on change.
- No per-frame object allocations.

A family skin that rebuilds rails, clones a second HUD, or writes text every frame fails this contract.

### 1.5 Color + shape (proposal §6)

Keep `#hud` tokens: `--rw-accent`, `--rw-warn`, `--rw-bad`, `--rw-good`. `--vein` stays a Bio / living accent, not a FreeSpace green combat default. HUD-03 body classes continue to override the same tokens. Shape or text must carry every state. Color is never the only cue.

---

## 2. Parity rule

Wishlist HUD-02: both families communicate the same essential information and **neither receives a competitive readability disadvantage**.

A living HUD that is prettier but worse in a duel is a failed skin.

### 2.1 Same data, same time, same place

- Same strings, same numbers, same hide/show gates, same 5 Hz text cadence.
- Same rail offsets, same hub size, same contacts slot, same edge-arrow inset (`EDGE_MARGIN = 84`).
- Same combat fade opacities.

### 2.2 Pixel budget into the aim column

**Aim column** = the vertical center strip that holds the hull (chase/third), lead pip, projectile path, and empty hub.

- Family chrome may not grow **toward center** by more than **8 px** versus the other family, measured at 1600×900.
- Rails stay at the 78 px offset. Do not eat the 78 px gap.
- Living iris / mech tick share one box. Do not grow cilia, veins, or ticks across the hub interior.
- Contacts pips stay on the bottom arc. No tendrils from the arc onto the glass.
- No extra widgets (heart-rate, mood orb, ammo flower, GSE, four-face shield) in the glance cluster.

### 2.3 Motion budget

Living family may pulse **accent only** (proposal: pulse the accent, not the whole arc).

Caps, unless `body.rw-reduced-motion`:

| Motion | Max |
|---|---|
| Translation of any glance glyph | **2 px** |
| Scale of any glance glyph | **1.00–1.04** |
| Opacity wobble of any glance glyph | **±0.08** |
| Loop period | ≥ 1.2 s (no seizure-rate flicker) |
| One-shot flashes (hit, range pop, hostile-enter) | already one-shot; do not turn them into loops |

Contacts already use a short enter pulse (`CONTACT_PULSE = 0.45`). Family skins must not enlarge that pulse or move pips.

### 2.4 Reduced motion equalizes layout

`body.rw-reduced-motion` already kills HUD animation/transition (`hud.css`). HUD-02 adds a harder rule:

Under reduced motion, **both families must render the same static layout**.

Allowed residual difference: static stroke tokens (line cap, dash, a still vein tint on labels).  
Forbidden residual difference: extra nodes, extra width into the 78 px gap, a larger iris, a different rail order, a delayed fade.

Acceptance: a 1600×900 still of mech + reduced-motion and bio + reduced-motion overlay with a 8 px tolerance on every glance instrument box.

### 2.5 Readability checks both families must pass

- Screen vs Shell still read as thin vs thick without color.
- Hull LOW/CRIT still show the word.
- FORE/AFT still show the word plus fill vs hollow.
- Color-blind and high-contrast still apply (see §4).
- Bright-sky / star-near frames still keep stroke contrast (existing contrast tokens).

---

## 3. Family switch

### 3.1 Recommended function

```js
// src/systems/hud.js (later implementation wave — not this wave)
// import { isBeautiful } from './organic.js';

/** @returns {'mech' | 'bio'} */
export function hudFamily(ctx) {
  const debug = sessionHudFamilyOverride(); // session-only; see §7
  if (debug === 'mech' || debug === 'bio') return debug;

  const p = ctx.player;
  if (!p) return 'bio';

  // SHP hook (field does not exist yet). Explicit hull kind wins.
  if (p.hullKind === 'built') return 'mech';
  if (p.hullKind === 'living') return 'bio';

  // Beautiful Ones grown hull (NPC path already uses this test).
  if (isBeautiful(p.faction)) return 'bio';

  // Pre-SHP starter: ship.js always mounts a living mesh.
  return 'bio';
}
```

Apply as `#hud.dataset.family = hudFamily(ctx)` on init and when the mounted hull changes. Do not rebuild nodes. CSS: `#hud[data-family="mech"]` and `#hud[data-family="bio"]`.

Return tokens stay `'mech' | 'bio'`. Prose may say conventional / living.

### 3.2 How the player ship is marked living **today** (read, do not invent)

| Signal | Where | What it actually means today | HUD use |
|---|---|---|---|
| Living mesh | `src/systems/ship.js` header | Player hull is **always** a grown ship (swim / breath / heartbeat). `createShipState('light')` only. | Default family is **bio**. |
| `isBeautiful(faction)` | `organic.js` | `faction === 'beautiful'`. NPC Beautiful Ones ships and gates. | Use after SHP writes `ctx.player.faction`. **False** on the current starter (`faction` defaults to `'independent'`). |
| `ctx.player.faction` | `createShipState` / save restore | Persisted. Default `'independent'`. | SHP writes the shipyard faction here. Beautiful → bio. |
| `ctx.player.classKey` | `'light'` starter | Class is role/stats, not grown vs built. Ace / cutter / light can be either culture. | Do **not** switch on classKey alone. |
| `ctx.world.origin` | `origins.js` / `ORIGINS` / `save.js` `WORLD_FIELDS` | Start situation only. `beautiful` sets bond 0.35, hunger 0.4, two `livingRock`. It does **not** change mesh, faction, or classKey. `greenhand` copy is already “a living ship”. | Do **not** switch on origin. |
| `ctx.bio` | `bio.js` | Companion mood / hunger / wounds / bond / growth. Always present on the current living starter. | Career panel. Not a family switch. |

There is **no conventional player hull** in the tree today. A conventional starter is not current state. Do not pretend `origin !== 'beautiful'` is a mechanical ship.

### 3.3 Cases the integrator must honor

| Case | Family | Rationale |
|---|---|---|
| Fresh boot, any origin, current `light` / `independent` hull | `bio` | `ship.js` living mesh. Greenhand text: “a berth, a living ship”. Beautiful origin is the same hull with more bond. |
| Beautiful Ones origin, current hull | `bio` | Origin is flavor + bio start values, not a second hull. |
| Future SHP buy of a Beautiful Ones hull | `bio` | `isBeautiful(player.faction)` or `hullKind === 'living'`. |
| Future SHP buy of a Freehold / Ledger / other **built** hull | `mech` | SHP must set `hullKind: 'built'` (and faction). |
| Future SHP hull swap back to a living hull | `bio` | Hull decides. Swap is instant on the same `#hud` tree. |
| Living hull with conventional guns (wishlist SHP-03) | `bio` | Weapons do not pick the HUD. WPN still names the installed gun. |
| `body.rw-*` settings | unchanged family | Accessibility is not a skin picker. |

### 3.4 SHP hook (design only — SHP is not this wave)

When SHP-01 / SHP-02 mounts a purchased hull, write:

- `ctx.player.faction` — already persisted through `save.js` restore.
- `ctx.player.classKey` — already persisted.
- `ctx.player.hullKind = 'living' | 'built'` — **new field, SHP-owned**. Player is not a `WORLD_FIELDS` whitelist. `snapshot()` writes `player: ctx.player` wholesale (`save.js` ~170). `restore()` does `Object.assign(ctx.player, snap.player)` (~359). `sanitizeRestored` only heals NaN numeric vitals; it does **not** drop unknown keys. Extra player keys **keep** across save/load today.

HUD must **not** write `hullKind`. A HUD write would persist in `rimward-save-v1` with no `living`|`built` allowlist. A hand-edited `hullKind: 'built'` on the living starter would stick.

The SHP persist wave must copy `hullKind` on purpose and allowlist `living`|`built` only (same class of heal as `scanner` 0/1/2). Anything else: delete the key so `hudFamily` falls through. Do not add a `settings.js` key. Do not add a `WORLD_FIELDS` HUD key.

HUD reads `hullKind` if present. HUD never writes it.

Until SHP exists, `hudFamily` returns `'bio'` in live play. Both skins must still be implementable and screenshotable via the session debug override (§7).

### 3.5 No free HUD-skin setting

Do **not** add “HUD style: mechanical / living” to the O panel.

A living ship must not run a mechanical HUD because the player prefers the look. That is a competitive and fiction break.

If a later owner wants a skin override, that is a **HUD-03** product question (see §10). Not this implementation wave.

### 3.6 Alternatives (switch rule)

**Alt S1 — Origin proxy (rejected as default).**  
`origin === 'beautiful' ? 'bio' : 'mech'`.  
Cheap before SHP, but it lies: greenhand already flies a living ship, and a later SHP Beautiful hull on a ledger-debt save would keep a mechanical HUD. Origin is a start situation (`origins.js`), not a hull id.

**Alt S2 — `isBeautiful(player.faction)` only (rejected as sole test).**  
True after SHP writes `faction: 'beautiful'`. False on today’s starter (`independent`), which is still a living mesh. Would ship a mechanical HUD on the only playable living hull.

**Chosen:** hull kind + Beautiful faction + living-starter default (function in §3.1). Origin is narrative. Class is stats. Bio is the companion.

---

## 4. HUD-03 mapping

Existing client settings stay the only overrides. Waves A–F added no new HUD-03 options. HUD-02 first implementation adds none.

| Setting | Owner | Apply path | Both families |
|---|---|---|---|
| Color-blind | `ctx.settings.colorblind` | `body.rw-colorblind` | Same token remap. Shape/text still required. |
| High contrast | `ctx.settings.highContrast` | `body.rw-contrast` | Same stroke boost. Rails stay unfilled. |
| Reduced motion | `ctx.settings.reducedMotion` | `body.rw-reduced-motion` | §2.4 equal static layout. Also silences family pulses and any family audio loops. |
| Text scale | `ctx.settings.textScale` `0.85\|1\|1.2\|1.5` | `--rw-text-scale` on `#hud` | Same scale. Family chrome must not clip XL. |
| Mute | `ctx.settings.muted` | `song.js` gain 0 | Mutes family cues too. |
| Master volume | `ctx.settings.masterVolume` 0..1 | `song.js` | Family cues ride this bus. |
| Hints | `ctx.settings.hints` | `onboarding.js` | Unchanged. Not a HUD family. |

`settings.js` is the only writer of `ctx.settings`. Persisted key remains `rimward-settings-v1`. **Prefer no `settings.js` write** in the HUD-02 implementation wave.

Do not add HUD-03 audio-alert toggles. Wishlist “optional audio alerts” stays unscoped.

---

## 5. Audio policy

FX-02 (Wave 54, `song.js`) already prioritizes **weapon, impact, engine, and warning** over music, radio, and station ambience.

HUD-02 family cues:

- Optional, last implementation slice.
- Secondary to `playerFire`, `npcFire`, `playerHit`, `npcHit`, `bodyHit`, engine/burner, `shieldDown`, `engineOut`.
- Short ticks or a quiet living click. No new music bed. No `songShift`. Do not redesign whalesong.
- Bio family must not drown FX-02 with heartbeat / tendril rustle.
- Mech family must not add a second engine loop.
- `muted` and `masterVolume` already exist. Use them. No new volume slider.
- Reduced motion: no looping family cue. One-shot combat warnings that already exist may stay.

Whalesong (`ctx.bio.songEvent`) is the companion voice, not a HUD-02 instrument. Do not retarget it as a family skin.

---

## 6. DOM / CSS architecture

### 6.1 Chosen: one tree, two `data-family` skins

- Keep the single `#hud` root `initHud` already owns.
- Set `data-family="mech"` or `data-family="bio"` on `#hud` (not on `document.body`).
- Body stays for HUD-03: `rw-colorblind`, `rw-contrast`, `rw-reduced-motion`.
- CSS selectors: `#hud[data-family="bio"] .rw-reticle-cilia { … }` etc.
- Init-once nodes stay. Skins are CSS (+ tiny class toggles already used: `in-range`, `is-lit`, `h-warn`).

**Forbid** a second parallel HUD DOM (`#hud-mech` + `#hud-bio`, or a living overlay sibling). That breaks the performance contract and doubles Playwright pins.

### 6.2 Alternatives (skin architecture)

**Alt A1 — Body class `rw-hud-bio` / `rw-hud-mech`.**  
Works, but collides mentally with HUD-03 `rw-*` accessibility classes and makes “body means client preference” muddy. Rejected vs `#hud[data-family]`.

**Alt A2 — Two parallel HUD trees.**  
Forbidden. Doubles nodes, breaks 5 Hz write-on-change caches, risks one family hiding a readout.

**Alt A3 — Swap stylesheets.**  
Forbidden as the only mechanism. Reload/restyle races and loses init-once identity.

### 6.3 Parallel-safety (implementers)

`hud.js` + `hud.css` are **not** parallel-safe. One implementation owner at a time. Do not land family CSS in a PR that another worker is restyling rails. `song.js` may take a last, isolated cue PR. Avoid `settings.js`.

---

## 7. Security

See also `out/w61/shared-security.md`.

- NPC names, cover names, `ctx.world.shipName`, comm lines (`commLine.text` / `.line`), toast lines, ore / commodity names, system names, landmark labels stay **`textContent` / `Text` nodes**.
- `el()` already uses `textContent`. Keep that.
- **No `innerHTML` / `insertAdjacentHTML` / `document.write` of world or save strings.**
- Family CSS is authored, not interpolated from faction or player names.
- **No new `localStorage` keys.** Do not extend `rimward-settings-v1` for family.
- **No new `save.js` `WORLD_FIELDS` for HUD.** `hullKind` is a player-record field for the SHP wave, not a HUD-02 persist. Restore already keeps extra player keys (`Object.assign`). HUD must not write `hullKind` (it would persist unsanitized). SHP must allowlist `living`|`built`.
- Debug override, if implementers need both skins before SHP: **session-only**.
  - Allowed: `sessionStorage['rw-hud-family']` = `mech`|`bio`, or a query parsed at boot and stored in a module let.
  - Forbidden: persisting that override, writing it from the O panel, or letting a save file set it.
- Q-ship `coverName` remains a mask, not a reason to use HTML.

---

## 8. Non-goals (this design and the first implementation wave)

- No skins ship in wave 61 (design only).
- No TGT-04 turrets / automated weapons HUD.
- No missiles, aspect lock, lock-box, missile timer, incoming-missile gauge.
- No G / S / E power triad. Plant / Flight / Heat stay `.rw-aux`.
- No four-face shields or F5–F8 transfer. Facing glance only.
- No tendrils across the aim glass (proposal HUD-02 paragraph).
- No moving glance positions (rails, hub, contacts slot, edge arrow).
- No designer-only “pretty” instruments that are not in §1.1.
- No FreeSpace green combat default.
- No first-person-only combat HUD.
- No contacts ring around the reticle.
- No HUD-03 audio-alert settings.
- No free HUD-skin setting.
- No music redesign.
- No SHP shipyard implementation in the HUD-02 code wave (hook only).

---

## 9. Later implementation PR plan (not this wave)

Do **not** schedule or land these PRs in wave 61.

`hud.js` and `hud.css` are shared. Land **serially**. One owner.

| PR | Intent | Likely files | Depends on | Acceptance |
|---|---|---|---|---|
| **PR1 — Hook** | Add `hudFamily(ctx)`, set `#hud[data-family]`, session debug override. **Zero visual delta** at default (`bio`). | `src/systems/hud.js` only if possible. Tiny `hud.css` attribute comment OK. **No `settings.js`.** | Waves A–F (already in tree) | Boot pins still pass. Default `data-family="bio"`. `?` / session override flips attribute without new nodes. |
| **PR2 — Mech skin** | Conventional stroke language. Same boxes. | `src/ui/hud.css`, maybe small class names in `hud.js` | PR1 | 1600×900 stills: mech vs current glance overlay ≤ 8 px. All §1.1 instruments visible. |
| **PR3 — Bio skin** | Living accent (pulse accent only). No tendrils. Iris stays small. | `src/ui/hud.css`, maybe `hud.js` class toggles | PR1 (may parallel PR2 **only** if a single owner edits `hud.css`) | Same still test. Reduced-motion bio == reduced-motion mech layout. |
| **PR4 — Family audio (optional)** | Quiet family ticks under FX-02. Mute / masterVolume honor. | `src/systems/song.js` only | PR1. FX-02 already shipped | No music change. Muted = silent. Weapons still louder. |
| **PR5 — Pins** | Playwright 1600×900 stills + boot-test pins | `scripts/boot-test.mjs` (pins only; not a wave-61 edit), stills under `out/hud-research/` | PR2 + PR3 | See §9.1 |

Prefer **no `settings.js` write**. If a reviewer demands a visible debug toggle, it is a session flag printed in an existing overlay, not a persisted checkbox.

SHP-01/02 (later, other initiative): write `player.hullKind` + `player.faction`, then PR1’s function starts returning `'mech'` in live play. HUD PRs must not wait on SHP to land the skins, but live default stays bio until that hook is written.

### 9.1 Acceptance tests (implementation wave)

Playwright 1600×900, chase, same lock, both families:

- `hud-02-bio-chase.png` / `hud-02-mech-chase.png` — Screen, Shell, petals+LOW/CRIT, SPD, WPN, DIST, name, FORE/AFT, lead, RANGE, MATCH all present.
- `hud-02-bio-scanner0.png` / `hud-02-mech-scanner0.png` — no contacts arc.
- `hud-02-bio-mki-aft.png` / `hud-02-mech-mki-aft.png` — aft hostile on bottom arc.
- `hud-02-*-combat-fade.png` — Manifest/Bio/POS at 0.14.
- `hud-02-*-colorblind.png` / `hud-02-*-contrast.png` / `hud-02-*-reduced-motion.png` — HUD-03 still applies; reduced-motion pair matches layout.
- `hud-02-*-xl.png` — text scale 1.5 does not clip rails into the hub.

Boot pins (`scripts/boot-test.mjs`, extend the HUD-01 / wave B–F block ~11273+):

- `#hud[data-family]` is `bio` or `mech`.
- Still exactly one `.rw-combat-self`, one `.rw-combat-target`, one `.rw-contacts`.
- Scanner 0 hides the arc; Mk I shows it.
- `hudFamily` with `{ player: { faction: 'beautiful' } }` → `bio`.
- `hudFamily` with `{ player: { hullKind: 'built', faction: 'freehold' } }` → `mech`.
- Override in `sessionStorage` does not survive a new documented “no session” boot path (pin the helper, not a real disk key).

### 9.2 Dependencies

- Requires HUD-01 / TGT-01..03 / waves A–F (done).
- Does not require SHP, TGT-04, missiles, or new HUD-03.
- Audio PR requires FX-02 (done).
- Save / origin / bio systems stay read-only.

---

## 10. Open questions (owner only)

Decided from locked docs are in §11. These remain product calls:

1. **Ship HUD-02 skins before SHP hull swap?** Until SHP, live play only shows `bio`. Mech is debug/screenshot only. Owner may wait for SHP so both families appear in normal play, or ship skins early for art.
2. **Unknowables (and any later grown-but-not-Beautiful hull) — `bio` or `mech`?** Today `isBeautiful` is only `faction === 'beautiful'`. After debug and `hullKind`, §3.1 hits `isBeautiful` then **unconditional `return 'bio'`**. Unset `hullKind` on **any** faction (independent, Unknowables, Beautiful) is `bio`. Owner must still say whether an Unknowables **purchased** hull should set `hullKind: 'living'` (bio) or `hullKind: 'built'` (mech). Do not treat Unknowables as a silent mech default.
3. **HUD-03 free skin override later?** This contract forbids it in the first implementation. Owner may reopen as HUD-03 after both skins exist and playtest shows a need (e.g. motion sickness on bio that reduced-motion already should kill). Default remains no.

---

## 11. Decisions recorded (not silent)

| Topic | Decision | Rationale |
|---|---|---|
| Switch key | Hull, not origin, not class, not bio mood | `origins.js` adjusts start conditions only. `ship.js` is a living mesh. `classKey` is a stats row. Wishlist HUD-02 is conventional **ships** vs living **ships**. |
| Pre-SHP default | `bio` | Only mounted player hull is living. `isBeautiful(player.faction)` is false (`independent`) and must not flip the starter to mech. |
| Beautiful origin | Still `bio`, no special case | Origin does not change hull. Effects are bond / hunger / cargo. |
| Conventional starter | Not invented here | No built player mesh exists. Do not fake one with origin. |
| Skin setting | None | Hull decides. A free skin is HUD-03-or-never. |
| DOM | One tree, `#hud[data-family]` | Honors init-once / 5 Hz contract. Body classes stay HUD-03. |
| Audio | Optional last PR, under FX-02 | Wishlist creature cues; proposal forbade organic audio in A–F, not forever. Mute already exists. No music change. |
| Tendrils | Forbidden across aim glass | Proposal HUD-02 + this non-goals list. |
| Glance positions | Frozen | HUD-01 / waves A–F closeout. |
| New persist keys | None for HUD-02 | Family is derived. Debug is session-only. `hullKind` waits for SHP. |
| HUD-03 options | None new | Existing `settings.js` / `body.rw-*` only. |

---

## 12. Integrator checklist

- [ ] Family notes keep every §1.1 instrument in the same place.
- [ ] No tendrils on glass. No GSE. No four-face shields. No missiles. No TGT-04.
- [ ] Parity numbers in §2 used as acceptance, not vibes.
- [ ] Switch is `hudFamily(ctx)` as specified, or a documented owner change to §10.
- [ ] No `settings.js` HUD-skin checkbox.
- [ ] One `#hud` tree.
- [ ] World strings → `textContent`.
- [ ] Wave 61 lands markdown only.
