import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {createEphemeralSignedIdentity147} from '../research/signed-two-owner-transport-147/ephemeral-signed-identity.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=await sharp({create:{width:96,height:96,channels:3,background:'#467087'}}).jpeg().toBuffer();
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const sha=hash(bytes);
const damagedBytes=await sharp({create:{width:96,height:96,channels:3,background:'#875246'}}).jpeg().toBuffer();
const damagedImage='data:image/jpeg;base64,'+damagedBytes.toString('base64');
const root=resolve(process.env.P1600_PUBLIC_ROOT||'public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  const source=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!source.startsWith(root+'/'))throw Error('Test path outside public root');
  const body=await readFile(source);
  res.writeHead(200,{'content-type':types[extname(source)]||'application/octet-stream','cache-control':'no-store'});
  res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port;
const owner='a1600000-0000-4000-8000-000000000001',other='b1600000-0000-4000-8000-000000000002';
const row={id:'shirt',ownerId:owner,image,name:'Private blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue',
 originalPhoto:{image,sha256:sha},sourceSHA256:sha,sourceHashVerified:true,userAdjusted:true};
const board={id:'outfit-board',current:{name:'Today',slots:{top:'shirt'}},saved:[{name:'Saved outfit',slots:{top:'shirt'}}]};
const marker={id:'cloud-sync',baseVersion:1,localRevision:0,dirty:false};
const fixture={items:[row],state:[marker,board,{id:'draft',batch:[]}]};
const identity=createEphemeralSignedIdentity147();
const results=[];
async function storage(page,id,seed){
 return page.evaluate(({id,seed})=>new Promise((done,fail)=>{
  const request=indexedDB.open('closet-current-user-'+id,2);
  request.onupgradeneeded=()=>{
   for(const name of ['items','state'])request.result.createObjectStore(name,{keyPath:'id'});
  };
  request.onerror=()=>fail(request.error);
  request.onsuccess=()=>{
   const database=request.result,tx=database.transaction(['items','state'],seed?'readwrite':'readonly');
   const items=tx.objectStore('items'),state=tx.objectStore('state');
   if(seed){items.clear();state.clear();for(const row of seed.items)items.put(row);for(const row of seed.state)state.put(row);}
   const saved=items.getAll(),values=state.getAll();
   tx.oncomplete=()=>{database.close();done({items:saved.result,state:values.result});};
   tx.onabort=()=>{database.close();fail(tx.error);};
  };
 }),{id,seed});
}
async function login(page,who){
 await page.locator('#authEmail').fill(who===owner?'a@example.test':'b@example.test');
 await page.locator('#authPassword').fill('synthetic-test-password');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth.user?.id===id,who);
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
}
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.P1600_ENGINE&&process.env.P1600_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
   let revision=1,writes=0,reads=0,blocked=0;
   await context.route('**/*',route=>{
    const req=route.request(),target=new URL(req.url());
    if(target.origin===url)return route.continue();
    if(!target.hostname.endsWith('.supabase.co')){blocked++;return route.abort();}
    const reply=(json,status=200)=>route.fulfill({status,json,headers:{'access-control-allow-origin':'*'}});
    const auth=req.headers().authorization||'';
    if(target.pathname==='/auth/v1/token'){
     const id=req.postDataJSON().email==='a@example.test'?owner:other;
     return reply({user:{id},access_token:identity.issue(id),refresh_token:'local-only',expires_in:600});
    }
    let signed;try{signed=identity.verify(auth.replace(/^Bearer /,''));}catch{return reply({},401);}
    if(target.pathname==='/auth/v1/logout'){identity.revoke(signed.sessionId);return reply({});}
    if(target.pathname==='/rest/v1/closet_backups'){
     if(target.searchParams.get('owner_id')!=='eq.'+signed.ownerId)return reply({},403);
     reads++;
     if(signed.ownerId===other)return reply([]);
     return reply([{revision,document:{schemaVersion:1,items:[],state:{}}}]);
    }
    writes++;return reply({},409);
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url+'/');
   await storage(page,owner,fixture);
   await login(page,owner);
   await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('up to date'));
   await page.evaluate(()=>switchView('closet'));
   await page.locator('.closet-backup summary').click();
   const download=page.waitForEvent('download',{timeout:5000}).catch(()=>null);
   await page.locator('#export').click();
   const file=await download;
   assert.ok(file,await page.locator('#message').textContent());
   const backup=JSON.parse(await readFile(await file.path(),'utf8'));
   assert.equal(hash(Buffer.from(backup.items[0].originalPhoto.image.split(',')[1],'base64')),sha);
   assert.equal(backup.outfitBoard.saved[0].slots.top,'shirt');
   const corrupt={items:[row,{...row,id:'bad',name:{broken:true},image:damagedImage,
    originalPhoto:{image:damagedImage,sha256:hash(damagedBytes)},sourceSHA256:hash(damagedBytes)}],state:fixture.state};
   const before=await storage(page,owner,corrupt);
   let downloads=0,confirmations=0;
   page.on('download',()=>downloads++);
   let consent=false;
   page.on('dialog',dialog=>{
    if(dialog.type()==='beforeunload')return dialog.accept();
    confirmations++;
    return consent?dialog.accept():dialog.dismiss();
   });
   await page.locator('#export').click();
   await page.waitForFunction(()=>/download|backup/i.test(document.getElementById('message').textContent));
   await page.locator('#import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
   await page.waitForTimeout(500);
   revision=2;
   await page.evaluate(()=>window.closetCloud.sync());
   const after=await storage(page,owner);
   const red={exported:downloads>0,askedToImport:confirmations>0,overwritten:JSON.stringify(after)!==JSON.stringify(before)};
   console.log(engine,'late corruption',JSON.stringify(red));
   results.push({engine,...red});
   if(!red.exported&&!red.askedToImport&&!red.overwritten){
    const dirty={...corrupt,state:[{...marker,dirty:true},...fixture.state.slice(1)]};
    const dirtyBefore=await storage(page,owner,dirty);
    const priorReads=reads;
    await page.evaluate(()=>window.closetCloud.sync({retryPaused:true}));
    assert.equal(reads,priorReads);
    assert.deepEqual(await storage(page,owner),dirtyBefore);
    assert.match(await page.locator('#cloudStatus').textContent(),/recovery required/i);
   }
   const mixed={items:[row,{...row,id:'foreign',ownerId:other,name:'Foreign row'}],
    state:[marker,{...board,saved:[{name:'Damaged',slots:{top:'missing'}}]},
     {id:'draft',batch:[null,42,{...row,name:'Duplicate shirt',id:'duplicate'},{...row,id:'duplicate'}]}]};
   const mixedBefore=await storage(page,owner,mixed);
   await Promise.all([page.waitForNavigation(),page.evaluate(()=>document.getElementById('logout').click())]);
   await login(page,owner);
   await page.evaluate(()=>switchView('closet'));
   const recoveryVisible=await page.locator('#closetGrid').getByText('Private blue shirt',{exact:true}).isVisible();
   results.at(-1).recoveryHidden=!recoveryVisible;
   console.log(engine,'recovery projection',JSON.stringify({visible:recoveryVisible}));
   assert.equal(await page.locator('#closetGrid').getByText('Foreign row').count(),0);
   const visible=await page.locator('#closetGrid img').getAttribute('src');
   assert.equal(hash(Buffer.from(visible.split(',')[1],'base64')),sha);
   assert.deepEqual(await storage(page,owner),mixedBefore);
   await Promise.all([page.waitForNavigation(),page.evaluate(()=>document.getElementById('logout').click())]);
   await login(page,other);
   assert.equal(await page.evaluate(()=>items.length),0);
   assert.deepEqual(await storage(page,owner),mixedBefore);
   await page.locator('#import').setInputFiles({name:'foreign.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(backup))});
   await page.waitForFunction(()=>/owner/i.test(document.getElementById('message').textContent));
   assert.equal((await storage(page,other)).items.length,0);
   assert.equal(writes,0);
   assert.deepEqual(errors,[]);
   console.log(engine,'startup isolation and signed owner switch passed',JSON.stringify({reads,blocked}));
   if(red.exported||red.askedToImport||red.overwritten||!recoveryVisible)continue;
   // Separately authorized synthetic recovery outside the application. The
   // application never removes the damaged records or invents repair data.
   revision=1;
   const orphaned={...fixture,state:[marker,{...board,saved:[{name:'Orphaned',slots:{top:'missing'}}]},fixture.state[2]]};
   const orphanedBefore=await storage(page,owner,orphaned);
   await Promise.all([page.waitForNavigation(),page.evaluate(()=>document.getElementById('logout').click())]);
   await login(page,owner);
   await page.evaluate(()=>switchView('closet'));
   assert.ok(await page.locator('#closetGrid').getByText('Private blue shirt',{exact:true}).isVisible());
   assert.equal(await page.locator('#export').isEnabled(),false);
   assert.equal(await page.locator('#clothingPhotos').isEnabled(),false);
   assert.equal(await page.evaluate(()=>db===null&&automaticQueue.length===0),true);
   assert.deepEqual(await storage(page,owner),orphanedBefore);
   await storage(page,owner,fixture);
   await Promise.all([page.waitForNavigation(),page.evaluate(()=>document.getElementById('logout').click())]);
   await login(page,owner);
   await page.evaluate(()=>switchView('closet'));
   assert.equal(await page.locator('#export').isEnabled(),true);
   consent=true;
   await page.locator('#import').setInputFiles({name:'owner.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(backup))});
   await page.waitForFunction(()=>/Backup imported atomically/.test(document.getElementById('message').textContent));
   const recovered=await storage(page,owner);
   assert.equal(hash(Buffer.from(recovered.items[0].originalPhoto.image.split(',')[1],'base64')),sha);
   assert.equal(recovered.state.find(r=>r.id==='outfit-board').saved[0].slots.top,'shirt');
   console.log(engine,'authorized synthetic recovery and same-owner import passed',sha);
  }finally{await browser.close();}
 }
 assert.ok(results.length);
 assert.ok(results.every(x=>!x.exported&&!x.askedToImport&&!x.overwritten&&!x.recoveryHidden),JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
