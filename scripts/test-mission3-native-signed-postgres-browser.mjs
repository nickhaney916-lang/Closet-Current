// Mission 3: actual built Closet Current cloud controller + genuine PostgreSQL
// RLS and unchanged supabase/cloud-backup.sql. All RSA keys, owners and files
// are ephemeral LOCAL CI fixtures. No Supabase Auth service, hosted project,
// staging or production network writes are permitted.
import {chromium,webkit} from 'playwright';
import {Pool} from 'pg';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createEphemeralSignedIdentity147} from '../research/signed-two-owner-transport-147/ephemeral-signed-identity.mjs';

const pgurl=process.env.M3_EPHEMERAL_POSTGRES_URL;
if(!pgurl||!['postgres','localhost','127.0.0.1'].includes(new URL(pgurl).hostname))
 throw Error('Mission 3 forbids nonlocal or hosted Postgres connections');
const pool=new Pool({connectionString:pgurl,max:6});
const signed=createEphemeralSignedIdentity147();
const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mission3-real-postgres-signed-native-browser');
await mkdir(out,{recursive:true});
const data=async(color)=>{
 const body='<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480">'+
 '<rect width="360" height="480" fill="#d9dfe4"/>'+
 '<path d="M120 45L151 20H209L240 45L318 126L270 170L240 110L240 427H120V110L90 170L42 126Z" fill="'+color+'"/>'+
 '</svg>';
 return sharp(Buffer.from(body)).jpeg({quality:86}).toBuffer();
};
const imageA=await data('#29618b'),imageB=await data('#6f387e');
const sha=b=>createHash('sha256').update(b).digest('hex');
const originals=new Map(),security={sqlRlsReads:0,sqlRlsWrites:0,
 sqlStorageReads:0,sqlStorageWrites:0,foreignSelectDenials:0,
 foreignStorageDenials:0,invalidTokenDenials:0,signaturesChecked:0,
 expiredOrRevokedDenied:0};
const reports=[],errors=[];
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript',
 '.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET')throw Error('GET only');
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!full.startsWith(root+'/')||p.includes('\\'))throw Error('Invalid local asset');
  const bytes=await readFile(full);
  res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,
 remote='https://hlkgymugtfbirlpunsra.supabase.co';
const axeScript=await readFile('node_modules/axe-core/axe.min.js','utf8');
const cors={'access-control-allow-origin':'*',
 'access-control-allow-headers':'authorization,apikey,content-type,x-client-info',
 'access-control-allow-methods':'GET,POST,OPTIONS'};

