## Status
CLEAN

## What I tested

Wave 120 iteration 2 leftover census re-freeze: designer **Major** KeyM SELECT typeahead vs chart close. Domain: data. No Vite. No Chrome. No formatters. No linters. No full test suite. This verifier did not edit `src/`, `scripts/`, wishlist, `PROGRESS.md`, or worker freeze files except this report.

Recheck targets:

1. `out/w120/chartlabel/shared-contract.md` §0.1 / §0.3 / §0.7 / §4: later KeyM close skip via live `isTypingFocus` is **allowed** on the **existing** `galaxychart.js` handler. It is **not** labeled as remap-forbidden.
2. Leftover still **REAL** (labels still inert in live `src/`).
3. This round did **not** write `src/`.
4. `overlay-policy.js` was **not** rewritten this round.
5. Sibling theft still forbidden (toast, AP `setOpen(false)`, `showApLive`, WAVE117 pins, hail, save, KeyJ, hub, `innerHTML`).
6. Escape still closes. Helper miss fail-closed (close as live; never trap).
7. Dest layout home is **under the desc** (designer Minor closed in freeze).

`[NO BROWSER COVERAGE]`

## 1. Contract: KeyM skip allowed, not remap-forbidden

Merge law: `out/w120/chartlabel/shared-contract.md` (LastWrite 2026-08-25 12:50). Design header points at it. Contract wins on conflict.

| Section | Freeze | Verdict |
|---|---|---|
| §0.3 | KeyM stays `e.code === 'KeyM'`. **Do not remap.** Later PR1 **may** edit the **existing** KeyM handler only: if chart open and `isTypingFocus()` (live `overlay-policy.js` **72–80**, includes `SELECT`), **do not** `setOpen(false)`. Skip is **not** a remap and **not** a new listener. **Do not** add a second window `keydown`. **Do not** rewrite `overlay-policy.js`. | Closed |
| §0.1 KeyM close vs dest typeahead | Same skip. Import `isTypingFocus` next to live `playSurfaceBlocked`. Escape still closes. | Closed |
| §0.7 | Existing close (`galaxychart.js` **700–704**): `open` + `isTypingFocus()` → do not close. If the call throws: `#rw-galaxy-dest` `activeElement` fallback. If both miss → **close as live**. **Never stop.** Escape still `setOpen(false)`. Do not invent a second helper. | Closed |
| §0.9 | **Must** import and **call** live `isTypingFocus`. Must **not** claim overlay-policy **body**. | Closed |
| §2 | Partial merge dest `<select>` without KeyM typing skip **forbidden**. KeyM not typing → close as live. Escape even if dest focused → close. | Closed |
| §3 / §4 | **Lands:** import `isTypingFocus` + existing KeyM close typing skip in `galaxychart.js`. **Forbidden separately:** KeyM **remap**; new KeyM listener; Escape skip. | Closed |

Designer Major asked to name the skip in §0.1 / §4 allowed `galaxychart.js` symbols so PR1 is not scared off as “KeyM remap.” §4 allowed line names the skip. Remap remains a **different** forbid (`e.code` stays `KeyM`; no new bind). Explicit non-pick “Skip dest KeyM typeahead” is **forbidden**. Explicit non-pick “Remap KeyH/M/L/J” is remap, not the typing skip.

Live helper already includes `SELECT`:

```
overlay-policy.js:72–80  isTypingFocus → INPUT / TEXTAREA / SELECT / contentEditable
overlay-policy.js:83–87  playSurfaceBlocked calls isTypingFocus on open only
galaxychart.js:5         import playSurfaceBlocked only (no isTypingFocus yet)
galaxychart.js:700–704   if (open) setOpen(false) always — skip not shipped
```

That is the correct leftover census: freeze later skip; do not ship it in this wave.

`docs/Nav07ChartLabelDesign.md` (12:52) matches: existing handler, not a remap, not a new listener, Escape still closes, overlay-policy not rewritten. Designer KeyM Major is **closed in freeze**. Worker `ui-audit.md` / `code-review.md` / `notes.md` / `security-review.md` say the same.

