# Wave 122 remaining NAV leftover — cite notes

File reads only. No Vite. No Chrome. No `npm run test:boot`.

## Verdict agreement

| File | Leftover | Named serial | Name |
|---|---|---|---|
| `docs/Nav08RemainingNavDesign.md` Status | CONSUME | none | no remaining NAV leftover |
| `out/w122/navrest/shared-contract.md` | CONSUME (wins on fork) | none | no remaining NAV leftover |
| `out/w122/navrest/current-nav-remaining-inventory.md` §0 / §13 | CONSUME | none | no remaining NAV leftover |
| `out/w122/navrest/notes.md` | CONSUME | none | no remaining NAV leftover |

No fork. Brief merge-law row points at the contract.

## NAV-01..07 live (not a hidden hole)

| Slice | Cite claimed | Live |
|---|---|---|
| NAV-01 persist `nav` | `save.js` 77–101 / 100–101 | `WORLD_FIELDS` ends `'nav'` at 100–101 |
| NAV-01 snapshot/restore heal | `save.js` 976, 1240 | `sanitizeNav(ctx)` at both |
| NAV-01 write bag AP false | `nav.js` 48–55 | `writeNav` always `autopilot: false` |
| NAV-01 sanitize | `nav.js` 191–192 | `sanitizeNav` export; keep path always calls `writeNav` |
| NAV-01 plot/clear | `nav.js` 271–300 | `clearRoute` / `plotRoute`; uncharted fail closed |
| NAV-01 recalc no teleport | `nav.js` 302–303 | comment + no `currentSystem` write |
| NAV-01 chart click | `galaxychart.js` 89–97, 726–732, 748–751 | `isPlotTarget` includes `.rw-galaxy-label`; `activateSystem` plot/clear |
| NAV-02 readout | `hud.js` 1008–1026 | NEXT / DEST / JUMPS / GATE; `aria-live` on live block |
| NAV-02 cue park | `hud.js` 818–822, 1690–1738 | `.rw-nav-gate-cue`; park docked/jumping |
| NAV-02 ring | `nav-guidance.js` 1–12 | consume `path[1]`; read-only `world.nav` |
| NAV-03 MATCH | `autopilot.js` 22, 175–188 | `apRefuseToken` `'match'`; English line 22 |
| NAV-03 cancel dest keep | 191–207 | `nav.autopilot = false` only; no `dropNav` |
| NAV-03 restore silent | 202–206 | `reason === 'restore'` skips emit |
| NAV-03 no jump emit | file header 1–4 | `jumpRequested` emit only `gate.js` 678 |
| NAV-03 next hop | 111–116 | `path[1]` |
| NAV-04 hover model | `chart-hover.js` 1–8, 28–66 | no DOM; no persist |
| NAV-04 strip / no plot | `galaxychart.js` 31–33, 374–387, 439–460, 754–758 | pointerover `applyHoverId` only |
| NAV-05 hop kind | `gate.js` 501–505 | `'ring'` \| `'hub'` \| `''` |
| NAV-05 nearer hub vs ring | `autopilot.js` 335–337 | `hopKind !== 'hub'` no cycle |
| NAV-05 hub cycle skip ring | `gate.js` 681–690 | `lookupLiveNavHopKind(...) !== 'ring'` |
| NAV-05 split `AP_LINES` | `autopilot.js` 21–38 | `missingHop` ≠ `missingGate` |
| NAV-05 sole emit | `gate.js` 672–678 | `{ to: near.to }` |
| NAV-05 wantJump | `autopilot.js` 333 | `inZone && !docked && nearTo === hop` |
| NAV-05 chart live fly cancel | `galaxychart.js` 157–162, 644–647, 819–827 | `#rw-galaxy-ap-live` `textContent` |
| NAV-05 direct engage stay | `autopilot.js` 209–223; pin `chartStayOpen` 23570–23572 | `tryEngage` has no `setOpen` |
| NAV-06 button close | `galaxychart.js` 699–721 | empty token → `showApLive('')` + `setOpen(false)` + blur / HUD Cancel |
| NAV-06 pin | `boot-test.mjs` 23659–23664, 23724 | `chartEngageStay`; comment “Button success close (PR1)” |
| NAV-07 labels | `galaxychart.js` 340–350; `hud.css` 2165–2171 | `data-system-id`; `pointer-events: all` |
| NAV-07 dest select | 194–230, 394–396, 742–746, 561–563 | `#rw-galaxy-dest`; change → `activateSystem`; sync on `retargetPlot` |
| NAV-07 KeyM skip | 764–779; `overlay-policy.js` 72–80 | `isTypingFocus` includes `SELECT`; fallback dest id |
| NAV-07 Escape | 786–787 | still `setOpen(false)` |
| NAV-07 HIT 24 CSS px | 48, 513 | `HIT_CSS_DIAMETER = 24` |
| NAV-07 no innerHTML | grep `galaxychart.js` | 0 |

## Standing omit (not leftover)

| Omit | Live |
|---|---|
| Teleport dest | `autopilot.js` `currentSystem` only compared at 396. No assignment. Jump emit is `near.to`. |
| Persist-resume flying AP | `writeNav` / `sanitizeNav` always `autopilot: false`. WAVE85 `stuffedFalse` 19680–19688, 19730. |
| Empty hub | `hud.css` 184–193 80 px reticle. No NAV child. |
| Digit 0 shipyard | `src/systems/station.js` 188 last `DOCK_KEY_SERVICES` is `shipyard`; Digit 0 at 6172. Digit 8 launch / Digit 9 epics via index map 6035–6036. Inventory omits `src/systems/` prefix; lines match. |
| Hub PPI | none in chart/HUD nav surfaces. |

## Wishlist (cite only; pack did not edit)

- Initiative NAV 1113–1124: NAV-01..07 listed through Wave 121.
- NAV-03 body 1165–1169 still says “Remaining zone handoff leftover … impl later.” **Stale.** Wave 117 PR1 landed (`docs/Nav05HandoffDesign.md` Status).
- Idea inbox NAV rows `[x] DONE`: handoff 44–49; chart-label 65–71; close-chart-on-AP 72–76.

## Boot pins (read only)

Present: WAVE85 NAV PERSIST / CHART / GUIDANCE / AUTOPILOT / AP PATH; WAVE117 NAV-05 HANDOFF.

Absent (grep 0): `WAVE96`, `WAVE120`, `WAVE121`, `hoverModel`, `chart-hover` in `scripts/boot-test.mjs`. Contract §0.13: not a player-facing hole.

WAVE85 destKeep assignment is `boot-test.mjs` 19643; inventory cites object key 19724. Same pin.

## Overlay / persist / ctx

- `ctx.autopilot` live-only: `ctx.js` 16, 96–105. Not `WORLD_FIELDS`.
- `flags.chartOpen` session: `ctx.js` 208.
- Overlay gate: `galaxychart.js` 482–486 `canOpenPlayCard(ctx, 'chart')`.
- HUD Cancel: `hud.js` 1068–1076 `disengage(ctx, 'cancel')`.
- `jumpRequested` emit in `src/`: only `gate.js` 678.

## Cite nits (not bugs)

- Digit cites say `station.js` without `src/systems/`. File exists there, not `src/game/station.js`.
- Status paint range inventory 543–638 is `retargetPlot` dest/hop/unreachable/arrived. Accurate enough.
