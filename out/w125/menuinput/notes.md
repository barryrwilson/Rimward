# Wave 125 CTL-04 PR1 station-menu Digit skip — notes

**Verdict:** PR1 **landed** in `src/systems/controls.js`. Digit1–5 do **not** assign `input.weaponGroup` while a dock menu or other play surface owns those digits. Open space still sets groups 1–5.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `execute_workflows` (`r-mt9a2ngz-30c051c2`). Primary binding: `claude/workflow-security-review`. Control: `claude/workflow-approval-gating` (no graph write). Draft Circle of Love is non-binding.
- Merge law: `out/w124/menuinput/shared-contract.md`. Formula copied into `shouldSkipWeaponGroupDigits`.
- Import **read** of `hailDigitsAllowed`, `playSurfaceBlocked`, `settingsOwnsScreen` from `src/systems/overlay-policy.js`. Did **not** write that file.
- Did **not** add `stopImmediatePropagation`. Did **not** add Digit6–9/0. Did **not** remap KeyJ/KeyD. Did **not** change `fireHeld`. Did **not** write `weaponGroup` from `station.js`.
- TRACKED still Digit1–5.
- Node smoke of the skip formula (no Vite, no Chrome, no `npm run test:boot`): open space skip=false; `docked`/`hailOpen`/`paused`/`chartOpen`/`berthOpen` === true skip=true; string `docked` not skip.

## Live change

`controls.js` keydown `case 'Digit1'` … `'Digit5'`:

- Before: unconditional `input.weaponGroup = n`.
- After: `if (!shouldSkipWeaponGroupDigits(ctx)) input.weaponGroup = n`.

Skip true when:

- `flags.docked === true`
- `flags.hailOpen === true`
- `hailDigitsAllowed(ctx) === false`
- `playSurfaceBlocked(ctx) === true`
- `settingsOwnsScreen() === true`
- `paused` / `chartOpen` / `berthOpen` === true
- `shouldSkipDockPulse` (title / models / typing)

Fail closed: `=== true` only. Missing flags = not-docked. Outer catch never throws to the listener. Direct `ctx.input.weaponGroup = n` still works (combat pins).

## Not this PR

- `fireHeld` docked conjunct = PR2.
- Boot pins in `scripts/boot-test.mjs` = named, not this write-set.
- Hail.js overlap comment **431–432** is now stale (WPN write skipped; hail resolve still live). Do not edit hail.js in this pack.

## Honor

- HUD-01 empty hub. No new chrome. No “not available”. No `innerHTML`.
- Digit 0 shipyard. Digit 8/9 station. Digit 1–5 flight WPN in open space.
- CTL-01 KeyJ. CTL-02 hail resolve unchanged.

## Reviews

- Security: self-applied. No CRITICAL/HIGH.
- Code: self-applied. No Blocker/Major.
- UI: self-applied. No Blocker/Major. No new HUD copy.
