import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../public/maps/${name}.json`,import.meta.url),'utf8'));
const world=read('world'),regions=read('regions');
test('world retains Taiwan and small countries as independently selectable boundaries',()=>{
  assert.equal(world.length,242);assert.equal(new Set(world.map(f=>f.id)).size,world.length);
  for(const id of ['TWN','SGP','MCO','VAT','MLT','LIE'])assert.ok(world.find(f=>f.id===id)?.path.length>0,id);
});
test('travel footprints match confirmed cities and Taiwan counties without inventing visits',()=>{
  assert.deepEqual(regions.filter(f=>f.kind==='city').map(f=>f.id).sort(),['edmonton','shanghai','suzhou','hangzhou','tianjin','beijing','harbin','taiyuan','datong','nanjing'].sort());
  assert.equal(regions.filter(f=>f.kind==='county').length,22);
  assert.deepEqual(regions.filter(f=>f.kind==='county'&&f.visited).map(f=>f.id).sort(),['TW-PIF','TW-KHH','TW-HUA','TW-TXG','TW-TPE','TW-YUN','TW-TNN','TW-NAN','TW-CYI','TW-CYQ'].sort());
  assert.equal(regions.find(f=>f.id==='TW-NWT').visited,false);
});
test('projected administrative boundaries are finite closed areas with local city extents',()=>{
  for(const f of [...world,...regions]){
    assert.ok(f.path.startsWith('M')&&f.path.endsWith('Z'),f.id);
    assert.ok(!/NaN|Infinity/.test(f.path),f.id);
    const [x,y,right,bottom]=f.bounds;assert.ok([x,y,right,bottom,...f.center].every(Number.isFinite));
    assert.ok(right>x&&bottom>y,f.id);
    if(f.kind==='city')assert.ok(right-x<10&&bottom-y<10,`${f.id} must be a city, not its country`);
  }
});
