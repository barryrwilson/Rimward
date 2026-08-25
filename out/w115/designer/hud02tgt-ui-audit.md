# UI Audit: HUD-02 remaining TARGET class silhouettes (Wave 115)

**Auditor:** `[designer]` (independent of `out/w115/hud02tgt/ui-audit.md`)
**Scope:** Wave 115 HUD-02 remaining TARGET class silhouettes — markdown freeze only. Confirm leftover chrome is a **22×10 class hint on existing target facing**, not a hub pip, not a Digit, not a steal of WAVE113/114 player tokens, not lock class on `#hud`.
**Review file:** `out/w115/designer/hud02tgt-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Hud02RemainingTargetSilhouettesDesign.md`, merge law `out/w115/hud02tgt/shared-contract.md` (wins on conflict), inventory `out/w115/hud02tgt/current-hud02-target-silhouette-inventory.md`. Worker self-audit `out/w115/hud02tgt/ui-audit.md` read, not copied. Live cites: `src/systems/hud.js`, `src/ui/hud.css`, `src/systems/npc.js`, `src/game/traffic-feel.js`. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w115/hud02tgt/shared-contract.md` wins if the brief forks. This wave does not ship overlay CSS. Findings bind **later PR1**. Serial is named only.

## UI Audit: HUD-02 target facing class hint (leftover freeze)

### Summary

No product UI ships this wave. The pack freezes leftover as **allowlisted `data-class-key` on `.rw-combat-target` only** plus a **scope fix** of live WAVE113/114 player selectors to `.rw-combat-self`. Fail closed is generic **player-family** facing on the **target** row. The brief does **not** put lock class on `#hud`. It does **not** add a hub child. FORE/AFT stay. Digit 0/8/9 stay. Q-ship glyph follows cover / visual class. WAVE113/114 metrics stay player art (cite, do not rewrite).

**Counts:** 🔴 Blocker **0**. 🟠 Major **0** (open). 🟡 Minor **4**. 💡 Suggestion **3**.

### Verdict

**PASS.** The freeze would not mix player vs lock on `#hud` and would not parent class chrome into the 80 px hub. Live unscoped player CSS still lies on `tgtFacing`; leftover is **real** (not CONSUME). Later PR1 must land the scope split. Do not treat the leak as a target-class feature.

---

### Honor / Blocker gate

Flag **Blocker** if the brief would put lock class on `#hud` and mix player vs target glyphs, or add a hub child. It does neither.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| HUD-01 empty 80 px hub | Goals 8; contract §0.2; no new DOM on `.rw-reticle` | `.rw-reticle` 80×80 (`hud.css` 184–193); pupil + 3 cilia + RANGE (`hud.js` 726–729) | **Pass.** No hub child scheduled. |
| No hub pip | Explicit non-pick; PR1 “does not land” hub | RANGE word only when in-range (`hud.css` 207–220; `hud.js` 729) | **Pass.** Class stays in the 22×10 sil. |
| No new Digit; Digit 0/8/9 stay | Honor; contract §0.3 | shipyard / launch / Standing (`station.js` 188, 5963–5966, 6100–6105) | **Pass.** Home is `hud.js` + `hud.css`. |
| FORE/AFT stay | Picture; contract §0.14 | `makeFacing` FORE/AFT text nodes (`hud.js` 353–361, 864, 875); class CSS nose/body only | **Pass.** Words + fill vs hollow remain the facing cue. |
| WAVE113/114 tokens stay **player** | Honor; contract §0.21 / §0.1 | Bio `hud.css` 1590–1669; mech `hud.css` 1286–1336; writer `classKeyToken` player only (`hud.js` 101–108) | **Pass.** PR1 **narrows** selectors. It does not rewrite clip-path / plate tuples. |
| PR1 must not restyle **player** facing from **lock** class | contract §0.11–0.13; one `#hud` writer stays player | `applyClassKeyAttr` on `#hud` (`hud.js` 110–115, 1101, 1758) | **Pass.** Lock attr is `.rw-combat-target` only. Player CSS → `.rw-combat-self`. |
| Do not put lock class on `#hud` (mix gate) | Non-pick; contract §0.11 | Today `#hud[data-class-key]` restyles **both** rails from **player** (leak) | **Pass as freeze.** Brief forbids the mix path. See closed Major. |
| Target glyph must not leak Q-ship true class | contract §0.12; `visualClassFor` | Cover mesh `npc.js` 276–277; helper `traffic-feel.js` 114–121; Mk II unmasks **name** only (`hud.js` 2068–2071) | **Pass.** Glyph = `coverClass ?? 'freighter'` while unrevealed. Mk II does not unmask the sil. |
| KeyT / KeyV / KeyK / KeyX stay | Honor; contract §0.3 | `controls.js` 44, 268, 280–290 | **Pass.** No remap. |

