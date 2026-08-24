/**
 * TGT-03 subsystem aim (Wave 100). Live only: no persist, no DOM.
 * Selectable part is engine. Other channels stay geometry peel.
 */

export const SUBSYS_PART_ENGINE = 'engine';

export function healSubsysPart(part) {
  return part === SUBSYS_PART_ENGINE ? SUBSYS_PART_ENGINE : null;
}

export function lockIsShip(t) {
  return !!(t && t.object && t.state && !t.lockKind);
}

export function dropPartIfNotShip(ctx) {
  if (!ctx || !ctx.targets) return;
  if (!lockIsShip(ctx.targets.current)) ctx.targets.part = null;
}

export function toggleEnginePart(ctx) {
  if (!ctx || !ctx.targets) return null;
  if (ctx.flags && ctx.flags.docked) return healSubsysPart(ctx.targets.part);
  if (ctx.flags && ctx.flags.chartOpen) return healSubsysPart(ctx.targets.part);
  if (ctx.gate && ctx.gate.jumping) return healSubsysPart(ctx.targets.part);
  if (!lockIsShip(ctx.targets.current)) {
    ctx.targets.part = null;
    return null;
  }
  const next = healSubsysPart(ctx.targets.part) === SUBSYS_PART_ENGINE
    ? null
    : SUBSYS_PART_ENGINE;
  ctx.targets.part = next;
  return next;
}

export function prefersEngine(ctx, ship) {
  if (!ctx || !ctx.targets) return false;
  if (healSubsysPart(ctx.targets.part) !== SUBSYS_PART_ENGINE) return false;
  const cur = ctx.targets.current;
  return !!(ship && cur === ship && lockIsShip(cur));
}
