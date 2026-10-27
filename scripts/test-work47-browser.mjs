import {chromium,webkit} from 'playwright';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('.'),out='benchmark/work47/screenshots';await mkdir(out,{recursive:true});const manifest=JSON.parse(await readFile('benchmark/work47/manifest.json'));
const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(p==='/')p='/research/work47/index.html';const path=resolve(root,'.'+p);if(!path.startsWith(root+'/'))throw Error();const data=await readFile(path);res.writeHead(200,{'content-type':({'.mjs':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png'})[extname(path)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,results=[];
try{for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){const browser=await engine.launch({headless:true});try{for(const width of [320,390,430]){const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[],external=[];await context.route('**/*',r=>{const u=r.request().url();if(u.startsWith(origin+'/')||/^(data:|blob:)/.test(u))return r.continue();external.push(u);return r.abort();});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/research/work47/index.html');
try{await page.waitForFunction(n=>document.querySelector('#sample')?.options.length===n,
 manifest.rows.length,{timeout:9000});}catch{
 const info=await page.evaluate(()=>({selectorOptions:document.querySelector('#sample')?.options.length,
  modules:[...document.scripts].map(s=>s.src||s.type).slice(0,5)}));
 throw Error('Offline licensed demo could not populate selector '+JSON.stringify({info,errors,external:external.slice(0,6)}));
}
for(const row of manifest.rows){await page.selectOption('#sample',row.id);await page.waitForFunction(id=>document.body.dataset.ready==='true'&&document.body.dataset.id===id,row.id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('#after canvas').count(),row.profile?1:0);
const foreground=page.locator('#after svg[data-humanoid-overlay="reviewed-anatomy-v1"]');
assert.equal(await foreground.count(),row.profile?1:0,'Anatomy foreground only for fitted licensed cutouts');
if(row.profile&&width===390&&name==='chromium'){
 const target=page.locator('#after');
 await mkdir('benchmark/work47/occlusion-pairs',{recursive:true});
 await target.screenshot({path:'benchmark/work47/occlusion-pairs/'+row.id+'-foreground.png'});
 await foreground.evaluate(el=>el.style.visibility='hidden');
 await target.screenshot({path:'benchmark/work47/occlusion-pairs/'+row.id+'-baseline.png'});
 await foreground.evaluate(el=>el.style.visibility='visible');
}
if(row.profile){const before=await page.locator('#after canvas').evaluate(c=>c.toDataURL());await page.getByRole('button',{name:'↓ Down',exact:true}).click();assert.notEqual(await page.locator('#after canvas').evaluate(c=>c.toDataURL()),before);await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await page.locator('#after canvas').evaluate(c=>c.toDataURL()),before);}await page.screenshot({path:`${out}/${name}-${width}-${row.id}.png`,fullPage:true});results.push({engine:name,width,id:row.id,rendered:!!row.profile,hasCutout:row.hasCutout,ownerApproved:false});}assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();}}finally{await browser.close();}}}finally{server.close();}await writeFile('benchmark/work47/browser-results.json',JSON.stringify(results,null,2));console.log('WORK47_BROWSER_MATRIX',results.length);
