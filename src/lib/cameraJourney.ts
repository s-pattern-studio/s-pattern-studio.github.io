const ease=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
/** Separate orienting, approaching, and the final push; velocities meet at zero. */
export function advanceJourney(previous:{view:string;elapsed:number},view:string,dt:number){
  const changed=previous.view!==view;
  return {view,elapsed:changed?0:previous.elapsed+Math.max(0,Math.min(dt,.05)),changed};
}
export function cameraJourney(elapsed:number,opening:boolean){
  if(!opening)return {focus:ease(elapsed/.95),approach:ease(elapsed/.95),zoom:0,done:elapsed>=.95,phase:elapsed>=.95?'arrived':'return'};
  const t=Math.max(0,elapsed);
  return {
    focus:ease(t/.3),
    approach:ease((t-.18)/.8),
    zoom:ease((t-1.10)/.52),
    done:elapsed>=1.70,
    phase:t<.18?'orient':t<.98?'approach':t<1.10?'framed':t<1.70?'zoom':'arrived',
  };
}
