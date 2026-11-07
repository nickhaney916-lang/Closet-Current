/**
 * CLOSET CURRENT P138 — genuine Chromium/WebKit owner-restore UI exercise.
 * This is NOT the shipping app: the real P137/P129/P128/P126 modules are
 * mounted on a local research-only HTML page against an isolated fake HTTP
 * server. Signed JWT, deployed Supabase, physical phones and shipping UI remain
 * independently unverified. Never submit user/account photos or secrets.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname,dirname,sep} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),out='benchmark/cloud-restore-browser-138';
await mkdir(out,{recursive:true});
const file='benchmark/fixtures/commons-0002.jpg';
const original=readFileSync(file);
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const originalSHA=sha(original);
const evidence=locked.find(x=>x.id==='commons-0002');
assert.ok(evidence?.verified&&evidence.sha256===originalSHA&&
 evidence.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),
 'P138 use only legally sourced independently SHA-locked original JPEG');
const m=await sharp(original).metadata();
const cutout=await sharp(original).extract({left:0,top:0,
 width:Math.floor(m.width*.55),height:Math.floor(m.height*.65)})
 .jpeg({quality:88}).toBuffer();
const cutoutSHA=sha(cutout);
assert.notEqual(originalSHA,cutoutSHA);
const uri=b=>'data:image/jpeg;base64,'+b.toString('base64');

const accounts=new Map(),docs=new Map(),objects=new Map();
const events={reads:0,uploads:0,storageReads:0,cases:[],screenshots:[],
 crossOwnerDenied:0,failed:[],pageErrors:[],externalNetwork:[]};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript',
 '.mjs':'text/javascript','.json':'application/json'};
function send(res,status,value,type='application/json'){
 res.writeHead(status,{'content-type':type,'cache-control':'no-store',
 'x-content-type-options':'nosniff'});
 res.end(type==='application/json'?JSON.stringify(value):value);
}
const ingest=async req=>{
 const chunks=[];let count=0;
 for await(const chunk of req){
  count+=chunk.length;if(count>20_000_000)throw Error('request size limit');
  chunks.push(chunk);
 }
 return Buffer.concat(chunks);
};
function account(req){
 const header=req.headers.authorization;
 for(const [id,token] of accounts)
  if(header==='Bearer '+token)return id;
 return null;
}
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const path=url.pathname;
  if(path==='/favicon.ico')return send(res,204,'','text/plain');
  if(path.startsWith('/rest/v1/closet_backups')){
   if(req.method!=='GET')return send(res,405,{error:'method'});
   const id=url.searchParams.get('owner_id')?.replace(/^eq\./,'');
   const owner=account(req);
   if(!owner||owner!==id){
    events.crossOwnerDenied++;return send(res,403,{error:'owner isolation'});
   }
   events.reads++;
   const row=docs.get(owner);
   return send(res,200,row?[structuredClone(row)]:[]);
  }
  if(path==='/rest/v1/rpc/save_closet_backup'){
   if(req.method!=='POST')return send(res,405,{error:'method'});
   const owner=account(req);
   if(!owner){events.crossOwnerDenied++;return send(res,403,{error:'owner isolation'});}
   const body=JSON.parse((await ingest(req)).toString('utf8'));
   const prev=docs.get(owner),rev=prev?.revision||0;
   if(body?.p_document?.ownerId!==owner)
    return send(res,403,{error:'wrong owner'});
   if(body.p_expected_revision!==rev)return send(res,200,null);
   docs.set(owner,{owner_id:owner,revision:rev+1,document:body.p_document});
   return send(res,200,rev+1);
  }
  if(path.startsWith('/storage/v1/object/closet-private/')){
   const owner=account(req);
   const key=decodeURIComponent(path.slice('/storage/v1/object/closet-private/'.length));
   const match=/^([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(key);
   if(!owner||!match||match[1]!==owner){
    events.crossOwnerDenied++;
    return send(res,403,{error:'private storage policy'});
   }
   if(req.method==='POST'){
    events.uploads++;
    if(objects.has(key))return send(res,409,{error:'immutable object exists'});
    const bytes=await ingest(req);
    if(sha(bytes)!==match[2])return send(res,400,{error:'SHA mismatch'});
    objects.set(key,bytes);
    return send(res,200,{saved:true});
   }
   if(req.method==='GET'){
    events.storageReads++;
    const bytes=objects.get(key);
    return bytes?send(res,200,bytes,'image/jpeg'):send(res,404,{error:'missing'});
   }
   return send(res,405,{error:'method'});
  }
  // Browser ESM relative imports may only access unchanged research source
  // and the P138 isolated HTML; no public app, staging or outside files served.
  if(req.method!=='GET'||!path.startsWith('/research/')||
   path.includes('\\')||path.includes('\0')||
   path.split('/').includes('..')||!['.html','.mjs','.js'].includes(extname(path)))
   return send(res,404,'Not found','text/plain');
  const target=resolve(root,'.'+path);
  if(!target.startsWith(root+sep))return send(res,403,'Not allowed','text/plain');
  const contents=await readFile(target);
  return send(res,200,contents,mime[extname(target)]);
 }catch(e){return send(res,500,{error:'isolated research server failed'});}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;

const snapshot=async page=>page.evaluate(async()=>{
 const s=await window.research138.state();
 return {
  color:s.item?.color,
  outfits:s.board?.saved?.map(x=>x.id)||[],
  code:s.lastOutcome?.code||null,
  kind:s.lastOutcome?.kind||null,
  cancelled:s.lastOutcome?.result?.cancelled||false,
  restored:s.lastOutcome?.result?.restored||false,
  busy:s.busy,dialogOpen:s.dialogOpen,
  status:s.status
 };
});
async function screenshot(page,engine,width,stage){
 const name=engine+'-'+width+'-'+stage+'.png';
 const bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const metadata=await sharp(bytes).metadata();
 const stats=await sharp(bytes).stats();
 assert.equal(metadata.width,width);
 assert.equal(metadata.height,860);
 assert.ok(bytes.length>4000&&stats.channels.some(x=>x.stdev>8),
  'real screenshot must be nonblank');
 await writeFile(out+'/'+name,bytes);
 events.screenshots.push({engine,width,stage,name,sha256:sha(bytes),bytes:bytes.length});
}
const waitDialog=p=>p.locator('#confirm').waitFor({state:'visible',timeout:45000});
const waitStatus=(p,text)=>p.waitForFunction(value=>
 document.getElementById('status')?.textContent.includes(value),text,{timeout:45000});
let browser=null;
try{
 for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
  browser=await driver.launch({headless:true});
  for(const width of [320,390,430]){
   const ownerId=randomUUID(),bId=randomUUID();
   const token='p138-unsigned-test-owner-A-'+ownerId;
   const tokenB='p138-unsigned-test-owner-B-'+bId;
   accounts.set(ownerId,token);accounts.set(bId,tokenB);
   const context=await browser.newContext({
    viewport:{width,height:860},deviceScaleFactor:1,hasTouch:true
   });
   await context.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(origin+'/'))return route.continue();
    events.externalNetwork.push({engine,width,method:route.request().method()});
    return route.abort();
   });
   const page=await context.newPage();
   page.on('pageerror',err=>events.pageErrors.push({engine,width,message:String(err)}));
   page.on('crash',()=>events.failed.push({engine,width,error:'real browser crash'}));
   await page.goto(origin+'/research/cloud-restore-browser-138/restore-review.html',
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.research138?.seed==='function');
   const seeded=await page.evaluate(async data=>window.research138.seed(data),{
    ownerId,token,
    original:uri(original),originalSHA,
    cutout:uri(cutout),cutoutSHA
   });
   assert.equal(seeded.photoObjects,2);
   assert.equal(seeded.revision,1);
   const serverBackup=docs.get(ownerId);
   assert.equal(serverBackup.revision,1);
   assert.equal(objects.size>=2,true);
   assert.equal(JSON.stringify(serverBackup.document).includes('data:image/jpeg'),false);
   assert.deepEqual([...objects.keys()].filter(k=>k.startsWith(ownerId+'/'))
    .map(k=>k.split('/')[1]).sort(),[originalSHA+'.jpg',cutoutSHA+'.jpg'].sort());

   await page.locator('#preview').click();
   await waitStatus(page,'Preview checked');
   const initial=await snapshot(page);
   assert.equal(initial.restored,false);
   assert.equal(await page.locator('#localClothes').innerText(),'1');
   assert.equal(await page.locator('#remoteClothes').innerText(),'1');
   await screenshot(page,engine,width,'01-readonly-preview');
   const beforePreviewImages=events.storageReads;
   await page.locator('#preview').click();await waitStatus(page,'Preview checked');
   assert.equal(events.storageReads,beforePreviewImages,
    'read-only P137 preview must not fetch private JPEG assets');

   await page.evaluate(()=>window.research138.changeLocal('Red',true));
   await page.locator('#restore').click();
   await waitDialog(page);
   assert.equal(await page.locator('#dialogLocalOutfits').innerText(),'2');
   assert.equal(await page.locator('#dialogRemoteOutfits').innerText(),'1');
   const modal=await page.locator('#confirm').innerText();
   for(const privateText of ['research-p138-reviewed-shirt','cloud-outfit-p138',
    'Red','Green','data:image/jpeg','closet-photo:'])
    assert.equal(modal.includes(privateText),false,
     'private garment detail absent from actual owner dialog');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
    true,'320/390/430 responsive layout has no horizontal overflow');
   await screenshot(page,engine,width,'02-real-owner-consent');
   await page.locator('#cancel').click();await waitStatus(page,'Cancelled.');
   assert.equal((await snapshot(page)).color,'Red');
   assert.equal((await snapshot(page)).outfits.length,2);
   assert.equal(docs.get(ownerId).revision,1);
   await screenshot(page,engine,width,'03-owner-cancelled');

   await page.locator('#restore').click();await waitDialog(page);
   await page.locator('#approve').click();
   await waitStatus(page,'Restored cloud wardrobe');
   const restored=await snapshot(page);
   assert.equal(restored.color,'Green');
   assert.deepEqual(restored.outfits,['cloud-outfit-p138']);
   assert.equal(restored.restored,true);
   assert.equal(restored.code,null);
   await screenshot(page,engine,width,'04-atomic-restored');

   await page.evaluate(()=>window.research138.changeLocal('Violet',true));
   await page.locator('#restore').click();await waitDialog(page);
   await page.evaluate(()=>window.research138.changeLocal('Blue',false));
   await page.locator('#approve').click();await waitStatus(page,'Local closet changed.');
   const localConflict=await snapshot(page);
   assert.equal(localConflict.code,'local-changed');
   assert.equal(localConflict.color,'Blue');
   assert.equal(localConflict.outfits.length,2);
   await screenshot(page,engine,width,'05-local-conflict-rejected');

   await page.locator('#restore').click();await waitDialog(page);
   if(width===320){
    docs.get(ownerId).revision++;
   }else{
    const row=docs.get(ownerId);
    row.document=structuredClone(row.document);
    row.document.items[0].color='Unapproved second-device remote color';
   }
   await page.locator('#approve').click();
   await waitStatus(page,'Cloud backup changed.');
   const remoteConflict=await snapshot(page);
   assert.equal(remoteConflict.code,'remote-changed');
   assert.equal(remoteConflict.color,'Blue');
   assert.equal(remoteConflict.outfits.length,2);
   await screenshot(page,engine,width,'06-remote-conflict-rejected');

   // A different synthetic account receives no A data under the same-origin
   // isolated server's private owner-folder checks, not actual signed RLS.
   const bRead=await context.request.get(origin+
    '/rest/v1/closet_backups?owner_id=eq.'+bId+
    '&select=owner_id,revision,document',{headers:{
     Authorization:'Bearer '+tokenB,apikey:'p138-synthetic-local-only'
    }});
   assert.equal(bRead.status(),200);
   assert.deepEqual(await bRead.json(),[]);
   const foreignRead=await context.request.get(origin+
    '/storage/v1/object/closet-private/'+ownerId+'/'+originalSHA+'.jpg',
    {headers:{Authorization:'Bearer '+tokenB,
     apikey:'p138-synthetic-local-only'}});
   assert.equal(foreignRead.status(),403);
   const flags=await page.evaluate(()=>window.research138.flags());
   assert.deepEqual(flags,{researchOnly:true,signedJWTVerified:false,
    actualP137BrowserMounted:true,familyAlpha:'HOLD',productionAuthorized:false});
   events.cases.push({
    engine,width,actualBrowserP137Consent:true,
    actualP129RealJPEGCloudBackup:true,
    originalSHA,cutoutSHA,privateOriginalAndCutoutStorage:true,
    ownerDialogContainsPhotos:false,ownerCancelWithoutWrite:true,
    atomicSavedOutfitRestore:true,localEditDuringConsentRejected:true,
    remoteSameRevisionOrVersionEditRejected:true,
    syntheticOwnerBPrivacyDenied:true,
    signedJWTVerified:false,physicalDeviceVerified:false,
    productionDeployed:false,familyAlpha:'HOLD'
   });
   await context.close();
  }
  await browser.close();browser=null;
 }
 assert.equal(events.cases.length,6);
 assert.equal(events.screenshots.length,36);
 assert.equal(events.pageErrors.length,0);
 assert.equal(events.failed.length,0);
 assert.equal(events.externalNetwork.length,0);
 assert.ok(events.crossOwnerDenied>=6);
 const results={
  priority:'P138-CLOUD-RESTORE-REAL-BROWSER-CONSENT',
  sourceParent:'5e8bdb194ce9d2a274a23a79d3faa11e319d5f3e',
  actualP137MountedInIsolatedResearchBrowser:true,
  actualShippingCloudUIIntegrated:false,
  genuineOriginalLicensingVerified:true,
  genuineOriginalAndCutoutJPEGsVerified:true,
  syntheticOwnerTokensNotSigned:true,
  realSignedSupabaseTwoAccountRLS:false,
  realPhysicalAndroidOrIphone:false,
  existingProductionOrStagingModified:false,
  familyAlpha:'HOLD',
  ...events
 };
 await writeFile(out+'/results.json',JSON.stringify(results,null,2));
 console.log('P138_ACTUAL_BROWSER_CLOUD_RESTORE_RESEARCH '+JSON.stringify({
  chromiumWidths:[320,390,430],webkitWidths:[320,390,430],
  genuineCases:events.cases.length,screenshots:events.screenshots.length,
  actualP137Mounted:true,actualShippingUI:false,
  ownerApprovalAndSourceIntegrity:true,
  realSignedJwt:false,physicalDevice:false,familyAlpha:'HOLD'
 }));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
