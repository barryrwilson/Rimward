# Wave 109 MSN-03 remaining unique SKU — worker notes

First impl of `docs/Msn03UniqueSkuDesign.md` + merge law `out/w108/msn03sku/shared-contract.md`. Contract wins.

## Landed
- PR1 `CHAIN_GRANT`: Veridian `auto`, Hollow `dart`; Freehold/Ledger kept; no `gilded`.
- PR2 `grantChainSku` boolean + write verify; last-step fail `credits += 2`; commLine fail suffix.
- PR3 Digit 2 hint from catalog names. No shop costs on Jobs.
- PR4 WAVE109 boot section + standalone probe.

## Honor
- Did not write `src/game/state.js`.
- No new persist key. No `world.chainSku`.
- Live ids `dart`/`auto` only. Shop 6500/4200 unchanged.
- Unique four / chain splice / DONE hide / family caps closed.
- No graft/scanner/mining/living hull grant.
- HUD-01 empty hub. Digit 0 shipyard. Digit 2 Jobs. Digit 8/9 stay.

## Probe
`node out/w109/msn03sku/probe.mjs` → PROBE PASS.

## Boot
WAVE109 MSN-03 pins are source + isolated hangar grants. They do not need a live dock.

WAVE83 STATION last-step pins retuned to Wave 109 deputize (harness only; product grant law unchanged):
- `lastFreeholdLight`: light still does not seat dart; credits `payQuoted 22 + consolation 2`.
- `lastVeridianAuto` (was `lastVeridianNoSku`): heavy hull seats `auto`; launcher unchanged; credits `+19` (no shop 4200 debit, no fail +2).
- `lastHollowDart` (was `lastHollowNoSku`): clear mounted launcher/ammo first; Hollow seats empty dart (`launcher === 'dart'`, `missileAmmo === 0`); turret unchanged; credits `+17`.

Do not “fix” WAVE26/WAVE4/WAVE35.

## Reviews
Security, code, and UI self-applied. No HIGH/CRITICAL/Blocker/Major product defects.

Harness re-review: pins read live hangar/credits after `finishChainStep`. No persist key. No innerHTML. Employer still from `parseChainId` jobs. Hollow reset writes empty launcher/ammo on the mounted row only so the pin cannot pass on leftover Freehold dart.
