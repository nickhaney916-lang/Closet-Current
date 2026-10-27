// REAL licensed-photo diagnostic screenshots. No account, model, new mask,
// staging or approval flow. Renderer code is unchanged and source-pinned.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist-family-alpha-33-visual-hold'),mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
const manifest=JSON.parse(await readFile(root+'/manifest.json','utf8'));
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/favicon.ico'){res.writeHead(204);return res.end();}const file=resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+'/'))throw Error('path');res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(await readFile(file));}catch{res.writeHead(404);res.end('not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,report=[];
await mkdir('benchmark/work46-avatar/screenshots',{recursive:true});
try{for(const [name,engine]of [['Chromium',chromium],['WebKit',webkit]]){const browser=await engine.launch({headless:true,args:name==='Chromium'?['--no-sandbox']:[]});try{for(const width of [320,390,430]){const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[],outside=[],missing=[];await ctx.route('**/*',r=>r.request().url().startsWith(origin+'/')||/^(data:|blob:)/.test(r.request().url())?r.continue():(outside.push(r.request().url()),r.abort()));const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});try{
 await page.goto(origin+'/');
 for(const row of manifest.rows){
  await page.getByLabel('Example',{exact:true}).selectOption(row.id);
  await page.waitForFunction(id=>{const el=document.getElementById('gallery');return el.dataset.ready==='true'&&el.dataset.id===id;},row.id);
  const facts=await page.evaluate(()=>{const root=document.getElementById('gallery'),frames=[...root.querySelectorAll('.family-alpha-avatar')];return {hasProposal:root.dataset.hasProposal==='true',avatars:frames.length,photoLayers:root.querySelectorAll('.family-alpha-avatar img').length,aspectRatioPreserved:frames.every(f=>[...f.querySelectorAll('img')].every(im=>{const b=im.getBoundingClientRect();return Math.abs((b.width/b.height)/(im.naturalWidth/im.naturalHeight)-1)<.015;})),currentEyes:root.querySelectorAll('figure:nth-child(4) [data-part="left-eye"]').length,provisionalLabels:root.querySelectorAll('.provisional').length,overflow:document.documentElement.scrollWidth>innerWidth+2,brokenImages:[...root.querySelectorAll('img')].some(x=>!x.complete||!x.naturalWidth),selectHeight:document.getElementById('sample').getBoundingClientRect().height,sha:root.dataset.cutoutSHA||null};});
  assert.equal(facts.hasProposal,row.hasProposal);assert.equal(facts.avatars,row.hasProposal?3:0);assert.equal(facts.photoLayers,row.hasProposal?3:0);assert.equal(facts.provisionalLabels,4);assert.equal(facts.overflow,false);assert.equal(facts.brokenImages,false);assert.equal(facts.aspectRatioPreserved,true);assert.ok(facts.selectHeight>=44);if(row.hasProposal){assert.equal(facts.currentEyes,1);assert.equal(facts.sha,row.work30NativeCutoutSHA256);}else assert.equal(facts.sha,null);
  if(row.hasProposal && row.category!=='Shoes'){const fit=page.getByRole('region',{name:'Adjust photographed clothing position on 2D figure'});await fit.getByRole('button',{name:'− Smaller'}).click();await fit.getByRole('button',{name:'↑ Up'}).click();assert.match(await fit.getByRole('status').innerText(),/preview only/i);}
  const path=`benchmark/work46-avatar/screenshots/${name.toLowerCase()}-${width}-${row.id}-PROVISIONAL-HOLD.png`;await page.screenshot({path,fullPage:true});
  report.push({engine:name,width,id:row.id,technicalStatus:'PASS',visualDecision:row.decision,hasProposal:row.hasProposal,physicalPhone:false,ownerApproved:false,sourceSHA256:row.sourceSHA256,...facts});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(missing,[]);
 }finally{await ctx.close();}}}finally{await browser.close();}}}finally{server.close();}
await writeFile('benchmark/work46-avatar/browser-results.json',JSON.stringify({release:'HOLD',physicalPhoneVerified:false,cases:report},null,2));console.log('WORK46_AVATAR_TECHNICAL_BROWSER_PASS',JSON.stringify({cases:report.length,renderedProposalCases:report.filter(x=>x.hasProposal).length,blockedCases:report.filter(x=>!x.hasProposal).length,ownerApproved:false}));
