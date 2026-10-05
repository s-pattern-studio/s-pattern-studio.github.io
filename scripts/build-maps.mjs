import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve('public/maps');
const read = name => JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const project = ([lon,lat]) => [lon+180,180-Math.log(Math.tan(Math.PI/4+Math.max(-85,Math.min(85,lat))*Math.PI/360))*180/Math.PI];
function shape(geometry) {
  if(!['Polygon','MultiPolygon'].includes(geometry.type))throw Error(`Expected area, got ${geometry.type}`);
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const d=polygons.map(polygon=>polygon.map(ring=>ring.map((coord,i)=>{
    const [x,y]=project(coord);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    return `${i?'L':'M'}${x.toFixed(4)},${y.toFixed(4)}`;
  }).join('')+'Z').join('')).join('');
  return {path:d,bounds:[minX,minY,maxX,maxY],center:[(minX+maxX)/2,(minY+maxY)/2]};
}
const world=read('world-detail-source.geojson').features.map(f=>({id:f.properties.ADM0_A3,en:f.properties.NAME_EN||f.properties.NAME,zh:f.properties.NAME_ZHT||f.properties.NAME_ZH||f.properties.NAME,...shape(f.geometry)}));
fs.writeFileSync(path.join(dir,'world.json'),JSON.stringify(world));
const cities = [
  ['edmonton','Edmonton','愛德蒙頓'],['shanghai','Shanghai','上海'],['suzhou','Suzhou','蘇州'],['hangzhou','Hangzhou','杭州'],['tianjin','Tianjin','天津'],['beijing','Beijing','北京'],['harbin','Harbin','哈爾濱'],['taiyuan','Taiyuan','太原'],['datong','Datong','大同'],['nanjing','Nanjing','南京'],
].map(([id,en,zh])=>{
  const f=read(`${id}-source.geojson`).features[0];
  if(f.properties.category!=='boundary')throw Error(`Not an administrative boundary: ${id}`);
  return {id,en,zh,kind:'city',osmId:f.properties.osm_id,visited:true,...shape(f.geometry)};
});
const twNames={'TW-HSQ':'新竹縣','TW-MIA':'苗栗縣','TW-LIE':'連江縣','TW-KIN':'金門縣','TW-CYQ':'嘉義縣','TW-ILA':'宜蘭縣','TW-NAN':'南投縣','TW-CHA':'彰化縣','TW-PIF':'屏東縣','TW-TTT':'臺東縣','TW-HUA':'花蓮縣','TW-PEN':'澎湖縣','TW-YUN':'雲林縣','TW-CYI':'嘉義市','TW-HSZ':'新竹市','TW-KEE':'基隆市','TW-TXG':'臺中市','TW-TAO':'桃園市','TW-NWT':'新北市','TW-TNN':'臺南市','TW-TPE':'臺北市','TW-KHH':'高雄市'};
const visitedTaiwan=new Set(['TW-PIF','TW-KHH','TW-HUA','TW-TXG','TW-TPE','TW-YUN','TW-TNN','TW-NAN','TW-CYI','TW-CYQ']);
const taiwan=read('taiwan-source.geojson').features.map(f=>({id:f.properties.shapeISO,en:f.properties.shapeName,zh:twNames[f.properties.shapeISO],kind:'county',visited:visitedTaiwan.has(f.properties.shapeISO),...shape(f.geometry)}));
fs.writeFileSync(path.join(dir,'regions.json'),JSON.stringify([...cities,...taiwan]));
const simple=read('world-source.geojson').features.map(f=>shape(f.geometry));
const wall=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 35 360 240"><rect x="0" y="30" width="360" height="290" fill="#1b302b"/><g fill="#758573" stroke="#c8b78a" stroke-width=".32">${simple.map(s=>`<path d="${s.path}"/>`).join('')}</g><g fill="#efd088">${cities.map(c=>`<circle cx="${c.center[0]}" cy="${c.center[1]}" r="1.4"/>`).join('')}</g><text x="15" y="265" fill="#c4b38b" font-family="monospace" font-size="5">PLACES LEAVE PATTERNS</text></svg>`;
fs.writeFileSync(path.join(dir,'world-wall.svg'),wall);
console.log(JSON.stringify({countries:world.length,cities:cities.length,taiwan:taiwan.length,worldBytes:fs.statSync(path.join(dir,'world.json')).size,regionsBytes:fs.statSync(path.join(dir,'regions.json')).size}));

