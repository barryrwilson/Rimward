/**
 * KeyboardEvent.code with empty-code fallback from `key`.
 * Authored literals only. Never throw. Prototype-safe: Object.hasOwn, no for-in.
 */

/** Own field, or host proto (KeyboardEvent getters). Never Object.prototype. */
function ownValue(obj, name) {
  let cur = obj;
  const seen = new Set();
  let depth = 0;
  while (cur && cur !== Object.prototype && depth < 8) {
    depth += 1;
    if (seen.has(cur)) break;
    seen.add(cur);
    if (Object.hasOwn(cur, name)) return obj[name];
    cur = Object.getPrototypeOf(cur);
  }
  return undefined;
}

function fromKey(key) {
  if (typeof key !== 'string' || key.length === 0) return '';
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return '';
  let k;
  try {
    k = key.toLowerCase();
  } catch {
    return '';
  }
  if (k === '__proto__' || k === 'constructor' || k === 'prototype') return '';
  if (k.length === 1) {
    const c = k.charCodeAt(0);
    if (c >= 97 && c <= 122) return 'Key' + String.fromCharCode(c - 32);
    if (c >= 48 && c <= 57) return 'Digit' + k;
  }
  if (key === ' ' || k === 'space') return 'Space';
  if (k === 'shift') return 'ShiftLeft';
  if (k === 'escape') return 'Escape';
  if (k === 'arrowup') return 'ArrowUp';
  if (k === 'arrowdown') return 'ArrowDown';
  return '';
}

export function decodeKeyCode(e) {
  try {
    if (e == null || typeof e !== 'object') return '';
    const code = ownValue(e, 'code');
    if (typeof code === 'string' && code.length > 0) return code;
    return fromKey(ownValue(e, 'key'));
  } catch {
    return '';
  }
}
