# UI Audit: Msn04 job-posting identity leftover integrator

### Summary

No product UI ships in Wave 130. Audit is of the live Digit 2 Jobs board and later mining-row identity. Blocker/Major UI holes in **live** play (two identical `Mine Raw ore` + same UU rows) are accepted as leftover **REAL** and frozen as PR1 distinct commodity text. Color-only distinction, merged ids, hidden unique four, and scanner-as-feedback are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Live pane already uses `h()` `textContent` (`station.js` **4464–4468**, **5214**). Later uniqueness can ride the same rows.
- Player identity is named in **text** (title `Mine ${oreName}` + pay `Deliver ${need} ${oreName} here — pays ${est} UU`), not color.
- Digit 2 stays Jobs. Digit n still accepts by visible index. No new Digit.
- Unique four stay on the board (player career landmarks).
- `reducedMotion`: no new animation.
- HUD-01 hub stays empty; no job pip on the aim glass.
- Omit-second-card is an honest empty slot, not a duplicate row.

### Findings

#### 🔴 Blocker: Identical mining rows — **resolved as later mint**

**Location:** live `renderJobs` **5150–5156**, **5242–5251**; fill **2293–2314**  
**Issue:** Jobs 8 and 9 (board index) can show the same title and the same UU. Digit accept cannot tell them apart.  
**Fix:** PR1 distinct commodity (or omit). Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Color-only or slot-only distinction — **resolved in freeze**

**Location:** honor a11y / `reducedMotion`  
**Issue:** A CSS class, slot badge, or hidden id in a tooltip would fail the inbox (player saw title + UU).  
**Fix:** distinct **ore name** in title and pay line. Color is extra, not the only cue.

#### 🟠 Major: Renumbering / Digit remap to “fix” 8 and 9 — **resolved in freeze**

**Location:** `boardJobs` **3659–3695**; Digit accept **6230–6232**; dock Digit 2 **6169–6176**  
**Issue:** Inbox “jobs 8 and 9” is paint order. Compacting the list or remapping Digit 2 would steal dock chrome and unique-four positions.  
**Fix:** keep index paint. Make the two **mining** rows differ. Digit 0/8/9 stay.

#### 🟠 Major: Scanner / lock-card as board feedback — **resolved in freeze**

**Location:** inbox **187–192** (other item); HUD ore readout `hud.js` **2451–2471**  
**Issue:** Teaching ore type on the scanner would look like a UI fix for twins but is a different leftover.  
**Fix:** Msn04 does not touch scanner, aim glass, or lock card.

#### 🟠 Major: Fake second origin / fake need to differentiate copy — **resolved in freeze**

**Location:** `makeMiningJob` **2276**, **2280**  
**Issue:** Changing need or origin text to make twins “look different” lies about the contract.  
**Fix:** real different commodity, or omit.

### 🟡 Minor: Two passenger `Escort passengers` rows stay identical after PR1

**Location:** **5170–5175**  
**Issue:** Player may still see two identical escort cards.  
**Justification:** Authored family; not inbox mining. Optional PR2. Do not invent fake passenger names here.

### 🟡 Minor: Time-left label is not part of identity

**Location:** `miningTimeLeftLabel` **2355–2363**  
**Issue:** Twins minted a frame apart could differ by `Ns left` while title/pay match. Inbox cited title + UU.  
**Justification:** commodity uniqueness is the cue. Do not depend on clock text.

### 🟡 Minor: Omit slot 1 leaves a shorter board

**Location:** contract omit-if-exhausted  
**Issue:** Digit indices after mining shift vs a two-card board.  
**Justification:** Honest. Better than a duplicate. Live table size is 2, so omit is the size-1 future path.

### 💡 Suggestion: Optional PR3 still

One still: Freehold Digit 2, two mining rows with **different** ore names, unique four visible, hub empty, no pause, no scanner filter.

### 💡 Suggestion: Do not add “slot 0/1” chrome

Players do not need internal slot numbers. Distinct ore names are enough.
