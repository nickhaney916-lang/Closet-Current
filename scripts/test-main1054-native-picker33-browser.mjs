/**
 * MAIN1054 M33: actual unmodified native auth/app/Outfit Builder click paths.
 * Isolated public-licensed JPEG source + synthetic signed account HTTP only.
 * NO DEPLOY / NO REAL ACCOUNT / NO PHYSICAL PHONE / 2D ONLY.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),mime={'.js':'text/javascript','.mjs':'text/javascript',
 '.html':'text/html','.css':'text/css','.json':'application/json',
 '.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png'};
const jpg=await readFile('benchmark/fixtures/commons-0053.jpg');
const image='data:image/jpeg;base64,'+jpg.toString('base64');
const sha=createHash('sha256').update(jpg).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public\/|research\/|node_modules\/)/.test(path)||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('path blocked');
  const full=resolve(root,'.'+path);
  if(!full.startsWith(root+'/'))throw Error('outside repository');
  const content=await readFile(full);
  res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
const authHost='https://hlkgymugtfbirlpunsra.supabase.co';
const owner='m33-A',itemId=owner+'-jeans';
const mode=process.env.MAIN33_ENGINE||'both';
const sourceRoster34=process.env.MAIN34==='research';
assert.ok(['chromium','webkit','both'].includes(mode));
const engines=[['chromium',chromium],['webkit',webkit]].filter(([name])=>mode==='both'||name===mode);
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
let count=0;
async function authRoute(route){
 const url=new URL(route.request().url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  let data={};try{data=JSON.parse(route.request().postData()||'{}')}catch{}
  const grant=url.searchParams.get('grant_type');
  const valid=grant==='password'&&data.email===owner+'@example.test'||
   grant==='refresh_token'&&data.refresh_token==='refresh-'+owner;
  if(!valid)return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({msg:'Synthetic authentication rejected'})});
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify({user:{id:owner,email:owner+'@example.test'},
    access_token:'synthetic-m33-'+(++count),refresh_token:'refresh-'+owner,expires_in:3600})});
 }
 return route.abort();
}
async function signin(page){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('Synthetic-Only-No-Credential');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(o=>window.closetAuth?.user?.id===o&&
  db?.name==='closet-current-user-'+o,owner,{timeout:20000});
}
async function seed(page){
 const row={id:itemId,ownerId:owner,category:'Bottoms',itemType:'Jeans',
  color:'Blue',name:'Synthetic owner category label - not blind photo truth',colorSource:'user',
  sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,userAdjusted:true,
  confirmedCategory:true,confirmedColor:true,seasons:[],
  image,originalPhoto:{image,sha256:sha},
  confirmedDetails:{category:'Bottoms',itemType:'Jeans',color:'Blue'},
  confirmedDetailsSource31:{ownerId:owner,itemId,sourceSHA256:sha,
   basis:'PHOTO119-explicit-owner-confirmation'},
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence'};
 await page.evaluate(data=>new Promise((resolve,reject)=>{
  if(window.closetAuth?.user?.id!==data.owner)throw Error('fixture owner mismatch');
  const dbRequest=indexedDB.open('closet-current-user-'+data.owner,2);
  dbRequest.onupgradeneeded=()=>{
   if(!dbRequest.result.objectStoreNames.contains('items'))
    dbRequest.result.createObjectStore('items',{keyPath:'id'});
   if(!dbRequest.result.objectStoreNames.contains('state'))
    dbRequest.result.createObjectStore('state',{keyPath:'id'});
  };
  dbRequest.onerror=()=>reject(dbRequest.error);
  dbRequest.onsuccess=()=>{
   const connection=dbRequest.result,tx=connection.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put(data.row);
   tx.objectStore('state').put({id:'outfit-board',current:{name:'M33 source-safe look',
    slots:{}},saved:[]});
   tx.oncomplete=()=>{connection.close();resolve();};
   tx.onerror=tx.onabort=()=>{const err=tx.error;connection.close();reject(err);};
  };
 }),{owner,row});
}
async function privateBoard(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const request=db.transaction('state','readonly').objectStore('state').get('outfit-board');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 }));
}
async function mutateSource(page){
 return page.evaluate(id=>new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
  const request=store.get(id);
  request.onsuccess=()=>{
   const value=request.result;
   value.originalPhoto.sha256='0'.repeat(64);
   store.put(value);
  };
  tx.oncomplete=()=>resolve();
  tx.onerror=tx.onabort=()=>reject(tx.error);
 }),itemId);
}
let browser,debug=null;const results=[],errors=[],external=[];
try{
 for(const [engineName,engine] of engines){
  browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:850},
     hasTouch:true,isMobile:true,serviceWorkers:'block'});
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.endsWith('/public/cloud-backup.js'))
      return route.fulfill({contentType:'text/javascript',body:cloudStub});
     if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'+host))
      return route.continue();
     if(url.startsWith(authHost+'/auth/v1/'))return authRoute(route);
     external.push({engine:engineName,width,host:new URL(url).hostname});return route.abort();
    });
    const page=await context.newPage();
    debug={engine:engineName,width,stage:'goto'};
    page.on('pageerror',e=>errors.push({engine:engineName,width,error:String(e)}));
    await page.goto(host+'/public/index.html?ownerPicker33=research'+(sourceRoster34?'&ownerRevision34=research':''),{waitUntil:'domcontentloaded'});
    debug.stage='signin';await signin(page);
    debug.stage='seed';await seed(page);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(o=>window.closetAuth?.user?.id===o&&
     typeof boardInitialized!=='undefined'&&boardInitialized===true&&
     Array.isArray(items)&&items.length===1,owner,{timeout:20000});
    await page.evaluate(()=>switchView('builder'));
    debug.stage='actual-native-picker-click';
    await page.locator('#boardSlots .board-slot-bottom').click();
    await page.locator('#boardPickerItems .board-pick').first().click();
    await page.waitForTimeout(1300);
    let privateData=await privateBoard(page);
    const debugInfo=await page.evaluate(()=>({
     shownSlot:currentBoard?.slots?.bottom||null,
     savedSlot:!!document.querySelector('#boardPicker')?.open,
     boardInitialized,ownerResearchFlag:ownerPicker33Active,
     status:document.getElementById('boardSaveStatus')?.textContent?.slice(0,180)||''
    }));
    console.log('MAIN1054_M33_PUBLIC_FIXTURE_PICKER',JSON.stringify({
     engine:engineName,width,ui:debugInfo,
     persistedSelected:privateData?.current?.slots?.bottom===itemId,
     persistedSlotCount:Object.keys(privateData?.current?.slots||{}).length}));
    assert.equal(privateData.current.slots.bottom,itemId);
    results.push({engine:engineName,width,case:'real opt-in picker persisted source-safe private bottom slot',pass:true});
    debug.stage='save-owned-outfit';
    await page.locator('#saveBoard').click();
    let outcomeStatus='';
    for(let spin=0;spin<50;spin++){
     await page.waitForTimeout(200);
     privateData=await privateBoard(page);
     outcomeStatus=await page.locator('#boardSaveStatus').innerText();
     if(privateData?.saved?.length===1||outcomeStatus.includes('Could not save'))break;
    }
    const sourceGateDebug=privateData?.saved?.length===1?null:await page.evaluate(async()=>{
     try{
      const gate=await ownerPicker33Gate();
      try{await gate.prepareWrite(currentBoard);return 'preflight-accepted';}
      catch(e){return String(e?.message||e).slice(0,140);}
      finally{gate.dispose();}
     }catch(e){return String(e?.message||e).slice(0,140);}
    });
    console.log('MAIN1054_M33_PUBLIC_FIXTURE_SAVE',JSON.stringify({
     engine:engineName,width,persistedSaved:privateData?.saved?.length||0,
     status:outcomeStatus.slice(0,160),preflight:sourceGateDebug
    }));
    assert.equal(privateData.saved.length,1);
    results.push({engine:engineName,width,case:'real native saved outfit passed atomic source row CAS',pass:true});
    if(sourceRoster34){
     debug.stage='content-derived-durable-cross-tab-roster';
     const compared=await page.evaluate(async()=>{
      const gate=await ownerPicker33Gate();
      try{
       const proof=await gate.prepareWrite(currentBoard);
       const getRows=()=>new Promise((resolve,reject)=>{
        const q=db.transaction('items','readonly').objectStore('items').getAll();
        q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
       });
       const before=await getRows();
       const matchedBefore=proof.matchesRoster(before);
       // A second IndexedDB connection simulates an old writer/another tab
       // changing an unrelated saved garment without incrementing UI epoch.
       await new Promise((resolve,reject)=>{
        const q=indexedDB.open(db.name,2);
        q.onerror=()=>reject(q.error);
        q.onsuccess=()=>{
         const other=q.result,tx=other.transaction('items','readwrite');
         tx.objectStore('items').put({
          id:'unrelated-cross-tab',ownerId:window.closetAuth.user.id,
          category:'Tops',itemType:'Other',color:'Purple',
          notes:'Synthetic unrelated cross-tab addition'
         });
         tx.oncomplete=()=>{other.close();resolve();};
         tx.onerror=tx.onabort=()=>{const e=tx.error;other.close();reject(e);};
        };
       });
       const after=await getRows();
       return {durable:proof.durableContentChecked,matchedBefore,
        matchedAfter:proof.matchesRoster(after)};
      }finally{gate.dispose();}
     });
     assert.deepEqual(compared,{durable:true,matchedBefore:true,matchedAfter:false});
     results.push({engine:engineName,width,case:'durable M34 full-roster CAS refuses unrelated cross-tab garment change',pass:true});
    }
    debug.stage='tamper-source-and-resave-veto';
    await mutateSource(page);
    await page.locator('#saveBoard').click();
    await page.waitForTimeout(800);
    assert.equal((await privateBoard(page)).saved.length,1,'tampered original cannot add another saved outfit');
    assert.ok((await page.locator('#boardSaveStatus').innerText()).includes('Could not save'));
    results.push({engine:engineName,width,case:'tampered source cannot persist another native outfit',pass:true});
    await context.close();
   }
  }finally{await browser.close();browser=null;}
 }
 assert.equal(errors.length,0,'native app page runtime errors');
 assert.ok(external.every(x=>['fonts.googleapis.com','raw.githubusercontent.com','cdn.jsdelivr.net'].includes(x.host)),
  'unexpected external request origin; all external requests are aborted');
 assert.equal(results.length,engines.length*(sourceRoster34?12:9));
 console.log(sourceRoster34?'MAIN1054_M34':'MAIN1054_M33',JSON.stringify({results,source:'licensed Commons-0053',
  realHumanLabels:false,syntheticOwners:true,physicalPhone:false,hostedCloud:false,
  consumer3D:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
}catch(error){
 console.error('MAIN1054_M33 failed',String(error),{debug,errors,external});
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}