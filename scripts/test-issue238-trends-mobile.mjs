/**
 * Offline synthetic mobile-browser trend QA, no paid APIs or external calls.
 * Node 22, Playwright 1.56.1, Chromium and WebKit 320/390/430 widths.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('public'), research=resolve('research/trends/trend-quality-gate.mjs');
const server=createServer(async(req,res)=>{
 try{
  const route=new URL(req.url,'http://127.0.0.1').pathname;
  if(route==='/issue238'){
   res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none';script-src 'self';style-src 'unsafe-inline';connect-src 'self';img-src data:","Cache-Control":"no-store"});
   res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline trend research QA</title><style>body{margin:0;max-width:100%;padding:8px;font-family:sans-serif}main{max-width:100%}article{overflow-wrap:anywhere}</style><main><section id="owned"><h2>Owned clothes</h2></section><section id="shopping"><h2>Shopping inspiration — not owned</h2></section><p id="status"></p></main><script src="/trend-library.js"></script><script src="/outfit-board-engine.js"></script>');
   return;
  }
  if(route==='/issue238-quality.mjs'){
   res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(await readFile(research));return;
  }
  const path=resolve(root,'.'+decodeURIComponent(route));
  if(!path.startsWith(root+sep))throw Error('Unsafe fixture path');
  res.writeHead(200,{'Content-Type':extname(path)==='.json'?'application/json':'text/javascript','Cache-Control':'no-store'});
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('No matching offline fixture');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const addr='http://127.0.0.1:'+server.address().port+'/issue238',summary=[];
try{
 for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engineName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:740},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],remoteCalls=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith('http://127.0.0.1:')){remoteCalls.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(addr);
    const output=await page.evaluate(async()=>{
     const gate=await import('/issue238-quality.mjs');
     const seed=await (await fetch('/trend-data.json')).json();
     const date=Date.parse('2026-10-23T19:00:00Z');
     const q=gate.normalizeQualityLibrary(seed,{now:date});
     if(q.status!=='current'||q.publicationSites<6)throw Error('Fresh real fixture not accepted');
     applyLoadedTrendLibrary(seed);
     const board=cleanOutfitBoard({audience:'Women',occasion:'Casual',slots:{top:'owned-top'}},[{id:'owned-top',category:'Tops',itemType:'Sweater',image:'synthetic-original'}]);
     const ideas=wardrobeGapIdeas('shoes',board,[{id:'owned-top',category:'Tops',itemType:'Sweater',image:'synthetic-original'}]);
     if(!ideas.length||ideas.some(x=>x.itemId)||!board.slots.top)throw Error('Ideas became owned garment');
     const owned=[{id:'owned-top',category:'Tops',image:'synthetic-original'}],shopping=[{type:'Sneakers',name:'New sneakers',url:'https://example-fashion.org/sneakers'}];
     const isolated=gate.ownedOnlyOutfitView({board:{slots:{top:'owned-top'}}},owned,shopping);
     const ownedRoot=document.querySelector('#owned'),shopRoot=document.querySelector('#shopping');
     for(const p of isolated.ownedGarments){const node=document.createElement('article');node.textContent=p.id;node.dataset.ownedId=p.id;ownedRoot.append(node);}
     for(const p of isolated.shoppingInspiration){const node=document.createElement('article');node.textContent=p.name;node.dataset.shoppingUrl=p.url;shopRoot.append(node);}
     if(ownedRoot.querySelectorAll('[data-owned-id]').length!==1||shopRoot.querySelectorAll('[data-shopping-url]').length!==1)throw Error('Shopping/owned isolation failed');
     const stale=structuredClone(seed);stale.updated_at='2026-07-01T00:00:00Z';
     const select=gate.chooseTrendResearch({remote:stale,cached:seed},{now:date});
     if(select.origin!=='cached'||select.mode!=='verified-research')throw Error('Offline fallback was not source-safe');
     const empty=gate.chooseTrendResearch({remote:stale,cached:stale},{now:date});
     if(empty.mode!=='general-styling-only')throw Error('Stale trend advertised as current');
     const redirects=await Promise.all([
      gate.inspectExternalLink('https://style.org/story',async()=>({status:404,url:'https://style.org/story'})),
      gate.inspectExternalLink('https://style.org/story',async()=>{throw Error('offline');}),
      gate.inspectExternalLink('https://style.org/story',async()=>({status:302,redirected:true,url:'https://evil.org/other'}))
     ]);
     if(redirects.map(x=>x.status).join(',')!=='broken,unverified,review-redirect')throw Error('Link condition safety failed');
     document.querySelector('#status').textContent='Offline synthetic audit: 6 sources, safe cache fallback, owned vs shopping separation';
     return {sourceHosts:q.publicationSites,rows:ideas.length,isolatedOwned:isolated.ownedGarments.length,isolatedShopping:isolated.shoppingInspiration.length,
      staleOfflineRefused:true,redirects:redirects.map(x=>x.status)};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(remoteCalls,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    summary.push({engine:engineName,width,...output,pageErrors:0,externalRequests:0});
    await context.close();
   }
  }finally{await browser.close();}
 }
 if(summary.length!==6)throw Error('Expected all 6 browser/viewport cases');
 console.log('ISSUE238_MOBILE_RESULTS '+JSON.stringify(summary));
}finally{await new Promise(resolve=>server.close(resolve));}