If a later worker writes lock `classKey` onto `#hud.dataset.classKey`, parents a class pip into `.rw-reticle`, or keys target CSS off `#hud[data-class-key]`, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Class hint inside existing 22×10 `.rw-facing-sil`; never grow sil | **Pass.** Leftover forbids width/height/flex-basis change. Cite WAVE113/114 in-box metrics. Unreadable key → omit **that** target rule. | `hud.css` 239–244; contract §0.14 |
| Two facing copies; leftover does not invent a third glance row | **Pass.** `makeFacing(selfRail)` and `makeFacing(tgtRail)` already exist. | `hud.js` 863–875 |
| Target rail already hides for non-ship | **Pass.** No class chrome in the glance set while `.is-hidden`. | `hud.js` 873, 1253–1268; `hud.css` 36 |
| Family from **player**; class inside family | **Pass.** No lock `data-family`. Bio player + plated lock still sees organism language. | `hud.js` 81–89; contract §0.14 |
| Fail closed unknown / proto / missing lock | **Pass.** Omit `tgtRail.dataset.classKey`. Generic family facing still paints on the target row. Never throw. Never `innerHTML`. | contract §0.12 / §2 |
| `reducedMotion`: no new facing loops | **Pass.** Static clip / plate only. Live kill-all stays. | `hud.css` 1183–1188; contract §0.15 |
| Color never the only class cue | **Pass.** Cite live geometry. Keep cyan / `--rw-accent` / `--vein`. Color-blind FORE/AFT inset stays. | `hud.css` 310–317, 1286–1336, 1590–1669 |
| Duel parity | **Pass.** Same glance set, same cadence. Accent inside the sil. Screen / Shell / petals / SPD / RANGE do not move. | contract §0.16 |
| Target reverse meters do not flip the sil | **Pass.** Row-reverse is `.rw-combat-target .rw-meter` only. `.rw-facing` is not a meter. | `hud.css` 901–907 |
| Earth photocopy glyphs | **Pass.** Cite WAVE113 mass/length/tautness and WAVE114 triangle+square. No shark/tank toys. | contract §0.19 |
| Persist / Digit / `state.js` | **Pass.** Attribute is DOM-only. No `world.tgtClass`. | contract §0.5–0.6 |

---

### What's done well

