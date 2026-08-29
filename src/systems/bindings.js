/**
 * Bind map helpers (RW-002 PR3). DOM-free, JSON-safe, prototype-safe.
 * Does not write ctx. Does not import ctx.js. Mouse mapping stays here,
 * not in key-code.js.
 */

function isProtoToken(v) {
  return v === '__proto__' || v === 'constructor' || v === 'prototype';
}

const RESERVED = new Set([
  'Escape',
  'Tab',
  'AltLeft',
  'AltRight',
  'ControlLeft',
  'ControlRight',
  'MetaLeft',
  'MetaRight',
  'ContextMenu',
  'Digit0',
  'Digit8',
  'Digit9',
]);
for (let i = 1; i <= 12; i++) RESERVED.add('F' + i);

const MOUSE = new Set(['Mouse0', 'Mouse1', 'Mouse2']);

const SHORT_SPECIAL = Object.freeze({
  Mouse0: 'LMB',
  Mouse1: 'MMB',
  Mouse2: 'RMB',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift R',
  Space: 'Space',
  Enter: 'Enter',
  Backspace: 'Backspace',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
});

export const COMMANDS = Object.freeze([
  Object.freeze({ id: 'strafeUp', defaultCode: 'KeyW', label: 'Vertical strafe up', helpLine: '{key} — vertical strafe up' }),
  Object.freeze({ id: 'strafeDown', defaultCode: 'KeyS', label: 'Vertical strafe down', helpLine: '{key} — vertical strafe down' }),
  Object.freeze({ id: 'strafeLeft', defaultCode: 'KeyA', label: 'Strafe left', helpLine: '{key} — strafe left' }),
  Object.freeze({ id: 'strafeRight', defaultCode: 'KeyD', label: 'Strafe right', helpLine: '{key} — strafe right' }),
  Object.freeze({ id: 'rollLeft', defaultCode: 'KeyQ', label: 'Roll left', helpLine: '{key} — roll left' }),
  Object.freeze({ id: 'rollRight', defaultCode: 'KeyE', label: 'Roll right', helpLine: '{key} — roll right' }),
  Object.freeze({ id: 'throttleUp', defaultCode: 'KeyR', label: 'Throttle up', helpLine: '{key} (hold) — throttle up' }),
  Object.freeze({
    id: 'throttleDown',
    defaultCode: 'KeyF',
    label: 'Throttle down',
    helpLine: '{key} (hold) — throttle down · double-tap — full stop',
  }),
  Object.freeze({ id: 'afterburner', defaultCode: 'Space', label: 'Afterburner', helpLine: '{key} — afterburner' }),
  Object.freeze({ id: 'drift', defaultCode: 'ShiftLeft', label: 'Vector-hold drift', helpLine: '{key} (hold) — vector-hold drift' }),
  Object.freeze({ id: 'fire', defaultCode: 'Mouse0', label: 'Fire', helpLine: '{key} (hold) — fire' }),
  Object.freeze({ id: 'wpn1', defaultCode: 'Digit1', label: 'Weapon group 1', helpLine: '{key} — weapon group 1 (cannon)' }),
  Object.freeze({ id: 'wpn2', defaultCode: 'Digit2', label: 'Weapon group 2', helpLine: '{key} — weapon group 2 (disruptor)' }),
  Object.freeze({ id: 'wpn3', defaultCode: 'Digit3', label: 'Weapon group 3', helpLine: '{key} — weapon group 3 (mining)' }),
  Object.freeze({ id: 'wpn4', defaultCode: 'Digit4', label: 'Weapon group 4', helpLine: '{key} — weapon group 4 (missiles)' }),
  Object.freeze({ id: 'wpn5', defaultCode: 'Digit5', label: 'Weapon group 5', helpLine: '{key} — weapon group 5 (psionic)' }),
  Object.freeze({
    id: 'targetCycle',
    defaultCode: 'KeyT',
    label: 'Cycle target',
    helpLine: '{key} — cycle target (hostiles first in combat)',
  }),
  Object.freeze({ id: 'reticleLock', defaultCode: 'KeyV', label: 'Lock under reticle', helpLine: '{key} — lock under reticle' }),
  Object.freeze({ id: 'automine', defaultCode: 'KeyN', label: 'Automine', helpLine: '{key} — automine locked asteroid' }),
  Object.freeze({
    id: 'enginePart',
    defaultCode: 'KeyK',
    label: 'Engine on lock',
    helpLine: '{key} — engine on lock (after shields)',
  }),
  Object.freeze({ id: 'hail', defaultCode: 'KeyH', label: 'Hail', helpLine: '{key} — hail' }),
  Object.freeze({ id: 'dock', defaultCode: 'KeyJ', label: 'Dock / jump', helpLine: '{key} — dock / jump' }),
  Object.freeze({
    id: 'camera',
    defaultCode: 'KeyC',
    label: 'Camera',
    helpLine: '{key} — camera (chase / third / first-person)',
  }),
  Object.freeze({ id: 'matchSpeed', defaultCode: 'KeyX', label: 'Match speed', helpLine: '{key} — match lock speed' }),
  Object.freeze({ id: 'pause', defaultCode: 'KeyP', label: 'Pause', helpLine: '{key} — pause' }),
  Object.freeze({ id: 'settings', defaultCode: 'KeyO', label: 'Settings', helpLine: '{key} — settings' }),
  Object.freeze({ id: 'chart', defaultCode: 'KeyM', label: 'Galaxy chart', helpLine: '{key} — galaxy chart' }),
  Object.freeze({ id: 'berth', defaultCode: 'KeyL', label: 'Berth records', helpLine: '{key} — berth records (save/load)' }),
  Object.freeze({
    id: 'hubCycle',
    defaultCode: 'KeyG',
    label: 'Hub route',
    helpLine: '{key} — cycle hub route at a Lamplighter junction',
  }),
]);

