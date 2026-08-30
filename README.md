# RIMWARD

RIMWARD is a browser-based space sandbox built with Three.js and Vite. It
combines flight, combat, trade, mining, faction reputation, missions,
exploration, ship ownership, and agent-driven play in a persistent world.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm ci
npm run dev
```

The production and headless verification gates are:

```bash
npm run build
npm run test:boot
```

`test:boot` is the required headless gate. RW-006 and RW-007 pinned the
WAVE30 demand/pay and WAVE127/WAVE132 Agent API fixtures. The GitHub boot
job is a required merge check. Runtime-error overlay pins run with
`npm run test:runtime-error-ux`.

`master` requires the GitHub checks named exactly `Build` and `Boot harness`.
For a release candidate, dispatch the `Release candidate` workflow with a full
40-character commit SHA. The workflow checks out and verifies that exact SHA,
runs install, build, boot, focused regressions, bridge smoke, both live-browser
probes, and the dependency audit, then uploads bounded evidence with one final
JSON/Markdown verdict. A release PR records independent approval when one is
available; otherwise it includes an explicit security/regression self-review.
The artifact retains full and deployable-runtime dependency audits;
high-severity findings in either tree fail the release gate. The integrated
workflow has a 60-minute Windows budget because the complete local boot harness
can take about five minutes; the ordinary required `Build` and `Boot harness`
jobs stay on Ubuntu.

REL-001, REL-002, and REL-004 are integrated. A release is green only when the
workflow passes against the final full SHA from `master`.

## Work tracking

- [Remaining work](docs/REMAINING-WORK.md) is the compact inventory of current
  outcomes and explicitly optional follow-ups.
- [Player-experience wishlist](docs/PLAYER-EXPERIENCE-WISHLIST.md) preserves
  product intent and playtest provenance.
- [Progress tracker](PROGRESS.md) is the historical implementation record and
  architecture-contract log. Older `OPEN` entries can be superseded by later
  waves.
- GitHub Project [Rimward](https://github.com/users/barryrwilson/projects/1) is
  the operational task queue used by Orca AI.

Agents and contributors should read [AGENTS.md](AGENTS.md) before starting an
issue. A GitHub issue is the authority for its bounded task; current code wins
over old implementation assumptions.

## Agent play bridge

The game exposes a versioned browser agent API and an optional loopback bridge.

```bash
npm run agent:bridge:smoke
```

The smoke command starts and stops its own Vite and bridge processes. For a
manual session, start Chrome with remote debugging on port 9222, run the game,
and then run `npm run agent:bridge` in a separate terminal.

See [AgentApiDesign.md](docs/AgentApiDesign.md) for the contract and security
boundaries. The bridge is loopback-only; do not put an LLM runner or secret in
the browser bundle.
