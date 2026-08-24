## UI Audit: BIO-05 Wave 97 owner close (frozen copy; no new chrome)

Persona: `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`.  
Guide: `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
Wave 97 ships **no live HUD chrome**. This pass audits frozen player-facing copy and the explicit omits in the owner file, brief, and merge law. Review only. Do not edit `src/` or product files.

Sources: `docs/OwnerDecisionsWave97.md`; `docs/Bio05AbominationsDesign.md`; `out/w97/bio05/shared-contract.md`; worker `out/w97/bio05/ui-audit.md`; live-copy pins from `out/w96/bio05/current-bio05-inventory.md` (code still wins). This auditor did not re-open `src/`.

Merge law: if the owner file or brief and `out/w97/bio05/shared-contract.md` disagree, the **contract wins**.

### Summary

Wave 97 restates live Gilded warn copy and closes leftover chrome as omit. No hangar grafted badge. No plated tissue overlay. Digit 0 stays shipyard. HUD never writes `hullKind`. Grafted built stays mech. No remaining Blocker or Major on frozen UI law. Worker self-audit is accepted on severity; extra suggestions below are not defects.

### Freeze checks (this wave’s job)

| Check | Verdict | Cite |
|---|---|---|
| Live Gilded warn restated, not rewritten | **Pass.** Owner and contract copy the live ASCII strings. Brief does not replace them. | Owner 78–81; contract §1.2 44–50; inventory §4 83–85 |
| No hangar grafted badge | **Pass.** Closed omit. Hull cards stay name + class · faction · mounted. Digit 9 + Gilded warn already tell the beat. | Owner 72–83; contract §2.3 98–100; brief 124, 182; inventory §11 200 |
| No plated tissue overlay | **Pass.** Closed omit. Keep plated `buildBuiltVisual`. Do not replace `makeLivingHull`. | Owner 55–70; contract §2.2 92–96; brief 117–118, 181 |
| Digit 0 stays shipyard | **Pass.** Dock Digit 0 stays shipyard. Yard Digit 0 stays hangar row 8. Graft stays Hangar Offer, not a stolen Digit. | Owner 107; contract §0.5 19; brief 58, 86, 120, 176 |
| HUD never writes `hullKind` | **Pass.** Restated. Later impl must not treat HUD family as a write. | Owner 65, 108; contract §0.6 20; brief 37, 86, 119, 173 |
| Grafted stays mech | **Pass.** HUD family stays mech on plated built. Digit 5 may still fire via `canFirePsionic`. | Owner 65, 99; contract §1.6 70–72; brief 56, 119, 173 |
| No new desk / HUD chrome this wave | **Pass.** Markdown only. No badge, overlay, ungraft SKU, NPC world look, or Digit map. | Owner 14, 115–122; contract §0.1 16, §5 134–144; brief 90–91 |

### Live copy (must stay)

Pinned from Wave 96 inventory §4 against Wave 97 contract §1.2. Owner restates **warn / reduced only**. Do not rewrite.

| Moment | Frozen string | Contract | Owner restatement |
|---|---|---|---|
| Offer title | `Graft tissue` | §1.2 48 | not restated (keep live) |
| Offer meta | `4000 UU · Mounted plated hull.` | §1.2 48 | not restated (keep live) |
| Offer action | `Offer graft` | §1.2 48 | not restated (keep live) |
| Warn | `Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.` | §1.2 49 | Owner 80 — **exact match** (ASCII `-10`) |
| Reduced | `Beautiful Ones become enemies.` | §1.2 50 | Owner 81 — **exact match** |
| Success | `Tissue sealed to the hull.` | §1.2 51 | not restated (keep live) |
| Living / Unk | `Grafts fit plated hulls only.` | §1.2 52 | not restated (keep live) |
| Already | `This hull is already grafted.` | §1.2 53 | not restated (keep live) |
| Banner | `The Chain does not graft here.` | §1.2 54 | not restated (keep live) |
| Hostile Gilded | `No sale.` | §1.2 55 | not restated (keep live) |
| Credits | `Not enough credits.` | §1.2 56 | not restated (keep live) |

Confirm controls are live but still unpinned in contract §1.2 (same Wave 96 gap):

| Moment | Live string (inventory §4) | Contract §1.2 |
|---|---|---|
| Confirm title | `Graft tissue` | implied by Offer title |
| Confirm action | `Confirm graft` | **not listed** |
| Cancel | `Esc — Cancel` | **not listed** |

`innerHTML` stays forbidden. Copy stays `textContent` / `h()` / `el()` (Owner 106; contract §0.4 18; brief 122).

Digit 9 already names the cap (not a new BIO-05 rail; inventory §4 92):

- Move: `Graft caps ${beautiful} at min(current, -10) while any grafted row remains.` (`station.js` 1157)
- Live: `Patrols hunt at standing -10 or below.` and `Graft: ${beautiful} min(current, -10) while any grafted row remains.` (`station.js` 1170, 1178)

### What's done well

- Owner close is chrome-negative: badge omit, overlay omit, NPC world look player-only, ungraft forbidden. No new HUD family, Digit, or desk string.
- Warn restatement matches live ASCII copy, including `-10`. Owner integers may use unicode `−10`; the player sentence does not. That split is correct.
- Graft stays the live two-step: Offer → Confirm / Esc on the Hangar pane. Debit 4000 UU on confirm only.
- Warn stays on the **confirm** row, not only Digit 9. Hostility is not a silent standing write.
- Reduced motion already swaps to `GRAFT_WARN_REDUCED` without extra animation. Wave 97 does not add a third warn.
- Success stays a notice (`Tissue sealed to the hull.`), not a blocking modal.
- Refuse lines stay short. Living and Unknowables share `Grafts fit plated hulls only.` Hostile Gilded is `No sale.`
- Digit 0 stays dock Shipyard. Yard Digit 0 stays hangar row 8. Graft is click Offer, not Digit theft.
- HUD grafted built stays **mech**. HUD does not read `grafted`. Digit 5 stays existing WPN `5 · name` / `5 · —`. Aim glass stays empty (HUD-01).
- Color is not the only hostility cue: confirm sentence + Digit 9 notes + patrol hunt at −10.
- Brief §2 still splits live Gilded graft from helper-ready destroy +5. Player-outcome prose does not add a “friend standing” toast.
- Worker U1–U4 are correctly treated as **already frozen**, not open Majors.

### Findings

#### 🔴 Blocker

None remaining.

The owner close does not make later impl inaccessible. It does not steal dock digits. It does not rewrite live warn copy. It does not require new HUD chrome.

#### 🟠 Major

None remaining.

Worker `ui-audit.md` U1–U4 (second warn, required badge, Digit theft, mech→bio / living overlay) are **closed by Wave 97**. They are not open defects.

- U1: Owner 78–81 and contract §1.2 restate live `GRAFT_WARN` / `GRAFT_WARN_REDUCED`. Brief does not author a second warning.
- U2: Owner 72–76 and contract §2.3 **omit** the hangar grafted badge. Closed. Successor only.
- U3: Graft stays Hangar Offer. Digit 0 shipyard. Digit 5 stays BIO-04 WPN.
- U4: HUD never writes `hullKind`. Grafted stays mech. Overlay **omit**. Keep plated.

Do not re-open those as Majors.

#### 🟡 Minor

##### D1: Reduced warn omits the −10 hunt number (accepted live)

**Location:** contract §1.2 50; Owner 81; inventory `shipyard-desk.js` 69  
**Issue:** Motion-sensitive players see `Beautiful Ones become enemies.` Digit 9 still names `min(current, -10)` and `Patrols hunt at standing -10 or below.`  
**Why it matters:** Two warn lengths already exist. A third line would fight the freeze.  
**Fix:** Keep the live reduced string. Do not invent a third warn. Status: **accepted**.

##### D2: Hangar cards still omit the word grafted (accepted omit; now closed)

**Location:** Owner 76; contract §2.3 98–100; brief 124, 182; inventory `shipyard-desk.js` 397–403  
**Issue:** After confirm, hull meta is still `class · faction · mounted`. The player infers Abomination from Digit 9, mech HUD, and the Gilded warn.  
**Why it matters:** A required badge would be new player-facing chrome. Wave 97 closes that wait as omit. The loop already works.  
**Fix:** **Omit.** Successor owner file only. Status: **accepted / closed**.

#### 💡 Suggestion

##### D3: Player-outcome prose says “Confirm papers”; live button is `Confirm graft`

**Location:** `docs/Bio05AbominationsDesign.md:130`; inventory §4 82 (`shipyard-desk.js` 360–374); contract §1.2 44–56  
**Issue:** Brief §2 says “Offer graft. Confirm papers.” Inventory titles the step “Confirm papers” while the control is `Confirm graft` / `Esc — Cancel`. Contract §1.2 still pins Offer / warn / refuse / success, but not those two control labels. Wave 97 owner restates warn only.  
**Why it matters:** A later desk rewrite could rename confirm to `Confirm papers` and collide with train/buy grammar.  
**Fix:** Later impl keep `Confirm graft` and `Esc — Cancel`. Optional: add those two literals to a successor contract table. Do not change product copy in Wave 97.

##### D4: Do not add a destroy “friend standing” toast

**Location:** brief owner-request row `docs/Bio05AbominationsDesign.md:10`; brief §2 132; contract §1.4 63–64  
**Issue:** Owner-request language still says “Beautiful friend standing”. Live math is Beautiful **+5** then `min(current, −10)` while the player still owns tissue. Brief §2 correctly calls destroy helper-ready and does not propose a toast. Worker recheck agrees.  
**Why it matters:** A later kill toast that says “friend” would lie while the recap holds enemies at ≤ −10, and would be new chrome.  
**Fix:** No new comm/HUD toast for BIO-05 destroy. Keep existing `commLine` primitives. Integers stay Wave 82.

##### D5: Later overlay / NPC look must not grow an aim-glass pip

**Location:** Owner 55–70, 35–51; contract §2.1–§2.2 84–96; brief PR3 145; HUD-01  
**Issue:** Overlay and NPC grafts stay skipped until a successor owner file opens them. Digit 5 already uses the WPN rail.  
**Why it matters:** A tissue pip, lock box, or incoming gauge on the glass would reopen HUD-01 / HUD-02 non-goals.  
**Fix:** If a successor opens PR3, overlay the plated rig only. Do not flip HUD family to bio. Do not add glass chrome. Do not steal Digit 0–9.

##### D6: If a successor later opens a hangar badge

**Location:** contract §2.3 100; Owner 76; inventory `shipyard-desk.js` 402–403  
**Issue:** Cards have a meta line ready for static text.  
**Fix:** `textContent` only. Example: `grafted` on the meta line. Never `innerHTML`. Not this wave.

### Accessibility / states (no new chrome)

- **Contrast / theming:** No new tokens. Graft keeps existing yard Hangar rows. Hostility is a sentence, not color alone.
- **Keyboard:** Dock Digit 0 = Shipyard. Hangar 1/2 = panes. Graft Offer and Confirm stay buttons. Esc cancels pending with no write. Do not bind Digit 0 to Confirm graft.
- **Focus:** Live dock rebuild can drop focus (known station pattern). Wave 97 does not add an overlay. Do not “fix” that in BIO-05.
- **States frozen:** Offer visible / hidden; confirm pending; Esc no-write; refuse map; reduced warn; success notice; already-grafted hide.
- **Loading / empty / error:** No new chrome, so no new loading rail. Living / Unk / banner / hostile / credits already have lines.
- **Reduced motion:** Live swap to `GRAFT_WARN_REDUCED`. Keep it.

### Recheck vs worker `out/w97/bio05/ui-audit.md`

Agree on frozen UI law. No remaining Blocker or Major. Warn restated, not rewritten. Badge omit. Overlay omit. Digit 0 shipyard. HUD never writes `hullKind`. Grafted stays mech. No friend-standing toast. NPC world look stays player-only.

Dissent: none on severity. Worker U5 matches D1 (accepted). Worker U6 matches D6. Extra suggestions D3–D5 only (control-label pin, no kill toast, no glass pip if a successor opens overlay).

Do not rubber-stamp the worker’s “Major (fixed in freeze)” list as open work. Those items are closed.

### Verdict

**CLEAN.** Keep live Gilded graft papers. Do not rewrite the warn. No hangar grafted badge. No plated tissue overlay. Digit 0 stays Shipyard. HUD never writes `hullKind`. Grafted built stays mech. Wave 97 markdown freeze is safe. Later impl must not ship new BIO-05 HUD chrome unless a successor owner file opens it.
