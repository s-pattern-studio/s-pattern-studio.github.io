import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraJourney,advanceJourney} from '../src/lib/cameraJourney.ts';
test('overview orients first, approaches the object, then performs the final zoom',()=>{
  assert.equal(cameraJourney(.1,true).approach,0);
  assert.ok(cameraJourney(.1,true).focus>0);
  assert.equal(cameraJourney(1,true).approach,1);
  assert.equal(cameraJourney(1.05,true).zoom,0);
  assert.ok(cameraJourney(1.4,true).zoom>0);
  assert.equal(cameraJourney(1.62,true).done,false);
  assert.equal(cameraJourney(1.7,true).done,true);
});
test('changing target after a settled frame starts at zero before any pose is sampled',()=>{
  const next=advanceJourney({view:'room',elapsed:12},'work',.016);
  assert.equal(next.changed,true);assert.equal(next.elapsed,0);
  const pose=cameraJourney(next.elapsed,true);
  assert.equal(pose.approach,0);assert.equal(pose.zoom,0);assert.equal(pose.focus,0);assert.equal(pose.done,false);
});
test('retargeting during return starts from a fresh journey without an overview reset stage',()=>{
  const next=advanceJourney({view:'room',elapsed:.3},'books',.05);
  assert.equal(next.elapsed,0);assert.equal(cameraJourney(next.elapsed,true).phase,'orient');
  for(let t=0;t<1.8;t+=.01)assert.notEqual(cameraJourney(t,true).phase,'overview');
});
test('journey values remain bounded and continuous across stage boundaries',()=>{
  for(const boundary of [.18,.3,.98,1.1,1.62]){
    const a=cameraJourney(boundary-.0001,true),b=cameraJourney(boundary+.0001,true);
    for(const key of ['focus','approach','zoom']){assert.ok(Math.abs(a[key]-b[key])<.002);assert.ok(a[key]>=0&&b[key]<=1);}
  }
});
