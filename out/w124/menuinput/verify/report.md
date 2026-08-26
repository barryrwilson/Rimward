# Wave 124 remaining CTL-04 menu-input leftover — verifier report

**Domain:** data (markdown freeze). No Vite. No Chrome. No `npm run test:boot`. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` first `blocked_ambiguous` (`r-mt9835wh-4d483ac0`, false matches). Second call `execute_workflows` software-delivery (`r-mt9846ic-374353bc`) + approval-gating control. Did not `graph_approve` / `graph_propose`.  
**Verdict:** **CLEAN**

## Status

CLEAN

## What I tested

- Inventory vs live `src/systems/controls.js` Digit1–5 → `input.weaponGroup`.
- Live `src/systems/station.js` Digit services (Digit4 Feed & tend, Digit5 Repair; Digit 0/8/9 station). No `stopPropagation` on station digits.
- Live `src/systems/overlay-policy.js` `hailDigitsAllowed` / `playSurfaceBlocked`.
- Live `src/systems/hail.js` Digit1–3 overlap comment.
- Leftover REAL: Digit1–5 still write `weaponGroup` with no docked skip.
- Worker write-set vs git. No `src/`. Honor paths not edited by this pack.
- Later write-set freeze: `src/systems/controls.js` only (named boot pins). Not `save.js` / `overlay-policy.js` writers / `npc.js`.
- Digit 0/8/9 stay station. No bind-remap settings schema.
- Contract wins. `fireHeld` named **PR2**, not required PR1.
- Flag scan: CONSUME, `src` written, overlay-policy exclusive write, KeyJ remap, Digit steal, sibling mix.

## Bugs found

None.

Leftover is **REAL**. Pack does **not** freeze CONSUME. Named later serial is **PR1 station-menu Digit skip**. Serial is **not** none.

## Environmental issues

None that block this data pass.

- First graph resolve was `blocked_ambiguous` (training / knowledge / automation false matches). Second resolve bound software-delivery. Read-only census plus verifier files under `out/w124/menuinput/verify/` only.
- Working tree has dirty `PROGRESS.md` and `docs/PLAYER-EXPERIENCE-WISHLIST.md`. Diff is Wave 123 leftover census plus playtest capture. This pack did not edit those files.
- Sibling untracked packs `out/w124/berthfreeze/**` and `out/w124/startergrace/**` exist. They are other workers.
- Started no Vite. Started no Chrome.

## Evidence

### Write-set

`git status --short` scoped:

- Worker pack (untracked): `docs/Ctl04MenuInputDesign.md` + `out/w124/menuinput/{code-review,current-ctl04-menu-input-inventory,notes,security-review,shared-contract,ui-audit}.md`.
- No `src/` change. No `scripts/` change.
- `docs/Ctl01DockBindDesign.md` / `docs/Ctl02OverlayDesign.md` untouched. `docs/OwnerDecisionsWave124.md` absent.

### Leftover REAL (weaponGroup still writes while docked)

Live `src/systems/controls.js` **329–344**:

```
case 'Digit1': input.weaponGroup = 1;
case 'Digit2': input.weaponGroup = 2;
case 'Digit3': input.weaponGroup = 3;
case 'Digit4': input.weaponGroup = 4;
case 'Digit5': input.weaponGroup = 5;
```

No `flags.docked` test. No `hailDigitsAllowed`. No `playSurfaceBlocked`. `shouldSkipDockPulse` (**68–82**) is KeyJ only (**303**).

`TRACKED` **41–48** includes Digit1–5 only. No Digit6–9. No Digit0.

`grep hailDigitsAllowed|overlay-policy|flags.docked` in `controls.js`: no matches.

Live `src/systems/station.js`:

- `DOCK_KEY_SERVICES` **188**: market, jobs, bar, **feed**, **repair**, outfitting, people, **launch**, **epics**, **shipyard**.
- Level-1 labels **6034**: Market, Jobs board, Bar, **Feed & tend**, **Repair**, … Launch, Standing, Shipyard.
- Digit hotkeys **6036**: index `i` → `i+1`, last row **0**.
- Listener **6156–6177**: comment “never writes ctx.input”. Bubble. **No** `preventDefault` / `stopPropagation` / `stopImmediatePropagation`.
- Digit4 → feed. Digit5 → repair. Digit0 → shipyard. Digit8 → launch. Digit9 → epics.
- Dock **6100–6101**: `flags.docked = true`, `ui.open = true`.

Both window bubble listeners run. Station does not stop the event. Controls still writes `weaponGroup`. Inbox copy matches HUD `weaponHudLabel` (`hud.js` **255–273**): `4 · —` / `5 · Psionic bolt` (or `5 · —`).

### Overlay policy / hail

`overlay-policy.js` **83–91** `playSurfaceBlocked`: title / models / typing.  
**175–185** `hailDigitsAllowed`: false on paused, playSurfaceBlocked, settingsOwnsScreen, chart, berth. Catch → false. Hail **resolve** gate, not WPN write.

`hail.js` **431–432** live comment: Digit1–3 also switch weapon groups. Listener **433–448** uses `hailDigitsAllowed`; catch fail-open `digitsOk = true`. `preventDefault` only on intent match. No `stopPropagation`.

Wave 118 gates hail resolve only. Confirmed.

### Inventory cite spot-check (live)

| Claim | Live |
|---|---|
| Digit1–5 assign `controls.js` **329–344** | unconditional `weaponGroup` 1–5 |
| TRACKED Digit1–5 only **45** | live |
| KeyJ skip **68–82**, **303** | `shouldSkipDockPulse`; Digit path unused |
| Help WPN line **378** | `1/2/3/4/5 — weapon group…` |
| `fireHeld` **476** | `fireDown && chartOpen !== true`; no docked conjunct |
| Station services **188**, **6034**, **6156–6177** | live |
| Digit4 Feed / Digit5 Repair | live |
| Digit 0/8/9 shipyard/launch/epics | live via `DOCK_KEY_SERVICES` |
| Overlay class **4430**; z 20 `screens.css` **8–16** | live |
| `hailDigitsAllowed` **175–185** | live |
| `playSurfaceBlocked` **83–91** | live |
| hail overlap **431–432** | live |
| HUD label **255–273**; WPN rail **926–927** | live |
| automine HUD write **807** | existing exception; pack does not claim `hud.js` |
| combat docked **1825–1828** | early return; weapons cold |
| `ctx.js` **15** input writer / **31** docked / **85** group | live |
| `main.js` initStation **109** then initControls **112** | live |
| Title capture Digit + stopImmediate **209–214**, **239** | live |
| Settings KeyO/Escape **228–234** | live |
| Origins Digit1–5 `src/game/origins.js` **92**, **143–149** | live (`paused = true`; no stop) |
| Berth KeyL comment `src/game/save.js` **1506–1508** | live never intercept |
| Chart KeyM **764–788** | no Digit |
| Models capture **647**; filter digits return without stop **704–719**; default stopImmediate **745–749** | live |
| Boot `dispatchKey('Digit5')` **1639** repair; **1664** Digit1 repair-all; **1216** Digit2 jobs; **1363** Digit1 market | live; no `weaponGroup` unchanged pin |

Nit (not a pack fail): inventory `initTitle` **105** vs live **106**. Digit 0/8/9 cite also lists outfitting papers **6248–6250** (level-2 Digit 8/9). Dock-root 0/8/9 stay **188** / **6169–6177**.

### Later write-set / honor / PR2

Contract §0.7 and brief: later write-set **`src/systems/controls.js` only** (+ named `scripts/boot-test.mjs` pins). Read overlay helpers. Do not write `overlay-policy.js` / `save.js` / `hail.js` / `station.js` / `npc.js` / `hud.js` / `state.js`.

Not overlay-policy exclusive write. Default is **read**. New export only if a later census proves it is the only safe share.

Digit 0/8/9 stay `station.js`. Digit1–5 stay open-space WPN. No bind-remap schema. No new persist key. KeyJ / KeyD stay.

`fireHeld` while docked is **PR2 optional** (`update()` conjunct). Not stuffed into PR1 Digit switch. Brief, contract, inventory, notes agree. Combat already cold **1825–1828**. Matches parent: PR2, not required PR1.

### Flag scan

| Flag | Result |
|---|---|
| CONSUME | **not** frozen. Census proves leak. Correct. |
| `src` written | **no** |
| overlay-policy exclusive write | **no** (read-only freeze) |
| remaps KeyJ | **no** |
| Digit steal (0/8/9 or flight 1–5) | **no** |
| sibling mix (`save.js` / `npc.js` / CTL-03 / AI-05 / Ctl01 / Ctl02) | **no** |

Contract wins over brief if they ever conflict. They match on leftover, serial, write-set, Digit 0/8/9, KeyJ, hailDigitsAllowed role, and PR2 `fireHeld`.