`designer-audit.md` (12:38) still scores the Major **open**. That file is the pre-refreeze designer snapshot. Worker did not rewrite it. Contract after 12:50 is merge law. This does **not** invert CLEAN.

## 2. Leftover still REAL

Live labels still do **not** activate. Dest `<select>` is still absent in `src/`. Serial **PR1 chart-label**. Not CONSUME.

| Claim | Live | Match |
|---|---|---|
| `.rw-galaxy-label` `pointer-events: none` | `hud.css` **2127–2132** | Yes |
| Labels have no `data-system-id` | `galaxychart.js` **283–290** (`class`, `x`, `y`, `text-anchor`; `textContent = sys.name`) | Yes |
| Click requires `isHitDisc` | **675–677** | Yes |
| Hover requires `isHitDisc` | **686–688** | Yes |
| Keys KeyM / Escape only; open always closes | **698–712**; **704** `if (open) setOpen(false)` | Yes |
| No dest list / `activateSystem` / `isPlotTarget` | grep `src/` `rw-galaxy-dest` / `createElement('select')` = 0 | Yes |
| `innerHTML` in galaxychart | grep 0 | Yes |
| Inbox still IDEA | wishlist **65–69** `[ ] IDEA (P2, NAV/A11Y)` | Yes |

If labels already plotted **and** dest list already existed **and** KeyM skip already shipped, leftover would be CONSUME. They do not. Inert labels plus always-close KeyM is still the inbox hole. Freeze correctly keeps REAL.

## 3. No `src/` writes this round

Round-2 pack timestamps (all after live `src/`):

| Path | LastWrite |
|---|---|
| `shared-contract.md` | 12:50:50 |
| `docs/Nav07ChartLabelDesign.md` | 12:52:01 |
| `notes.md` | 12:52:01 |
| inventory / code-review | 12:53:02 |
| security-review / ui-audit | 12:53:46 |
| `galaxychart.js` | **12:23:47** (before this freeze) |
| `hud.css` | **12:25:33** (before this freeze) |
| `overlay-policy.js` | **09:59:21** (sibling overlay; not this leftover) |

Dirty `galaxychart.js` / `hud.css` vs HEAD are overlay open-gate, NAV-05 live line, sibling AP success `setOpen(false)`, HUD-02 silhouettes — not chart-label dest/skip. This leftover pack is still markdown only (`docs/Nav07ChartLabelDesign.md` + `out/w120/chartlabel/**`). This verifier did not blame this worker for other-wave dirty trees.

## 4. overlay-policy.js not rewritten

`src/systems/overlay-policy.js` is untracked sibling overlay work. LastWrite **09:59:21**. Chart-label freeze files start **12:50**. Body still exports `isTypingFocus` with `SELECT` and `playSurfaceBlocked` catch-false. Contract forbids rewrite and requires **call** only from later `galaxychart.js`. Round 2 did not edit this file.

## 5. Sibling theft still forbidden

| Surface | Frozen | Where |
|---|---|---|
| Toast / extra `commLine` / `hud.js` | Do not steal | §0.10, §4 |
| `save.js` / persist / WORLD_FIELDS | Forbidden | §0.6, §4 |
| Overlay mutex / `hail.js` / overlay-policy **body** | Cite; call `isTypingFocus` only | §0.9, §4 |
| WAVE117 `chartStayOpen` / `chartEngageStay` / `scripts/boot-test.mjs` pins | Must not retune | §0.11, §4 |
| Autopilot success `setOpen(false)` | Sibling; do not fight; live **647–648** | §0.11 |
| `showApLive` rewrite | Forbidden; live `textContent` **586–590** | §0.8 |
| KeyJ / `controls.js` | Cite; do not remap | §0.3 |
| HUD-01 hub / Digit 0/8/9 | No dest pip; no new Digit | §0.2 |
| `innerHTML` | Forbidden | §0.4 |
| Pause | Never `flags.paused` from this leftover | §0.7 |

§4 forbidden file list still includes `hail.js`, `overlay-policy.js`, `autopilot.js`, `controls.js`, `state.js`, `nav.js` rewrite, `chart-hover.js` rewrite, `hud.js` toast, `save.js`, `station.js` Digit map, WAVE117 pins, wishlist, `PROGRESS.md`.