const BY_ID = Object.create(null);
const defaults = Object.create(null);
for (let i = 0; i < COMMANDS.length; i++) {
  const cmd = COMMANDS[i];
  BY_ID[cmd.id] = cmd;
  defaults[cmd.id] = cmd.defaultCode;
}
export const DEFAULT_BINDINGS = Object.freeze(defaults);

function copyDefaults() {
  const out = {};
  for (let i = 0; i < COMMANDS.length; i++) {
    const id = COMMANDS[i].id;
    out[id] = DEFAULT_BINDINGS[id];
  }
  return out;
}

function isReservedCode(code) {
  if (typeof code !== 'string' || code.length === 0) return true;
  if (isProtoToken(code)) return true;
  return RESERVED.has(code);
}

function isAllowedCode(id, code) {
  if (typeof id !== 'string' || !Object.hasOwn(BY_ID, id)) return false;
  if (typeof code !== 'string' || code.length === 0) return false;
  if (isReservedCode(code)) return false;
  if (MOUSE.has(code)) return id === 'fire';
  return true;
}

function hasCollision(map) {
  const seen = Object.create(null);
  for (let i = 0; i < COMMANDS.length; i++) {
    const id = COMMANDS[i].id;
    if (!Object.hasOwn(map, id)) continue;
    const code = map[id];
    if (typeof code !== 'string') continue;
    if (Object.hasOwn(seen, code)) return true;
    seen[code] = id;
  }
  return false;
}

function resolveCollisions(map) {
  const buckets = Object.create(null);
  for (let i = 0; i < COMMANDS.length; i++) {
    const id = COMMANDS[i].id;
    const code = Object.hasOwn(map, id) ? map[id] : DEFAULT_BINDINGS[id];
    if (typeof code !== 'string') continue;
    if (!Object.hasOwn(buckets, code)) buckets[code] = [];
    buckets[code].push(id);
  }
  const codes = Object.keys(buckets);
  for (let i = 0; i < codes.length; i++) {
    const ids = buckets[codes[i]];
    if (!ids || ids.length < 2) continue;
    for (let j = 0; j < ids.length; j++) {
      map[ids[j]] = DEFAULT_BINDINGS[ids[j]];
    }
  }
  if (hasCollision(map)) return copyDefaults();
  return map;
}

