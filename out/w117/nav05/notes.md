# Wave 117 NAV-05 PR1 notes

PR1 lands the Wave 116 merge-law leftover: wrong-hub no-cancel, hub-only cycle, distinct reason English, chart-open live paint, live `systemLoaded` pin.

## Ports

Did not start Vite. Did not start Chrome/CDP. Prefer verifier live-check. If a later live pass needs Vite: port **5177**, CDP **9477**, user-data-dir `out/w117/nav05/chrome-profile`.

## Boot pins (WAVE117 object)

`jumpOnlyGate`, `linesSplit`, `noCollapseSrc`, `plotMulti`, `engaged`, `chartStayOpen`, `ringKind`, `hubKind`, `hubNoCancel`, `hubNoCycle`, `hop1Jump`, `hop1Sys`, `hop2Path`, `hop2Jump`, `hop2Sys`, `liveRouteSeq`, `dockPressedStay`, `chartEngageStay`, `chartCancelLive`, `missingHopTok`, `zoneUnchanged`.

Source probe: `node out/w117/nav05/probe.mjs` (PASS).

## Coupling

- `gate.js` still sole emit. Cycle skipped when hop kind is `ring`.
- NAV-01 `writeNav` still forces `autopilot: false` on `systemLoaded`. Second hop re-engages. That is consume, not a new persist key.
- CTL-01 sibling still owns KeyD / `dockPressed`. AP jump uses `apJump` with `dockPressed` false.
- HUD-02 sibling owns `hud.js` / `hud.css`. This PR did not claim them.

## Known boot FAILs

Left untouched (WAVE21 hub D, WAVE22, REDMARCH, WAVE83 missiles, and the named WAVE4/WAVE26/WAVE35/WAVE30 set).
