// Exercise the normal local owner UI with licensed, SHA-pinned originals and intercepted auth.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import {createHash} from 'node:crypto';

const root=resolve(process.env.APP_SOURCE_ROOT||'.'),out=process.env.A15_OUT||'benchmark/assignment-15';
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');
  const file=resolve(root,'.'+path),bytes=await readFile(file);
  if(!file.startsWith(root+'/public/'))throw Error('outside public app');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html'; // P167 no research URL flags
const owner='synthetic-assignment-15-a', secondOwner='synthetic-assignment-15-b';
const specimens=[
 ['tee','Tops','T-shirt','Blue','commons-0001','Blue shirt'],
 ['polo','Tops','T-shirt','Red','commons-0002','Red shirt'],
 ['jeans','Bottoms','Jeans','Blue','commons-0023','Jeans'],
 ['shorts','Bottoms','Shorts','Orange','commons-0033','Shorts'],
 ['sneakers','Shoes','Sneakers','White','commons-0080','Sneakers'],
 ['loafers','Shoes','Sneakers','Black','commons-0081','Black sneakers']
];
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const fixtures=await Promise.all(specimens.map(async ([id,category,itemType,color,fixture,name])=>{
 const jpg=await readFile('benchmark/fixtures/'+fixture+'.jpg');
 const image='data:image/jpeg;base64,'+jpg.toString('base64');
 const sourceSHA256=createHash('sha256').update(jpg).digest('hex');
 const lock=locks.find(row=>row.id===fixture);
 assert.equal(lock?.verified,true);
 assert.ok(lock.attribution?.license);
 assert.equal(sourceSHA256,lock.sha256);
 return {id,ownerId:owner,name,category,itemType,color,colorSource:'user',
  image,originalPhoto:{image,sha256:sourceSHA256},sourceSHA256,sourceHashVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true,pattern:'Solid',seasons:[],savedAt:'2026-11-24T00:00:00Z'};
}));
const results=[];
try{
 const engines=[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  if(process.env.A15_ENGINE&&engine!==process.env.A15_ENGINE)continue;
  const browser=await type.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(['data:','blob:'].includes(url.protocol)||url.hostname==='127.0.0.1')return route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/logout')
      return route.fulfill({status:204});
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
      const payload=route.request().postDataJSON();
      const id=payload.email?.split('@')[0]||payload.refresh_token;
      if([owner,secondOwner].includes(id))return route.fulfill({status:200,json:{
       access_token:'test-'+id,refresh_token:id,expires_in:3600,user:{id,email:id+'@example.invalid'}
      }});
     }
     return route.abort();
    });
    await context.addInitScript(()=>{
     class ReviewOnlyWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(data){const reply=value=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,...value}});},0);
       if(data.type==='load')reply({type:'ready'});
       else if(data.type==='classify')reply({type:'result',strong:false,categoryConfirmed:false,choices:[],details:{}});
      }
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
    });
    const page=await context.newPage();
    page.setDefaultTimeout(12000);
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    const signIn=async id=>{
     await page.locator('#authEmail').fill(id+'@example.invalid');
     await page.locator('#authPassword').fill('local synthetic fixture');
     await page.locator('#authSubmit').click();
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized,id);
    };
    const signOut=async()=>{
     await page.locator('.account-menu summary').click();
     await page.locator('#logout').click();
     await page.locator('#authGate').waitFor();
    };
    const builder=async()=>{
     await page.locator('#moreMenu summary').click();
     await page.locator('#moreMenu button[data-view=builder]').click();
    };
    const photos=page.locator('#mission4Preview1054Photos img');
    const preview=async ids=>{
     await page.locator('#mission4Preview1054Section button').click();
     await page.getByText(ids.length+' owner-confirmed original photo(s) verified.',{exact:false}).waitFor();
     assert.deepEqual((await photos.evaluateAll(nodes=>nodes.map(node=>node.src))).sort(),
      ids.map(id=>fixtures.find(row=>row.id===id).image).sort());
     assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
    };
    const status=page.locator('#boardSaveStatus');
    const save=page.locator('#saveBoard'), update=page.locator('#updateSavedOutfit'), remove=page.locator('#removeSavedOutfit');
    const library=page.locator('#savedBoards');
    const name=page.locator('#boardName');
    const read=id=>page.evaluate(id=>new Promise(resolve=>{
     const request=db.transaction('state').objectStore('state').get(id);
     request.onsuccess=()=>resolve(request.result);
    }),id);
    const state=()=>read('outfit-board');
    const reopen=label=>library.getByRole('button',{name:label,exact:true}).click();
    const wardrobe=()=>page.evaluate(()=>readAll());
    const settled=()=>page.evaluate(()=>writes);
    const setName=async label=>{await name.fill(label);await name.press('Tab');await settled();};
    const visibleCount=n=>page.waitForFunction(n=>savedOutfitBoards.length===n,n);
    const reloadOwner=async()=>{
     await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized,owner);
     await builder();
    };
    try{
     await page.goto(host,{waitUntil:'domcontentloaded'});
     await signIn(owner);
     await page.evaluate(async rows=>{
      await writeAll(rows);items=(await readAll()).map(normalizeClothing);render();
     },fixtures);
     const originalRows=await wardrobe();
     const wearKey='outfit-wear-history-v1';
     await builder();
     for(const [slot,id] of [['top','tee'],['bottom','jeans'],['shoes','sneakers']]){
      await page.locator('#boardSlots .board-slot-'+slot).click();
      await page.locator('#boardPickerItems .board-pick').filter({
       has:page.getByText(fixtures.find(row=>row.id===id).name,{exact:true})
      }).click();
      await settled();
     }
     await setName('Twin');
     await save.click();
     await visibleCount(1);
     await preview(['tee','jeans','sneakers']);
     await reopen('Twin');
     const first=(await state()).saved[0];
     if(process.env.A15_BASELINE==='1'){
      assert.equal(await update.count(),0);
      const rows=Array.from({length:50},(_,i)=>({...first,name:'Filled '+i}));
      await page.evaluate(async saved=>{
       await new Promise((resolve,reject)=>{
        const tx=db.transaction('state','readwrite');
        tx.objectStore('state').put({id:'outfit-board',current:saved[0],saved});
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
       });
      },rows);
      await reloadOwner();await save.click();
      assert.match(await status.innerText(),/up to 50 outfits/);
      assert.equal(await remove.count(),0);
      console.log('ASSIGNMENT_15_BASELINE',engine,width,'50 saved outfits; no management controls');
      continue;
     }
     await save.click();
     await page.getByText('This exact outfit is already saved.',{exact:false}).waitFor();
     assert.equal((await state()).saved.length,1);
     await reopen('Twin');
     const longName='W'.repeat(80);
     await setName(longName);
     await update.click();
     await library.getByRole('button',{name:longName,exact:true}).waitFor();
     assert.equal(await page.locator('#savedOutfitSelected').evaluate(node=>node.scrollWidth<=node.clientWidth),true,
      'a valid 80-character saved outfit title must fit the mobile viewport');
     await setName('Renamed');
     await update.click();
     await library.getByRole('button',{name:'Renamed',exact:true}).waitFor();
     assert.deepEqual((await state()).saved,[{...first,name:'Renamed'}]);
     await reopen('Renamed');
     await page.locator('#boardSlots .board-slot-top').click();
     await page.locator('#boardPickerItems .board-pick').filter({hasText:'Red shirt'}).click();
     await settled();
     await save.click();
     await visibleCount(2);
     const twins=(await state()).saved;
     assert.deepEqual(twins.map(row=>[row.name,row.slots.top]),[['Renamed','tee'],['Renamed','polo']]);
     const entries=library.getByRole('button',{name:'Renamed',exact:true});
     await entries.first().click();
     await settled();
     await library.locator(':scope > :first-child').getByRole('button',{name:'I wore this',exact:false}).click();
     await page.waitForFunction(()=>outfitWearEvents.length===1);
     const wear=await read(wearKey);
     assert.equal(wear.events.length,1);
     await entries.last().click();
     await settled();
     await preview(['polo','jeans','sneakers']);
     page.once('dialog',d=>d.dismiss());
     await remove.click();
     assert.deepEqual((await state()).saved,twins);
     // Index plus the recorded roster snapshot must refuse an outdated card.
     await page.evaluate(async()=>{
      await new Promise((resolve,reject)=>{
       const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');
       const request=store.get('outfit-board');
       request.onsuccess=()=>store.put({...request.result,saved:[...request.result.saved].reverse()});
       tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });
     });
     page.once('dialog',d=>d.accept());
     await remove.click();
     await page.getByText('Saved outfits changed. Reload, then reopen the outfit to manage it.',{exact:true}).waitFor();
     assert.deepEqual((await state()).saved,[...twins].reverse());
     // Additional rows are seeded only for capacity and mobile list coverage.
     for(const size of [10,25,49,50]){
      await page.evaluate(async({saved,size})=>{
       const rows=[...saved,...Array.from({length:size-saved.length},(_,i)=>({...saved[0],name:'Scale '+i}))];
       await new Promise((resolve,reject)=>{
        const tx=db.transaction('state','readwrite');
        tx.objectStore('state').put({id:'outfit-board',current:rows[0],saved:rows});
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
       });
      },{saved:twins,size});
      await reloadOwner();
      assert.equal(await page.locator('#savedOutfitSearchCount').innerText(),size+' saved outfits');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     }
     await save.click();
     await page.getByText('You can save up to 50 outfits.',{exact:false}).waitFor();
     await library.getByRole('button',{name:'Renamed',exact:true}).first().click();
     await settled();
     // Updating a combination at capacity consumes no extra record.
     await page.locator('#boardSlots .board-slot-bottom').click({position:{x:12,y:12}});
     await page.locator('#boardPickerItems .board-pick').filter({has:page.getByText('Shorts',{exact:true})}).click();
     await settled();
     await update.evaluate(button=>{button.click();button.click();});
     await page.getByText('Saved outfit updated.',{exact:true}).waitFor();
     const before=await state();
     assert.equal(before.saved.length,50);
     assert.equal(before.saved[0].slots.bottom,'shorts');
     await page.evaluate(()=>{
      const transaction=db.transaction;
      db.transaction=function(stores,...options){
       const tx=transaction.call(this,stores,...options);
       if(stores==='state'&&options[0]==='readwrite'){
        this.transaction=transaction;
        tx.objectStore('state').get('outfit-board').onsuccess=()=>tx.abort();
       }
       return tx;
      };
     });
     page.once('dialog',d=>d.accept());
     await remove.click();
     await page.getByText('Could not remove this outfit. Try again.',{exact:true}).waitFor();
     assert.deepEqual(await state(),before);
     page.once('dialog',d=>d.accept());
     await remove.click();
     await visibleCount(49);
     const freed=await state();
     assert.deepEqual(freed.saved,before.saved.slice(1));
     assert.deepEqual(freed.current,before.current);
     await setName('Capacity recovered');
     await save.click();
     await visibleCount(50);
     assert.equal((await state()).saved.at(-1).name,'Capacity recovered');
     const final=await state();
     assert.deepEqual(await read(wearKey),wear);
     assert.deepEqual(await wardrobe(),originalRows);
     await reloadOwner();assert.deepEqual(await state(),final);
     await signOut();await signIn(secondOwner);await builder();
     assert.equal(await state(),undefined);
     assert.deepEqual(await wardrobe(),[]);
     assert.equal(await page.locator('#savedOutfitManage').isVisible(),false);
     await signOut();await signIn(owner);
     assert.deepEqual(await state(),final);
     assert.deepEqual(await read(wearKey),wear);
     assert.deepEqual(errors,[]);
     results.push({engine,version:browser.version(),width,sourceSHA256:fixtures.map(row=>row.sourceSHA256)});
     console.log('ASSIGNMENT_15_PASS',engine,width);
    }catch(error){await page.screenshot({path:out+'/'+engine+'-'+width+'-FAIL.png',fullPage:true});throw error;}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 await writeFile(out+'/results.json',JSON.stringify({cases:results,syntheticAuth:true},null,2));
}finally{server.close();}
