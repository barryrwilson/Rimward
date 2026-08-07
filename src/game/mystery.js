/**
 * Mystery — authored breadcrumbs scattered through the systems
 * (doc §15/§25 — curiosity before explanation; Witness Rule not required,
 * clues are authored not recorded).
 *
 * Each system def carries optional `clues` and `landmarks` arrays with plain
 * [x,y,z] positions. When the player first flies within discovery range of
 * one, its id is recorded in ctx.world.mystery (persisted by save.js) and a
 * voiced line surfaces via 'commLine' plus a dedicated 'clueFound' /
 * 'landmarkFound' event. Discovery is permanent per id — never re-fires,
 * including across save/load.
 *
 * The lines raise curiosity WITHOUT explaining: no buried truth is stated,
 * only the sense that something is out there. The third clue overall also
 * fires the 'echoes-3' milestone.
 *
 * Wave 6 rung: with CONVERGENCE.cluesNeeded clues held, Echo voices the
 * fixed hintLine once (convergeHinted flag); approaching CONVERGENCE.site in
 * its system after the hint then fires the 'convergence' milestone + event
 * and 'songShift' once (converged flag). Both flags live on the mystery
 * record so they persist; the copy never restates the buried truth.
 *
 * Wave 7 rung: post-convergence, with DEEPENING.cluesNeeded clues held,
 * Echo voices the fixed hintLine once (deepHinted flag); approaching
 * DEEPENING.site in its system after the hint then fires the 'deepening'
 * milestone + event and 'songShift' once (deepened flag). Same
 * persistence and no-restatement discipline as the convergence rung.
 *
 * Pure sim: no three.js/DOM imports. Ship position is read as plain x/y/z
 * properties off ctx.ship.object.position; distances via Math.hypot.
 * Per-frame cost: one pass over the current system's few entries, zero
 * allocations.
 */

import { CONVERGENCE, DEEPENING } from './state.js';

const CLUE_RADIUS = 35; // u — clue discovery range
const LANDMARK_RADIUS = 100; // u — landmark discovery range
const EMPTY = []; // shared fallback for systems without authored POIs

export function initMystery(ctx) {
  // Lazily create the persisted record (save.js restores over it via
  // WORLD_FIELDS, so an existing save keeps its found/visited lists).
  ctx.world.mystery ??= { found: [], visited: [] };

  return {
    update() {
      if (ctx.flags.docked || ctx.gate.jumping) return;
      const obj = ctx.ship.object;
      if (!obj) return;
      // Re-resolved each frame: save.js may swap ctx.world.mystery wholesale
      // on load. found/visited arrays are only ever push()ed into in place —
      // landmarks.js change-detects on array length.
      const mystery = ctx.world.mystery ??= { found: [], visited: [] };
      const px = obj.position.x;
      const py = obj.position.y;
      const pz = obj.position.z;

      // Convergence rung (wave 6): once enough clues are held, Echo voices
      // the hint exactly once ever — the flag persists on the mystery record.
      // Old saves lack these fields; missing reads falsy.
      if (!mystery.convergeHinted && (mystery.found?.length ?? 0) >= CONVERGENCE.cluesNeeded) {
        mystery.convergeHinted = true;
        ctx.emit('commLine', { text: CONVERGENCE.hintLine, from: 'Echo' });
      }

      // Site discovery: hinted, in the site's system, within its radius.
      // The converged flag is the permanence guard — fires exactly once ever.
      if (mystery.convergeHinted && !mystery.converged
        && ctx.world.currentSystem === CONVERGENCE.site.system) {
        const sp = CONVERGENCE.site.position;
        if (Math.hypot(px - sp[0], py - sp[1], pz - sp[2]) <= CONVERGENCE.site.radius) {
          mystery.converged = true;
          ctx.emit('milestone', { id: 'convergence', line: CONVERGENCE.site.line });
          ctx.emit('convergence', { id: CONVERGENCE.site.id, line: CONVERGENCE.site.line });
          ctx.emit('songShift', { reason: 'convergence' });
        }
      }

      // Deepening rung (wave 7): after convergence, once enough clues are
      // held, Echo voices the hint exactly once ever — the flag persists on
      // the mystery record. Old saves lack these fields; missing reads falsy.
      if (mystery.converged && !mystery.deepHinted
        && (mystery.found?.length ?? 0) >= DEEPENING.cluesNeeded) {
        mystery.deepHinted = true;
        ctx.emit('commLine', { text: DEEPENING.hintLine, from: 'Echo' });
      }

      // Site discovery: hinted, in the site's system, within its radius.
      // The deepened flag is the permanence guard — fires exactly once ever.
      if (mystery.deepHinted && !mystery.deepened
        && ctx.world.currentSystem === DEEPENING.site.system) {
        const sp = DEEPENING.site.position;
        if (Math.hypot(px - sp[0], py - sp[1], pz - sp[2]) <= DEEPENING.site.radius) {
          mystery.deepened = true;
          ctx.emit('milestone', { id: 'deepening', line: DEEPENING.site.line });
          ctx.emit('deepening', { id: DEEPENING.site.id, line: DEEPENING.site.line });
          ctx.emit('songShift', { reason: 'deepening' });
          ctx.emit('commLine', { text: DEEPENING.site.line, from: 'Echo' });
        }
      }

      const def = ctx.systems?.[ctx.world.currentSystem];
      if (!def) return;

      const clues = def.clues || EMPTY;
      for (let i = 0; i < clues.length; i++) {
        const c = clues[i];
        if (mystery.found.indexOf(c.id) !== -1) continue;
        const p = c.position;
        if (Math.hypot(px - p[0], py - p[1], pz - p[2]) > CLUE_RADIUS) continue;
        mystery.found.push(c.id);
        ctx.emit('clueFound', { id: c.id, line: c.line });
        ctx.emit('commLine', { text: c.line, from: 'Echo' });
        if (mystery.found.length === 3) {
          ctx.emit('milestone', { id: 'echoes-3', line: 'Something out here is answering.' });
        }
      }

      const landmarks = def.landmarks || EMPTY;
      for (let i = 0; i < landmarks.length; i++) {
        const l = landmarks[i];
        if (mystery.visited.indexOf(l.id) !== -1) continue;
        const p = l.position;
        if (Math.hypot(px - p[0], py - p[1], pz - p[2]) > LANDMARK_RADIUS) continue;
        mystery.visited.push(l.id);
        ctx.emit('landmarkFound', { id: l.id, name: l.name, line: l.line });
        ctx.emit('commLine', { text: l.line, from: l.name });
      }
    },
  };
}
