import { Component, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { messages } from './locales';
import { localeConfig, locales, periodHour, periods, readRoute, safeRead, safeWrite, studioContact, type Locale, type Period, type Section } from './lib/model';
import type { Messages } from './locales/en';
import { type RoomView, type MarkerRefs } from './lib/views';

import StudioSelect from './components/StudioSelect';
import TravelAtlas from './components/TravelAtlas';
import RecordsPanel from './components/RecordsPanel';
import WorkPanel from './components/WorkPanel';
import Markdown from './components/Markdown';
import {collection} from './lib/content';
import {surfaces,surfaceTransform,type SurfaceRect,type SurfaceRefs} from './lib/surfaces';
import {useStaticExperience} from './lib/device';
import StudioEntrance from './components/StudioEntrance';

const Scene = lazy(() => import('./Scene'));
const art = `${import.meta.env.BASE_URL}concept.jpg`;
function Arrow({diagonal = false}: {diagonal?:boolean}) { return <span aria-hidden="true">{diagonal ? '↗' : '↗'}</span>; }
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode;onFailure:()=>void}, {failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onFailure();}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}

function useReducedMotion() {
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  return reduced;
}

function useMobileExperience(){
 const read=()=>useStaticExperience(innerWidth,matchMedia('(pointer: coarse)').matches,navigator.userAgent);
 const [mobile,setMobile]=useState(read);
 useEffect(()=>{const media=matchMedia('(pointer: coarse)'),update=()=>setMobile(read());window.addEventListener('resize',update);media.addEventListener('change',update);return()=>{window.removeEventListener('resize',update);media.removeEventListener('change',update);};},[]);
 return mobile;
}

function PanelContent({section,t,locale}: {section:Section;t:Messages;locale:Locale}) {
  const page=collection('pages',locale).find(p=>p.id===section);
  const narrative=<Markdown>{page?.body??''}</Markdown>;

  if(section==='work')return <><h2>{page?.title??t.workTitle}</h2><WorkPanel locale={locale}/></>;
  if(section==='studio')return <><h2>{page?.title??t.studioTitle}</h2>{narrative}<div className="studio-image" style={{backgroundImage:`url(${art})`}} role="img" aria-label={t.snapshot}/><div className="studio-tags"><span>DESIGN</span><span>CODE</span><span>CULTURE</span></div></>;
  if(section==='books')return <><h2>{page?.title??t.booksTitle}</h2>{narrative}<div className="book-art" aria-hidden="true">{['#aba083','#646d58','#714332','#384848','#948155','#c0b69a'].map((c,i)=><div key={c} style={{background:c,height:`${130+i%3*22}px`,transform:`rotate(${i===4?-8:0}deg)`}}><span>—</span></div>)}</div></>;
  if(section==='records')return <><h2>{page?.title??t.recordsTitle}</h2><RecordsPanel locale={locale}/></>;
  if(section==='memories')return <><h2>{page?.title??t.memoriesTitle}</h2><TravelAtlas locale={locale}/></>;
  return <><h2>{page?.title??t.contactTitle}</h2>{narrative}<div className="business-card"><span className="card-monogram">S.</span><strong>S. Pattern Studio</strong><small>DESIGN · DEVELOPMENT · CULTURE</small></div>{studioContact.email?<a className="primary-button" href={`mailto:${studioContact.email}`}>{studioContact.email}<Arrow/></a>:<p className="note">{t.emailPending}</p>}<a className="text-link mt-6" href={studioContact.github} target="_blank" rel="noopener noreferrer">{t.github}<Arrow/></a></>;
}

