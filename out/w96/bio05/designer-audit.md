## UI Audit: BIO-05 remaining Abominations (design freeze)

Persona: `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`.  
Guide: `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
Wave 96 ships **no new UI**. This pass audits proposed (and frozen-live) player-facing copy and surfaces in the brief + merge law against live Gilded papers. Review only. Do not edit `src/`.

Sources: `docs/Bio05AbominationsDesign.md`; `out/w96/bio05/shared-contract.md`; `out/w96/bio05/current-bio05-inventory.md`; worker `out/w96/bio05/ui-audit.md`; live `src/systems/shipyard-desk.js`, `src/systems/hud.js`, `src/systems/station.js`, `src/systems/ship.js`.

### Summary

The brief preserves live Gilded graft papers, dock Digit 0 as Shipyard, and HUD-02 **mech** for grafted built. It does not add a hangar grafted badge or an aim-glass pip. No remaining Blocker or Major. Worker self-audit is accepted.

### Freeze checks (this wave’s job)

| Check | Verdict | Cite |
|---|---|---|
| Live graft papers kept | **Pass.** Contract §1.2 copies live strings. Brief does not replace them. | `shared-contract.md` 42–54; `shipyard-desk.js` 52–69, 288–290, 360–418 |
| Digit 0 shipyard | **Pass.** Dock Digit 0 stays last service `shipyard`. Yard Digit 0 stays hangar row 8. Graft is click Offer, not a stolen Digit. | Brief 117; contract §0.5; `station.js` 186, 5801–5804, 5920–5922; `shipyard-desk.js` 18–20, 143–151, 411–418, 464–496 |
| HUD-02 mech for grafted built | **Pass.** HUD reads `hullKind === 'built'` → `mech`. HUD never writes `hullKind`. HUD does not read `grafted`. Mesh stays plated. | Brief 116; contract §0.6; `hud.js` 76–85; `ship.js` 535–560 |
| No competing hangar badge | **Pass.** Default omit. Owner-open only. | Brief 121; contract §2.3; `shipyard-desk.js` 397–403 |
| No aim-glass pip / gauge | **Pass.** Non-goal. Do not reopen HUD-01 empty glass. Digit 5 stays existing WPN `5 · name` / `5 · —`. | Brief 90; contract §0.7, §0.11; `hud.js` 222–224 |

Merge law: if the brief and `shared-contract.md` disagree, the **contract wins**.

### Live copy (must stay)

Pinned from `shipyard-desk.js` against contract §1.2:

| Moment | Live string | Line |
|---|---|---|
| Offer title | `Graft tissue` | 413 |
| Offer meta | `` `${GRAFT_LIST_UU} UU · Mounted plated hull.` `` (`GRAFT_LIST_UU` = 4000) | 414; `shipyard.js` 26 |
| Offer action | `Offer graft` | 415 |
| Confirm title | `Graft tissue` | 363 |
| Confirm warn | `Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.` | 67–68, 365 |
| Confirm warn (reduced) | `Beautiful Ones become enemies.` | 69, 361–365 |
| Confirm action | `Confirm graft` | 366 |
| Cancel | `Esc — Cancel` | 370 |
| Success | `Tissue sealed to the hull.` | 289 |
| Living / Unk | `Grafts fit plated hulls only.` | 59 |
| Already | `This hull is already grafted.` | 60 |
| Banner | `The Chain does not graft here.` | 61 |
| Hostile Gilded | `No sale.` | 62 |
| Credits | `Not enough credits.` | 63 |

Host `h()` / `btn()` use `textContent` (`station.js` 4302–4311). `innerHTML` stays forbidden.

Digit 9 already names the cap (not a new BIO-05 rail):

- Move: `Graft caps ${beautiful} at min(current, -10) while any grafted row remains.` (`station.js` 1157)
- Live: `Patrols hunt at standing -10 or below.` and `Graft: ${beautiful} min(current, -10) while any grafted row remains.` (`station.js` 1170, 1178)

### What's done well

- Graft reuses the yard two-step: Offer → Confirm / Esc (`shipyard-desk.js` 360–418). Same Hangar pane as Mount.
- Warn sits on the **confirm** row, not only Digit 9. Hostility is not a silent standing write (`GRAFT_WARN` 67–68).
- Reduced motion swaps to `GRAFT_WARN_REDUCED` without extra animation (`shipyard-desk.js` 361–365).
- Success is a notice, not a blocking modal (`shipyard-desk.js` 288–290).
- Refuse lines are short and specific (`GRAFT_REFUSE_LINES` 52–65). Living and Unknowables share one plated-only line. Hostile Gilded is `No sale.` (same grammar as yard buy).
- Graft is a Hangar **button**. Digits 1 Hangar / 2 Yard / 3+ and 0 index hulls. Pending papers swallow digits without debit (`shipyard-desk.js` 487).
- Dock menu still paints `0 — Shipyard` (`station.js` 5801–5804). Esc cancels graft pending before undock (`station.js` 5930–5931).
- HUD grafted built stays **mech**. Digit 5 eligibility is `canFirePsionic`, not HUD family. Aim glass stays empty (HUD-01).
- Color is not the only hostility cue: confirm sentence + Digit 9 notes + patrol hunt at −10.
- Brief §2 splits **live Gilded graft** from **helper-ready destroy +5**. No “friend standing” toast is proposed. Player loop PRs stay skipped (contract §1.7).
- Optional leftovers (NPC traffic, plated overlay, badge) default **off / omit / keep plated**. They must not steal Digits or replace `makeLivingHull`.

### Findings

#### 🔴 Blocker

None remaining.

The brief does not make later impl inaccessible. It does not steal dock digits. It does not contradict live warn copy without a freeze.

#### 🟠 Major

None remaining.

Worker `ui-audit.md` U1–U4 (second warn, required badge, Digit theft, mech→bio) are **already frozen**. They are not open defects.

- U1: Contract §1.2 keeps live `GRAFT_WARN` / `GRAFT_WARN_REDUCED`. Brief does not author “irreversible Marked”, a fake UU, or “not available”.
- U2: Contract §2.3 default **omit** hangar grafted badge.
- U3: Graft stays click Offer. Digit 0 shipyard. Digit 5 stays BIO-04 WPN.
- U4: HUD-02 stays. Grafted built remains plated + mech.

Agree with the worker: do not re-open those as Majors.

#### 🟡 Minor

##### D1: Reduced warn omits the −10 hunt number (accepted live)

**Location:** `src/systems/shipyard-desk.js:69`; brief does not replace it  
**Issue:** Motion-sensitive players see `Beautiful Ones become enemies.` Digit 9 still names `min(current, -10)` and `Patrols hunt at standing -10 or below.` (`station.js` 1157, 1170, 1178).  
**Why it matters:** Two warn lengths already exist. A third line would fight the freeze.  
**Fix:** Keep the live reduced string. Do not invent a third warn. Status: **accepted**.

##### D2: Hangar cards still omit the word grafted (accepted omit)

**Location:** `src/systems/shipyard-desk.js:397-403`; contract §2.3; brief 121  
**Issue:** After confirm, the hull meta is still `class · faction · mounted`. The player infers Abomination from Digit 9, mech HUD, and the Gilded warn. Code review C5 already accepted this.  
**Why it matters:** A required badge this freeze would be a competing player-facing leftover. The loop already works.  
**Fix:** Default **omit**. Owner-open only. Status: **accepted**.

#### 💡 Suggestion

##### D3: Player-outcome prose says “Confirm papers”; live button is `Confirm graft`

**Location:** `docs/Bio05AbominationsDesign.md:127`; live `shipyard-desk.js:366-370`  
**Issue:** §2 says “Offer graft. Confirm papers.” Inventory §4 also titles the step “Confirm papers” while the control is `Confirm graft` / `Esc — Cancel`. Contract §1.2 pins Offer / warn / refuse / success, but not those two control labels.  
**Why it matters:** A later desk rewrite could rename the graft confirm to `Confirm papers` and collide with train/buy grammar.  
**Fix:** Later impl keep `Confirm graft` and `Esc — Cancel`. Optional: add those two literals to contract §1.2. Do not change product copy in Wave 96.

##### D4: Do not add a destroy “friend standing” toast

**Location:** brief owner-request row (`docs/Bio05AbominationsDesign.md:10`); wishlist “immediate friend standing”; live `kill-standing.js` + recap  
**Issue:** Wishlist language is “friend standing”. Live math is Beautiful **+5** then `min(current, −10)` while the player still owns tissue. Brief §2 correctly calls destroy helper-ready, not a current world beat, and does not propose a toast.  
**Why it matters:** A later kill toast that says “friend” would lie while the recap holds enemies at ≤ −10, and would be new chrome.  
**Fix:** No new comm/HUD toast for BIO-05 destroy. Keep existing `commLine` primitives. Integers stay Wave 82.

##### D5: Later overlay / NPC look must not grow an aim-glass pip

**Location:** contract §2.1–§2.2; brief PR3; HUD-01  
**Issue:** Optional plated tissue overlay is a **mesh** leftover. Digit 5 already uses the WPN rail.  
**Why it matters:** A tissue pip, lock box, or incoming gauge on the glass would reopen HUD-01 / HUD-02 non-goals.  
**Fix:** If the owner opens PR3, overlay the plated rig only. Do not flip HUD family to bio. Do not add glass chrome. Do not steal Digit 0–9.

##### D6: If the owner later opens a hangar badge

**Location:** contract §2.3; `shipyard-desk.js:402-403`  
**Issue:** Cards have a meta line ready for static text.  
**Fix:** `textContent` only. Example (owner-open): `grafted` on the meta line. Never `innerHTML`. Not this wave.

### Accessibility / states (no new chrome)

- **Contrast / theming:** No new tokens. Graft uses existing `.shipyard-buy-row` / `.screen-btn-warm`.
- **Keyboard:** Dock Digit 0 = Shipyard. Hangar 1/2 = panes. 3+/0 = Mount. Graft Offer and Confirm are real `<button type="button">`. Esc cancels pending. Digits do not debit. Do not bind Digit 0 to Confirm graft.
- **Focus:** Live dock rebuild can drop focus (known station pattern). Brief does not add a new overlay. Do not “fix” that in BIO-05.
- **States frozen:** Offer visible / hidden; confirm pending; Esc no-write; refuse map; reduced warn; success notice; already-grafted hide.
- **Empty / error:** Living / Unk / banner / hostile / credits / busy already have lines. No new empty-state card.

### Recheck vs worker `ui-audit.md`

Agree. No remaining Blocker or Major. Brief §2 does not add a friend-standing toast. Confirm papers still use live `GRAFT_WARN` / `GRAFT_WARN_REDUCED`. No new desk string table, HUD label, Digit map, badge, or aim-glass pip.

Dissent: none on severity. Extra suggestions D3–D5 only (control-label pin, no kill toast, no glass pip on a later overlay).

### Verdict

**Pass.** Keep live Gilded graft papers. Digit 0 stays Shipyard. Grafted built stays HUD-02 mech on a plated mesh. No competing badge. No aim-glass pip. Wave 96 markdown freeze is safe for a later serial that must **not** reopen the player desk.
