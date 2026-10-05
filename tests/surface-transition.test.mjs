import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceTransform,surfaces} from '../src/lib/surfaces.ts';
import {views} from '../src/lib/views.ts';
test('surface expansion starts at the projected object instead of the viewport centre',()=>{
  assert.equal(surfaceTransform({x:800,y:240,width:200,height:120,viewportWidth:1000,viewportHeight:600},1000,600),'translate3d(800px,240px,0) scale(0.2,0.2)');
});
test('closing after viewport resize preserves the relative object anchor',()=>{
  assert.equal(surfaceTransform({x:800,y:240,width:200,height:120,viewportWidth:1000,viewportHeight:600},500,300),'translate3d(400px,120px,0) scale(0.2,0.2)');
});
test('every room section has a nonzero object surface for zoom transitions',()=>{
  for(const section of ['work','records','books','memories','studio','contact']){
    assert.ok(surfaces[section].width>0&&surfaces[section].height>0);
    assert.equal(surfaces[section].center.length,3);
  }
});
test('each 3D close-up moves the camera substantially toward its actual object',()=>{
  const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  for(const [section,surface] of Object.entries(surfaces)){
    assert.ok(distance(views[section].position,surface.center)<distance(views.room.position,surface.center)*.6,section);
    assert.deepEqual(views[section].look,surface.center,section);
  }
});
