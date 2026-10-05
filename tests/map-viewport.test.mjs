import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clampMapBox,zoomMapBox,fitMapAspect,WORLD,TAIWAN} from '../src/lib/mapViewport.ts';
function within(box,extent){
  const [x,y,w,h]=box,[left,top,width,height]=extent;
  assert.ok(x>=left-1e-9&&y>=top-1e-9);
  assert.ok(x+w<=left+width+1e-9&&y+h<=top+height+1e-9);
  assert.ok(w>0&&h>0);
}
test('Taiwan extent includes all county geometry, including offshore islands',()=>{
  const regions=JSON.parse(fs.readFileSync(new URL('../public/maps/regions.json',import.meta.url),'utf8'));
  for(const f of regions.filter(f=>f.kind==='county')){const [x,y,r,b]=f.bounds;within([x,y,r-x,b-y],TAIWAN);}
});
test('dragging beyond any edge stays inside the active map extent',()=>{
  for(const extent of [WORLD,TAIWAN])for(const x of [-10000,0,10000])for(const y of [-10000,0,10000]){
    within(clampMapBox([x,y,1,1],extent),extent);
  }
});
test('repeated zoom out fits the extent without changing aspect ratio',()=>{
  for(const extent of [WORLD,TAIWAN]){
    let box=clampMapBox([300,155,.1,.2],extent);
    for(let i=0;i<100;i++){box=zoomMapBox(box,1.8,extent);within(box,extent);assert.ok(Math.abs(box[2]/box[3]-.5)<1e-9);}
  }
});
test('repeated zoom in remains finite and stops at the minimum width',()=>{
  let box=TAIWAN;
  for(let i=0;i<100;i++){box=zoomMapBox(box,.55,TAIWAN);within(box,TAIWAN);}
  assert.equal(box[2],.008);
});
test('desktop and mobile map frames match the container without stretching geography',()=>{
  for(const aspect of [878/480,326/340]){
    const extent=fitMapAspect(TAIWAN,aspect);let box=extent;
    for(let i=0;i<20;i++){box=zoomMapBox(box,i%2?.55:1.8,extent);within(box,extent);assert.ok(Math.abs(box[2]/box[3]-aspect)<1e-9);}
  }
});
test('wall map SVG has explicit raster dimensions for WebGL texture upload',()=>{
  const svg=fs.readFileSync(new URL('../public/maps/world-wall.svg',import.meta.url),'utf8');
  assert.match(svg.slice(0,160),/width="1440" height="960"/);
});
