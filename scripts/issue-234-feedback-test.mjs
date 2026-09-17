/**
 * Issue #234 — dock-approach cancellation feedback.
 *
 * Scope: the ONLY product change for #234 is the text of
 * DOCK_APPROACH_LINES.blocked and .impact. One case per changed token pins
 * three things: the pre-existing specific cause survives, the next action is
 * appended, and the public resolver returns that same line for the unchanged
 * reason token.
 *
 * Cancellation behaviour itself is covered by the existing
 * scripts/issue-139-dock-corridor-test.mjs and
 * scripts/issue-173-dock-cancel-live-probe.mjs; the public HUD/commLine
 * receipt is covered by scripts/issue-234-feedback-live-probe.mjs. This file
 * does not restate either.
 *
 * Usage: node --import ./scripts/with-css-stub.mjs scripts/issue-234-feedback-test.mjs
 * (src/game/autopilot.js pulls a transitive CSS import; the stub is the same
 * one scripts/issue-139-dock-corridor-test.mjs uses.)
 */

import assert from 'node:assert/strict';
import { DOCK_APPROACH_LINES, dockApproachLine } from '../src/game/autopilot.js';

const NEXT_ACTION = 'Wait for clearance or steer clear, then retry the approach.';

const CASES = [
  { token: 'blocked', cause: 'Dock approach cancelled — route is blocked.' },
  { token: 'impact', cause: 'Dock approach cancelled: hull contact.' },
];

console.log('issue-234 dock-approach feedback');

for (const { token, cause } of CASES) {
  const line = DOCK_APPROACH_LINES[token];
  // Cause first, next action appended, exactly once, and nothing between them.
  assert.equal(line, `${cause} ${NEXT_ACTION}`, `${token}: cause + next action`);
  // The machine-readable token an agent matches on is unchanged, and the
  // public resolver still maps it to that line.
  assert.equal(dockApproachLine(token), line, `${token}: resolver returns the line`);
  console.log(`  ok  ${token}: cause kept, next action appended, resolver unchanged`);
}

console.log(`\nissue-234 dock-approach feedback: ${CASES.length * 2} assertions passed`);
