import type { Section } from './model';
import type { Vec3 } from './views';
export type SurfaceRect = { x:number;y:number;width:number;height:number;viewportWidth?:number;viewportHeight?:number };
export type SurfaceRefs={current:Partial<Record<Section,SurfaceRect>>};
export function surfaceTransform(rect:SurfaceRect|undefined,width:number,height:number){
  if(!rect)return `translate3d(${width*.4}px,${height*.4}px,0) scale(.2,.2)`;
  const vw=rect.viewportWidth??width,vh=rect.viewportHeight??height;
  return `translate3d(${rect.x*width/vw}px,${rect.y*height/vh}px,0) scale(${rect.width/vw},${rect.height/vh})`;
}
export const surfaces:Record<Section,{color:string;center:Vec3;width:number;height:number;horizontal?:boolean}>={
  work:{color:'#223c3d',center:[2.4,1.6,.698],width:1.1,height:.66},
  memories:{color:'#1b302b',center:[2.6,2.28,-2.76],width:2.18,height:1.38},
  records:{color:'#30251d',center:[-2.47,.55,-1.9],width:2.12,height:1.2},
  books:{color:'#30352c',center:[2.57,.55,-1.9],width:2.12,height:1.2},
  studio:{color:'#343e40',center:[-2.52,1.58,-2.87],width:.72,height:.99},
  contact:{color:'#171d18',center:[1.44,1.011,1.43],width:.32,height:.19,horizontal:true},
};
