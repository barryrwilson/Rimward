import {
  PAD_GOV_FAR_CAP,
  PAD_GOV_SLOW,
  applyPadSpeedGovernor,
  padGovernorActive,
  padGovernorBand,
  padMaxClosingSpeed,
} from '../src/game/pad-speed-governor.js';

let fails = 0;
function pin(name, ok) {
  if (ok) console.log('ok', name);
  else {
    fails += 1;
    console.log('FAIL', name);
  }
}

const live = {
  docked: false,
  jumping: false,
  berthHold: false,
  paused: false,
  dockPressed: false,
  burnerActive: false,
  apDock: false,
};

pin('band 3x', padGovernorBand(45) === 135);
pin('cap at dock', padMaxClosingSpeed(45, 45) === PAD_GOV_SLOW);
pin('cap inside dock', padMaxClosingSpeed(30, 45) === PAD_GOV_SLOW);
pin('cap at band', padMaxClosingSpeed(135, 45) === PAD_GOV_FAR_CAP);
pin('cap mid is between', (() => {
  const mid = padMaxClosingSpeed(90, 45);
  return mid > PAD_GOV_SLOW && mid < PAD_GOV_FAR_CAP;
})());
pin('nonfinite dist fail-closed', padMaxClosingSpeed(NaN, 45) === PAD_GOV_SLOW);

pin('active default', padGovernorActive(live) === true);
pin('cancel docked', padGovernorActive({ ...live, docked: true }) === false);
pin('cancel jump', padGovernorActive({ ...live, jumping: true }) === false);
pin('cancel berth', padGovernorActive({ ...live, berthHold: true }) === false);
pin('cancel pause', padGovernorActive({ ...live, paused: true }) === false);
pin('cancel dockPressed', padGovernorActive({ ...live, dockPressed: true }) === false);
pin('cancel burner', padGovernorActive({ ...live, burnerActive: true }) === false);
pin('cancel apDock', padGovernorActive({ ...live, apDock: true }) === false);
pin('cancel missing flags', padGovernorActive(null) === false);

{
  const vel = { x: -120, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    { x: 200, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    live,
    45,
  );
  pin('outside band no-op', applied === false && vel.x === -120);
}

{
  const vel = { x: -120, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    { x: 100, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    live,
    45,
  );
  const cap = padMaxClosingSpeed(100, 45);
  pin('clamps closing', applied === true && Math.abs((-vel.x) - cap) < 1e-9);
  pin('no lateral invent', vel.y === 0 && vel.z === 0);
}

{
  const vel = { x: 80, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    { x: 80, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    live,
    45,
  );
  pin('never accelerate toward', applied === false && vel.x === 80);
}

{
  const vel = { x: 40, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    { x: 80, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    live,
    45,
  );
  pin('receding no-op', applied === false && vel.x === 40);
}

{
  const vel = { x: -120, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    { x: 80, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { ...live, burnerActive: true },
    45,
  );
  pin('burner override', applied === false && vel.x === -120);
}

{
  const vel = { x: -120, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    [90, 0, 0],
    [0, 0, 0],
    live,
    45,
  );
  pin('array poses', applied === true && vel.x > -120);
}

{
  const vel = { x: -120, y: 0, z: 0 };
  const applied = applyPadSpeedGovernor(
    vel,
    { x: NaN, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    live,
    45,
  );
  pin('nan pose skip', applied === false && vel.x === -120);
}

if (fails === 0) {
  console.log('PAD SPEED GOVERNOR PASS');
  process.exit(0);
}
console.log(`PAD SPEED GOVERNOR FAIL — ${fails}`);
process.exit(1);
