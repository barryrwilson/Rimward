/**
 * Contacts-arc gate. Pure: no DOM, no WEAPONS index.
 * Garbage / missing scanner heals to 0 (hide). Park docked or jumping.
 * Does not mutate scanner.
 */

/** @returns {0|1|2} */
export function contactsScanner(scanner) {
  return scanner === 1 || scanner === 2 ? scanner : 0;
}

/**
 * @param {unknown} scanner
 * @param {unknown} docked
 * @param {unknown} jumping
 * @returns {boolean}
 */
export function contactsGate(scanner, docked, jumping) {
  return contactsScanner(scanner) >= 1 && !docked && !jumping;
}
