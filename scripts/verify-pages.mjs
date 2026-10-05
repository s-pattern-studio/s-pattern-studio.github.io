import {readFile,access} from 'node:fs/promises';
import path from 'node:path';

const html=await readFile('dist/index.html','utf8');
if(/\/src\/|\.tsx(?:["'?]|$)/.test(html))throw new Error('Deployment contains development source instead of the Vite build.');
const assets=[...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css|svg))"/g)].map(m=>m[1]);
if(!assets.some(p=>p.endsWith('.js')))throw new Error('Missing compiled JavaScript entry.');
for(const asset of assets)await access(path.join('dist',asset.replace(/^\//,'')));
console.log('Verified compiled HTML and its assets.');

if(process.env.PAGES_URL){
 const base=new URL(process.env.PAGES_URL);
 const attempts=12;
 for(let i=0;i<attempts;i++){
  try{
   const url=new URL(base);url.searchParams.set('verify',`${process.env.GITHUB_SHA??'local'}-${i}`);
   const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
   const live=await response.text();
   if(!response.ok||live.includes('/src/main.tsx')||!assets.every(asset=>live.includes(asset)))throw new Error('The public site is still serving a different or unbuilt index.html.');
   for(const asset of assets){const r=await fetch(new URL(asset,base),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Asset failed: ${asset} (${r.status})`);}
   console.log('Verified public Pages HTML and asset responses.');process.exit(0);
  }catch(error){console.log(`Check ${i+1}/${attempts}: ${error.message}`);if(i===attempts-1)throw new Error('Public site did not update. Confirm Settings > Pages > Source is GitHub Actions, and check for another publishing workflow.');await new Promise(resolve=>setTimeout(resolve,30000));}
 }
}
