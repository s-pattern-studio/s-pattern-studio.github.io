import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { lightingAt, type Section } from './lib/model';
import { hotspots, views, inspectionViews, type RoomView, type MarkerRefs } from './lib/views';

import {cameraJourney,advanceJourney} from './lib/cameraJourney';
import {surfaces,type SurfaceRefs} from './lib/surfaces';
import {posterLayout} from './lib/posters';

type V3 = [number, number, number];
const surfaceCache = new Map<string,THREE.CanvasTexture>();
function surfaceTexture(kind:string) {
  if(surfaceCache.has(kind))return surfaceCache.get(kind)!;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
  const c=canvas.getContext('2d')!;c.fillStyle='#b9b3a7';c.fillRect(0,0,256,512);
  if(kind==='wood'){
    for(let i=0;i<1600;i++){
      const x=(i*71.37)%256;c.strokeStyle=`rgba(42,29,18,${0.025+(i%8)*0.012})`;c.lineWidth=0.4+(i%4)*0.2;c.beginPath();
      for(let y=0;y<=512;y+=12){const xx=x+Math.sin(y/65+i)*1.5+Math.sin(y/170+i)*3;y?c.lineTo(xx,y):c.moveTo(xx,y);}c.stroke();
    }
  }else{
    for(let i=0;i<30000;i++){const v=80+(i%80);c.fillStyle=`rgba(${v},${v},${v},.12)`;c.fillRect((i*71.37)%256,(i*93.17)%512,1.2,1.2);}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  surfaceCache.set(kind,texture);return texture;
}
function Box({ p, s, color, surface, ...props }: { p: V3; s: V3; color: string; surface?:string } & Partial<React.ComponentProps<'mesh'>>) {
  return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s}/><meshStandardMaterial color={color} map={surface?surfaceTexture(surface):undefined} roughness={0.85}/></mesh>;
}
type BoxInstance={p:V3;s:V3;color:string};
function StaticBoxes({items}:{items:BoxInstance[]}){
  const ref=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{const mesh=ref.current!,object=new THREE.Object3D(),color=new THREE.Color();items.forEach((item,i)=>{object.position.set(...item.p);object.scale.set(...item.s);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);mesh.setColorAt(i,color.set(item.color));});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();},[items]);
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow receiveShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial roughness={.85}/></instancedMesh>;
}
function Disc({ p, radius, color, rotation = [-Math.PI / 2, 0, 0] }: { p: V3; radius: number; color: string; rotation?: V3 }) {
  return <mesh position={p} rotation={rotation}><circleGeometry args={[radius, 40]}/><meshStandardMaterial color={color} roughness={0.7}/></mesh>;
}

