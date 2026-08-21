## UI Audit Recheck: Digit 2 Jobs spy cards

**Scope:** Recheck of prior Major only. Source: `src/systems/station.js` `renderJobs` spy branches (~3997–4169). Prior file: `out/w80/espionage/designer-audit.md`.
**Review file:** `out/w80/espionage/designer-audit-recheck.md`
**Method:** Source re-read. No Playwright. [NO BROWSER COVERAGE].
**Stance:** Review only. Flag remaining Blocker/Major. Do not inflate. Do not re-open closed minors as majors.

### Summary
The accepted-spy “file here” Major is **closed**. Accepted reward and state now name `homeName`. Offered origin still says “here”, which is allowed. Pay fallback now matches explore. No remaining blockers. No remaining majors.

### Verdict
**clean** — 0 blockers, 0 majors.

### Prior Major: closed

#### 🟠 Major: Accepted spy says “file here” on every board
**Prior location:** `src/systems/station.js:4086`, `src/systems/station.js:4161–4163`
**Status:** **closed**
**Evidence:**
- `homeName` is `spyStationName(originId, 'the home dock')` in title/detail (4001), reward (4083), and accepted state (4162).
- Accepted reward (4087–4088): `File intel from ${destName} at ${homeName} — pays ${est} UU`.
- Accepted state (4164–4168): `intel aboard — file at ${homeName}` and `ACCEPTED — gather at ${destName} then file at ${homeName}`.
- Offered reward (4089) still uses `File intel from ${destName} here`. Offered spy is origin-only (`boardJobs` 2885), so “here” is the posting dock.
- Grep of `*.js`: no `file here` string in product source.

At the gather dest, the player now sees the home station name, not “here”. Detail (4005) and status no longer contradict.

### Also verified (not a new finding)
- Accepted pay fallback (4084–4086) now uses `jobPayFor(ctx, originId, explorePayBase())` when `payQuoted` is missing, same as explore (4075–4077). Prior minor is closed; not re-raised.

### What's done well
- Live spy title/detail still name dest and home station, not ids (3997–4005).
- Accepted cards stay on every board (2885 filters offered only) and now name the file dock on those boards.
- `h()` still uses `textContent`. Accept is still a real button.

### Findings

No 🔴 Blocker.
No 🟠 Major.

### Recheck table

| Prior item | Result |
| --- | --- |
| Accepted reward “file here” | Closed. Names `homeName` at 4088. |
| Accepted state “then file here” / “file here” | Closed. Names `homeName` at 4165–4167. |
| Offered “here” | Allowed. Origin board only (2885, 4089). |
| Missing `payQuoted` → 0 UU | Closed as prior minor. Matches explore. |
| New Blocker/Major | None. |
