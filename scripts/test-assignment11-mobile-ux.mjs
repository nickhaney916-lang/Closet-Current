/** Mobile UX QA using the actual unchanged-auth contract with disposable test
 * identity, in-memory synthetic clothes and local-only app files.
 * No customer accounts, media, network providers, deployment or paid AI.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep))throw Error('Invalid local fixture path');
  let content=await readFile(file);
  if(path==='/style.css'||path==='/app-theme.css')content=Buffer.from(content.toString().replace(/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com[^;]+;\s*/g,''));
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(content);
 }catch{res.writeHead(404);res.end('No local fixture');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,375,390,430]){
    const context=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
    const external=[],pageErrors=[],page=await context.newPage();
    page.on('pageerror',err=>pageErrors.push(err.message));
    await context.route('**/*',route=>{
     const link=route.request().url();
     if(link.startsWith(origin))return route.continue();
     // Mock missing external font calls with an empty style sheet so QA
     // cannot access unrelated websites and remains deterministic offline.
     external.push(link);
     if(link.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json'))
      return route.fulfill({status:503,contentType:'application/json',body:'{}'});
     return route.fulfill({status:200,contentType:'text/css',body:''});
    });
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'assignment11-test-user'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await page.goto(origin+'/');
    await page.evaluate(()=>closetReady);
    const initial=await page.evaluate(()=>{
     const canvas=document.createElement('canvas');canvas.width=600;canvas.height=800;
     const g=canvas.getContext('2d');g.fillStyle='#2552b7';g.fillRect(0,0,600,800);
     const photo=canvas.toDataURL('image/jpeg',.94);
     const data=[['t1','Tops','T-shirt'],['t2','Tops','Sweater'],['b1','Bottoms','Jeans'],['b2','Bottoms','Shorts'],['s1','Shoes','Sneakers'],['d1','Dresses','Casual dress']];
     const original=data.map(([id,category,itemType])=>normalizeClothing({id,category,itemType,image:photo,color:'Blue',name:'Synthetic '+itemType,seasons:[],savedAt:'2026-10-23T00:00:00Z'}));
     items=original;
     render();
     return {originals:items.map(x=>({id:x.id,image:x.image})),view:document.querySelector('.view:not([hidden])')?.id};
    });
    assert.equal(initial.view,'home');
    const homeNames=await page.locator('#home .home-action strong').allTextContents();
    assert.ok(homeNames.some(x=>x.includes('Add clothes')),'Home needs clear Add clothes action');
    assert.ok(homeNames.some(x=>x.includes('My closet')),'Home needs clear closet action');
    await page.locator('#home .home-action[data-go-view="closet"]').click();
    assert.equal(await page.locator('#closetQuickCategories button').count(),4);
    const cards=await page.locator('#closetQuickCategories button').evaluateAll(nodes=>nodes.map(n=>({
      label:n.querySelector('strong')?.textContent,count:n.querySelector('.closet-quick-count')?.textContent,
      width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,
      aria:n.getAttribute('aria-label')
    })));
    assert.deepEqual(cards.map(x=>x.label),['Shirts','Pants','Shoes','Dresses']);
    assert.deepEqual(cards.map(x=>x.count),['2 pieces','2 pieces','1 piece','1 piece']);
    assert.ok(cards.every(x=>x.height>=88&&x.width>=110&&x.aria?.includes('Browse category')),'Touch targets and accessible labels insufficient');
    const before=await page.evaluate(()=>JSON.stringify(items.map(x=>[x.id,x.image])));
    await page.locator('#closetQuickCategories button[data-closet-quick="pants"]').click();
    assert.equal(await page.locator('#filter').inputValue(),'Bottoms');
    assert.equal(await page.locator('#closetCollection').isVisible(),true);
    assert.equal(await page.locator('#closetGrid article').count(),2);
    assert.equal(await page.locator('#closetBack').evaluate(el=>document.activeElement===el),true);
    await page.locator('#closetBack').click();
    await page.locator('#closetQuickCategories button[data-closet-quick="shoes"]').click();
    assert.equal(await page.locator('#closetGrid article').count(),1);
    await page.locator('#closetBack').click();
    await page.locator('#closetQuickCategories button[data-closet-quick="dresses"]').click();
    assert.equal(await page.locator('#closetGrid article').count(),1);
    const after=await page.evaluate(()=>JSON.stringify(items.map(x=>[x.id,x.image])));
    assert.equal(before,after,'Navigating must never mutate original saved clothing');
    await page.locator('.main-nav .tab[data-view="scan"]').click();
    assert.equal(await page.locator('#interval').inputValue(),'5');
    assert.equal(await page.locator('#start').innerText(),'Manual photos');
    assert.match(await page.locator('#startAuto').innerText(),/Auto.*5 seconds/);
    assert.equal(await page.locator('#captureState').getAttribute('aria-live'),'off');
    assert.equal(await page.locator('#captureAnnouncement').getAttribute('aria-live'),'polite');
    // Verify reference photo lives next to the actual adjustment fields,
    // with user text/metadata unmodified before pressing Save.
    await page.evaluate(()=>adjustPhoto(items[0]));
    const dialog=page.locator('dialog.photo-adjust');
    const ref=dialog.locator('.mobile-adjust-reference img');
    assert.equal(await ref.count(),1);
    const refPixelSize=await ref.evaluate(async img=>{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};});
    assert.deepEqual(refPixelSize,{width:600,height:800});
    assert.equal(await ref.getAttribute('alt'),'Clothing photo being reviewed');
    await dialog.getByRole('button',{name:'Cancel'}).click();
    await dialog.waitFor({state:'detached'});
    const unchanged=await page.evaluate(()=>JSON.stringify(items.map(x=>[x.id,x.image])));
    assert.equal(unchanged,before);
    const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth}));
    assert.ok(overflow.scrollWidth<=overflow.innerWidth+1,JSON.stringify({browserName,width,overflow}));
    assert.deepEqual(pageErrors,[]);
    assert.ok(external.every(x=>x.includes('fonts.googleapis.com')||x.includes('fonts.gstatic.com')||x.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json')),'Unexpected network request '+external.join(','));
    results.push({browser:browserName,width,categoryButtons:4,categoryCountsValid:true,touchTargetsValid:true,photoUnchanged:true,
      reviewedSourcePixels:refPixelSize,manualAndFiveSecondModes:true,quietAccessibleCountdown:true,
      pageErrors:pageErrors.length,locallyMockedExternalLookups:external.length,layoutOverflow:0});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,8);
 console.log('ASSIGNMENT11_MOBILE_BROWSER_RESULTS '+JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