## 6. Escape still closes; helper miss fail-closed

| Case | Freeze | Live today |
|---|---|---|
| Escape while open | `setOpen(false)` even if dest focused. Do **not** skip Escape unless later playtest. §0.7 / §2 / formula **161–163** | **710–712** already closes |
| `isTypingFocus` throws | dest id fallback; then close as live | skip not shipped |
| Helper miss (no focus, no dest id) | **close as live**; never trap; never stop | **704** already closes |
| Open helper miss | `playSurfaceBlocked` catch-false; live open | **706–708** |
| Second `isTypingFocus` / overlay-policy rewrite | Forbidden | not done |

Fail-closed is **close the chart**, not trap it. That matches live always-close until PR1 lands the typed skip.

## 7. Dest layout under desc (designer Minor)

Designer Minor asked for a layout home that does not shrink Autopilot / Close.

| Freeze | Text |
|---|---|
| §0.1 Dest layout | Label+select sit **under the desc**, not in the title/actions row. Clear / Autopilot / Close stay in the **top** actions cluster (min 24). Do not cover those buttons. Do not put the select over the SVG. Do not raise z. |
| §0.19 | Dest sits **under the desc** (after those buttons in DOM). |
| §0.1 Focus | Tab order **after** Close (DOM under desc). No autofocus. No trap. |
| §4 hud.css | Dest control **under desc**. Forbidden: dest over SVG or Autopilot/Close |

Worker `ui-audit.md` marks this Minor **closed in freeze**. `designer-audit.md` still cites old “before Clear”; that cite is stale vs current §0.1 Focus. Contract wins.

## Bugs found

None that invert leftover REAL, KeyM skip deputize, dest-under-desc, sibling theft, overlay-policy rewrite, `src/` write-set, Escape close, or helper-miss fail-closed.

`designer-audit.md` still shows Major/Minor open. That is a pre-refreeze snapshot (12:38), not current merge law (12:50+). Do not treat it as an open freeze hole.

Inventory AP-close line cites remain stale vs live **647–648** (citation drift from round 1). Behavior claims for labels / discs / keyboard dest still match. Later PR1 must re-census `galaxychart.js`. This does **not** invert REAL.

## Environmental issues

None that block this verify.

`graph_resolve` (`codex/agent-codex`) returned `execute_workflows` for `codex/workflow-pdf-processing` (score 47.14, coverage 0.09, terms `layout` / `read` / `verify`). Trigger is PDF extract/fill/export. This task is a local leftover census. Treated as a false match. Did not use PDF tools. Did not write the graph. Did not start Vite or Chrome. This verifier left no Vite/Chrome process.

`[NO BROWSER COVERAGE]`

## Evidence

- report path: `C:\Projects\WebSim\out\w120\chartlabel\verify\report-2.md`
- contract (merge law): `C:\Projects\WebSim\out\w120\chartlabel\shared-contract.md`
- design: `C:\Projects\WebSim\docs\Nav07ChartLabelDesign.md`
- inventory: `C:\Projects\WebSim\out\w120\chartlabel\current-chartlabel-inventory.md`
- prior verify: `C:\Projects\WebSim\out\w120\chartlabel\verify\report.md`

Live citations (1-based):

```
overlay-policy.js:72–80    isTypingFocus includes SELECT (call later; do not rewrite)
galaxychart.js:5           import playSurfaceBlocked only
galaxychart.js:283–290     label text; no data-system-id
galaxychart.js:586–590     showApLive textContent only
galaxychart.js:647–648     sibling AP success setOpen(false)
galaxychart.js:675–684     click: isHitDisc else return
galaxychart.js:686–692     pointerover: isHitDisc else return
galaxychart.js:700–704     KeyM open always setOpen(false)
galaxychart.js:710–712     Escape still setOpen(false)
hud.css:2127–2132          .rw-galaxy-label pointer-events none
wishlist:65–69             IDEA (P2, NAV/A11Y) still inbox
```
