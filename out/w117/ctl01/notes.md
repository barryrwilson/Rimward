# Wave 117 CTL-01 PR1 notes

## Landed

- `pendingDock` from **KeyJ** only. `TRACKED` includes `KeyJ`.
- `case 'KeyD'` no longer sets `pendingDock`. Held KeyD still writes `strafeX`.
- World edge stays `ctx.input.dockPressed`. No `jumpPressed`.
- Skip pulse while the `#rw-title` overlay is **attached** (`isConnected` / `parentNode` / `parent`), `ctx.models.isOpen()`, or typing INPUT/TEXTAREA/SELECT/contentEditable. Catch → skip. Never throw.
- Boot harness `getElementById` always creates a detached node (`scripts/boot-test.mjs` ~239–241). Truthy `#rw-title` lookup is not title open. WAVE21 KeyJ failed until skip required attach. Live `closeTitle()` still `root.remove()`.
- Help: A/D still lateral strafe; hail / **J dock** / camera. `textContent` / `el()` / `h()` only.
- Onboarding: `J — dock`, `J — jump the gate`.
- HUD prompt family: dock/jump `pKey` **J**; hub `pKey` **G** and verb `J — Jump to …`. Combat rails / class tokens / RANGE / tgtFacing not rewritten by this leftover (HUD-02 sibling may already hold those lines in the dirty tree).
- `ctx.js` comments: dock edge J; strafeX still D.
- `scripts/boot-test.mjs` boot pins applied after NAV-05: WAVE21 `dispatchKey('KeyJ')` (junction + back-gate); WAVE6 `hintCardVisible('J — dock')`. `dockAtCurrentStation` still pulses `ctx.input.dockPressed`. KeyZ dismiss stays. WAVE117 NAV-05 KeyM pins not inverted.

## Not this worker

- `gate.js` / `station.js` / `autopilot.js` / `state.js` / `hud.css` / Digit / persist / overlay stacking / NAV-05.

## WAVE21 retest

`npm run test:boot`: wave21 hub junction all true (`dEmitsRouteJump`, `jumpBegun`, `arrivedAtHearth`, `nearHearthBackGate`, `backGateZone`, `hubArrivalRule`). wave22 `goneInHearth` true. wave117 nav-05 handoff all true. WAVE6 onboarding all true. Remaining `BOOT TEST FAIL — 20 errors` includes known WAVE26 pins. Not fixed here.

## Graph

`graph_resolve` returned CRM account workflows (score 16.4, coverage 0.07) for this WebSim bind. That stack does not apply. No CRM writes. No external send.
