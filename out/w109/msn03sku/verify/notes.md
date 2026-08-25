# Wave 109 MSN-03 verifier notes

Graph: `codex/workflow-browser-assisted-work` (execute_workflows). Local Vite + Playwright. No external send.

Probe: PASS.
WAVE109 pins: all true.
WAVE83 STATION: lastFreeholdLight false (credits now +payQuoted+2). lastVeridianNoSku false (heavy seats auto). lastHollowNoSku true (dart already seated from freehold heavy, pin does not see Hollow write). Worker did not update WAVE83 pins.

Live grants via `window.__ctx` job inject + 0.5s tickDeliveryJobs:
- light last Freehold: 350→374, empty racks
- heavy last Freehold: 374→396, dart ammo 0
- heavy last Veridian: 396→415, auto
- step 1 Veridian: credits stay 415, next chain-veridian-2
- ace last Hollow after clear launcher: 415→432, dart ammo 0
- chain-__proto__-1 spliced, no pay

Digit 2 hint: Dart rack / Auto turret. No 6500/4200. Copy uses “a Auto turret”.

Hub 80×80, five children, no SKU pip. Digit 0 shipyard. Digit 9 Standing. Digit 8 Launch. Overlay textContent empty after undock. station.js has no innerHTML token.

git: no `state.js`, no `save.js`. WORLD_FIELDS still hangar + launcher/missileAmmo/turret. Catalog still dart/auto only.
