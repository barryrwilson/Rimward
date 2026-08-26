# WAVE132 boot-worker notes

Scope: `scripts/boot-test.mjs` pins + design/PROGRESS + these notes. No `src/` writes.

WAVE131 `pr3Unknown` expected dock/hail/pulse tokens `unknown`. PR3 is live, so that pin would fail. WAVE132 owns those names. WAVE131 still pins teleport, desk, AP, undock, noThrow.

WAVE129 `noAgentHail` greps `act({ name: 'hail'` in `agent-api.js` and `hail.js`. Boot pins use `name: 'hail'` only as `{ v: 1, name: 'pulse', args: { edge: 'hail' } }` here, never that exact substring in src.

Law 19: pulse then one systems update before asserting edges.

Did not grant credits, hull, cargo, or teleport. `__proto__` edge is refuse `unknown`. No innerHTML.
