import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, resolve, sep} from 'node:path';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('dist');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const {pathname}=new URL(req.url,'http://127.0.0.1');
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  assert.ok(path.startsWith(root+sep));
  res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream'}).end(await readFile(path));
 }catch{if(!res.headersSent)res.writeHead(404);res.end();}
});
const owner='assignment-34-owner';
const palette=['#2f4375','#802f51','#334529','#171e21','#635b49','#2d314d'];
const photos=await Promise.all(palette.map(async background=>{
 const bytes=await sharp({create:{width:80,height:100,channels:3,background}}).jpeg().toBuffer();
 return {image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:createHash('sha256').update(bytes).digest('hex')};
}));
const clothing=[
 ['tee','Tops','T-shirt','Same name'],['twin','Tops','T-shirt','Same name'],
 ['sweater','Tops','Sweater','Sweater'],['jeans','Bottoms','Jeans','Jeans'],
 ['shoes','Shoes','Sneakers','Sneakers'],['jacket','Outerwear','Jacket','Jacket']
].map(([id,category,itemType,name],i)=>({
 id,ownerId:owner,category,itemType,name,color:'Black',seasons:['All seasons'],image:photos[i].image,
 originalPhoto:{...photos[i],ownerId:owner},sourceSHA256:photos[i].sha256,ownerReviewed:true
}));
clothing.push({...clothing[4],id:'laundry',availability:'laundry'});
const current={name:'Working board',slots:{top:'tee',bottom:'jeans',shoes:'shoes'}};
const saved={name:'Original saved outfit',slots:{top:'tee',bottom:'jeans',shoes:'shoes'}};
async function start(page,origin){
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof db!=='undefined'&&db&&boardInitialized);
}
async function snapshot(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state']);
  const rows=tx.objectStore('items').getAll();
  const outfit=tx.objectStore('state').get('outfit-board');
  tx.oncomplete=()=>resolve({rows:rows.result,outfit:outfit.result});
  tx.onabort=()=>reject(tx.error);
 }));
}

