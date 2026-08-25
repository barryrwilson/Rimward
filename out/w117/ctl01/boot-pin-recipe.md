# Wave 117 CTL-01 boot-pin recipe

**Applied** after NAV-05 WAVE117 pins landed. WAVE21 jump dispatches KeyJ. WAVE6 hint is `J — dock`. Dock helpers still set `ctx.input.dockPressed`.

Line numbers are from the Wave 117 snapshot of `scripts/boot-test.mjs` (WAVE21 ~706/732, WAVE6 ~1732). Re-grep if the sibling shifts lines. Match the **old** text, not the number.

## 1. WAVE21 hub jump — KeyD → KeyJ (~706)

**Old (641–643, comment; optional but keep comments true):**

```js
// (wrapping, authored order) while the junction is the nearest zone; D —
// the same dockPressed edge a physical-gate jump uses — emits
```

**New:**

```js
// (wrapping, authored order) while the junction is the nearest zone; J —
// the same dockPressed edge a physical-gate jump uses — emits
```

**Old (702–707):**

```js
// D on the wrapped selection (routes[0] === fh_hearth): controls.js turns
// the keydown into dockPressed one tick after the keydown; gate.js emits
// and jump.js consumes on the tick after that — the request rides
// lastEvents exactly like a physical-gate D press.
dispatchKey('KeyD');
tick(2, 'wave21 junction D');
```

**New:**

```js
// J on the wrapped selection (routes[0] === fh_hearth): controls.js turns
// the keydown into dockPressed one tick after the keydown; gate.js emits
// and jump.js consumes on the tick after that — the request rides
// lastEvents exactly like a physical-gate J press.
dispatchKey('KeyJ');
tick(2, 'wave21 junction J');
```

Field `w21hubChecks.dEmitsRouteJump` may keep its name (behavior pin, not a key name). Do not add a new Digit pin.

## 2. WAVE21 back-gate jump — KeyD → KeyJ (~732)

**Old (724–733):**

```js
// Home through the physical back-gate — the real D path again. The
// hub-arrival rule must land the ship at the freehold JUNCTION (~50u off
// hub.position), never at the gates[0] fallback (~145u away — 80u
// discriminates; the junction sits ~145u from freehold's veridian gate).
ctx.ship.object.position.set(...(hearthBack?.position ?? [0, 0, 0]));
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'wave21 at hearth back-gate');
w21hubChecks.backGateZone = ctx.gate.inZone === true && ctx.gate.nearHub === false && ctx.gate.nearTo === 'freehold';
dispatchKey('KeyD');
tick(2, 'wave21 back-gate D');
```

**New:**

```js
// Home through the physical back-gate — the real J path again. The
// hub-arrival rule must land the ship at the freehold JUNCTION (~50u off
// hub.position), never at the gates[0] fallback (~145u away — 80u
// discriminates; the junction sits ~145u from freehold's veridian gate).
ctx.ship.object.position.set(...(hearthBack?.position ?? [0, 0, 0]));
ctx.ship.velocity.set(0, 0, 0);
tick(5, 'wave21 at hearth back-gate');
w21hubChecks.backGateZone = ctx.gate.inZone === true && ctx.gate.nearHub === false && ctx.gate.nearTo === 'freehold';
dispatchKey('KeyJ');
tick(2, 'wave21 back-gate J');
```

## 3. WAVE6 onboarding string — `'D — dock'` → `'J — dock'` (~1732)

**Old:**

```js
const dockHintSuppressed = !ctx.world.onboarding.seen.includes('dock') && !hintCardVisible('D — dock');
```

**New:**

```js
const dockHintSuppressed = !ctx.world.onboarding.seen.includes('dock') && !hintCardVisible('J — dock');
```

KeyZ at ~1723 stays unbound dismiss. Do **not** steal KeyZ.

## 4. Keep — direct `ctx.input.dockPressed = true` dock helpers

Do **not** change these (line numbers may drift; match the assignment):

- `dockAtCurrentStation` (~1137, ~1139): `ctx.input.dockPressed = true` then `false`.
- Second helper copy (~4460, ~4462) if still present: same assignment.
- Call sites such as `dockAtCurrentStation('wave28 space-only dock')` (~6572): keep. They already pulse the world edge, not KeyD.

Wave 4 comment (~1101–1103) that names the `dockPressed` edge (not KeyD) may stay.

## 5. Do not touch

- Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul gate).
- KeyZ unbound dismiss.
- Digit 0/8/9 pins.
- HUD-02 combat-rail pins.
- NAV-05 AP `wantJump` pins except as that sibling already owns them.
- `dispatchKey` helper itself (~260).

## 6. After apply — grep expect

```
dispatchKey('KeyJ')     at WAVE21 jump legs (was KeyD)
hintCardVisible('J — dock')
no dispatchKey('KeyD') for jump
ctx.input.dockPressed = true  still in dockAtCurrentStation
```