function posterTexture(index: number) {
  const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const palette = ['#b5a17b', '#8d4837', '#688080', '#b6ad90', '#343e40', '#92784c'];
  ctx.fillStyle = palette[index % palette.length]; ctx.fillRect(0, 0, 192, 256);
  ctx.strokeStyle = '#272b26'; ctx.lineWidth = 2; ctx.strokeRect(9, 9, 174, 238);
  ctx.fillStyle = '#232721';
  if (index % 3 === 0) {
    for(let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(96, 124, 20 + i * 12, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillRect(89, 50, 14, 157);
  } else if(index % 3 === 1) {
    for(let i = 0; i < 5; i++) ctx.fillRect(25 + i * 30, 65 + (i % 2) * 30, 19, 105);
  } else {
    ctx.beginPath(); ctx.arc(96, 111, 53, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = palette[index % palette.length]; ctx.fillRect(45, 100, 115, 17);
  }
  ctx.fillStyle = index % 6 === 4 ? '#d8ccb1' : '#222720';
  ctx.font = 'bold 23px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(['STAY HUMAN', 'THE GROOVE', 'AFTER HOURS', 'SIDE A', 'PATTERNS', 'SOUL STUDY'][index % 6], 96, 36, 165);
  ctx.font = '11px monospace'; ctx.fillText(`STUDIO ARCHIVE / 0${index + 1}`, 96, 222);
  // Deterministic printed grain; no image or font network requests.
  for(let i=0;i<2200;i++) { ctx.fillStyle = `rgba(28,24,19,${(i % 5) * 0.025})`; ctx.fillRect((i * 71) % 192, (i * 43) % 256, 1, 2); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function Posters() {
  const textures = useMemo(() => posterLayout.map((_, i) => posterTexture(i)), []);
  useEffect(() => () => textures.forEach(t => t.dispose()), [textures]);
  return <group>{textures.map((map, i) => <mesh key={i} position={posterLayout[i].position} rotation={[0, 0, posterLayout[i].rotation]}>
    <planeGeometry args={[0.72, 0.99]}/><meshStandardMaterial map={map} roughness={1}/>
  </mesh>)}</group>;
}

function Shelf({ p, books = false }: { p: V3; books?: boolean }) {
  const colors = books ? ['#c2b49a','#646e65','#773c30','#303d46','#967546','#47483b'] : ['#413c34','#8b7860','#b7a080','#373e3e','#714b36'];
  return <group position={p}>
    <Box p={[0,0.68,0]} s={[2.3,1.35,0.66]} color="#30251d"/>
    <Box p={[0,0.7,0.35]} s={[2.12,1.2,0.05]} color="#171a15"/>
    {[0.08,0.73,1.38].map(y=><Box key={y} p={[0,y,0.08]} s={[2.42,0.07,0.8]} color="#624b36"/>)}
    {[-1.14,0,1.14].map(x=><Box key={x} p={[x,0.72,0.13]} s={[0.065,1.38,0.75]} color="#614a34"/>)}
    <StaticBoxes items={useMemo(()=>[0,1].flatMap(row=>Array.from({length:books?16:25},(_,i)=>{
      const width=books?.10:.056,count=books?16:25,x=-1.02+i*(2.03/count)+(i>=count/2?.09:0),height=books?.35+(i%4)*.046:.49;
      const spine:BoxInstance={p:[x,.13+row*.65+height/2,.29],s:[width,height,.38],color:colors[(i+row)%colors.length]};
      return books?[spine,{p:[x,.20+row*.65,.488] as V3,s:[width*.7,.025,.005] as V3,color:'#c4b391'}]:[spine];
    }).flat()),[books])}/>
  </group>;
}

function Speaker({ p }: {p: V3}) {
  return <group position={p}><Box p={[0,0,0]} s={[0.46,0.78,0.4]} color="#1c201d"/>
    <Disc p={[0,-0.14,0.205]} radius={0.16} color="#0c1110" rotation={[0,0,0]}/>
    <Disc p={[0,-0.14,0.21]} radius={0.07} color="#363932" rotation={[0,0,0]}/>
    <Disc p={[0,0.19,0.21]} radius={0.06} color="#a39677" rotation={[0,0,0]}/>
  </group>;
}

function Turntable({p}: {p: V3}) {
  return <group position={p}><Box p={[0,0,0]} s={[0.9,0.12,0.66]} color="#222723"/>
    <Disc p={[-0.13,0.065,0]} radius={0.27} color="#080d0c"/>
    <Disc p={[-0.13,0.069,0]} radius={0.075} color="#a04d36"/>
    <Box p={[0.26,0.105,0.05]} s={[0.024,0.025,0.4]} color="#b0a28b" rotation={[0,-0.35,0]}/>
  </group>;
}

function Desk() {
  return <group position={[2.4,0,1]}>
    <Box p={[0,1.12,0]} s={[2.4,0.12,1.2]} color="#98714f" surface="wood"/>
    {[-1,1].flatMap(x=>[-0.43,0.43].map(z=><Box key={`${x}-${z}`} p={[x,0.55,z]} s={[0.065,1.1,0.065]} color="#222925"/>))}
    <Box p={[0,1.8,-0.34]} s={[1.23,0.79,0.06]} color="#151c1c"/>
    <mesh position={[0,1.8,-0.302]}><planeGeometry args={[1.1,0.66]}/><meshBasicMaterial color={surfaces.work.color} toneMapped={false}/></mesh>
    {[-0.16,0,0.16].map((y,i)=><Box key={y} p={[-0.17,1.8+y,-0.293]} s={[0.57-i*0.1,0.025,0.005]} color="#a7b2a2"/>)}
    <Box p={[0,1.32,-0.34]} s={[0.045,0.4,0.06]} color="#222723"/>
    <Box p={[0,1.2,-0.32]} s={[0.42,0.025,0.25]} color="#222723"/>
    <Box p={[-0.3,1.21,0.3]} s={[0.77,0.04,0.26]} color="#30382e"/>
    <Box p={[-0.96,1.20,0.43]} s={[0.32,0.018,0.19]} color="#171d18" rotation={[0,0.15,0]}/>
    <Box p={[-0.96,1.211,0.43]} s={[0.16,0.003,0.02]} color="#aa9466" rotation={[0,0.15,0]}/>
    <group position={[0.76,1.24,0.15]}>
      <Box p={[0,0,0]} s={[0.52,0.09,0.63]} color="#333b32"/>
      {Array.from({length:16},(_,i)=><Box key={i} p={[-0.175+(i%4)*0.115,0.051,0.015+Math.floor(i/4)*0.095]} s={[0.075,0.02,0.064]} color={i===3?'#c88943':'#b0a68f'}/>)}
      <Box p={[-0.07,0.052,-0.21]} s={[0.19,0.007,0.09]} color="#a57a39"/>
    </group>
    <Speaker p={[-0.95,1.56,-0.3]}/>
    <Box p={[0,0.7,1.03]} s={[0.72,0.12,0.65]} color="#373e31"/>
    <Box p={[0,1.14,1.34]} s={[0.72,0.7,0.1]} color="#34392d"/>
    <Box p={[0,0.36,1.03]} s={[0.07,0.7,0.07]} color="#212721"/>
    <Box p={[0,0.07,1.03]} s={[0.7,0.08,0.54]} color="#212721"/>
  </group>;
}

function Lamp({lamp}: {lamp:number}) {
  return <group position={[0.2,1.43,-2.28]}>
    <Disc p={[0,0.02,0]} radius={0.19} color="#79603a"/>
    <Box p={[0,0.37,0]} s={[0.025,0.73,0.025]} color="#9c8155"/>
    <mesh position={[0,0.83,0]}><cylinderGeometry args={[0.22,0.36,0.45,32,1,true]}/><meshStandardMaterial color="#dcb57a" emissive="#ffb25d" emissiveIntensity={lamp*0.7} side={THREE.DoubleSide}/></mesh>
    <pointLight position={[0,0.68,0]} color="#ffb765" intensity={lamp*13} distance={6} decay={2}/>
  </group>;
}

function MapArt() {
  const texture=useLoader(THREE.TextureLoader,`${import.meta.env.BASE_URL}maps/world-wall.svg`);
  texture.colorSpace=THREE.SRGBColorSpace;
  return <group position={[2.6,2.48,-2.84]}><Box p={[0,0,0]} s={[2.3,1.5,.09]} color="#80613b"/><mesh position={[0,0,.08]}><planeGeometry args={[2.18,1.38]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh></group>;
}

function Hit({p,s,section,onSelect}: {p:V3;s:V3;section:Section;onSelect:(s:Section)=>void}) {
  const [hover,setHover] = useState(false);
  const {gl} = useThree();
  useEffect(()=>()=>{gl.domElement.style.cursor='';},[gl]);
  function over(e:ThreeEvent<PointerEvent>) { e.stopPropagation(); setHover(true); gl.domElement.style.cursor='pointer'; }
  return <mesh position={p} onPointerOver={over} onPointerOut={()=>{setHover(false);gl.domElement.style.cursor='';}} onClick={e=>{e.stopPropagation();onSelect(section);}}>
    <boxGeometry args={s}/><meshBasicMaterial color="#d5b170" transparent opacity={hover ? 0.085 : 0} depthWrite={false}/>
  </mesh>;
}

function Room({hour,onSelect,active,view,markers,surfaceRects,onArrive}: {hour:number;onSelect:(s:Section)=>void;active:boolean;view:RoomView;markers:MarkerRefs;surfaceRects:SurfaceRefs;onArrive:(view:RoomView)=>void}) {
  const target = lightingAt(hour);
  const ambient = useRef<THREE.AmbientLight>(null), sun = useRef<THREE.DirectionalLight>(null);
  const skyMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const {camera,size,invalidate,gl} = useThree();
  const look = useRef(new THREE.Vector3(...views.room.look));
  const projected = useMemo(()=>new THREE.Vector3(),[]);
  const targetPosition = useMemo(()=>new THREE.Vector3(...views[view].position),[view]);
  const targetLook = useMemo(()=>new THREE.Vector3(...views[view].look),[view]);
  const sky = useMemo(()=>new THREE.Color(target.a.sky).lerp(new THREE.Color(target.b.sky),target.t),[target.a.sky,target.b.sky,target.t]);
  useEffect(()=>{ const cam=camera as THREE.PerspectiveCamera; cam.fov=size.width<size.height?82:66;cam.updateProjectionMatrix();invalidate();},[camera,size,invalidate]);
  const arrival=useRef(onArrive);arrival.current=onArrive;
  const motion=useRef({view,elapsed:0,from:new THREE.Vector3(...views.room.position),look:new THREE.Vector3(...views.room.look),done:false});
  useEffect(()=>{invalidate();},[view,invalidate]);
  useEffect(()=>{if(active)invalidate();},[active,hour,invalidate]);
  useFrame((_,dt)=>{
    if(!active)return;
    const alpha=1-Math.exp(-Math.min(dt,0.05)*5);
    const a=ambient.current!, s=sun.current!, m=skyMaterial.current!;
    a.intensity=THREE.MathUtils.lerp(a.intensity,target.ambient,alpha);
    s.intensity=THREE.MathUtils.lerp(s.intensity,target.sun,alpha);
    m.color.lerp(sky,alpha);m.emissive.copy(m.color);
    // Initialise the new journey in the same frame, BEFORE sampling any pose.
    const next=advanceJourney(motion.current,view,dt);
    if(next.changed)motion.current={view,elapsed:0,from:camera.position.clone(),look:look.current.clone(),done:false};
    const travel=motion.current;travel.elapsed=next.elapsed;
    const opening=view!=='room',journey=cameraJourney(travel.elapsed,opening);
    if(gl.domElement.dataset.cameraStage!==journey.phase)gl.domElement.dataset.cameraStage=journey.phase;
    if(!opening){
      camera.position.lerpVectors(travel.from,targetPosition,journey.approach);
      look.current.lerpVectors(travel.look,targetLook,journey.focus);
    }else{
      const inspection=new THREE.Vector3(...inspectionViews[view as Section]);
      camera.position.lerpVectors(travel.from,inspection,journey.approach).lerp(targetPosition,journey.zoom);
      look.current.lerpVectors(travel.look,targetLook,journey.focus);
    }
    camera.lookAt(look.current);camera.updateMatrixWorld();
    const justArrived=journey.done&&!travel.done;
    if(justArrived)travel.done=true;
    for(const [id,surface] of Object.entries(surfaces)){
      const points=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y])=>new THREE.Vector3(surface.center[0]+x*surface.width/2,surface.center[1]+(surface.horizontal?0:y*surface.height/2),surface.center[2]+(surface.horizontal?y*surface.height/2:0)).project(camera));
      const xs=points.map(p=>(p.x+1)*size.width/2),ys=points.map(p=>(1-p.y)*size.height/2);
      const x=THREE.MathUtils.clamp(Math.min(...xs),0,size.width-8),y=THREE.MathUtils.clamp(Math.min(...ys),0,size.height-8);
      surfaceRects.current[id as Section]={x,y,width:Math.max(8,Math.min(size.width,Math.max(...xs))-x),height:Math.max(8,Math.min(size.height,Math.max(...ys))-y),viewportWidth:size.width,viewportHeight:size.height};
    }
    if(justArrived)arrival.current(view);
    for(const [section,point] of Object.entries(hotspots)){
      const el=markers.current[section as Section];if(!el)continue;
      projected.set(...point).project(camera);
      const half=Math.min(100,size.width/2-12);
      const screenX=(projected.x+1)*size.width/2;
      el.style.transform=`translate3d(${THREE.MathUtils.clamp(screenX,half+10,size.width-half-10)}px,${(1-projected.y)*size.height/2}px,0) translate(-50%,-50%)`;
      const inFrame=projected.z<1&&projected.z>-1&&Math.abs(projected.x)<0.94&&Math.abs(projected.y)<0.78;
      el.style.visibility=inFrame?'visible':'hidden';
    }
    if(!travel.done||Math.abs(a.intensity-target.ambient)>0.002 || Math.abs(s.intensity-target.sun)>0.002)invalidate();
  });
  return <>
    <ambientLight ref={ambient} intensity={target.ambient}/><hemisphereLight args={['#c5cbd4','#594330',0.8]}/>
    <directionalLight ref={sun} position={[-0.5,3.2,-1.6]} intensity={target.sun} color="#ffd7a0" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-camera-near={0.1} shadow-camera-far={15} shadow-bias={-0.001}/>
    <group position={[0,-0.2,0]}>
      <Box p={[0,-0.18,0]} s={[8.25,0.3,6.2]} color="#25251e"/>
      {Array.from({length:23},(_,i)=><Box key={i} p={[-3.92+i*0.35,0,0]} s={[0.341,0.06,6]} color={['#8b6e51','#8e7255','#826449','#917257'][i%4]} surface="wood"/>)}
      <Box p={[0,1.8,-3]} s={[8.2,3.6,0.17]} color="#434940" surface="plaster"/>
      <Box p={[-4.05,1.8,0.75]} s={[0.14,3.6,7.5]} color="#45473e" surface="plaster"/>
      <Box p={[4.05,1.8,0.75]} s={[0.14,3.6,7.5]} color="#40463e" surface="plaster"/>
      <Box p={[0,3.65,0.5]} s={[8.2,0.12,7.2]} color="#2d3029"/>
      {Array.from({length:23},(_,i)=><Box key={`front-${i}`} p={[-3.92+i*0.35,0,4.3]} s={[0.341,0.06,2.6]} color={['#8b6e51','#8e7255','#826449','#917257'][i%4]} surface="wood"/>)}
      {[-3,-1,1,3].map(x=><Box key={x} p={[x,3.5,0.4]} s={[0.12,0.16,7]} color="#242b25"/>)}
      {Array.from({length:14},(_,row)=>Array.from({length:6},(_,col)=><Box key={`${row}-${col}`} p={[-3.66+col*0.53+(row%2)*0.13,0.16+row*0.25,-2.895]} s={[0.50,0.226,0.03]} color={['#624436','#704b3a','#80523f','#584335'][(col+row)%4]}/>))}
      <Posters/>
      <Box p={[-0.06,2.36,-2.86]} s={[1.9,2.18,0.12]} color="#151e1c"/>
      <mesh position={[-0.06,2.36,-2.784]}><planeGeometry args={[1.72,2]}/><meshStandardMaterial ref={skyMaterial} color={sky} emissive={sky} emissiveIntensity={0.3}/></mesh>
      {Array.from({length:7},(_,i)=><Box key={i} p={[-0.76+i*0.24,1.7+(i%3)*0.12,-2.75]} s={[0.21,0.64+(i%3)*0.24,0.01]} color="#3f4d4c"/>)}
      {[-0.95,-0.06,0.83].map(x=><Box key={x} p={[x,2.36,-2.70]} s={[0.045,2.1,0.055]} color="#17211e"/>)}
      {[1.31,2.31,3.41].map(y=><Box key={y} p={[-0.06,y,-2.7]} s={[1.85,0.05,0.06]} color="#17211e"/>)}
      <Shelf p={[-2.47,0,-2.28]}/><Shelf p={[2.57,0,-2.28]} books/>
      <Turntable p={[-2.55,1.48,-2.24]}/><Speaker p={[-3.36,1.81,-2.3]}/>
      <Box p={[-0.1,1.37,-2.25]} s={[1.12,0.09,0.83]} color="#614b33"/>
      <Box p={[-0.1,0.67,-2.5]} s={[0.07,1.34,0.07]} color="#242a22"/>
      <Lamp lamp={target.lamp}/><MapArt/><Desk/>
      <Hit p={[-2.48,0.88,-2.12]} s={[2.5,1.9,1]} section="records" onSelect={onSelect}/>
      <Hit p={[2.6,0.77,-2.14]} s={[2.45,1.5,1]} section="books" onSelect={onSelect}/>
      <Hit p={[2.6,2.5,-2.7]} s={[2.3,1.5,0.2]} section="memories" onSelect={onSelect}/>
      <Hit p={[2.4,1.5,1]} s={[2.5,1.3,1.25]} section="work" onSelect={onSelect}/>
      <Hit p={[1.45,1.28,1.48]} s={[0.38,0.15,0.3]} section="contact" onSelect={onSelect}/>
      <Hit p={[-2.54,2.3,-2.7]} s={[2.44,2.1,0.2]} section="studio" onSelect={onSelect}/>
    </group>
  </>;
}

function ContextEvents({onFailure}:{onFailure:()=>void}) {
  const {gl}=useThree();
  useEffect(()=>{
    const canvas=gl.domElement;
    canvas.addEventListener('webglcontextlost',onFailure);
    return()=>canvas.removeEventListener('webglcontextlost',onFailure);
  },[gl,onFailure]);
  return null;
}

const initialCamera={position:views.room.position,fov:66,near:0.08,far:60};

function FirstPaint({onReady}:{onReady:()=>void}){
  const frames=useRef(0),{invalidate}=useThree();
  useFrame(()=>{if(frames.current>=2)return;frames.current++;if(frames.current===2)onReady();else invalidate();});
  return null;
}

export default function Scene({hour,onSelect,active,onFailure,view,markers,surfaceRects,onArrive,onReady}: {hour:number;onSelect:(s:Section)=>void;active:boolean;onFailure:()=>void;view:RoomView;markers:MarkerRefs;surfaceRects:SurfaceRefs;onArrive:(view:RoomView)=>void;onReady:()=>void}) {
  return <Canvas shadows camera={initialCamera} dpr={[1,1.5]} frameloop={active?'demand':'never'} gl={{antialias:true,alpha:true,powerPreference:'low-power'}} onCreated={({gl})=>{
    gl.toneMapping=THREE.ACESFilmicToneMapping;
    gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;
  }}><Suspense fallback={null}><ContextEvents onFailure={onFailure}/><Room hour={hour} onSelect={onSelect} active={active} view={view} markers={markers} surfaceRects={surfaceRects} onArrive={onArrive}/><FirstPaint onReady={onReady}/></Suspense></Canvas>;
}

