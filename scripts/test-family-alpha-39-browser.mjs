import {chromium,webkit} from 'playwright';import {createServer} from 'node:http';import {readFile,mkdir} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=resolve('research/family-alpha-39'),out=resolve('benchmark/family-alpha-39');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;const path=resolve(root,'.'+(p==='/'?'/index.html':p));if(!path.startsWith(root+'/'))throw Error();const b=await readFile(path);res.writeHead(200,{'content-type':extname(path)==='.mjs'?'text/javascript':'text/html'});res.end(b);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let runs=0;
try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){const b=await engine.launch({headless:true});try{for(const width of [320,390,430]){
 const context=await b.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});const errors=[],external=[];
 await context.route('**/*',route=>{const u=route.request().url();if(u.startsWith(origin+'/')||u.startsWith('blob:')||u.startsWith('data:'))return route.continue();external.push(u);return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/');
 await page.locator('#file').setInputFiles('benchmark/fixtures/commons-0043.jpg');await page.locator('#use:not([disabled])').waitFor();
 assert.equal(await page.locator('#review').isVisible(),true);assert.ok(await page.locator('#photo').evaluate(i=>i.naturalWidth>600));
 const sourceHash=createHash('sha256').update(await readFile('benchmark/fixtures/commons-0043.jpg')).digest('hex');
 const shownHash=await page.locator('#photo').evaluate(async img=>{const a=await (await fetch(img.src)).arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',a);return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');});assert.equal(shownHash,sourceHash);
 assert.ok((await page.locator('#notice').innerText()).length>5);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:`${out}/${name}-${width}-licensed-skirt-review.png`,fullPage:true});
 await page.locator('#retake').click();assert.equal(await page.locator('#review').isHidden(),true);
 await page.locator('#file').setInputFiles('benchmark/fixtures/commons-0043.jpg');await page.locator('#use:not([disabled])').waitFor();await page.locator('#use').click();assert.match(await page.locator('#status').innerText(),/not saved to your closet/);
 // Dark synthetic photo: warning is advisory and Use Photo remains available.
 const dark=await page.evaluate(()=>{let c=document.createElement('canvas');c.width=800;c.height=800;let x=c.getContext('2d');x.fillStyle='#080808';x.fillRect(0,0,800,800);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('#file').setInputFiles({name:'dark.png',mimeType:'image/png',buffer:Buffer.from(dark,'base64')});await page.locator('#use:not([disabled])').waitFor();assert.match(await page.locator('#notice').innerText(),/may be dark/);await page.locator('#use').click();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();runs++;
 }}finally{await b.close();}}}finally{server.close();}console.log(`WORK39_OFFLINE_BROWSER_PASS ${runs}/6`);
