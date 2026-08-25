## Status
CLEAN

## What I tested

Markdown leftover census for Wave 120 P2 NAV/A11Y **PR1 chart-label**. Domain: data. No Vite. No Chrome. No formatters. No linters. No full test suite. This verifier did not edit `src/`, `scripts/`, wishlist, `PROGRESS.md`, or worker freeze files.

Recheck targets:

1. Live `src/systems/galaxychart.js` and `src/ui/hud.css`: labels, `isHitDisc`, click/hover, KeyM/Escape, aria, dest `<select>`. Code wins. REAL vs CONSUME.
2. Merge law forbids sibling theft (toast, `save.js`, overlay-policy, hail, WAVE117 pins, Autopilot success `setOpen(false)`, `showApLive` rewrite, KeyJ, hub, Digit 0/8/9, `state.js`, `innerHTML`, persist, pause).
3. This worker did not write `src/`, `scripts/`, wishlist, or `PROGRESS.md`.
4. `docs/Nav07ChartLabelDesign.md` exists and names the contract as merge law.
5. Deputize is smallest additive and playable. Labels + dest `<select>` are one leftover. Partial merge is forbidden in the contract.
6. `[NO BROWSER COVERAGE]` is expected.

## Leftover REAL vs live code

Live labels still do **not** activate. Leftover is **REAL**. Not CONSUME. Serial name **PR1 chart-label** is correct.

| Claim (inventory / contract) | Live | Match |
|---|---|---|
| `.rw-galaxy-label` `pointer-events: none` | `hud.css` **2127–2132** | Yes |
| Labels have no `data-system-id` | `galaxychart.js` **283–290** (`class`, `x`, `y`, `text-anchor` only; `textContent = sys.name`) | Yes |
| Click requires `isHitDisc` | **675–677** | Yes (line drift; see below) |
| Hover requires `isHitDisc` | **686–688**; `applyHoverId` inspect only | Yes |
| Discs transparent, mouse-only, 24 CSS px | Build **272–279**; CSS **2111–2116**; `HIT_CSS_DIAMETER = 24` **46**; `updateHitRadii` **443–460** | Yes |
| Keys KeyM and Escape only | **698–712** (`e.code === 'KeyM'` / `'Escape'`). No dest keys. | Yes |
| SVG `role=img`; no dest list | SVG **195–201**; no `createElement('select')` / `rw-galaxy-dest` / `activateSystem` / `isPlotTarget` / `tabindex` in this file | Yes |
| Authored ∪ pinned ∪ hub ≈ 12 names vs ~94 generated | Authored 7 (`AUTHORED_IDS` **52**). Generated 94 (`galaxy.generated.js` header + 94 object keys; `state.js` **580–583**). Pinned 5 (`PINNED_IDS` **53**). Generated hubs are `fx_bastion`, `gc_auction`, `blackstation` (already pinned). Unique label ids = **12**. | Yes |
| `innerHTML` in galaxychart | grep 0. Labels use `textContent` **289**. `showApLive` uses `textContent` **586–590**. | Yes |
| Inbox still IDEA | `docs/PLAYER-EXPERIENCE-WISHLIST.md` **65–69** still `[ ] IDEA (P2, NAV/A11Y)` | Yes |

If labels already plotted, leftover would be CONSUME and this freeze would be a bug. They do not. Click still returns unless `isHitDisc`. Labels still sit above discs with `pointer-events: none`, so a click on the glyph does not plot unless the pointer also hits the disc on the node.

## Citation drift (not leftover-verdict)

Inventory cites click **659–668**, hover **670–676**, keys **682–697**, Autopilot **633–650** with **no** `setOpen(false)` yet.

Live after sibling overlay + chart-close inserts:

- Click **675–684**
- Hover **686–692**
- Keys **698–712**
- Autopilot click **633–666** already has `showApLive(''); setOpen(false);` at **647–648** plus blur/chip focus **649–663**

`galaxychart.js` last write 2026-08-25 12:23; inventory 12:25. The AP-close insert was already in the file at census time. Inventory §6 snapshot is stale on that branch. The pack already says: sibling **may** insert `setOpen(false)`; do **not** census that branch as this leftover; later PR1 **must re-census**. Behavior claims for **labels / discs / keyboard dest** still match live code. This does **not** invert REAL.

`isHitDisc` **77–85**, label build **283–291**, `HIT_CSS_DIAMETER` **46**, `showApLive` **586–590**, `setOpen` open-gate **421–441**, overlay import **5** still match.

## Merge law (sibling theft)

`out/w120/chartlabel/shared-contract.md` is merge law. Design header points at it. If they disagree, the contract wins.