async function asSigned(token,fn){
 const {ownerId}=signed.verify(token);security.signaturesChecked++;
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  await client.query('SET LOCAL ROLE authenticated');
  await client.query("select set_config('request.jwt.claim.sub',$1,true)",[ownerId]);
  const result=await fn(client,ownerId);
  await client.query('COMMIT');
  return result;
 }catch(e){
  await client.query('ROLLBACK').catch(()=>{});throw e;
 }finally{client.release();}
}
async function pgRead(token,owner){
 return asSigned(token,async client=>{
  const rs=await client.query('select owner_id,revision,document from public.closet_backups where owner_id=$1',[owner]);
  return rs.rows;
 });
}
async function cloudHandler(route){
 const request=route.request(),uri=new URL(request.url()),verb=request.method();
 const fulfill=(status,value)=>route.fulfill({
  status,headers:{...cors,'content-type':'application/json'},
  body:JSON.stringify(value)
 });
 if(verb==='OPTIONS')return route.fulfill({status:204,headers:cors,body:''});
 const bearer=request.headers().authorization?.replace(/^Bearer /,'');
 if(!bearer){security.invalidTokenDenials++;return fulfill(401,{error:'signed JWT required'});}
 let verified;
 try{verified=signed.verify(bearer);security.signaturesChecked++;}
 catch{security.invalidTokenDenials++;return fulfill(401,{error:'invalid/revoked signed JWT'});}
 const who=verified.ownerId;
 try{
  if(uri.pathname==='/rest/v1/closet_backups'&&verb==='GET'){
   const queryOwner=uri.searchParams.get('owner_id')?.replace(/^eq\./,'');
   const select=uri.searchParams.get('select');
   assert.ok(['revision','revision,document'].includes(select));
   // Deliberately do NOT compare queryOwner with who here. Actual PostgreSQL
   // authenticated RLS must decide which owner row can be returned.
   const rows=await asSigned(bearer,async client=>{
    const sql=select==='revision'?'select revision from public.closet_backups where owner_id=$1':
     'select revision,document from public.closet_backups where owner_id=$1';
    return (await client.query(sql,[queryOwner])).rows;
   });
   security.sqlRlsReads++;
   if(who!==queryOwner&&rows.length===0)security.foreignSelectDenials++;
   return fulfill(200,rows.map(x=>({...x,revision:Number(x.revision)})));
  }
  if(uri.pathname==='/rest/v1/rpc/save_closet_backup'&&verb==='POST'){
   const body=request.postDataJSON();
   const value=await asSigned(bearer,async client=>(
    await client.query(
     'select public.save_closet_backup($1::bigint,$2::jsonb) as revision',
     [body.p_expected_revision,JSON.stringify(body.p_document)]
    )).rows[0].revision);
   security.sqlRlsWrites++;
   return fulfill(200,value===null?null:Number(value));
  }
  const prefix='/storage/v1/object/closet-private/';
  if(uri.pathname.startsWith(prefix)){
   const name=decodeURIComponent(uri.pathname.slice(prefix.length));
   // No JS owner-folder authorization. We check signed subject against the
   // actual unchanged PostgreSQL storage.objects RLS SQL on EVERY request.
   if(verb==='GET'){
    const rows=await asSigned(bearer,async client=>
     (await client.query("select name from storage.objects where bucket_id='closet-private' and name=$1",[name])).rows);
    security.sqlStorageReads++;
    if(rows.length===0){
     if(!name.startsWith(who+'/'))security.foreignStorageDenials++;
     return fulfill(404,{error:'not found under PostgreSQL owner RLS'});
    }
    const bytes=originals.get(name);
    if(!bytes)return fulfill(404,{error:'missing local synthetic photo payload'});
    return route.fulfill({status:200,headers:{...cors,'content-type':'image/jpeg'},body:bytes});
   }
   if(verb==='POST'){
    const bytes=request.postDataBuffer();
    if(bytes.length>8388608)return fulfill(413,{error:'oversized private original'});
    const hash=sha(bytes),expected=name.split('/')[1]?.replace(/\.jpg$/,'');
    if(hash!==expected)return fulfill(400,{error:'invalid private SHA'});
    try{
     await asSigned(bearer,async client=>client.query(
      "insert into storage.objects(bucket_id,name) values('closet-private',$1) returning name",[name]));
    }catch(error){
     if(error.code==='23505')return fulfill(409,{error:'immutable original already exists'});
     if(error.code==='42501'){
      security.foreignStorageDenials++;
      return fulfill(403,{error:'actual PostgreSQL owner RLS refused Storage write'});
     }
     throw error;
    }
    originals.set(name,bytes);security.sqlStorageWrites++;
    return fulfill(200,{Key:name});
   }
  }
  return fulfill(404,{error:'unsupported local RLS request'});
 }catch(e){
  errors.push({kind:'real-postgres-handler',message:e.message});
  return fulfill(500,{error:'ephemeral SQL failure'});
 }
}
async function contextFor(browser,width,owner,token){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(remote+'/'))return cloudHandler(route);
  if(url.startsWith(origin+'/'))return route.continue();
  return route.abort('blockedbyclient');
 });
 await context.route('**/auth.js*',route=>route.fulfill({
  contentType:'text/javascript',
  body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${token}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`
 }));
 return context;
}
async function seedOwner(page,owner,bytes){
 const img='data:image/jpeg;base64,'+bytes.toString('base64');
 const digest=sha(bytes);
 await page.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(async({owner,img,digest})=>{
  const db=await new Promise((resolve,reject)=>{
   const r=indexedDB.open('closet-current-user-'+owner,2);
   r.onupgradeneeded=()=>{
    if(!r.result.objectStoreNames.contains('items'))
     r.result.createObjectStore('items',{keyPath:'id'});
    if(!r.result.objectStoreNames.contains('state'))
     r.result.createObjectStore('state',{keyPath:'id'});
   };
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put({id:'signed-'+owner,
   ownerId:owner,category:'Tops',itemType:'T-shirt',
   name:'Local signed owner shirt',color:'Blue',
   image:img,originalPhoto:{image:img,sha256:digest},
   sourceSHA256:digest,sourceHashVerified:true,userAdjusted:true});
  tx.objectStore('state').put({id:'cloud-sync',
   baseVersion:0,baseDocument:null,dirty:true,localRevision:1});
  await new Promise((resolve,reject)=>{
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });db.close();
 },{owner,img,digest});
}
async function localState(page){
 return page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{
   const r=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  const tx=db.transaction(['items','state'],'readonly'),
   rows=tx.objectStore('items').getAll(),marker=tx.objectStore('state').get('cloud-sync');
  const [items,m]=await Promise.all([
   new Promise(resolve=>rows.onsuccess=()=>resolve(rows.result)),
   new Promise(resolve=>marker.onsuccess=()=>resolve(marker.result))
  ]);
  db.close();return {items,marker:m};
 });
}
async function awaitCloud(page){
 await page.waitForFunction(()=>document.getElementById('cloudStatus')
  ?.textContent==='Cloud backup up to date',null,{timeout:25000});
}
async function exercise(engine,browserType,width){
 const a=randomUUID(),b=randomUUID(),
  ta=signed.issue(a,{userMetadata:{ownerId:b,role:'service_role'}}),
  tb=signed.issue(b);
 // Admin bootstrap creates both disposable Auth UUID references; owner data
 // thereafter uses *only* SQL authenticated role under verified RS256 sub.
 await pool.query('insert into auth.users(id) values($1),($2)',[a,b]);
 const browser=await browserType.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const contexts=[];
 try{
  const ctxA=await contextFor(browser,width,a,ta);contexts.push(ctxA);
  const pageA=await ctxA.newPage();
  pageA.on('pageerror',e=>errors.push({engine,width,page:'A',error:e.message}));
  await seedOwner(pageA,a,imageA);
  await pageA.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await pageA.evaluate(()=>closetReady);
  await awaitCloud(pageA);
  const stateA=await localState(pageA);
  assert.equal(stateA.items.length,1);
  assert.equal(stateA.items[0].ownerId,a);
  assert.equal(stateA.marker.baseVersion,1);
  const blobA=a+'/'+sha(imageA)+'.jpg';
  assert.ok(originals.has(blobA));
  const ctxB=await contextFor(browser,width,b,tb);contexts.push(ctxB);
  const pageB=await ctxB.newPage();
  pageB.on('pageerror',e=>errors.push({engine,width,page:'B',error:e.message}));
  await seedOwner(pageB,b,imageB);
  await pageB.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await pageB.evaluate(()=>closetReady);
  await awaitCloud(pageB);
  const stateB=await localState(pageB);
  assert.equal(stateB.items.length,1);
  assert.equal(stateB.items[0].ownerId,b);
  assert.equal(stateB.marker.baseVersion,1);
  const blobB=b+'/'+sha(imageB)+'.jpg';
  assert.ok(originals.has(blobB));
  const sqlA=await pgRead(ta,a),sqlB=await pgRead(tb,b);
  assert.equal(sqlA.length,1);assert.equal(sqlB.length,1);
  assert.equal(sqlA[0].document.items[0].ownerId,a);
  assert.equal(sqlB[0].document.items[0].ownerId,b);
  assert.equal((await pgRead(ta,b)).length,0,
   'real PostgreSQL RLS must prevent A from SELECT B backup row');
  assert.equal((await pgRead(tb,a)).length,0);
  // Browser API, not just SQL helper, must exercise signed source principal.
  const foreignFetch=await pageA.evaluate(async({remote,b})=>{
   const token=await closetAuth.getAccessToken();
   const res=await fetch(remote+'/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+b,
    {headers:{authorization:'Bearer '+token,apikey:'synthetic'}});return res.json();
  },{remote,b});
  assert.deepEqual(foreignFetch,[]);
  const storageForbidden=await pageA.evaluate(async({remote,blobB})=>{
   const token=await closetAuth.getAccessToken();
   const res=await fetch(remote+'/storage/v1/object/closet-private/'+blobB,
    {headers:{authorization:'Bearer '+token,apikey:'synthetic'}});
   return res.status;
  },{remote,blobB});
  assert.equal(storageForbidden,404,'PostgreSQL Storage RLS hides owner-B JPEG from A');
  // Unverified/forged JWT cannot become authenticated at the real DB.
  const invalid=await pageA.evaluate(async({remote,a})=>{
   const res=await fetch(remote+'/rest/v1/closet_backups?select=revision&owner_id=eq.'+a,
    {headers:{authorization:'Bearer forged.test.token',apikey:'synthetic'}});return res.status;
  },{remote,a});
  assert.equal(invalid,401);
  // New browser private owner A has NO original local closet, and must
  // restore only its own signed RLS-backed JSON plus real stored photo bytes.
  const restoreCtx=await contextFor(browser,width,a,ta);contexts.push(restoreCtx);
  const restored=await restoreCtx.newPage();
  restored.on('pageerror',e=>errors.push({engine,width,page:'restore',error:e.message}));
  await restored.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await restored.evaluate(()=>closetReady);
  await awaitCloud(restored);
  const restoredState=await localState(restored);
  assert.equal(restoredState.marker.baseVersion,1);
  assert.equal(restoredState.items.length,1);
  assert.equal(restoredState.items[0].ownerId,a);
  assert.equal(restoredState.items[0].originalPhoto.image,
   'data:image/jpeg;base64,'+imageA.toString('base64'));
  assert.equal(restoredState.items[0].originalPhoto.sha256,sha(imageA));
  assert.notEqual(sha(imageA),sha(imageB));
  await pageA.locator('.account-menu > summary').click();
  const screenshot=`${engine}-${width}-signed-postgres-owner-A.png`;
  const png=await pageA.screenshot({path:resolve(out,screenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await pageA.addScriptTag({content:axeScript});
  const axe=await pageA.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(axe.violations.map(v=>v.id),[]);
  const lease=signed.verify(ta);signed.revoke(lease.sessionId);
  const revoked=await pageA.evaluate(async({remote,a})=>{
   const token=await closetAuth.getAccessToken();
   const res=await fetch(remote+'/rest/v1/closet_backups?select=revision&owner_id=eq.'+a,
    {headers:{authorization:'Bearer '+token,apikey:'synthetic'}});
   return res.status;
  },{remote,a});
  assert.equal(revoked,401);security.expiredOrRevokedDenied++;
  assert.equal((await localState(pageA)).items[0].originalPhoto.sha256,sha(imageA));
  return {engine,width,realPostgresRLS:true,realPostgresStorageRLS:true,
   actualCloudController:true,cryptographicallySignedEphemeralRS256:true,
   ownerRowsIsolated:true,foreignBrowserReadsDenied:true,
   forgedAndRevokedTokensDenied:true,realSQLBackupAndRestore:true,
   ownerAOriginalSHA:sha(imageA),ownerBOriginalSHA:sha(imageB),
   screenshot,sha256:sha(png),axeViolations:axe.violations.length,
   actualSupabaseAuth:false,hostedProject:false,physicalPhone:false};
 }finally{
  for(const context of contexts.reverse())await context.close().catch(()=>{});
  await browser.close();
 }
}
try{
 for(const [name,type]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])reports.push(await exercise(name,type,width));
 assert.deepEqual(errors,[]);
 assert.ok(security.sqlRlsReads>=12);
 assert.ok(security.sqlRlsWrites>=12);
 assert.ok(security.sqlStorageWrites>=12);
 assert.ok(security.sqlStorageReads>=6);
 assert.ok(security.foreignSelectDenials>=6);
 assert.ok(security.foreignStorageDenials>=6);
 assert.ok(security.invalidTokenDenials>=12);
 await writeFile(resolve(out,'results.json'),JSON.stringify({
  mission:3,scenario:'signed RS256 local owner authenticated through unchanged real PostgreSQL RLS and Storage policies',
  cases:reports,security,errors,claims:{ephemeralLocalPostgres:true,
   realPostgresRLS:true,actualNativeClosetController:true,
   supabaseHostedAuth:false,supabaseHostedStorage:false,
   physicalPhone:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:reports.length,security,errors:errors.length,output:out}));
}finally{await pool.end();await new Promise(done=>server.close(done));}
