/** Guards for the diagnostic's claims; does not start Chrome or mutate gameplay. */
import assert from 'node:assert/strict';
import {pacingEventWindows,requireAccepted,requirePacingComplete} from './issue-10-live-probe.mjs';

const lateDemand={type:'hailOpened',t:20,observedWorldTime:250};
const firstMinuteHit={type:'playerHit',t:45,observedWorldTime:45};
assert.deepEqual(pacingEventWindows([lateDemand,firstMinuteHit]),{
  firstMinuteEvents:[firstMinuteHit],afterGraceEvents:[lateDemand],
});
assert.throws(()=>pacingEventWindows([{type:'hailOpened',t:20}]),/lacks observed world time/);
for(const label of ['Initial dock','Return dock']){
  assert.throws(()=>requireAccepted({ok:false,token:'combat'},label),new RegExp(label+' refused'));
}

function completedRun(){
  const rows=[
    ['01-stock-start',0,false,216],['02-first-minute',60,false,202],
    ['03-docked',87,true,36],['04-launched',88,false,50],
    ['05-left-law-zone',106,false,797],['06-after-starter-grace',190,false,797],
    ['07-return-outcome',224,true,36],['08-return-launch',225,false,50],
    ['09-extended-window',240,false,50],
  ];
  return {
    initialDock:{receipt:{ok:true},completed:true},returnAttempt:{receipt:{ok:true},completed:true},
    checkpoints:rows.map(([name,t,docked,range])=>({name,observation:{t,session:{phase:'playing'},flags:{docked},station:{range}}})),
  };
}
assert.doesNotThrow(()=>requirePacingComplete(completedRun()));
for(const stage of ['initialDock','returnAttempt']){
  const refused=completedRun();refused[stage].receipt={ok:false,token:'combat'};
  assert.throws(()=>requirePacingComplete(refused),/dock refused/);
  const timedOut=completedRun();timedOut[stage].completed=false;
  assert.throws(()=>requirePacingComplete(timedOut),/did not complete both docks/);
}
const skippedReturn=completedRun();skippedReturn.checkpoints.splice(6,2);
assert.throws(()=>requirePacingComplete(skippedReturn),/skipped or reordered/);
for(const i of [2,6]){
  const notDocked=completedRun();notDocked.checkpoints[i].observation.flags.docked=false;
  assert.throws(()=>requirePacingComplete(notDocked),/Not docked/);
}
for(const i of [3,4,7]){
  const notLaunched=completedRun();notLaunched.checkpoints[i].observation.flags.docked=true;
  assert.throws(()=>requirePacingComplete(notLaunched),/Not launched/);
}
for(const range of [299,300,NaN]){
  const neverLeft=completedRun();neverLeft.checkpoints[4].observation.station.range=range;
  assert.throws(()=>requirePacingComplete(neverLeft),/never crossed outside/);
}
const shortRun=completedRun();shortRun.checkpoints[8].observation.t=239;
assert.throws(()=>requirePacingComplete(shortRun),/time window not reached/);
console.log('PASS: event clock attribution and mandatory natural pacing flow guards');
