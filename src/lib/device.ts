export function useStaticExperience(width:number,coarse:boolean,userAgent:string){
  return width<=760 || /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent) || (coarse&&width<=1024);
}