function ContentDialog({section,t,locale,onClose,closing,onCollapsed,reduced,origin}: {section:Section;t:Messages;locale:Locale;onClose:()=>void;closing:boolean;onCollapsed:()=>void;reduced:boolean;origin?:SurfaceRect}) {
  const ref=useRef<HTMLDialogElement>(null),sheet=useRef<HTMLDivElement>(null);
  const [ready,setReady]=useState(false);
  const currentTransform=useRef<string|null>(null);
  const currentOpacity=useRef<number|null>(null);
  const start=surfaceTransform(origin,innerWidth,innerHeight);
  const done=useRef(onCollapsed);done.current=onCollapsed;
  useLayoutEffect(()=>{
    const dialog=ref.current!,previous=document.activeElement as HTMLElement|null;
    dialog.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{dialog.close();document.body.style.overflow=old;previous?.focus();};
  },[]);
  useLayoutEffect(()=>{
    const el=sheet.current!;
    setReady(false);
    const from=currentTransform.current??(closing?'none':start);
    const animation=el.animate(closing?[{transform:from,opacity:currentOpacity.current??1},{offset:.75,opacity:.65},{transform:start,opacity:0}]:[{transform:from,opacity:currentOpacity.current??0},{offset:.25,opacity:.65},{transform:'translate3d(0,0,0) scale(1,1)',opacity:1}],{duration:reduced?0:closing?320:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
    animation.onfinish=()=>{if(closing)done.current();else setReady(true);};
    return()=>{const style=getComputedStyle(el);currentTransform.current=style.transform;currentOpacity.current=Number(style.opacity);animation.onfinish=null;animation.cancel();};
  },[closing,reduced,start]);
  useEffect(()=>{if(ready)ref.current?.querySelector<HTMLButtonElement>('.close-button')?.focus({preventScroll:true});},[ready]);
  return <dialog ref={ref} className={`content-dialog surface-${section}`} aria-label={t.nav[section]} onCancel={e=>{e.preventDefault();onClose();}}>
    <div className={`dialog-sheet surface-sheet ${ready&&!closing?'surface-ready':''}`}>
      <div ref={sheet} className="surface-proxy" aria-hidden="true" style={{background:surfaces[section].color,transform:start}}/>
      {ready&&!closing&&<div className="surface-content" style={{background:surfaces[section].color}}><header className="dialog-header"><span className="eyebrow">S. PATTERN / {t.nav[section]}</span><button onClick={onClose} className="close-button" aria-label={t.close}>×</button></header><div className="dialog-body"><PanelContent section={section} t={t} locale={locale}/><button className="back-button" onClick={onClose}>← {t.back}</button></div></div>}
    </div>
  </dialog>;
}

export default function App() {
  const [route,setRoute]=useState(()=>readRoute(location.hash,safeRead('sp-language')));
  const [period,setPeriod]=useState<Period>(()=>{const p=safeRead('sp-light');return periods.includes(p as Period)?p as Period:'auto';});
  const [now,setNow]=useState(()=>new Date());
  const [still,setStill]=useState(()=>safeRead('sp-still')==='true');
  const [failed,setFailed]=useState(false);
  const [entered,setEntered]=useState(false);
  const [sceneReady,setSceneReady]=useState(false);
  const mobile=useMobileExperience();
  const [view,setView]=useState<RoomView>('room');
  const [menu,setMenu]=useState(false);
  const [pending,setPending]=useState<Section|null>(null);
  const [pageVisible,setPageVisible]=useState(!document.hidden);
  const [panel,setPanel]=useState<Section|null>(null);
  const [closing,setClosing]=useState(false);
  const surfaceRects=useRef<SurfaceRefs['current']>({});
  const [origin,setOrigin]=useState<SurfaceRect>();
  const requested=useRef(route.section);requested.current=route.section;

  const markers=useRef<MarkerRefs['current']>({});
  const reduced=useReducedMotion();
  const t=messages[route.locale];
  const flat=mobile||still||failed||reduced;
  const hour=periodHour(period,now);
  const allSections:Section[]=['work','records','books','memories','studio','contact'];
  useEffect(()=>{
    const update=()=>{setRoute(readRoute(location.hash,safeRead('sp-language')));};
    window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);
  },[]);
  useEffect(()=>{const id=window.setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(id);},[]);
  useEffect(()=>{
    const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);
    return()=>document.removeEventListener('visibilitychange',update);
  },[]);
  useEffect(()=>{
    if(!entered)return;
    if(route.section){
      setClosing(false);
      if(flat){setOrigin(undefined);setPanel(route.section);setPending(null);return;}
      if(panel===route.section)return;
      setPanel(null);setPending(route.section);setView(route.section);
    }else{
      setPending(null);
      if(panel)setClosing(true);else setView('room');
    }
  },[route.section,flat,entered]);
  useEffect(()=>{
    const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(false);if(menu)document.getElementById('room-navigation')?.focus();if(pending){navigate(null);}}};
    window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);
  },[pending,menu]);
  useEffect(()=>{
    if(!menu)return;
    const outside=(event:PointerEvent)=>{if(!(event.target as Element).closest('.room-menu,.room-menu-toggle'))setMenu(false);};
    document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
  },[menu]);
  useEffect(()=>{
    document.documentElement.lang=localeConfig[route.locale].htmlLang;
    document.title=`S. Pattern Studio — ${route.section?t.nav[route.section]:'The Listening Loft'}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content',t.seoDescription);
    safeWrite('sp-language',route.locale);
  },[route,t]);
  useEffect(()=>safeWrite('sp-still',String(still)),[still]);
  function navigate(section:Section|null,locale:Locale=route.locale){location.hash=`/${locale}${section?`/${section}`:''}`;}
  function openObject(section:Section){setMenu(false);navigate(section);}
  function moveTo(next:RoomView){setMenu(false);if(next==='room'){navigate(null);setView('room');}else openObject(next);}
  function closePanel(){navigate(null);}
  function arrived(next:RoomView){
    if(next==='room'||requested.current!==next)return;
    setOrigin(surfaceRects.current[next]);setPanel(next);setPending(null);
  }

  function collapsed(){setPanel(null);setClosing(false);setView('room');}
  function changePeriod(value:Period){setPeriod(value);safeWrite('sp-light',value);}
  const fallback=<div className="immersive-fallback"><img src={art} alt={t.snapshot}/><p>{t.sceneFallback}</p></div>;
  return <div className="safehouse-app" data-flat={flat} data-entering={!entered} data-presenting={Boolean(route.section||pending||panel)}>
    <a className="skip-link" inert={!entered} href="#room-navigation" onClick={e=>{e.preventDefault();document.getElementById('room-navigation')?.focus();}}>{t.skip}</a>
    <main className="safehouse" aria-label={t.roomLabel} inert={!entered||Boolean(route.section||pending||panel)}>
      <h1 className="sr-only">S. Pattern Studio — {t.eyebrow}</h1>
      <div className="world-canvas">
        {flat?fallback:<SceneBoundary fallback={fallback} onFailure={()=>setFailed(true)}><Suspense fallback={<div className="scene-loading"><span className="loading-disc"/>{t.sceneLoading}</div>}><Scene hour={hour} onSelect={openObject} active={pageVisible&&!panel} onFailure={()=>setFailed(true)} onReady={()=>setSceneReady(true)} view={view} markers={markers} surfaceRects={surfaceRects} onArrive={arrived}/></Suspense></SceneBoundary>}
      </div>
      <div className="room-vignette" aria-hidden="true"/>
      {!flat&&<div className={`spatial-hotspots ${pending?'travelling':''}`} aria-label={t.explore}>
        {allSections.map((section,i)=><button key={section} ref={el=>{markers.current[section]=el;}} className={`spatial-hotspot ${section}`} onClick={()=>openObject(section)} aria-label={t.nav[section]}><span className="hotspot-dot">+</span><span className="hotspot-caption"><small>0{i+1}</small>{t.nav[section]}<b>↗</b></span></button>)}
      </div>}
      <header className="room-header">
        <button className="wordmark" onClick={()=>moveTo('room')} aria-label={t.roomOverview}>S. Pattern<span>Studio</span></button>
        <div className="room-identity"><span>THE LISTENING LOFT</span><small>{t.roomSubtitle}</small></div>
        <div className="header-controls">
          <div className="language-control"><StudioSelect label={t.language} value={route.locale} onChange={value=>navigate(route.section,value as Locale)} options={locales.map(locale=>({value:locale,label:localeConfig[locale].label}))}/></div>
          <button id="room-navigation" className="room-menu-toggle" aria-label={t.roomDirectory} aria-expanded={menu} aria-controls="room-menu" onClick={()=>setMenu(!menu)}><i className={`menu-icon ${menu?'is-open':''}`} aria-hidden="true"><span/><span/><span/></i><span>{t.roomDirectory}</span></button>
        </div>
      </header>
      {<nav className={`room-menu ${menu?'is-open':''}`} inert={!menu} aria-hidden={!menu} id="room-menu" aria-label={t.roomDirectory}>{allSections.map((section,i)=><button key={section} onClick={()=>openObject(section)}><small>0{i+1}</small>{t.nav[section]}<Arrow/></button>)}</nav>}
      <div className="room-intro" aria-live="polite"><span className="eyebrow">S. PATTERN / {view==='room'?'01':String(allSections.indexOf(view)+1).padStart(2,'0')}</span><h2>{pending?t.nav[pending]:view==='room'?t.roomWelcome:t.nav[view]}</h2><p>{pending?t.roomOpening:flat?t.stillInstruction:t.roomInstruction}</p></div>
      <div className="room-bottom">
        <div className="room-time"><div><span className="light-dot"/><span className="local-clock">{now.toLocaleTimeString(route.locale,{hour:'2-digit',minute:'2-digit',hour12:false})}</span><span className="room-time-label">LOCAL TIME</span></div><StudioSelect label={t.lighting} value={period} onChange={value=>changePeriod(value as Period)} disabled={flat} placement="up" options={periods.map(p=>({value:p,label:t.period[p]}))}/></div>
        <div className="room-utility"><button onClick={()=>openObject('contact')}>{t.nav.contact}<Arrow/></button>{!mobile&&!reduced&&!failed&&<button className="quiet-toggle" aria-pressed={still} onClick={()=>setStill(!still)}>{still?t.live:t.simple}</button>}</div>
      </div>
      {flat&&<nav className="flat-entries" aria-label={t.explore}>{allSections.map((s,i)=><button key={s} onClick={()=>openObject(s)}><small>0{i+1}</small><span>{t.nav[s]}</span><b aria-hidden="true">↗</b></button>)}</nav>}
    </main>
    {panel&&<ContentDialog key={panel} section={panel} t={t} locale={route.locale} onClose={closePanel} closing={closing} onCollapsed={collapsed} reduced={reduced} origin={origin}/> }
    {!entered&&<StudioEntrance ready={flat||sceneReady} reduced={reduced} locale={route.locale} onComplete={()=>setEntered(true)} onStatic={()=>{setStill(true);setEntered(true);}}/>}
  </div>;
}

