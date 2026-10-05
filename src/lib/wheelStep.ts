// A trackpad's momentum belongs to the same gesture, even after snapping ends.
export function wheelStep(state:{last:number;sum:number;used:boolean},delta:number,now:number){
 const fresh=now-state.last>180;
 const sum=(fresh?0:state.sum)+delta;
 const used=fresh?false:state.used;
 const step=!used&&Math.abs(sum)>=24?Math.sign(sum):0;
 return {last:now,sum,used:used||step!==0,step};
}
