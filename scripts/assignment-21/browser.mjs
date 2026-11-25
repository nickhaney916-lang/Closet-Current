import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium, webkit } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { endpoint, key, request, json } from './local-http.mjs';

const root = resolve('dist');
const mime = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const assetSources = {
 'auth.js': {url:'URL', key:'KEY'},
 'cloud-backup.js': {url:'BASE', key:'KEY'}
};
const errors = [];
const server = createServer(async (req, res) => {
 try {
  assert.equal(req.method, 'GET');
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (pathname === '/fixture-bootstrap') {
   res.writeHead(200, {'content-type':'text/html'}).end('<!doctype html><title>Fixture bootstrap</title>');
   return;
  }
  const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
  const path = resolve(root, filename);
  assert.ok(path.startsWith(root + sep));
  let bytes = await readFile(path);
  if (Object.hasOwn(assetSources, filename)) {
   const binding = assetSources[filename];
   let source = bytes.toString();
   for (const [name, replacement] of [[binding.url, endpoint.origin], [binding.key, key]]) {
    const expression = new RegExp('\\b' + name + "='[^']+'");
    assert.match(source, expression);
    const assignment = name + '=' + JSON.stringify(replacement);
    source = source.replace(expression, () => assignment);
   }
   bytes = Buffer.from(source);
  }
  res.writeHead(200, {'content-type':mime[extname(path)] || 'application/octet-stream','cache-control':'no-store'}).end(bytes);
 } catch (error) {
  if (error.code !== 'ENOENT') errors.push('Failed local asset dispatch');
  res.writeHead(404).end();
 }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;

const table = '/rest/v1/closet_backups';
const storage = '/storage/v1/object/closet-private/';
const rpc = '/rest/v1/rpc/save_closet_backup';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = [];

async function owner() {
 const email = 'scale-' + randomUUID() + '@example.test', password = randomBytes(18).toString('hex');
 const signed = await request('/auth/v1/signup',null,'POST',{email,password});
 assert.ok(signed.ok,'Local signup failed');
 return {email,password,id:json(signed).user.id};
}

async function token(account) {
 const response = await request('/auth/v1/token?grant_type=password',null,'POST',{email:account.email,password:account.password});
 assert.ok(response.ok,'Local login failed');
 return json(response).access_token;
}

async function remote(account) {
 const response = await request(table+'?owner_id=eq.'+account.id,await token(account));
 assert.ok(response.ok,'Independent backup read failed');
 return json(response)[0];
}

async function fixtures(account,total) {
 const records = [], objects = new Map();
 for(let i=0;i<total;i++){
  const high=i===0||i===total-1, width=high?2560:i%25===0?768:144, height=high?1920:i%25===0?576:192;
  let state=0x243f6a88+i;
  const rgb=Buffer.alloc(width*height*3);
  for(let j=0;j<rgb.length;j++){
   state=(Math.imul(state,1664525)+1013904223)>>>0;
   rgb[j]=high?(state>>>26)+((j/width/3|0)%192):state>>>24;
  }
  // Two garment records can share one original receipt without duplicating the object.
  const jpeg=i===2?objects.values().next().value:
   await sharp(rgb,{raw:{width,height,channels:3}}).jpeg({quality:82}).toBuffer();
  const sha=hash(jpeg),image='data:image/jpeg;base64,'+jpeg.toString('base64');
  objects.set(sha,jpeg);
  records.push({id:'fixture-'+i,ownerId:account.id,name:'Synthetic shirt '+i,category:'Tops',
   itemType:'T-shirt',color:'Blue',image,originalPhoto:{image,sha256:sha},sourceSHA256:sha,
   sourceHashVerified:true,sourcePhotoOriginal:true,ownerReviewed:true,userAdjusted:true,singleGarmentVerified:true});
 }
 return {records,objects};
}

async function writeWardrobe(page,account,records,outfits) {
 const board={id:'outfit-board',current:outfits[0],saved:outfits};
 await page.evaluate(async ({id,rows,board})=>{
  const db=await new Promise((resolve,reject)=>{
   const open=indexedDB.open('closet-current-user-'+id,2);
   open.onupgradeneeded=()=>{
    open.result.createObjectStore('items',{keyPath:'id'});
    open.result.createObjectStore('state',{keyPath:'id'});
   };
   open.onsuccess=()=>resolve(open.result);
   open.onerror=()=>reject(open.error);
  });
  try{
   await new Promise((resolve,reject)=>{
    const tx=db.transaction(['items','state'],'readwrite'),items=tx.objectStore('items'),state=tx.objectStore('state');
    for(const row of rows)items.put(row);
    state.put(board);
    const read=state.get('cloud-sync');
    read.onsuccess=()=>{
     const prior=read.result||{baseVersion:0,baseDocument:null,localRevision:0};
     state.put({...prior,id:'cloud-sync',dirty:true,localRevision:prior.localRevision+1});
    };
    tx.oncomplete=resolve;
    tx.onerror=tx.onabort=()=>reject(Error('Fixture transaction failed'));
   });
  } finally{db.close();}
 },{id:account.id,rows:records,board});
}

async function waitBackup(page){
 await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date',null,{timeout:150000});
}

async function login(page,account){
 await page.goto(origin+'/index.html');
 await page.locator('#authEmail').fill(account.email);
 await page.locator('#authPassword').fill(account.password);
 await page.locator('#authSubmit').tap();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&db?.name==='closet-current-user-'+id,account.id);
}

async function verifyRestored(page,account,rows,outfits,revision){
 const expected=rows.map(row=>[row.id,row.name,row.sourceSHA256]);
 const result=await page.evaluate(async ({ownerId,expected,outfits,revision})=>{
  const transaction=db.transaction(['items','state']),state=transaction.objectStore('state');
  const read=operation=>new Promise((resolve,reject)=>{
   operation.onsuccess=()=>resolve(operation.result);
   operation.onerror=()=>reject(operation.error);
  });
  const [rows,board,marker]=await Promise.all([read(transaction.objectStore('items').getAll()),
   read(state.get('outfit-board')),read(state.get('cloud-sync'))]);
  if(rows.length!==expected.length||board.saved.length!==outfits.length||marker.baseVersion!==revision||marker.dirty)return false;
  const map=new Map(rows.map(row=>[row.id,row]));
  for(const [id,name,digest] of expected){
   const row=map.get(id);
   if(!row||row.ownerId!==ownerId||row.name!==name||row.category!=='Tops'||row.itemType!=='T-shirt'||
      row.color!=='Blue'||row.originalPhoto?.sha256!==digest||row.sourceSHA256!==digest)return false;
   const data=Uint8Array.from(atob(row.originalPhoto.image.split(',')[1]),c=>c.charCodeAt(0));
   const actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');
   if(actual!==digest)return false;
  }
  return outfits.every((outfit,i)=>board.saved[i].name===outfit.name&&board.saved[i].slots.top===outfit.slots.top);
 },{ownerId:account.id,expected,outfits,revision});
 assert.ok(result,'Restored wardrobe differs from original receipts');
 await page.locator('#moreMenu summary').tap();
 await page.locator('#moreMenu button[data-view=builder]').tap();
 await page.locator('#savedBoards').getByText(outfits[0].name,{exact:true}).waitFor();
}

async function boundary() {
 const account=await owner(),bearer=await token(account);
 const make=size=>({schemaVersion:1,items:[],state:{padding:'x'.repeat(size)}});
 const under=make(5242880-1024),over=make(5242880+1024);
 const save=(revision,document)=>request(rpc,bearer,'POST',{p_expected_revision:revision,p_document:document});
 const first=await save(0,under);
 assert.ok(first.ok&&json(first)===1,'Below-limit RPC failed');
 const second=await save(1,over);
 assert.ok(!second.ok,'Above-limit RPC unexpectedly succeeded');
 const last=await remote(account);
 assert.ok(last.revision===1&&last.document.state.padding.length===under.state.padding.length,'Oversized RPC changed last-good backup');
 return {acceptedJsonBytes:Buffer.byteLength(JSON.stringify(under)),rejectedJsonBytes:Buffer.byteLength(JSON.stringify(over)),rejectedStatus:second.status};
}

async function exercise(browser,engine,width,total){
 const account=await owner(),outsider=await owner();
 const {records,objects}=await fixtures(account,total);
 const count=total===25?10:total===100?25:50;
 const outfits=Array.from({length:count},(_,i)=>({name:'Fixture outfit '+i,slots:{top:records[i].id}}));
 const seedOutfits=[outfits[0]], tallies={posts:0,gets:0,rpcs:0,peakPhotoRequests:0};
 let activePhotos=0,fault=null,captured=false,requestsAtFault=0,stage='bootstrap';
 const tracked=new Set(),marks={};
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const createPage=async ctx=>{
  const page=await ctx.newPage();
  page.setDefaultTimeout(45000);
  const settle=req=>{if(tracked.delete(req))activePhotos--;};
  page.on('requestfinished',settle);
  page.on('requestfailed',settle);
  await page.route('**/*',async route=>{
   const req=route.request(),target=new URL(req.url());
   if(target.origin===origin)return route.continue();
   if(target.origin!==endpoint.origin)return route.abort();
   const photo=target.pathname.startsWith(storage),post=req.method()==='POST',save=target.pathname===rpc&&post;
   if(photo){
    assert.ok(target.pathname.startsWith(storage+account.id+'/'),'Unexpected owner storage prefix');
    tracked.add(req);activePhotos++;
    tallies.peakPhotoRequests=Math.max(activePhotos,tallies.peakPhotoRequests);
    if(post)tallies.posts++;else tallies.gets++;
   }
   if(save)tallies.rpcs++;
   if(fault&&!captured&&((fault.afterPosts!==undefined&&photo&&post&&tallies.posts>=fault.afterPosts)||
      (fault.afterPosts===undefined&&save))){
    captured=true;requestsAtFault=tallies.posts;
    if(fault.kind==='lost-reply'){
     const upstream=await route.fetch({maxRedirects:0,maxRetries:0});
     assert.ok(upstream.ok(),'RPC failed before the controlled acknowledgment loss');
     return route.abort('connectionreset');
    }
    if(fault.kind==='browser-offline'){
     await context.setOffline(true);
     return route.abort('internetdisconnected');
    }
    if(fault.kind==='pre-commit')return route.abort('connectionreset');
    return route.fulfill({status:fault.kind,contentType:'application/json',body:'{}',
     headers:{'access-control-allow-origin':origin}});
   }
   return route.continue();
  });
  return page;
 };
 const page=await createPage(context);
 try{
  await page.goto(origin+'/fixture-bootstrap');
  await writeWardrobe(page,account,records.slice(0,1),seedOutfits);
  await login(page,account);await waitBackup(page);
  const seed=await remote(account);
  assert.ok(seed.revision===1&&seed.document.items.length===1,'Last-good seed not published');
  stage='full backup with interruption';
  await writeWardrobe(page,account,records,outfits);
  fault=total===25?{kind:width===390?'browser-offline':503,afterPosts:tallies.posts+2}:total===100?{kind:413,afterPosts:tallies.posts+50}:
   total===250?{kind:507,afterPosts:tallies.posts+240}:{kind:width===390?'lost-reply':'pre-commit'};
  const starting=performance.now();
  await page.reload();
  await page.waitForFunction(()=>/Retrying when connected|Cloud rejected|Cloud storage capacity/.test(
   document.getElementById('cloudStatus').textContent),null,{timeout:150000});
  assert.ok(captured,'Controlled fault did not run');
  // Durable capacity stops also survive re-entry before explicit retry.
  if([413,507].includes(fault.kind)){
   await page.reload();
   await page.waitForFunction(()=>/Cloud rejected|Cloud storage capacity/.test(document.getElementById('cloudStatus').textContent));
   assert.equal(tallies.posts,requestsAtFault);
  }
  const fromFault=await remote(account);
  if(fault.kind==='lost-reply')assert.ok(fromFault.revision===2&&fromFault.document.items.length===total);
  else assert.ok(fromFault.revision===1&&fromFault.document.items.length===1,'Incomplete transfer replaced last-good backup');
  stage='retry and committed verification';
  if(fault.kind==='browser-offline')await context.setOffline(false);
  await page.locator('.account-menu summary').tap();
  await page.locator('#syncCloset').tap();
  await waitBackup(page);
  marks.fullMs=Math.round(performance.now()-starting);
  const completed=await remote(account);
  assert.equal(completed.document.items.length,total);
  assert.ok(completed.revision>=2&&completed.revision<=3,'Unexpected publish count');
  assert.ok(tallies.posts<=objects.size*2+2,'Unbounded original POST retries');
  const fullPosts=tallies.posts;
  const fullGets=tallies.gets;
  stage='incremental metadata-only edit';
  records[0]={...records[0],name:'Updated synthetic shirt'};
  await writeWardrobe(page,account,[records[0]],outfits);
  await page.reload();await waitBackup(page);
  const edited=await remote(account);
  assert.equal(edited.revision,completed.revision+1);
  assert.equal(tallies.posts,fullPosts,'Metadata edit retransmitted original JPEGs');
  stage='clean repeat sync';
  const checked=page.waitForResponse(response=>response.url().startsWith(endpoint.origin+table+'?')&&
   new URL(response.url()).searchParams.get('select')==='revision'&&response.ok());
  await page.locator('.account-menu summary').tap();
  await page.locator('#syncCloset').tap();
  await checked;
  await waitBackup(page);
  assert.equal((await remote(account)).revision,edited.revision);
  assert.equal(tallies.posts,fullPosts);

  stage='independent backend objects';
  const bearer=await token(account), outsiderBearer=await token(outsider);
  const list=await request('/storage/v1/object/list/closet-private',bearer,'POST',{prefix:account.id,limit:1000});
  assert.ok(list.ok);
  assert.deepEqual(json(list).map(x=>x.name).sort(),[...objects.keys()].map(x=>x+'.jpg').sort());
  const sample=objects.keys().next().value, objectPath=storage+account.id+'/'+sample+'.jpg';
  const original=await request(objectPath,bearer);
  assert.ok(original.ok&&hash(original.bytes)===sample);
  const forbidden=await request(objectPath,outsiderBearer);
  assert.ok([400,401,403,404].includes(forbidden.status));
  const foreign=await request(table+'?owner_id=eq.'+account.id,outsiderBearer);
  assert.ok(foreign.ok&&json(foreign).length===0);
  stage='clean browser recovery';
  const restore=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const restoreStart=performance.now(),beforeRestorePosts=tallies.posts,beforeRestoreGets=tallies.gets;
  let heapBytes=null;
  try{
   const fresh=await createPage(restore);
   await login(fresh,account);await waitBackup(fresh);
   await verifyRestored(fresh,account,records,outfits,edited.revision);
   heapBytes=await fresh.evaluate(()=>performance.memory?.usedJSHeapSize??null);
  }finally{await restore.close();}
  assert.equal(tallies.posts,beforeRestorePosts);
  assert.ok(tallies.peakPhotoRequests<=4,'Photo transport exceeded expected maximum concurrency');
  marks.restoreMs=Math.round(performance.now()-restoreStart);
  return {engine,width,total,outfits:count,fault:fault.kind,uniqueObjects:objects.size,
   originalBytes:[...objects.values()].reduce((sum,bytes)=>sum+bytes.length,0),
   largestOriginalBytes:Math.max(...[...objects.values()].map(bytes=>bytes.length)),
   documentBytes:Buffer.byteLength(JSON.stringify(edited.document)),
   originalPosts:fullPosts,initialOriginalGets:fullGets,
   incrementalOriginalPosts:tallies.posts-fullPosts,restoreOriginalGets:tallies.gets-beforeRestoreGets,
   dispositions:{beforeFault:seed.revision,afterFault:fromFault.revision,completed:completed.revision,edited:edited.revision},
   heapBytes, ...marks,peakPhotoRequests:tallies.peakPhotoRequests,recovered:total};
 }catch(error){
  const match=error.stack?.match(/browser\.mjs:\d+:\d+/)?.[0]||error.name;
  throw Error(engine+' '+width+' '+total+' failed during '+stage+' ('+match+')');
 }finally{await context.close();}
}

try{
 const engine=process.env.A21_ENGINE;
 assert.ok(['chromium','webkit'].includes(engine));
 const browser=await ({chromium,webkit})[engine].launch();
 let capacity;
 try{
  capacity=await boundary();
  for(const width of [320,390,430])for(const total of [25,100,250,500]){
   const result=await exercise(browser,engine,width,total);
   report.push(result);
   console.log('ASSIGNMENT_21_PASS',JSON.stringify(result));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 await mkdir('benchmark/assignment-21',{recursive:true});
 await writeFile('benchmark/assignment-21/'+engine+'.json',JSON.stringify({capacity,report},null,2));
 console.log('ASSIGNMENT_21_DATABASE_LIMIT',JSON.stringify(capacity));
}finally{await new Promise(done=>server.close(done));}
