// Leave a physical gap before the window's left frame at x = -1.01.
export const posterLayout=Array.from({length:6},(_,i)=>({
  position:[-3.36+(i%3)*.82,2.82-Math.floor(i/3)*1.04,-2.87] as [number,number,number],
  rotation:(i%3-1)*.014,width:.72,height:.99,
}));
