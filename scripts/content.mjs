import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {parse} from 'parse5';
export function webUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function parseEntry(source,file){
 const {data,content}=matter(source);
 if(typeof data.title!=='string'||!data.title.trim())throw new Error(`${file}: title is required`);
 if(data.draft!==undefined&&typeof data.draft!=='boolean')throw new Error(`${file}: draft must be boolean`);
 if(data.url&&!webUrl(data.url))throw new Error(`${file}: url must be HTTP(S)`);
 if(data.cover&&!/^(https?:\/\/|\/media\/)/.test(data.cover))throw new Error(`${file}: invalid cover`);
 if(data.accent&&!/^#[0-9a-f]{6}$/i.test(data.accent))throw new Error(`${file}: accent must be #RRGGBB`);
 if(data.order!==undefined&&!Number.isFinite(data.order))throw new Error(`${file}: order must be a number`);
 return {title:data.title,artist:String(data.artist??''),url:data.url?webUrl(data.url):'',cover:data.cover??'',accent:data.accent??'#ad9065',order:data.order??100,draft:data.draft??false,body:content.trim()};
}
export function openGraphImage(html,url){
 let image='',base=url;function visit(n){const a=Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));if(n.nodeName==='base'&&a.href)base=new URL(a.href,url).href;if(n.nodeName==='meta'&&(a.property??a.name)?.toLowerCase()==='og:image'&&!image)image=a.content??'';for(const c of n.childNodes??[])visit(c);}
 try{visit(parse(html));return image?webUrl(new URL(image,base).href):'';}catch{return '';}
}
export async function fetchCover(url){
 try{const r=await fetch(url,{signal:AbortSignal.timeout(4500),headers:{Accept:'text/html'}});if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))return '';const reader=r.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2_000_000){await reader.cancel();return '';}chunks.push(value);}return openGraphImage(Buffer.concat(chunks).toString('utf8'),r.url||url);}catch{return '';}
}
export async function loadContent(root,resolveCover=fetchCover){
 const entries=[],covers=new Map();
 async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}if(!item.name.endsWith('.md'))continue;const rel=path.relative(root,file).split(path.sep);if(rel.length!==3)throw new Error(`${file}: use section/locale/id.md`);const [section,locale,name]=rel,e=parseEntry(await readFile(file,'utf8'),file);if(e.draft)continue;if(section==='work'&&!e.url)throw new Error(`${file}: published work needs a live url`);if(section==='records'&&!e.artist)throw new Error(`${file}: artist is required`);if(section==='work'&&!e.cover){if(!covers.has(e.url))covers.set(e.url,resolveCover(e.url));e.cover=await covers.get(e.url);}entries.push({...e,id:name.slice(0,-3),section,locale});}}
 await walk(root);return entries.sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
}
export default function contentPlugin(){
 const id='\0virtual:studio-content',root=path.resolve('content'),cache=new Map();const cover=url=>{if(!cache.has(url))cache.set(url,fetchCover(url));return cache.get(url);};
 return {name:'studio-markdown',resolveId(s){if(s==='virtual:studio-content')return id;},async load(s){if(s===id)return `export default ${JSON.stringify(await loadContent(root,cover))}`;},configureServer(server){server.watcher.add(root);const change=file=>{if(!file.startsWith(root+path.sep)||!file.endsWith('.md'))return;const mod=server.moduleGraph.getModuleById(id);if(mod)server.moduleGraph.invalidateModule(mod);server.ws.send({type:'full-reload'});};for(const event of ['add','change','unlink'])server.watcher.on(event,change);server.httpServer?.once('close',()=>{for(const event of ['add','change','unlink'])server.watcher.off(event,change);});}};
}
