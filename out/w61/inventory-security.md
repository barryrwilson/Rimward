# Security Review: out/w61 HUD evidence inventory

**Mode:** Quick scan (design inventory; no game-code change).  
**Persona:** security-auditor + orchestrator `security-review.md`.  
**Scope:** `out/w61/current-hud-inventory.md` plus the HUD sinks it cites (`src/systems/hud.js`, `src/ui/hud.css`, `src/systems/hail.js`, `src/core/ctx.js`).

## Security Review: shipped HUD sinks (HUD-02 must not worsen)

### Risk Level: Low (inventory artifact) / Medium (existing HUD display sinks if HUD-02 switches to HTML)

### Summary
The inventory is markdown with no executable sinks. The shipped HUD already writes player/NPC/comm strings with `textContent`. The real risk is a later HUD-02 skin introducing `innerHTML`, unsanitized class names from records, or prototype-key iteration. Those sinks are now listed in inventory §9.

### Findings

#### 🟡 MEDIUM: World/NPC strings enter the HUD without HTML encoding *by policy*, only by API

**Location:** `src/systems/hud.js:695` (`pushToast`), `:1315` (`tName.textContent`), `:1342` (`tgtNameEl.textContent`), `:216–224` (`toastForEvent` `commLine`)

**Issue:** `e.text`, `e.line`, `rec.name`, `rec.coverName`, and `st.name` are copied into the DOM. Today this is `textContent`, so markup does not execute. HUD-02 must keep that contract.

**Impact:** If HUD-02 builds organic markup with `innerHTML` or `insertAdjacentHTML` for names or comm, a crafted NPC/save name becomes XSS in a file:// or hosted build.

**Fix (HUD-02, not this inventory):** keep `textContent` / `createTextNode`. Do not interpolate names into HTML strings.

**Status:** documented in inventory §9. No game-code change (design-only wave).

#### 🟡 MEDIUM: Prototype-key lookups on `SYSTEMS` / `FACTIONS` / `COMMODITIES`

**Location:** `src/systems/hud.js:738` `SYSTEMS[e.to]`; `:1248` `SYSTEMS[ctx.world.currentSystem]`; `:1282` `FACTIONS[key]`; `:1299` `COMMODITIES[target.commodity]`; `:291–297` `known[e.kind]`

**Issue:** These tables are ordinary objects (`state.js` `export const SYSTEMS = { ... }`, `FACTIONS = { ... }`). A polluted or attacker-influenced key (`__proto__`, `constructor`) can yield unexpected objects. HUD currently only reads `.name` onto `textContent`.

**Impact:** Low today (no HTML). HUD-02 must not `for…in` these results into class lists or HTML.

**Fix:** inventory already names the lookups. HUD-02 should use `Object.hasOwn` or a known-key map if it adds new reads.

**Status:** documented. Not HIGH: no write to prototype, no HTML sink.

#### 🟢 LOW: Mood / contact `className` concatenation

**Location:** `hud.js:1239` `'rw-bio-icon m-' + mood`; `:1014` `'rw-contact-pip is-' + kind`

**Issue:** `kind` is `contactKind()` enum (`lock|hostile|civ`) — safe. `mood` is `ctx.bio.mood || 'serene'` (bio.js writer). Extra tokens in a future writer could inject classes.

**Impact:** Style / click-jacking only if mood becomes attacker-controlled.

**Fix:** HUD-02 must keep an allow-list if it restyles mood icons.

**Status:** documented.

#### 🟢 LOW: Hail portrait `img.src` (not under `#hud`)

**Location:** `src/systems/hail.js:354–361` `portraitFor(st.faction, speaker)` → `img.src`

**Issue:** Wave B parked Hail off `#hud`, but HUD-02 must not pull the portrait onto the aim glass via raw `src` from record fields.

**Impact:** Only if `portraitFor` ever returns a non-bundled URL. Inventory records Hail as a still card, not a comm video.

**Status:** informational.

### Passed Checks

- [x] No secrets, API keys, or tokens in HUD sources reviewed
- [x] No `innerHTML` in `src/systems/hud.js` (all writes `textContent` / attributes)
- [x] Toasts use `role="status"` / `aria-live="polite"` (no focus theft)
- [x] Contacts / chart marks `aria-hidden="true"`
- [x] Controls toggle is the only `#hud` `pointer-events: auto` element
- [x] Hail `pointer-events` only on the card (`hail.js:111–116`)
- [x] Inventory does not instruct HUD-02 to add HTML sinks
- [x] No new network, auth, or storage in this wave
- [x] Settings persist under `rimward-settings-v1` (existing; not changed)

### Recommendations

1. HUD-02 skins must not replace `textContent` name/comm writes with HTML templates.
2. Do not grow Hail into comm video on the aim glass (proposal §8 + existing still portrait).
3. Keep prototype-key reads as `.name` onto text nodes.

### Lifecycle mapping

- No 🔴 CRITICAL / 🟠 HIGH in the inventory artifact.
- Medium/Low sinks recorded so HUD-02 does not worsen them.
