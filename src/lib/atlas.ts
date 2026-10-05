export type MapFeature={id:string;en:string;zh:string;path:string;bounds:[number,number,number,number];center:[number,number];kind?:'city'|'county';visited?:boolean};
export type AtlasData={world:MapFeature[];regions:MapFeature[]};
let cached:Promise<AtlasData>|undefined;
export function loadAtlas(){
  return cached??=Promise.all(['world','regions'].map(async name=>{
    const response=await fetch(`${import.meta.env.BASE_URL}maps/${name}.json`);
    if(!response.ok)throw Error('Map unavailable');return response.json() as Promise<MapFeature[]>;
  })).then(([world,regions])=>({world,regions})).catch(error=>{cached=undefined;throw error;});
}
export function fitBounds(bounds:MapFeature['bounds']):[number,number,number,number]{
  const [x,y,right,bottom]=bounds;const width=Math.max(right-x,.012)*1.3,height=Math.max(bottom-y,.012)*1.3;
  const w=Math.max(width,height*1.55),h=w/1.55;return [(x+right-w)/2,(y+bottom-h)/2,w,h];
}
