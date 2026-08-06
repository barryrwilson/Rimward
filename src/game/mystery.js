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
 * Pure sim: no three.js/DOM imports. Ship position is read as plain x/y/z
 * properties off ctx.ship.object.position; distances via Math.hypot.
 * Per-frame cost: one pass over the current system's few entries, zero
 * allocations.
 */

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