/** string or default; never throw */
export function codeOf(ctx, id) {
  try {
    if (typeof id !== 'string' || isProtoToken(id) || !Object.hasOwn(BY_ID, id)) return '';
    const map = ctx && ctx.settings && ctx.settings.bindings;
    if (map && typeof map === 'object' && !Array.isArray(map) && Object.hasOwn(map, id)) {
      const code = map[id];
      if (isAllowedCode(id, code)) return code;
    }
    return DEFAULT_BINDINGS[id];
  } catch {
    try {
      return Object.hasOwn(BY_ID, id) ? DEFAULT_BINDINGS[id] : '';
    } catch {
      return '';
    }
  }
}

/** Authored short labels. Never HTML. */
export function shortLabel(code) {
  try {
    if (typeof code !== 'string' || code.length === 0) return '?';
    if (isProtoToken(code)) return '?';
    if (Object.hasOwn(SHORT_SPECIAL, code)) return SHORT_SPECIAL[code];
    if (code.length === 4 && code.charCodeAt(0) === 75 && code.charCodeAt(1) === 101 && code.charCodeAt(2) === 121) {
      const c = code.charCodeAt(3);
      if (c >= 65 && c <= 90) return code.charAt(3);
    }
    if (code.length === 6 && code.startsWith('Digit')) {
      const d = code.charCodeAt(5);
      if (d >= 48 && d <= 57) return code.charAt(5);
    }
    if (code.length === 7 && code.startsWith('Numpad')) {
      const d = code.charCodeAt(6);
      if (d >= 48 && d <= 57) return 'Num ' + code.charAt(6);
    }
    if (isReservedCode(code)) return '?';
    return code;
  } catch {
    return '?';
  }
}

export function commandLabel(id) {
  try {
    if (typeof id !== 'string' || isProtoToken(id) || !Object.hasOwn(BY_ID, id)) return '';
    return BY_ID[id].label;
  } catch {
    return '';
  }
}

export function helpLines(ctx) {
  const lines = ['Mouse — steer toward reticle'];
  try {
    for (let i = 0; i < COMMANDS.length; i++) {
      const cmd = COMMANDS[i];
      const key = shortLabel(codeOf(ctx, cmd.id));
      lines.push(cmd.helpLine.split('{key}').join(key));
    }
  } catch {
    /* keep the steer line */
  }
  return lines;
}

/**
 * '' | 'reserved' | other command id. Self-bind is not a conflict.
 * Garbage codes are reserved.
 */
export function conflictFor(map, id, code) {
  try {
    if (typeof id !== 'string' || isProtoToken(id) || !Object.hasOwn(BY_ID, id)) return 'reserved';
    if (!isAllowedCode(id, code)) return 'reserved';
    if (!map || typeof map !== 'object' || Array.isArray(map)) return '';
    for (let i = 0; i < COMMANDS.length; i++) {
      const other = COMMANDS[i].id;
      if (other === id) continue;
      if (!Object.hasOwn(map, other)) continue;
      if (map[other] === code) return other;
    }
    return '';
  } catch {
    return 'reserved';
  }
}

/** Plain object. Reject arrays/null. Collision set → defaults; leftover conflict → full reset. */
export function sanitizeBindings(raw) {
  try {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return copyDefaults();
    const out = copyDefaults();
    for (let i = 0; i < COMMANDS.length; i++) {
      const id = COMMANDS[i].id;
      if (!Object.hasOwn(raw, id)) continue;
      const code = raw[id];
      if (!isAllowedCode(id, code)) continue;
      out[id] = code;
    }
    return resolveCollisions(out);
  } catch {
    return copyDefaults();
  }
}
