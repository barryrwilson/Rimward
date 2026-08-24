# Wave 107 REP-05 PR3 notes

Digit 9 Standing LIVE CONSEQUENCES now copies three live sim lines:

- Police leave: hostile band below 0 and above −10, 300 u, `Leave this space.` (`POLICE_LEAVE_LINE` / `POLICE_LEAVE_RADIUS`).
- Covering: Known 10 local patrol vs the pirate or ace the player fights, `Patrol covering.` (`COVERING_LINE` / `COVERING_STANDING_MIN`).
- Inbound jump refuse: dest standing below −25 (Marked exclusive; −25 Suspect does not lock). Skip Unknowables / Hollow Reach / Independent. Dock stays open. `No passage.` (`JUMP_REFUSE_LINE` / `JUMP_REFUSE_STANDING` / `JUMP_REFUSE_SKIP`).

Hunt, yards, ace/frigate min-rep, locker, graft, restitution stay. Digit 0 stays shipyard. Digit 9 stays epics / Standing. No `innerHTML`. `h()` still writes `textContent`.

`station.js` imports in Node with the CSS stub, so notes stay in `standingLiveNotes()` (no `standing-notes.js` extract).

Merge law: `out/w103/rep05/shared-contract.md` still wins.

Probe: `node out/w107/rep05/probe.mjs`.