| Surface | Frozen | Where |
|---|---|---|
| Toast channel / extra `commLine` | Do not steal. Call `plotRoute` / `clearRoute` only (they already `commLine`) | §0.10, §4 forbids `hud.js` toast, `save.js` |
| `save.js` / persist | No new `WORLD_FIELDS` / `localStorage`. Dest value not persisted. Live `WORLD_FIELDS` has `nav` not chart-focus (`save.js` **77–101**) | §0.6 |
| Overlay mutex / `hail.js` / `overlay-policy.js` | Cite only. Do not raise chart z (live `hud.css` **1909** z 30). Do not skip hail flush | §0.9, §4 |
| WAVE117 `chartStayOpen` / `chartEngageStay` | Must not retune | §0.11 |
| Autopilot success `setOpen(false)` | Sibling PR1 chart-close. Must not fight. Must not claim | §0.11; live **647–648** already lands sibling close |
| `showApLive` rewrite | Forbidden. Body stays `textContent` **586–590** | §0.8 |
| KeyJ / `controls.js` | Cite. Do not remap. Live KeyJ `pendingDock` **302–304** | §0.3 |
| HUD-01 hub / Digit 0/8/9 | No dest pip. No new Digit | §0.2 |
| `state.js` | READ-ONLY later | §0.5 |
| `innerHTML` | Forbidden | §0.4 |
| Pause | Never `flags.paused` from this leftover | §0.7 |
| Plot on hover | Forbidden | §0.20 |

## Worker write-set

Untracked pack (this leftover):

- `docs/Nav07ChartLabelDesign.md`
- `out/w120/chartlabel/current-chartlabel-inventory.md`
- `out/w120/chartlabel/shared-contract.md`
- `out/w120/chartlabel/notes.md`
- `out/w120/chartlabel/security-review.md`
- `out/w120/chartlabel/code-review.md`
- `out/w120/chartlabel/ui-audit.md`

No `src/` writes that add label click or dest `<select>`. Dirty `galaxychart.js` vs HEAD is overlay open-gate, NAV-05 `autopilotDisengaged` live line, and sibling AP success `setOpen(false)` — not this leftover. Dirty `hud.css` vs HEAD is HUD-02 silhouettes + toast visibility; `.rw-galaxy-label` still `pointer-events: none`.

Dirty `PROGRESS.md` / wishlist / `scripts/boot-test.mjs` are other-wave / sibling work. Wishlist IDEA row is still inbox. This verifier does not blame the chart-label worker for those dirty trees. Chart-label pack does not steal `out/w120/toast/**` or `out/w120/chartclose/**`.

## Design doc + deputize

`docs/Nav07ChartLabelDesign.md` exists. Merge law field: `out/w120/chartlabel/shared-contract.md`. Contract wins on conflict.

Deputize: labels use the same plot path as hit discs (`activateSystem` → `clearRoute` / `plotRoute` + `retargetPlot(true)`). Enlarge by label box. Keep `HIT_CSS_DIAMETER` 24. One named dest `<select>` covers keyboard + unlabeled generated systems.

PR1 is **one leftover that must land both**. Contract §2:

- Partial merge (labels click, no dest list) **forbidden**
- Partial merge (dest list, labels still `pointer-events: none`) **forbidden**

That is documented. It is not two unnamed leftovers. SVG roving tabindex is **not** required PR1. Smallest additive and playable: yes.

## Bugs found

None that invert leftover REAL, merge law, write-set, or deputize.

Inventory Autopilot line snapshot is stale (sibling `setOpen(false)` already live at **648**). Recorded as citation drift. Later PR1 must re-census `galaxychart.js`.

## Environmental issues

None that block this verify.

`graph_resolve` (`codex/agent-codex`) returned `execute_workflows` for `codex/workflow-automation-management` (score 16.39, coverage 0.12). Trigger is Codex automation create/inspect/pause. This task is a local leftover census. Treated as a false match. Did not use the automation scheduler. Did not write the graph. Did not start Vite or Chrome. This verifier left no Vite/Chrome process.

`[NO BROWSER COVERAGE]`

## Evidence

- report path: `C:\Projects\WebSim\out\w120\chartlabel\verify\report.md`
- inventory: `C:\Projects\WebSim\out\w120\chartlabel\current-chartlabel-inventory.md`
- contract (merge law): `C:\Projects\WebSim\out\w120\chartlabel\shared-contract.md`
- design: `C:\Projects\WebSim\docs\Nav07ChartLabelDesign.md`

Live citations (1-based):

```
galaxychart.js:46          HIT_CSS_DIAMETER = 24
galaxychart.js:52–53       AUTHORED_IDS 7; PINNED_IDS 5
galaxychart.js:77–85       isHitDisc → class token rw-galaxy-hit only
galaxychart.js:195–201     SVG role=img
galaxychart.js:272–279     hit disc transparent, data-system-id, pointer-events all
galaxychart.js:283–290     label text; no data-system-id
galaxychart.js:421–425     setOpen canOpenPlayCard (overlay; do not steal)
galaxychart.js:443–460     hit r = max(NODE_R, 12/scale) → 24 CSS px
galaxychart.js:586–590     showApLive textContent only (NAV-05; do not rewrite)
galaxychart.js:647–648     sibling AP success setOpen(false) (do not fight)
galaxychart.js:675–684     click: isHitDisc else return; plotRoute/clearRoute
galaxychart.js:686–692     pointerover: isHitDisc else return; no plot
galaxychart.js:698–712     KeyM / Escape only
hud.css:1909               .rw-galaxy-chart z-index 30
hud.css:2111–2116          .rw-galaxy-hit transparent; pointer-events all
hud.css:2127–2132          .rw-galaxy-label pointer-events none
state.js:580–583           authored then 94 generated
controls.js:302–304        KeyJ pendingDock (cite; do not remap)
nav.js:30–36, 271–300      sanitizeSystemId / clearRoute / plotRoute (call only)
wishlist:65–69             IDEA (P2, NAV/A11Y) still inbox
```
