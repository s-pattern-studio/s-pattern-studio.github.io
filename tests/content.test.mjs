import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent,parseEntry,openGraphImage,fetchCover} from '../scripts/content.mjs';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
test('metadata handles relative images, HTML entities and attribute order',()=>{
 assert.equal(openGraphImage('<meta content="/cover.png?a=1&amp;b=2" property="og:image">','https://example.com/project'),'https://example.com/cover.png?a=1&b=2');
 assert.equal(openGraphImage('<meta property="og:image" content="javascript:alert(1)">','https://example.com'),'');
 assert.equal(openGraphImage('<title>No image</title>','https://example.com'),'');
});
test('frontmatter rejects invalid author input',()=>{
 assert.throws(()=>parseEntry('---\ntitle: Test\nurl: javascript:alert(1)\n---','test.md'),/HTTP/);
 assert.throws(()=>parseEntry('---\ntitle: Test\ndraft: "false"\n---','test.md'),/boolean/);
 assert.equal(parseEntry('---\ntitle: Notes\n---\n## Heading\n\nText','test.md').body,'## Heading\n\nText');
});
test('content collection has paired album and real website entries',async()=>{
 const entries=await loadContent(fileURLToPath(new URL('../content',import.meta.url)),async()=> '');
 assert.equal(entries.filter(e=>e.section==='records').length,4);
 assert.equal(entries.find(e=>e.section==='work').url,'https://cscl.vipresearch.ca/');
 assert.ok(entries.every(e=>!e.draft));
});
test('metadata failure falls back without blocking content',async()=>{
 const server=createServer((req,res)=>{if(req.url==='/ok'){res.setHeader('Content-Type','text/html');res.end('<meta property="og:image" content="/image.png">');}else{res.writeHead(403);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const base=`http://127.0.0.1:${server.address().port}`;assert.equal(await fetchCover(base+'/ok'),base+'/image.png');assert.equal(await fetchCover(base+'/fail'),'');}finally{server.close();}
});
