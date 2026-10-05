import {memo,useEffect,useRef,useState} from 'react';
import {loadAtlas,fitBounds,type AtlasData,type MapFeature} from '../lib/atlas';
import {clampMapBox,zoomMapBox,fitMapAspect,WORLD,TAIWAN} from '../lib/mapViewport';
import StudioSelect from './StudioSelect';
import type {Locale} from '../lib/model';
const overview:[number,number,number,number]=[0,35,360,240];
const CountryLayer=memo(function CountryLayer({world,locale}:{world:MapFeature[];locale:Locale}){return <g className="atlas-countries">{world.map(f=><path key={f.id} d={f.path} fillRule="evenodd" vectorEffect="non-scaling-stroke"><title>{locale==='zh-TW'?f.zh:f.en}</title></path>)}</g>;});
export default function TravelAtlas({locale}:{locale:Locale}){
  const zh=locale==='zh-TW',name=(f:MapFeature)=>zh?f.zh:f.en;
  const [data,setData]=useState<AtlasData>();const [error,setError]=useState(false);
  const [selected,setSelected]=useState<string>('');const [scope,setScope]=useState('world');
  const [aspect,setAspect]=useState(1.55);
  const extent=scope==='taiwan'?fitMapAspect(TAIWAN,aspect):WORLD;
  const [box,setBox]=useState(overview);const [country,setCountry]=useState('');
  const drag=useRef<{x:number;y:number;box:typeof overview;moved:boolean}|null>(null);
  const svg=useRef<SVGSVGElement>(null);
  useEffect(()=>{if(!svg.current)return;const observer=new ResizeObserver(([entry])=>{const {width,height}=entry.contentRect;if(width&&height)setAspect(width/height);});observer.observe(svg.current);return()=>observer.disconnect();},[data]);
  useEffect(()=>{setBox(previous=>clampMapBox(fitMapAspect(previous,aspect),scope==='taiwan'?fitMapAspect(TAIWAN,aspect):WORLD));},[aspect,scope]);
  function fetchData(){setError(false);loadAtlas().then(setData).catch(()=>setError(true));}
  useEffect(()=>{fetchData();},[]);
  function focus(f:MapFeature){setSelected(f.id);setBox(clampMapBox(fitMapAspect(fitBounds(f.bounds),aspect),extent));}
  function changeScope(next:string){setScope(next);setCountry('');setSelected('');setBox(clampMapBox(fitMapAspect(next==='taiwan'?TAIWAN:overview,aspect),next==='taiwan'?fitMapAspect(TAIWAN,aspect):WORLD));}
  function zoom(factor:number){setBox(box=>zoomMapBox(box,factor,extent));}
  if(!data)return <div className="atlas-loading" role="status">{error?<><p>{zh?'地圖暫時無法載入':'The map could not load.'}</p><button onClick={fetchData}>{zh?'重試':'Try again'}</button></>:zh?'正在展開旅行地圖…':'Unfolding the atlas…'}</div>;
  const regions=data.regions.filter(f=>scope==='taiwan'?f.kind==='county':true),place=data.regions.find(f=>f.id===selected);
  return <div className="travel-atlas">
    <div className="atlas-toolbar"><div className="atlas-tabs"><button aria-pressed={scope==='world'} onClick={()=>changeScope('world')}>{zh?'世界':'World'}</button><button aria-pressed={scope==='taiwan'} onClick={()=>changeScope('taiwan')}>{zh?'臺灣 · 22 縣市':'Taiwan · 22 regions'}</button></div>
    <div className="atlas-country-select"><span>{zh?'探索國家與地區':'Countries & territories'}</span><StudioSelect label={zh?'探索國家與地區':'Countries & territories'} value={country} searchable searchLabel={zh?'搜尋國家與地區':'Search countries and territories'} onChange={value=>{const f=data.world.find(f=>f.id===value);setCountry(value);if(f){setScope('world');setSelected('');setBox(clampMapBox(fitMapAspect(fitBounds(f.bounds),aspect)));}}} options={[{value:'',label:zh?'選擇目的地':'Choose a destination'},...[...data.world].sort((a,b)=>name(a).localeCompare(name(b),locale)).map(f=>({value:f.id,label:name(f)}))]}/></div></div>
    <div className="atlas-layout"><div className="atlas-map">
      <svg ref={svg} viewBox={box.join(' ')} aria-label={zh?'可拖曳與縮放的旅行地圖':'Interactive travel map'} onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,box,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(!d)return;const rect=e.currentTarget.getBoundingClientRect(),scale=Math.max(d.box[2]/rect.width,d.box[3]/rect.height);const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>5)d.moved=true;if(d.moved)setBox(clampMapBox([d.box[0]-dx*scale,d.box[1]-dy*scale,d.box[2],d.box[3]],extent));}} onPointerUp={e=>{const d=drag.current;if(d&&!d.moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-place]');const f=data.regions.find(f=>f.id===target?.getAttribute('data-place'));if(f)focus(f);}drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <CountryLayer world={data.world} locale={locale}/>
        <g>{regions.map(f=><path key={f.id} data-place={f.id} d={f.path} fillRule="evenodd" vectorEffect="non-scaling-stroke" className={`atlas-region ${f.visited?'visited':''} ${f.id===selected?'selected':''}`}><title>{name(f)}</title></path>)}</g>
        {box[2]>12&&<g>{data.regions.filter(f=>f.visited&&f.kind==='city').map(f=><g key={f.id} data-place={f.id} className="atlas-city-dot"><circle cx={f.center[0]} cy={f.center[1]} r={box[2]/100} fill="transparent"/><circle cx={f.center[0]} cy={f.center[1]} r={box[2]/280} fill="#f2ca7d" pointerEvents="none"/><title>{name(f)}</title></g>)}</g>}
      </svg><div className="atlas-zoom"><button onClick={()=>zoom(.55)} aria-label={zh?'放大':'Zoom in'}>＋</button><button onClick={()=>zoom(1.8)} aria-label={zh?'縮小':'Zoom out'}>−</button><button onClick={()=>changeScope(scope)}>{zh?'重設':'Reset'}</button></div>
      <span className="atlas-legend">● {zh?'金色：已走訪　／　拖曳移動，＋ − 縮放':'Gold: visited / Drag to pan, + − to zoom'}</span>
    </div><aside className="atlas-places"><span className="eyebrow">{scope==='taiwan'?(zh?'家鄉的旅行':'CLOSER TO HOME'):(zh?'我的足跡':'MY FOOTPRINTS')}</span><div className="atlas-place-list">{data.regions.filter(f=>scope==='taiwan'?f.kind==='county':f.kind==='city').map(f=><button key={f.id} aria-pressed={selected===f.id} onClick={()=>focus(f)}><i className={f.visited?'visited':''}/>{name(f)}<span>↗</span></button>)}</div></aside></div>
    <article className="atlas-story" aria-live="polite"><span className="eyebrow">{place?(place.visited?(zh?'走過的地方':'A PLACE I HAVE BEEN'):(zh?'下一段可能的旅程':'A POSSIBLE NEXT CHAPTER')):'TRAVEL ARCHIVE'}</span><h3>{place?name(place):(zh?'每個地方，都留下一點自己。':'Every place leaves a little of itself.')}</h3><p>{place?.id==='edmonton'?(zh?'加拿大實習的城市。工作與生活，成為成長的一部分。':'The city of my Canadian internship. Work and everyday life became part of my growth.'):place?.id==='shanghai'?(zh?'交換生活的城市，也是探索新視角的一段日子。':'A chapter of exchange studies and new perspectives.'):place?.id==='suzhou'?(zh?'電影海報牆、經典與街角，留下關於品味的靈感。':'A wall of classic film posters left a lasting visual impression.'):place?(zh?'照片與旅行筆記，將在這裡慢慢收藏。':'Photographs and travel notes will find a home here.'):(zh?'選擇城市，或放大臺灣探索每個縣市。':'Choose a city, or explore Taiwan county by county.')}</p></article>
    <p className="atlas-credit">{zh?'國界':'Countries'}: Natural Earth · {zh?'城市與縣市':'Regions'}: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors / geoBoundaries · <a href={`${import.meta.env.BASE_URL}maps/SOURCES.md`} target="_blank" rel="noreferrer">{zh?'資料來源與年代':'Sources & dates'}</a></p>
  </div>;
}
