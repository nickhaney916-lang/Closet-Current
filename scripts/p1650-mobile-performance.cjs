'use strict';
// Test-only extension of the pinned, loopback signed-owner normal-app runner.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
const anchor=" advance('normal-chooser-cancel-duplicate-and-oversize-no-write');";
const start=source.indexOf(anchor),end=source.lastIndexOf('}catch(error){');
if(start<0||end<=start||source.split(anchor).length!==2)throw Error('normal app benchmark anchor changed');
const workload=String.raw`
 advance('p1650-performance-baseline');
 const measurements=[];
 const cardSelector='#closetGrid .card';
 const closetTab=()=>page.locator('nav.main-nav button.tab[data-view="closet"]');
 const homeTab=()=>page.locator('nav.main-nav button.tab[data-view="home"]');
 const stats=async()=>page.evaluate(()=>{
  const images=[...document.querySelectorAll('#closetGrid .card img')];
  return {domNodes:document.querySelectorAll('*').length,cards:document.querySelectorAll('#closetGrid .card').length,
   images:images.length,decodedOrLoaded:images.filter(x=>x.complete&&x.naturalWidth>0).length,
   resourceImages:performance.getEntriesByType('resource').filter(x=>x.initiatorType==='img').length,
   heapBytes:performance.memory?.usedJSHeapSize??null,
   longTaskCount:window.__p1650LongTasks?.length??null,
   longTaskMs:window.__p1650LongTasks?.reduce((s,x)=>s+x,0)??null};
 });
 await context.addInitScript(()=>{
  if(globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')){
   window.__p1650LongTasks=[];
   new PerformanceObserver(list=>window.__p1650LongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});
  }
 });
 const settled=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const measure=async(label,size,repeat,action)=>{
  const before=await stats(),start=performance.now();
  await action();await settled();
  const elapsedMs=performance.now()-start,after=await stats();
  measurements.push({label,size,repeat,elapsedMs,before,after});
  console.log('P1650_SAMPLE '+JSON.stringify(measurements.at(-1)));
 };
 const waitOwned=async(n)=>{
  await page.waitForFunction(n=>window.closetAuth?.user?.id==='p99-A'&&db?.name==='closet-current-user-p99-A'&&document.querySelector('#appShell')?.hidden===false&&document.querySelector('#closetCount')?.textContent===String(n),n,{timeout:60000});
 };
 let existing=2;
 for(const size of [25,100,250,500]){
  // Explicitly synthetic legacy metadata and generated JPEGs. The real
  // reviewed originals from the unmodified runner remain untouched.
  const added=await page.evaluate(async({from,to})=>{
   if(db.name!=='closet-current-user-p99-A'||window.closetAuth?.user?.id!=='p99-A')throw Error('fixture owner mismatch');
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;
   const ctx=canvas.getContext('2d');const rows=[];
   for(let i=from;i<to;i++){
    const pixels=ctx.createImageData(640,640);
    let seed=(i+1)*2654435761>>>0;
    for(let j=0;j<pixels.data.length;j+=4){
     seed=(Math.imul(seed,1664525)+1013904223)>>>0;
     const x=(j/4)%640,y=Math.floor(j/2560),noise=(seed>>>24)%28;
     pixels.data[j]=(i*11+x/8+noise)%220;
     pixels.data[j+1]=(i*17+y/8+noise)%220;
     pixels.data[j+2]=(i*23+noise)%220;pixels.data[j+3]=255;
    }
    ctx.putImageData(pixels,0,0);ctx.fillStyle='#fff';ctx.font='32px sans-serif';ctx.fillText('Fixture '+i,24,50);
    const image=canvas.toDataURL('image/jpeg',0.82);
    rows.push(normalizeClothing({id:'p1650-fixture-'+i,ownerId:'p99-A',name:'P1650 fixture '+i,category:i%2?'Bottoms':'Tops',itemType:i%2?'Jeans':'Polo',color:i%2?'Blue':'Black',sleeveLength:i%2?'Not applicable':'Short sleeve',seasons:[],image,brand:'Synthetic'}));
   }
   const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
   for(const row of rows)store.add(row);
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);});
   return {rows:rows.length,jpegDataUrlChars:rows.reduce((s,r)=>s+r.image.length,0)};
  },{from:existing,to:size});
  console.log('P1650_FIXTURES '+JSON.stringify({size,...added}));
  existing=size;
  // First populated reload and two repeat reloads; not physical cold boot.
  for(let repeat=0;repeat<3;repeat++){
   await measure(repeat===0?'first-populated-reload':'warm-reload',size,repeat,async()=>{
    await page.reload({waitUntil:'domcontentloaded'});await waitOwned(size);
   });
   assert.equal(await rowCount(),size);
   await measure('open-closet',size,repeat,async()=>{await closetTab().click();await page.locator('#closetCategories').waitFor({state:'visible'});});
   await measure('browse-all-initial',size,repeat,async()=>{
    await page.locator('#closetAllPieces').click();
    await page.locator(cardSelector).first().waitFor({state:'visible'});
   });
   assert.equal(await page.locator(cardSelector).count(),size<=100?size:48);
   await measure('scroll-initial-cards',size,repeat,()=>page.locator(cardSelector).last().scrollIntoViewIfNeeded());
   for(let nav=0;nav<3;nav++){
    await measure('home-return',size,repeat*3+nav,async()=>{await homeTab().click();await page.locator('#home').waitFor({state:'visible'});});
    await measure('closet-return',size,repeat*3+nav,async()=>{await closetTab().click();await page.locator('#closetCategories').waitFor({state:'visible'});});
   }
   await page.locator('#closetAllPieces').click();
   while(await page.getByRole('button',{name:'Show more clothing'}).count()){
    const old=await page.locator(cardSelector).count();
    await page.evaluate(()=>{window.__p1650PriorCards=[...document.querySelectorAll('#closetGrid .card')];});
    await measure('expand-page',size,repeat,()=>page.getByRole('button',{name:'Show more clothing'}).click());
    const retained=await page.evaluate(()=>{
     const previous=window.__p1650PriorCards,now=[...document.querySelectorAll('#closetGrid .card')];
     const count=previous.filter((card,i)=>card===now[i]&&card.isConnected).length;
     delete window.__p1650PriorCards;return count;
    });
    const total=await page.locator(cardSelector).count();
    assert.ok(total>old,'pagination made no progress');
    assert.equal(total,Math.min(size,old+48),'page expansion size changed');
    measurements.at(-1).retainedPriorCards=retained;
    measurements.at(-1).priorCards=old;
    if(process.env.P1650_VARIANT==='parent')assert.equal(retained,0,'parent must reproduce replacement');
    if(process.env.P1650_VARIANT==='candidate')assert.equal(retained,old,'existing card identity must survive expansion');
   }
   assert.equal(await page.locator(cardSelector).count(),size);
   const ids=await page.locator(cardSelector).evaluateAll(cards=>cards.map(x=>x.dataset.itemId));
   assert.equal(new Set(ids).size,size,'duplicate visible cards');
   assert.equal(await rowCount(),size);
  }
 }
 const originalCheck=await page.evaluate(async()=>{
  const result=[];
  for(const row of items.filter(x=>x.ownerReviewed===true)){
   const bytes=Uint8Array.from(atob(row.originalPhoto.image.split(',')[1]),c=>c.charCodeAt(0));
   const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
   result.push({sha,receipt:row.sourceSHA256,owner:row.ownerId});
  }
  return result;
 });
 assert.equal(originalCheck.length,2);
 for(const original of originals)assert.ok(originalCheck.some(x=>x.sha===original.sha&&x.receipt===original.sha&&x.owner==='p99-A'));
 await page.locator('.account-menu summary').click();await page.locator('#logout').click();
 await page.waitForFunction(()=>document.querySelector('#authGate')?.hidden===false,null,{timeout:30000});
 await signIn('p99-B');await closetTab().click();await page.locator('#closetAllPieces').click();
 assert.equal(await rowCount(),0);assert.equal(await page.locator(cardSelector).count(),0);
 await page.locator('.account-menu summary').click();await page.locator('#logout').click();
 await page.waitForFunction(()=>document.querySelector('#authGate')?.hidden===false,null,{timeout:30000});
 await signIn('p99-A');await waitOwned(500);assert.equal(await rowCount(),500);
 assert.deepEqual(errors,[],'native page errors');
 const groups={};
 for(const x of measurements)(groups[x.size+':'+x.label]??=[]).push(x.elapsedMs);
 const summaries=Object.entries(groups).map(([key,values])=>{
  values.sort((a,b)=>a-b);const m=Math.floor(values.length/2);
  return {key,n:values.length,medianMs:values.length%2?values[m]:(values[m-1]+values[m])/2,minMs:values[0],maxMs:values.at(-1)};
 });
 await writeFile(join(out,'P1650-PERFORMANCE.json'),JSON.stringify({engine,width,source:process.env.P1650_SOURCE_SHA??null,variant:process.env.P1650_VARIANT??null,fixture:'2 reviewed public originals plus generated legacy JPEG rows',physicalDevice:false,measurement:'Playwright action plus two animation frames; loaded image count is not decode timing; heap/long tasks null when unsupported',measurements,summaries,sourceReceiptsPreserved:true,ownerIsolation:true},null,2)+'\n');
 console.log('P1650_SUMMARY '+JSON.stringify(summaries));
`;
const output='scripts/.p1650-performance-runner.mjs';
try{
 fs.writeFileSync(output,source.slice(0,start)+workload+source.slice(end),{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;process.exitCode=run.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
