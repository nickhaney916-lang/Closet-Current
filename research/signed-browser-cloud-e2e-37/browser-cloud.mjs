/**
 * SIGNED-BROWSER-CLOUD-E2E-37. Disposable Supabase only.
 * Real auth.js + native reviewed garment UI + IndexedDB + cloud-backup.js.
 * No hosted HTTP is sent: a Playwright routing proxy forwards every hosted
 * Supabase-shaped request to the same loopback local server and preserves its
 * real response. It swaps the publicly embedded hosted publishable key for
 * the disposable server's publishable/anon key, never an authorization JWT.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const ROOT=resolve('.');
const OUT=resolve('benchmark/signed-browser-cloud-e2e-37');
await mkdir(OUT,{recursive:true});
const env=Object.fromEntries((await readFile(process.env.SUPABASE_TEST_ENV,'utf8')).split('\n')
 .filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')];}));
const api=new URL(env.API_URL);
assert.ok(['localhost','127.0.0.1'].includes(api.hostname)&&api.protocol==='http:'&&api.port,'REQUIRE disposable local API');
const KEY=env.ANON_KEY||env.PUBLISHABLE_KEY;
assert.ok(KEY,'Local public key required');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const HOST='https://hlkgymugtfbirlpunsra.supabase.co';
const BLOCKED=[];
const observations=[];
const cases=[];
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.bin':'application/octet-stream','.jpg':'image/jpeg','.png':'image/png'};
const staticServer=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(req.method!=='GET'||!/^\/(public|research)\//.test(path)||path.includes('..')||path.includes('\\'))throw Error('Blocked static path');
  const filepath=resolve(ROOT,'.'+path);
  if(!filepath.startsWith(ROOT+'/'))throw Error('Root escape');
  const buffer=await readFile(filepath);
  res.writeHead(200,{'content-type':TYPES[extname(filepath)]||'application/octet-stream','cache-control':'no-store'});
  res.end(buffer);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>staticServer.listen(0,'127.0.0.1',ok));
const ORIGIN='http://127.0.0.1:'+staticServer.address().port;
const URL=ORIGIN+'/public/index.html?multi24=research&captureProof01=after&index04=after&nativeIndex07=research&nativeLossless04=research&index02=after';
let currentCase='initial';
async function jsonRequest(path,token,method='GET',body){
 const headers={apikey:KEY,...(token?{authorization:'Bearer '+token}:{})};
 if(body!==undefined)headers['content-type']=Buffer.isBuffer(body)?'image/jpeg':'application/json';
 if(['PATCH','DELETE'].includes(method))headers.prefer='return=representation';
 const response=await fetch(new URL(path,api),{method,headers,body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),signal:AbortSignal.timeout(18000),redirect:'error'});
 const bytes=Buffer.from(await response.arrayBuffer());
 let data=null;try{data=JSON.parse(bytes.toString('utf8'));}catch{}
 return {status:response.status,ok:response.ok,bytes,data};
}
async function createAccount(mark){
 const email='browser37-'+mark+'-'+randomUUID()+'@example.test';
 const password=randomBytes(23).toString('hex');
 const signup=await jsonRequest('/auth/v1/signup',null,'POST',{email,password});
 assert.ok(signup.ok,'Local Supabase signup must succeed ('+signup.status+')');
 const login=await jsonRequest('/auth/v1/token?grant_type=password',null,'POST',{email,password});
 assert.ok(login.ok&&login.data?.user?.id&&login.data?.access_token,'Local signed password login required');
 const verify=await jsonRequest('/auth/v1/user',login.data.access_token);
 assert.ok(verify.ok&&verify.data.id===login.data.user.id);
 return {email,password,id:login.data.user.id};
}
async function createPhotos(mark){
 const colors=mark==='a'?['#ca3c3c','#2e5c9e','#4e813f']:['#a54cb7','#e2aa22','#318a91'];
 const pieces=colors.map((c,i)=>{
  const x=30+i*300;
  return '<rect x="'+x+'" y="65" width="240" height="330" rx="17" fill="'+c+'" />'+
    '<path d="M'+(x+35)+' 90 L'+(x+205)+' 90" stroke="#efefef" stroke-width="7"/>';
 }).join('');
 const svg=Buffer.from('<svg width="900" height="480" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="480" fill="#e5e6e7"/>'+pieces+'</svg>');
 const bytes=await sharp(svg).jpeg({quality:91}).toBuffer();
 return {bytes,sha:sha(bytes),data:'data:image/jpeg;base64,'+bytes.toString('base64')};
}
function wire(ctx,tag){
 let inFlight=0;
 const hits=[];
 ctx.route('**/*',async route=>{
  const req=route.request(),u=req.url();
  if(u.startsWith(ORIGIN+'/')||u.startsWith('data:')||u.startsWith('blob:'))return route.continue();
  if(u.startsWith(HOST+'/')&&/^\/(auth|storage|rest)\/v1\//.test(new URL(u).pathname)){
   const url=new URL(u),target=new URL(url.pathname+url.search,api);
   assert.equal(target.hostname,api.hostname);
   const headers={...req.headers(),apikey:KEY};
   delete headers.host;
   inFlight++;
   try{
    const actual=await route.fetch({url:target.href,headers,timeout:20000,maxRedirects:0});
    hits.push({path:url.pathname,method:req.method(),status:actual.status()});
    await route.fulfill({response:actual,headers:{...actual.headers(),
     'access-control-allow-origin':'*',
     'access-control-allow-headers':'authorization,apikey,content-type,x-client-info,prefer,accept',
     'access-control-allow-methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS'}});
   }catch(e){BLOCKED.push({tag,kind:'local-backend-route-error',path:url.pathname});await route.abort().catch(()=>{});}
   finally{inFlight--;}
   return;
  }
  // Asset CDNs and outside connections are forbidden; model is deliberately
  // disabled, but still must fail closed rather than exfiltrate photo bytes.
  if(req.method()!=='GET')BLOCKED.push({tag,kind:'external-write',method:req.method()});
  return route.abort();
 });
 return {hits,pending:()=>inFlight};
}
async function loggedIn(page,account){
 await page.locator('#authEmail').fill(account.email);
 await page.locator('#authPassword').fill(account.password);
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
   db?.name==='closet-current-user-'+id&&window.multi24Research?.active===true,account.id,{timeout:30000});
 const identity=await page.evaluate(async()=>({
  id:window.closetAuth.user.id,
  db:db.name,
  token:await window.closetAuth.getAccessToken()
 }));
 assert.equal(identity.id,account.id);
 assert.equal(identity.db,'closet-current-user-'+account.id);
 assert.match(identity.token,/^[\w-]+\.[\w-]+\.[\w-]+$/);
 const checked=await jsonRequest('/auth/v1/user',identity.token);
 assert.equal(checked.data?.id,account.id);
 return identity.token;
}
async function rows(page){
 return page.evaluate(()=>new Promise((ok,fail)=>{
  const req=db.transaction('items').objectStore('items').getAll();
  req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error);
 }));
}
async function chooseSource(page,photo,tag){
 await page.evaluate(()=>switchView('scan'));
 await page.locator('#captureOutfit').click();
 await page.locator('#outfitUpload').setInputFiles({name:'synthetic-'+tag+'.jpg',mimeType:'image/jpeg',buffer:photo.bytes});
 await page.waitForFunction(d=>window.multi24Research?.debug().sourceSHA256===d,photo.sha,{timeout:35000});
}
async function markPiece(page,n,owner){
 await page.getByRole('button',{name:'Add missed piece'}).click();
 const card=page.locator('#multi24Research article.multi24-card').last();
 await card.getByRole('button',{name:'Adjust crop/mask'}).click();
 const dialog=page.locator('dialog.photo-crop-editor');
 await dialog.waitFor({state:'visible',timeout:15000});
 // Actual crop-editor keyboard handler, three disjoint human-marked regions.
 // Start from its whole-image rectangle; shrink each by arrow-key corner edits.
 await page.evaluate(n=>{
  const dialog=document.querySelector('dialog.photo-crop-editor');
  const nw=dialog.querySelector('.crop-handle.nw'),se=dialog.querySelector('.crop-handle.se');
  const key=(target,name,times)=>{for(let i=0;i<times;i++)target.dispatchEvent(
   new KeyboardEvent('keydown',{key:name,shiftKey:true,bubbles:true,cancelable:true}));};
  key(nw,'ArrowRight',[1,8,15][n]);key(nw,'ArrowDown',1);
  key(se,'ArrowLeft',[14,7,0][n]);key(se,'ArrowUp',2);
 },n);
 await dialog.getByRole('button',{name:'Save crop'}).click();
 await dialog.waitFor({state:'hidden',timeout:15000});
 const selected=page.locator('#multi24Research article.multi24-card').last();
 const cat=['Tops','Bottoms','Shoes'][n],sub=['T-shirt','Jeans','Sneakers'][n];
 await selected.getByLabel('Main category').selectOption(cat);
 await selected.getByLabel('Specific type').selectOption(sub);
 await selected.getByLabel('Color (confirm visually)').fill((owner==='a'?['Red','Blue','Green']:['Purple','Yellow','Teal'])[n]);
 await selected.getByLabel('I confirm this visible garment, category and color').check();
}
async function confirmedSave(page,photo,owner){
 await chooseSource(page,photo,owner);
 for(let n=0;n<3;n++)await markPiece(page,n,owner);
 assert.equal(await page.locator('#multi24Research input[type="checkbox"]:checked').count(),3);
 await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
 await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('3 separately confirmed garments saved together'),null,{timeout:35000});
 const saved=await rows(page);
 assert.equal(saved.length,3);
 assert.equal(new Set(saved.map(x=>x.sourcePieceKey)).size,3);
 assert.equal(new Set(saved.map(x=>x.id)).size,3);
 for(let n=0;n<3;n++){
  const x=saved.find(x=>x.category===['Tops','Bottoms','Shoes'][n]);
  assert.ok(x,'One confirmed garment of each selected category');
  assert.equal(x.itemType,['T-shirt','Jeans','Sneakers'][n]);
  assert.equal(x.ownerId,await page.evaluate(()=>window.closetAuth.user.id));
  assert.equal(x.sourceSHA256,photo.sha);
  assert.equal(x.originalPhoto.sha256,photo.sha);
  assert.equal(x.originalPhoto.image,photo.data);
  assert.equal(x.extractionReview,'human-confirmed');
  assert.equal(x.singleGarmentVerified,false);
  assert.equal(x.threeDReady,false);
 }
 return saved;
}
async function serverBackup(account,token,photo){
 const response=await jsonRequest('/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+account.id,token);
 if(!response.ok||!Array.isArray(response.data)||response.data.length!==1)return null;
 const backup=response.data[0],items=backup.document?.items;
 if(!Array.isArray(items)||items.length!==3)return null;
 assert.ok(backup.revision>=1);
 assert.ok(items.every(x=>x.ownerId===account.id&&x.originalPhoto?.sha256===photo.sha));
 const paths=new Set();
 for(const item of items){
  for(const path of [item.originalPhoto.image,item.image,item.recognitionPhoto?.image]){
   assert.match(path,/^closet-photo:[a-f0-9-]{36}\/[a-f0-9]{64}\.jpg$/);
   assert.ok(path.startsWith('closet-photo:'+account.id+'/'));
   paths.add(path.slice('closet-photo:'.length));
  }
 }
 assert.ok(paths.size>=2,'Both original and derived cropped photos persisted');
 for(const path of paths){
  const file=await jsonRequest('/storage/v1/object/closet-private/'+path,token);
  assert.ok(file.ok,'Storage object must actually exist');
  assert.equal(sha(file.bytes),path.split('/')[1].slice(0,-4));
  if(path.endsWith('/'+photo.sha+'.jpg'))assert.ok(file.bytes.equals(photo.bytes),'Original JPEG exact byte identity');
 }
 return {revision:backup.revision,document:backup.document,photoPaths:[...paths],originalVerified:true};
}
async function waitCloud(account,token,photo){
 let last=null;
 for(let i=0;i<65;i++){
  last=await serverBackup(account,token,photo);
  if(last)return last;
  await sleep(450);
 }
 throw Error('Cloud backup was never confirmed server-side for the signed browser account');
}
async function screenshot(page,engine,width,stage){
 const bytes=await page.screenshot({animations:'disabled',fullPage:true});
 const file=engine+'-'+width+'-'+stage+'.png';
 await writeFile(OUT+'/'+file,bytes);
 const meta=await sharp(bytes).metadata(),stat=await sharp(bytes).stats();
 assert.equal(meta.format,'png');assert.equal(meta.width,width);
 assert.ok(meta.height>=560&&bytes.length>5000&&stat.channels.some(x=>x.stdev>5));
 return {file,sha256:sha(bytes),bytes:bytes.length,width,height:meta.height};
}
async function hostileCheck(actor,victim,token,victimToken,privatePath){
 const attacks=[];
 const attempt=async(name,path,method='GET',body)=>{
  const res=await jsonRequest(path,token,method,body);
  attacks.push({name,status:res.status});
  return res;
 };
 const base='/rest/v1/closet_backups?owner_id=eq.'+victim.id;
 const read=await attempt('foreign backup SELECT',base);
 assert.ok(read.ok&&Array.isArray(read.data)&&read.data.length===0);
 const update=await attempt('foreign backup UPDATE',base,'PATCH',{document:{schemaVersion:1,items:[],state:{}}});
 assert.ok([401,403].includes(update.status)||update.ok&&Array.isArray(update.data)&&update.data.length===0);
 const del=await attempt('foreign backup DELETE',base,'DELETE');
 assert.ok([401,403].includes(del.status)||del.ok&&Array.isArray(del.data)&&del.data.length===0);
 const create=await attempt('forged owner INSERT','/rest/v1/closet_backups','POST',{owner_id:victim.id,revision:1,document:{schemaVersion:1,items:[],state:{}}});
 assert.ok([400,401,403,409].includes(create.status));
 const list=await attempt('foreign photo LIST','/storage/v1/object/list/closet-private','POST',{prefix:victim.id});
 assert.ok(list.ok&&Array.isArray(list.data)&&list.data.length===0);
 for(const method of ['GET','PUT','DELETE']){
  const r=await attempt('foreign photo '+method,'/storage/v1/object/closet-private/'+privatePath,method,method==='PUT'?Buffer.from('unauthorized'):undefined);
  assert.ok([400,401,403,404].includes(r.status)||method==='DELETE'&&r.ok&&Array.isArray(r.data)&&r.data.length===0);
 }
 const sign=await attempt('foreign signed URL','/storage/v1/object/sign/closet-private/'+privatePath,'POST',{expiresIn:60});
 assert.ok([400,401,403,404].includes(sign.status));
 const spoof=await attempt('foreign prefix upload','/storage/v1/object/closet-private/'+victim.id+'/spoof.jpg','POST',Buffer.from('fake'));
 assert.ok([400,401,403,404].includes(spoof.status));
 const jwt=await attempt('tampered bearer','/rest/v1/closet_backups?select=revision', 'GET');
 const tampered=await jsonRequest('/rest/v1/closet_backups?select=revision',token.slice(0,-8)+'tampered');
 assert.equal(tampered.status,401);
 const own=await jsonRequest('/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+victim.id,victimToken);
 assert.ok(own.ok&&own.data.length===1&&own.data[0].document.items.length===3,'Attacks never changed victim data');
 return attacks;
}
async function signOut(page){
 await page.evaluate(()=>document.getElementById('logout').click());
 await page.waitForFunction(()=>window.closetAuth?.user===null&&document.getElementById('appShell').hidden,null,{timeout:4500});
 await page.locator('#authSubmit').waitFor({state:'visible',timeout:20000});
}
async function recover(browser,engine,width,account,photo,tag,wireStats){
 const context=await browser.newContext({viewport:{width,height:940},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 wireStats.push(wire(context,tag));
 const page=await context.newPage();
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 const before=await page.evaluate(()=>new Promise((ok,fail)=>{
  const r=indexedDB.open('closet-current-user-'+window.closetAuth?.user?.id);
  // No account is authenticated yet: this new context contains no owner DB.
  ok(window.closetAuth?.user===null);
 }));
 assert.equal(before,true,'New context must begin signed out');
 const token=await loggedIn(page,account);
 await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date'&&window.closetAuth?.user?.id,null,{timeout:35000});
 await page.waitForFunction(()=>items?.length===3,null,{timeout:30000});
 const saved=await rows(page);
 assert.equal(saved.length,3);
 assert.equal(new Set(saved.map(x=>x.sourcePieceKey)).size,3);
 assert.ok(saved.every(x=>x.ownerId===account.id&&x.originalPhoto?.image===photo.data&&x.originalPhoto.sha256===photo.sha));
 const remote=await serverBackup(account,token,photo);
 assert.ok(remote,'Fresh browser recovery requires actual verified local cloud backup');
 return {context,page,token,saved};
}
try{
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();
  try{
   for(const width of [320,390,430]){
    currentCase=engine+'-'+width;
    const stats=[],shots=[],errorEvents=[];
    const accountA=await createAccount('a');
    const accountB=await createAccount('b');
    assert.notEqual(accountA.id,accountB.id);
    const photoA=await createPhotos('a'),photoB=await createPhotos('b');
    assert.notEqual(photoA.sha,photoB.sha);
    const context=await browser.newContext({viewport:{width,height:940},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    stats.push(wire(context,currentCase));
    const page=await context.newPage();
    page.on('pageerror',e=>errorEvents.push(e.message.slice(0,140)));
    await page.goto(URL,{waitUntil:'domcontentloaded'});
    await page.locator('#authEmail').fill(accountA.email);
    await page.locator('#authPassword').fill('invalid-credential');
    await page.locator('#authSubmit').click();
    await page.waitForFunction(()=>document.getElementById('authStatus')?.textContent.includes('incorrect'),null,{timeout:16000});
    assert.equal(await page.evaluate(()=>window.closetAuth.user),null);
    const tokenA=await loggedIn(page,accountA);
    shots.push(await screenshot(page,engine,width,'01-a-auth'));
    await chooseSource(page,photoA,'a');
    shots.push(await screenshot(page,engine,width,'02-a-original'));
    for(let n=0;n<3;n++)await markPiece(page,n,'a');
    assert.equal((await rows(page)).length,0,'Uncommitted pieces must not persist');
    await page.getByRole('button',{name:'Save confirmed pieces together'}).click();
    await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('3 separately confirmed garments saved together'),null,{timeout:30000});
    const aRows=await rows(page);
    assert.equal(aRows.length,3);
    assert.ok(aRows.every(x=>x.ownerId===accountA.id&&x.originalPhoto.image===photoA.data));
    shots.push(await screenshot(page,engine,width,'03-a-saved'));
    const cloudA=await waitCloud(accountA,tokenA,photoA);
    shots.push(await screenshot(page,engine,width,'04-a-cloud'));
    const stale=await context.newPage();
    stale.on('pageerror',e=>errorEvents.push(e.message.slice(0,140)));
    await stale.goto(URL,{waitUntil:'domcontentloaded'});
    await stale.waitForFunction(id=>window.closetAuth?.user?.id===id&&window.multi24Research?.active===true,accountA.id,{timeout:25000});
    await chooseSource(stale,photoB,'unfinished-b');
    await page.evaluate(()=>document.getElementById('logout').click());
    await stale.waitForFunction(()=>window.closetAuth?.user===null&&db===null&&
      document.getElementById('appShell').hidden&&document.querySelectorAll('#multi24Grid article').length===0,null,{timeout:4000});
    shots.push(await screenshot(stale,engine,width,'05-locked-tab'));
    await page.locator('#authSubmit').waitFor({state:'visible',timeout:20000});
    const tokenB=await loggedIn(page,accountB);
    assert.deepEqual(await rows(page),[],'B local IndexedDB starts empty');
    const noA=await jsonRequest('/rest/v1/closet_backups?owner_id=eq.'+accountA.id,tokenB);
    assert.ok(noA.ok&&noA.data.length===0);
    shots.push(await screenshot(page,engine,width,'06-b-empty'));
    const bRows=await confirmedSave(page,photoB,'b');
    assert.ok(bRows.every(x=>x.ownerId===accountB.id&&x.sourceSHA256===photoB.sha));
    shots.push(await screenshot(page,engine,width,'07-b-saved'));
    const cloudB=await waitCloud(accountB,tokenB,photoB);
    const denialsBA=await hostileCheck(accountB,accountA,tokenB,tokenA,cloudA.photoPaths[0]);
    const denialsAB=await hostileCheck(accountA,accountB,tokenA,tokenB,cloudB.photoPaths[0]);
    shots.push(await screenshot(page,engine,width,'08-b-cloud-private'));
    await signOut(page);
    const aRestored=await recover(browser,engine,width,accountA,photoA,currentCase+'-recover-a',stats);
    shots.push(await screenshot(aRestored.page,engine,width,'09-a-cloud-recovered'));
    const bRestored=await recover(browser,engine,width,accountB,photoB,currentCase+'-recover-b',stats);
    shots.push(await screenshot(bRestored.page,engine,width,'10-b-cloud-recovered'));
    const freshA=aRestored.saved,freshB=bRestored.saved;
    assert.ok(!freshA.some(x=>x.ownerId===accountB.id||x.sourceSHA256===photoB.sha));
    assert.ok(!freshB.some(x=>x.ownerId===accountA.id||x.sourceSHA256===photoA.sha));
    const transport=stats.flatMap(s=>s.hits);
    assert.ok(transport.some(x=>x.path==='/auth/v1/token'&&x.status===200));
    assert.ok(transport.some(x=>x.path.startsWith('/storage/v1/object/closet-private/')&&x.method==='POST'&&[200,201].includes(x.status)));
    assert.ok(transport.some(x=>x.path==='/rest/v1/rpc/save_closet_backup'&&x.method==='POST'&&x.status===200));
    assert.deepEqual(errorEvents,[],'No actual browser errors');
    cases.push({engine,width,accountIdsDistinct:true,realServerAuth:true,
     ownerAIdHash:sha(Buffer.from(accountA.id)).slice(0,16),
     ownerBIdHash:sha(Buffer.from(accountB.id)).slice(0,16),
     sourceA:photoA.sha,sourceB:photoB.sha,localSavedA:3,localSavedB:3,
     cloudRevisionA:cloudA.revision,cloudRevisionB:cloudB.revision,
     ownerDeniedCrossAccessBothDirections:denialsAB.length>=9&&denialsBA.length>=9,
     originalJPEGVerified:true,freshRecoveryA:3,freshRecoveryB:3,
     transport:{auth:transport.filter(x=>x.path.startsWith('/auth/')).length,
                storage:transport.filter(x=>x.path.startsWith('/storage/')).length,
                rest:transport.filter(x=>x.path.startsWith('/rest/')).length},
     screenshots:shots});
    await aRestored.context.close();await bRestored.context.close();
    await context.close();
    currentCase='completed '+engine+' '+width;
  }
 }finally{await browser.close();}
 }
 assert.equal(cases.length,6);
 assert.equal(BLOCKED.length,0,'Unexpected backend route failure or external photo write');
 const screenshots=cases.flatMap(x=>x.screenshots);
 assert.equal(screenshots.length,60);
 const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const report={priority:'SIGNED-BROWSER-CLOUD-E2E-37',head,parent:'77d5c760c847d6e2f544512e80fd8598fd610dad',
  realSignedBrowserToCloud:true,distinctAuthenticatedOwners:true,localSupabaseOnly:true,
  authResponsesFabricated:false,cloudAdapterStubbed:false,originalBytesVerified:true,
  segmentationModelRun:false,physicalDevicesTested:false,
  FamilyAlpha:'HOLD',productionTouched:false,stagingTouched:false,
  browserCases:6,screenshots:60,externalWritesBlocked:BLOCKED,
  limitations:['Local Supabase policies only, not hosted security','Manual crop fixtures, not automatic segmentation quality','Mobile browser engines, not physical phones'],
  cases};
 await writeFile(OUT+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('SIGNED37 verified 6 signed Chromium/WebKit browser-to-Supabase cases, 60 PNGs, owner RLS, original JPEG, fresh account recovery');
}catch(error){
 console.error('SIGNED37 NEEDS REWORK at '+currentCase+': '+String(error?.message||error).slice(0,700));
 throw error;
}finally{await new Promise(ok=>staticServer.close(ok));}
