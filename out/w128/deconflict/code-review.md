# Code Review: HUD-07 deconfliction design pack (Wave 128)

### Summary

Markdown-only. Inventory matches live `hud.js` / `hud.css`. Contract and design agree: leftover **REAL**, serial **PR1**, write-set `hud.js` + `hud.css`. No Blocker or Major remain after locking CONSUME-forbidden, hub-empty, neighbor insets, and fail-closed yield.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`.

### What's done well

- Code-wins census with file:line for every HUD node in the sight stack.
- Distinguishes HUD-05 CONSUME, HUD-06 live PR1, HUD-04 linger, HUD-01 hub.
- Reuses AGEZ math instead of inventing a second collision kernel.
- Smallest additive: words/labels yield first; glyphs and nav stay.
- One `#hud.in-combat` policy, not two HUDs.
- Write-set freeze excludes hail.js / galaxychart.js / controls.js / npc.js.

### Findings

#### 🔴 Blocker: CONSUME name would lie

**Location:** brief vs inventory §6  
**Issue:** If the pack froze “no HUD-07 leftover,” playtest inbox would look done while duplicate names and RANGE/LEAD words still stack.  
**Fix:** Freeze **REAL** / **PR1**. Done in contract §0 and design Key Decisions.

#### 🟠 Major: Rail name skip vs stripHudText

**Location:** `hud.js` **2345–2349** vs contract §0.3  
**Issue:** PR1 that hides/shows names could copy the unstripped rail path.  
**Fix:** Contract requires `stripHudText` if PR1 writes `.rw-combat-name`. Locked.

#### 🟠 Major: Blind extra `.in-combat` hide of HOME

**Location:** `hud.css` **89**, **688**; deputize exploration  
**Issue:** Duplicating fade onto HOME/GATE/J would steal HUD-06 / NAV-02 in cruise — the opposite of the quieter-but-navigable ask.  
**Fix:** Contract §0.16: do not hide HOME / NAV-02 / dock J / POS. Locked.

#### 🟡 Minor: AGEZ is bio-only

**Location:** `hud.js` **1545**  
**Issue:** Mech rails never run `agezHairOff`. PR1 path yield must not assume hair exists.  
**Fix:** Deputize measures hub/bracket/segment boxes, not hair pseudos. Documented in inventory §2. Acceptable; PR1 stills optional.

#### 💡 Suggestion: Optional PR2 stills

Chase lock + cruise stills are skippable after playtest. Do not block PR1.

### Contract vs design

| Claim | Contract | Design | Match |
|---|---|---|---|
| Leftover | REAL | REAL | yes |
| Serial | PR1 | PR1 | yes |
| CONSUME | forbidden | forbidden | yes |
| Write-set | hud.js + hud.css | same | yes |
| Hub | empty 80 px | empty 80 px | yes |
| HOME inset | 108 untouched | 108 untouched | yes |
| Persist | none | none | yes |
| Third live region | forbidden | forbidden | yes |

No remaining Blocker/Major in the markdown freeze.
