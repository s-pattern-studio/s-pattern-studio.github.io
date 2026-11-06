import test from 'node:test';
import assert from 'node:assert/strict';
import {useStaticExperience} from '../src/lib/device.ts';
import {posterLayout} from '../src/lib/posters.ts';
test('phones stay static in both orientations, even with an old 3D preference',()=>{
 assert.equal(useStaticExperience(390,true,'iPhone'),true);
 assert.equal(useStaticExperience(932,true,'iPhone'),true);
 assert.equal(useStaticExperience(1200,true,'Android'),true);
 assert.equal(useStaticExperience(390,false,'Desktop'),true);
 assert.equal(useStaticExperience(1920,false,'Desktop'),false);
 assert.equal(useStaticExperience(1440,true,'Desktop'),false);
});
test('rotated posters leave clearance from the window and each other',()=>{
 for(const p of posterLayout){const radius=Math.abs(Math.cos(p.rotation))*p.width/2+Math.abs(Math.sin(p.rotation))*p.height/2;assert.ok(p.position[0]+radius<-1.01-.25);assert.ok(p.position[0]-radius>-4);}
 assert.equal(posterLayout.length,6);
});