- Census refuses CONSUME. Live `#hud[data-class-key] .rw-facing-*` restyles `tgtFacing` from the **player** class (`hud.css` 1286–1336, 1590–1669; `makeFacing` 864 and 875). That is a lying glyph, not a lock-class token. Grep hole `.rw-combat-target[data-class-key]` is real.
- Two writers, two nodes: keep `applyClassKeyAttr` on `#hud` for **player**. New rail writer on `.rw-combat-target` only. That is the only structure that can show **heavy** on self and **ace** on lock without mixing.
- Selector shape in the formula is correct: player `#hud[data-family][data-class-key] .rw-combat-self .rw-facing-*`; target `#hud[data-family] .rw-combat-target[data-class-key] .rw-facing-*`. Family attr stays on `#hud` (player). Class attr for lock stays on the rail.
- Cover law matches the mesh: unrevealed Q-ship uses `coverClass ?? 'freighter'` (`npc.js` 276–277; `visualClassFor` 114–121). Hidden `state.classKey` is the cutter under the cover hull. The 22 px sil must follow the hull you see.
- Mk II pierce already unmasks **rail name** (`hud.js` 2068–2071`) and does **not** swap the 3D mesh. Glyph-follows-name would leak cutter while the mesh is still a cover freighter. Freeze keeps the sil on cover until `revealed`.
- No new control, hit target, toast, or settings checkbox. KeyT / KeyV / KeyK / KeyX stay. `body.rw-reduced-motion` / `rw-colorblind` / `rw-contrast` stay.
- Empty / error state is generic family facing on the target row, not a blank sil and not a hub caption. Partial merge (JS without CSS or CSS without JS) still paints family chrome.
- 80 px hub, RANGE, Digit 0/8/9, and Wave 62/65 family skins stay out of this leftover.

---

### Findings

None at 🔴 Blocker. No **open** 🟠 Major.

#### 🟠 Major (closed in freeze): Unscoped player class CSS lies on the target row

**Location:** `src/ui/hud.css:1286–1336`, `1590–1669`; `src/systems/hud.js:864`, `875`; inventory §4 / §11
**Issue:** Live `#hud[data-family][data-class-key] .rw-facing-*` matches every facing under `#hud`. A player heavy who locks an ace currently shows **two heavy** glyphs. FORE/AFT on the lock still work; the sil lies. Treating that leak as CONSUME would ship a false lock identity.
**Fix landed (markdown):** leftover is **real**. PR1 must (1) narrow player selectors to `.rw-combat-self`, (2) write allowlisted **visible** lock class on `.rw-combat-target` only, (3) author target CSS that cites WAVE113/114 22×10 metrics. Fail closed omit → generic **family** facing on the target row, **not** the player class leak.
**Status:** closed in contract §0.1 / §0.13. Do not reopen as CONSUME. Serial is **PR1 target facing class tokens**, not none.

#### 🟠 Major (closed in freeze): Lock class on `#hud` would mix player vs target

**Location:** `applyClassKeyAttr` `hud.js` 110–115; contract §0.11–0.13; user Blocker gate
**Issue:** One root `data-class-key` cannot drive mount class and lock class. Writing lock class onto `#hud` would restyle `selfFacing` from the lock (or keep mixing both). Adding a hub child would reopen HUD-01.
**Fix landed:** no second writer on `#hud.dataset.classKey`. No hub pip. Target rail is a different node.
**Status:** closed. Brief would **not** trip the Blocker gate.

#### 🟠 Major (closed in freeze): Hub pip / RANGE class word

**Location:** `hud.css` 184–193; `hud.js` 726–729; contract §0.2
**Issue:** A 22 px hint is easy to “clarify” with a class pip on the aim glass or a class word under RANGE.
**Fix landed:** no new DOM on `.rw-reticle`. RANGE stays TGT-01.
**Status:** closed.

#### 🟠 Major (closed in freeze): Q-ship true class on the glyph

**Location:** `npc.js` 276–277; `traffic-feel.js` 114–121; rail name `hud.js` 2068–2071; contract §0.12
**Issue:** `state.classKey` on a disguised Q-ship is the hidden cutter. Mk II already unmasks **name**. A glyph that followed name-pierce or hidden state would leak cover while the mesh is still the cover freighter.
**Fix landed:** glyph uses visual / cover class. Mk II does not unmask the sil. Reveal may then follow true class.
**Status:** closed.

#### 🟡 Minor: Light lock and omitted key look the same

**Location:** contract §0.1 “light may keep generic”; live mech/bio: no extra rule for `light` (`hud.css` 1286–1336 starts at heavy; 1590–1669 starts at heavy)
**Issue:** Allowlisted `light` and fail-closed omit both paint generic family facing on the target row. A light lock vs an unknown lock is not a distinct glance.
**Fix:** Accepted. Same as WAVE113/114 player light. Do not put LIGHT / ACE words on FORE/AFT or RANGE to split them.
**Status:** accepted.

#### 🟡 Minor: Family language follows the player, not the lock hullKind

**Location:** contract §0.14 last paragraph; integrator player outcome; `hudFamily` `hud.js` 81–89
**Issue:** A bio player who locks a plated ace still sees the WAVE113 **organism** ace clip on the target row, not the WAVE114 plate. A mech player who locks a living hull still sees plates. The 3D mesh and the 22 px hint can disagree on grown vs built.
**Fix:** Frozen. Class is inside **player** family. Lock-family `data-family` on the rail would be a third family and is a non-pick (Wave 61 §3.2 / Wave 62 consume).
**Status:** accepted. Playtest may notice; do not “fix” with lock family.

#### 🟡 Minor: Mk II pierced name and cover glyph disagree

**Location:** `hud.js` 2068–2071 vs cover freeze contract §0.12
**Issue:** After Mk II pierce the rail **name** can show the true hull while the sil stays cover (usually freighter). Same rail, two identities. That can read as a HUD bug.
**Fix:** Do **not** unmask the glyph to match the name. Mesh is still cover. Name pierce is scanner law; class hint is hull-you-see law. Optional later copy is out of this leftover.
**Status:** accepted (security over glance alignment).

#### 🟡 Minor: 22×10 mismatch pairs may not read (this leftover’s job)

**Location:** live cutter vs light mech (`hud.css` 1267–1280 vs 1305–1313: 1 px realloc, same top/height); bio ace/cutter/frigate clips (`hud.css` 1607–1653); contract §0.14 “if a key cannot read in-box, omit that key’s **target** CSS”
**Issue:** WAVE114 already accepted cutter≈light at HUD scale. This leftover exists so **self ≠ lock** can read. Player `light` (generic plate) vs lock `cutter` (nose 4 / 17×6) may still look like two generic plates. Bio taut classes can collapse to “skinny blob” at `--rw-text-scale` 0.85 or in combat dim.
**Fix:** PR1 cites live tuples; do not invent a third zoo and do not grow the sil. After playtest, omit **unread target** keys (generic family facing on that lock) rather than add a caption, hub pip, or fill-color cue.
**Status:** open for the implementation wave / optional PR2 stills. Not a freeze hole.

#### 💡 Suggestion: Forbid the descendant anti-pattern `#hud[data-class-key] .rw-combat-target`

**Location:** contract formula comments ~120–121; deputize PR1 item 3
**Issue:** Positive selectors are correct. A later PR that “scopes” player CSS by adding `.rw-combat-target` as a **descendant of `#hud[data-class-key]`** (player root) would still paint the **player** class on the lock row. Mix returns without writing lock class onto `#hud`.
**Fix:** PR1 must not ship `#hud[data-class-key] .rw-combat-target`. Target rules match `.rw-combat-target[data-class-key="…"]` only. Player rules match `.rw-combat-self` only.
**Status:** optional contract footnote. Formula already shows the right shape.

#### 💡 Suggestion: Optional `overflow: hidden` on `.rw-facing-sil`

**Location:** `hud.css` 239–244 (no overflow); WAVE113 designer note
**Issue:** Sil does not clip. Cited metrics fit (`left+width` / clip right edge ≤ 22). A later px retune could ink the 8 px FORE/AFT gap or the 78 px rail gap.
**Fix:** Optional overflow clip on the sil box only. Do not change width/height/flex-basis.
**Status:** optional. Not required for the freeze.

#### 💡 Suggestion: Optional PR2 mismatch stills at 1600×900

**Location:** contract §3 PR2; this audit did not start a browser
**Issue:** Spec audit only. Need stills of (player class ≠ lock class), (same class both rails), unknown lock, unrevealed Q-ship cover, Mk II pierced name + cover glyph, bio-player + plated lock, mech-player + living lock, `reducedMotion`.
**Fix:** Skip if PR1 reads enough. Do not make stills required with PR1. Do not use stills as a reason to grow the sil or add a hub pip.
**Status:** optional; named in the serial plan.

---

### Accessibility / theming / layout / states

- **Accessibility:** No new control, name, or keyboard path. Facing is not a button. FORE/AFT stay words plus fill vs hollow (`hud.js` 353; `hud.css` 281–317). Color-blind inset ring on `.is-lit` stays. Class cue is shape (clip-path / plate metrics), not a second palette.
- **Theming:** Target selectors must copy live tokenized paints (`--vein` mix on bio; inherited mech `rgba(111, 242, 224, …)`). Do not hardcode a lock-only accent that becomes the class cue.
- **Responsive:** Sil stays px-frozen 22×10. FORE/AFT still scale with `--rw-text-scale`. XL type must not replace the glyph with a class caption. Do not steal AGEZ / 78 px `RAIL_GAP` (`hud.js` 117).
- **States:** Loading N/A. Empty / no ship lock = rail `.is-hidden` (`display: none`, `hud.css` 36) and omit attribute immediately. Error / unknown / proto = generic family facing on the target row. Disabled N/A. Hover N/A. Focus N/A.
- **Vestibular:** No new `@keyframes` on facing. Live `body.rw-reduced-motion #hud *` already sets `animation: none`. Facing-flash on the **words** is pre-existing and already static under reduced motion (`hud.css` 305–307).
- **Hidden rail:** `#hud .is-hidden { display: none; }` removes the target row from the glance set. Class attr must still drop so a later show does not flash a stale key.

### Digit / hub freeze table

| Surface | Freeze |
|---|---|
| `.rw-reticle` 80×80 | empty of class; RANGE in-range only |
| Hub child / class pip | **none** |
| Digit 0 | shipyard |
| Digit 8 | launch (dock root) / launcher papers (outfitting) |
| Digit 9 | Standing (dock root) / turret papers (outfitting) |
| KeyT / KeyV / KeyK / KeyX | stay |
| WAVE113 bio / WAVE114 mech | player facing; PR1 scope to `.rw-combat-self` only |
| Lock class DOM | `.rw-combat-target[data-class-key]` later; **not** `#hud` |

### Worker self-audit delta

Worker `out/w115/hud02tgt/ui-audit.md` reports 0 open Blocker / Major, closed freeze Majors (lying tgt glyph, hub pip, Q-ship), three accepted Minors (light, family language, color), one Suggestion (do not reuse RANGE/MATCH/contacts). This pass **agrees** on the Blocker gate and the closed Majors. Extra notes: Mk II name vs cover glyph as an accepted glance conflict; 22×10 mismatch pairs are more load-bearing now that the leftover is self≠lock; descendant anti-pattern `#hud[data-class-key] .rw-combat-target` as a mix footgun even if lock class never touches `#hud`.

Did not start Vite or Chrome. Did not edit `src/`. Did not spawn children.