async function run(browser,origin,width){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  let actor=owner,offline=false;
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin||(offline&&url.pathname.includes('trend')))return route.abort();
   if(url.pathname!=='/auth.js')return route.continue();
   return route.fulfill({contentType:'text/javascript',body:
    'window.closetAuth={user:{id:'+JSON.stringify(actor)+'},ready:Promise.resolve(),assertCurrent(){}};'+
    'document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;'});
  });
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  await start(page,origin);
  await page.evaluate(({clothing,current,saved})=>new Promise((done,fail)=>{
   const tx=db.transaction(['items','state'],'readwrite');
   for(const row of clothing)tx.objectStore('items').put(row);
   tx.objectStore('state').put({id:'outfit-board',current,saved:[saved]});
   tx.oncomplete=done;tx.onabort=()=>fail(tx.error);
  }),{clothing,current,saved});
  await start(page,origin);
  await page.evaluate(()=>switchView('stylist'));
  const panel=page.locator('#stylistComparison');
  const status=panel.getByRole('status');
  const activeTop=()=>page.evaluate(()=>stylistComparisonDraft.board.slots.top);
  const generate=async()=>{
   await page.locator('#stylistSeason').evaluate(el=>{
    el.value='Fall';el.dispatchEvent(new Event('change'));
   });
   await page.locator('#createCollectionOutfits').click();
   await panel.getByRole('button',{name:'Compare outfits'}).click();
  };
  await generate();
  const before=await snapshot(page);
  const options=panel.locator('option');
  assert.equal(await options.count(),3);
  await panel.locator('select').selectOption('1');
  assert.match(await panel.innerText(),/Differs from option 1 in Top or dress/);
  const optionTwo=await activeTop();
  await panel.locator('select').selectOption('0');
  const first=await activeTop();
  assert.notEqual(first,optionTwo);
  const topPhoto=panel.locator('li').filter({has:page.getByRole('button',{name:'Swap Top or dress'})}).locator('img');
  assert.equal(await topPhoto.getAttribute('src'),clothing.find(row=>row.id===first).originalPhoto.image);
  await panel.getByRole('button',{name:'Keep Shoes'}).click();
  assert.equal(await panel.getByRole('button',{name:'Swap Shoes'}).isDisabled(),true);
  await panel.getByRole('button',{name:'Swap Top or dress'}).click();
  assert.equal(await activeTop(),optionTwo);
  assert.notEqual(await topPhoto.getAttribute('src'),clothing.find(row=>row.id===first).originalPhoto.image);
  await panel.getByRole('button',{name:'Swap Top or dress'}).click();
  assert.equal(await activeTop(),'sweater');
  await panel.getByRole('button',{name:'Swap Top or dress'}).click();
  assert.match(await status.innerText(),/No other available owned piece/);
  await panel.getByRole('button',{name:'Undo swap'}).click();
  assert.equal(await activeTop(),optionTwo);
  assert.deepEqual(await snapshot(page),before);
  assert.equal(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await panel.getByRole('button',{name:'Cancel comparison'}).click();
  assert.deepEqual(await snapshot(page),before);

  // Reuse the locally loaded app while both the browser and trend route are offline.
  await panel.getByRole('button',{name:'Compare outfits'}).click();
  offline=true;
  await context.setOffline(true);
  await panel.getByRole('button',{name:'Swap Top or dress'}).click();
  await panel.getByRole('button',{name:'Save as new outfit'}).click();
  await status.filter({hasText:'Saved. Find it'}).waitFor();
  const after=await snapshot(page);
  assert.deepEqual(after.rows,before.rows);
  assert.deepEqual(after.outfit.current,before.outfit.current);
  assert.deepEqual(after.outfit.saved[0],before.outfit.saved[0]);
  assert.equal(after.outfit.saved.length,2);
  assert.equal(after.outfit.saved[1].slots.top,optionTwo);
  await context.setOffline(false);
  await start(page,origin);
  assert.equal(await panel.isHidden(),true);
  await page.evaluate(()=>switchView('builder'));
  const reopened=page.getByRole('button',{name:'Casual · option 1',exact:true});
  await reopened.waitFor();
  await reopened.click();
  await page.waitForFunction(id=>currentBoard.slots.top===id,optionTwo);

  await page.evaluate(()=>switchView('stylist'));
  await generate();
  await panel.getByRole('button',{name:'Swap Top or dress'}).click();
  // An independent IDB connection changes availability without updating this page.
  await page.evaluate(id=>new Promise((done,fail)=>{
   const request=indexedDB.open(db.name);
   request.onerror=()=>fail(request.error);
   request.onsuccess=()=>{
    const foreign=request.result;
    const tx=foreign.transaction('items','readwrite'),store=tx.objectStore('items');
    const get=store.get(id);
    get.onsuccess=()=>store.put({...get.result,availability:'laundry'});
    tx.oncomplete=()=>{foreign.close();done();};
    tx.onabort=()=>{foreign.close();fail(tx.error);};
   };
  }),optionTwo);
  await panel.getByRole('button',{name:'Save as new outfit'}).click();
  await status.filter({hasText:'Your wardrobe changed'}).waitFor();
  assert.equal((await snapshot(page)).outfit.saved.length,2);
  // Restore availability, then delete a different row without updating this page.
  await page.evaluate(({choice,removed})=>new Promise((done,fail)=>{
   const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
   const request=store.get(choice);
   request.onsuccess=()=>store.put({...request.result,availability:'ready'});
   store.delete(removed);
   tx.oncomplete=done;tx.onabort=()=>fail(tx.error);
  }),{choice:optionTwo,removed:'laundry'});
  await panel.getByRole('button',{name:'Save as new outfit'}).click();
  await status.filter({hasText:'Your wardrobe changed'}).waitFor();
  assert.equal((await snapshot(page)).outfit.saved.length,2);
  await page.evaluate(()=>window.dispatchEvent(new Event('closet:session-locked')));
  assert.equal(await panel.isHidden(),true);
  assert.equal(await panel.locator('img').count(),0);
  actor='assignment-34-other-owner';
  await start(page,origin);
  await page.evaluate(()=>switchView('stylist'));
  await page.locator('#createCollectionOutfits').click();
  await page.locator('#stylistStatus').filter({hasText:'Add clothing photos'}).waitFor();
  assert.equal(await panel.isHidden(),true);
  assert.deepEqual((await snapshot(page)).rows,[]);

  const measured=await page.evaluate(()=>{
   const kinds=[['Tops','T-shirt'],['Bottoms','Jeans'],['Shoes','Sneakers'],['Outerwear','Jacket']];
   const summaries=[];
   for(const count of [25,100,250,500]){
    const rows=Array.from({length:count},(_,i)=>{
     const [category,itemType]=kinds[i%kinds.length];
     return {id:'fixture-'+i,category,itemType,color:'Blue'};
    });
    const samples=[];
    for(let trial=0;trial<7;trial++){
     const start=performance.now();
     const results=styleOwnedCollection(rows);
     if(results.length!==3||!stylistOwnedSubstitute(rows,results[0].board,'top',results[0].context,null)){
      throw Error('Comparison engine failed at wardrobe size '+count);
     }
     samples.push(performance.now()-start);
    }
    samples.sort((a,b)=>a-b);
    summaries.push({garments:count,medianMs:samples[3],maxMs:samples.at(-1)});
   }
   return summaries;
  });
  console.log('generation plus one swap, seven synthetic samples',JSON.stringify(measured));
 }finally{await context.close();}
}

try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC34_ENGINE&&process.env.CC34_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{
   for(const width of [320,390,430]){
    await run(browser,origin,width);
    console.log(engine,browser.version(),width,'PASS owned comparison');
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
