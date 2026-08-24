## UI Audit: Wave 92 Unknowables presence / later dock (design freeze)

### Summary

Wave 92 ships no chrome. First site is a landmark: existing discovery toast only. A later Unknowables Archive (Wave 82 Wait) must copy Assembly Market-pane confirm papers and must not steal Digit 0. This audit freezes Digit law, copy, contrast/hit/reduced-motion, and `textContent`. It does **not** skip the pass. No `[designer]` agent.

### What's done well

- Reuses live landmark `commLine` / `landmarkFound` (no new glance HUD).
- Later Archive reuses Assembly `renderArchiveDesk` family (`station.js` 1343–1353): Market level-2, two-step confirm, hostile `No sale.`
- Dock `h()` already assigns `textContent` (`station.js` 4238–4243).
- Digit 0 already shipyard (`station.js` 180, 5780–5788).
- Reduced-motion Archive header already has a short form.

### Frozen chrome (later impl)

| Surface | Freeze |
|---|---|
| First presence | No dock overlay. Authored landmark `line` via existing toast |
| Train desk | **None** |
| Later Archive home | Market pane at a **non-placeholder** Unknowables dock (Wait) |
| Later Archive verb | Two-step confirm. Not one-click UU |
| Digits | Dock level-1 Digit **0 = shipyard**. No new `DOCK_KEY_SERVICES` key. Digits do not debit data |
| People Digit 7 | Rescue + live cards. Not data. Not a gift |
| Portraits | Later People/hail: `portraitFor('unknowables', id)` — files exist. Hollow/independent stay text-only |
| Copy | Contract §5 static Echo. `priceOf` data stays 0 |

### Findings

#### 🔴 Blocker: Digit 0 must stay shipyard — **fixed in freeze**

**Location:** `station.js` 180, 5780–5788; contract §0.6, §5.2

**Issue:** A new dock service or mid-list insert moves Digit 0. Players already learn KeyY / Digit 0 = shipyard. An “Unknowables train” Digit would steal it.

**Fix applied:** No new `DOCK_KEY_SERVICES` key. No train desk. Later Archive is an additive Market block like Assembly. Presence has no desk.

#### 🟠 Major: Placeholder must not grow an Archive — **fixed in freeze**

**Location:** `station.js` 300–305, 1167–1168; contract §1.1, §7.7

**Issue:** `buildStationModel('unknowables')` is placeholder today. An Archive on that mesh would look like a real origin desk.

**Fix applied:** First site is not a dock. Later PR5 requires a non-placeholder station path **and** a successor owner un-wait. `archiveDeskAllowed` stays assembly-only until then.

#### 🟠 Major: Confirm papers, not one-click UU — **fixed in freeze**

**Location:** live Archive `dataPending` / confirm; contract §5.2

**Issue:** A single click that credits 900 UU is the graft/sale bug class.

**Fix applied:** Later dock copies Assembly two-step confirm. Esc / KeyB cancel. Presence has no UU chrome.

#### 🟠 Major: Fail-closed copy must not lie — **fixed in freeze**

**Location:** contract §3, §5.3

**Issue:** Showing “own crystal 400” on Assembly Market would lie (Assembly does not buy crystals). Showing 900 cubes at hush Threshold would lie (hollow dock).

**Fix applied:**

| Surface | Copy |
|---|---|
| Assembly (live, unchanged) | Legal cubes 400. Rival crystals 900 |
| Hush presence | Authored landmark line only. No Archive block |
| Later Unknowables origin (Wait) | Legal crystals 400. Rival cubes 900 |
| Hostile | `No sale.` |
| Wrong banner / placeholder | `The archive will not file here.` |

#### 🟡 Minor: Hit target / focus

**Location:** later Archive buttons

**Issue:** Dock buttons already exist; confirm must stay a real `<button>` with visible focus (`.screen-btn`). Hit ≥ 24 CSS px.

**Fix:** Reuse `btn()` helper. Do not make the whole Market table a click debit.

#### 🟡 Minor: Reduced motion / colorblind

**Location:** `station.js` 1348–1353

**Issue:** UU must remain in the short reduced header so the price is not color-only.

**Fix:** Later Unknowables header keeps both numbers in text, same as Assembly.

#### 💡 Suggestion: Portraits on later People

Files `unknowables-a.webp` / `b.webp` exist. Face-spread stays in `renderPeople` (Wave 41). No persist.

### Passed (planned UI)

- [x] No live UI this wave (no Vite, no Chrome)
- [x] `innerHTML` forbidden
- [x] Digit 0 shipyard
- [x] No train desk
- [x] Presence = toast only
- [x] Later desk = Market additive, not a new Digit
