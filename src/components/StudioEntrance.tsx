import {useEffect,useRef,useState} from 'react';
export default function StudioEntrance({ready,reduced,locale,onComplete,onStatic}:{ready:boolean;reduced:boolean;locale:string;onComplete:()=>void;onStatic:()=>void}){
 const started=useRef(performance.now()),[leaving,setLeaving]=useState(false),zh=locale==='zh-TW';
 const complete=useRef(onComplete);complete.current=onComplete;
 useEffect(()=>{if(!ready)return;const begin=window.setTimeout(()=>setLeaving(true),reduced?0:Math.max(0,700-(performance.now()-started.current)));return()=>clearTimeout(begin);},[ready,reduced]);
 useEffect(()=>{if(!leaving)return;const end=window.setTimeout(()=>complete.current(),reduced?0:650);return()=>clearTimeout(end);},[leaving,reduced]);
 return <div className={`studio-entrance ${leaving?'entrance-leaving':''}`} role="region" aria-label={zh?'進入工作室':'Entering the studio'}>
  <div className="entrance-light" aria-hidden="true"/><div className="entrance-print"><span className="entrance-edition">INDEPENDENT SPIRIT / VOL. 01</span><div className="entrance-record" aria-hidden="true"><span>S.</span></div><h2>S. Pattern <span>Studio</span></h2><div className="entrance-line" aria-hidden="true"/><p role="status">{ready?(zh?'燈亮了，歡迎進來。':'The light is on. Come on in.'):(zh?'正在點亮工作室⋯':'Setting the mood…')}</p><span className="entrance-caption">DESIGN · CODE · CULTURE</span></div>
  <button className="entrance-skip" onClick={onStatic}>{zh?'直接以靜態版瀏覽':'Continue in still view'} ↗</button>
 </div>;
}
