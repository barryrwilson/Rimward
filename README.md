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

`test:boot` is intentionally broad. Known intermittent demand/hail and Agent
API fixtures are tracked as [RW-006](https://github.com/barryrwilson/Rimward/issues/7)
and [RW-007](https://github.com/barryrwilson/Rimward/issues/13). The GitHub boot
job remains visible but advisory until those fixtures are deterministic; the
production build is the required gate.

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
