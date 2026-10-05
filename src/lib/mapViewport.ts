export type MapBox=[number,number,number,number];
export const WORLD:MapBox=[0,0,360,360];
export const TAIWAN:MapBox=[296,151.5,7,8];
export function fitMapAspect(box:MapBox,aspect:number):MapBox{
  const [x,y,w,h]=box;const width=Math.max(w,h*aspect),height=width/aspect;
  return [x+(w-width)/2,y+(h-height)/2,width,height];
}
export function clampMapBox(box:MapBox,extent:MapBox=WORLD):MapBox{
  const [left,top,maxWidth,maxHeight]=extent;
  const ratio=box[2]/box[3];
  const width=Math.min(maxWidth,maxHeight*ratio,Math.max(.008,box[2]));
  const height=width/ratio;
  return [Math.max(left,Math.min(left+maxWidth-width,box[0])),Math.max(top,Math.min(top+maxHeight-height,box[1])),width,height];
}
export function zoomMapBox(box:MapBox,factor:number,extent:MapBox=WORLD):MapBox{
  const [x,y,w,h]=box;return clampMapBox([x+w*(1-factor)/2,y+h*(1-factor)/2,w*factor,h*factor],extent);
}
