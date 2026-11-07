/**
 * CLOSET CURRENT P141 — genuine Chromium/WebKit owner-BACKUP UI exercise.
 * This is NOT the shipping app: the real P134/P133/P132/P129 modules are
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

const root=resolve('.'),out='benchmark/cloud-roundtrip-browser-141';
await mkdir(out,{recursive:true});
const file='benchmark/fixtures/commons-0002.jpg';
const original=readFileSync(file);
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const originalSHA=sha(original);
const evidence=locked.find(x=>x.id==='commons-0002');
assert.ok(evidence?.verified&&evidence.sha256===originalSHA&&
 evidence.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),
 'P141 use only legally sourced independently SHA-locked original JPEG');
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
  // and the P141 isolated HTML; no public app, staging or outside files served.
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


const read=async page=>page.evaluate(async()=>{
 const s=await window.research141.state();
 return {
  color:s.item?.color,originalSHA:s.item?.originalPhoto?.sha256,
  cutoutSHA:s.item?.cutoutSHA256,
  outfits:s.board?.saved?.map(x=>x.id)||[],
  backup:s.lastOutcome,restore:s.lastRestoreOutcome,
  backupModal:s.dialogOpen,restoreModal:s.restoreDialogOpen,
  busy:s.busy,status:s.status
 };
});
async function screenshot(page,engine,width,stage){
 const name=engine+'-'+width+'-'+stage+'.png';
 const bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.width,width);assert.equal(meta.height,860);
 assert.ok(bytes.length>4000&&stats.channels.some(c=>c.stdev>8),
  'actual browser screenshot must be nonblank');
 await writeFile(out+'/'+name,bytes);
 events.screenshots.push({engine,width,stage,name,sha256:sha(bytes),bytes:bytes.length});
}
const waitDialog=(p,id)=>p.locator('#'+id).waitFor({state:'visible',timeout:45000});
const waitStatus=(p,part)=>p.waitForFunction(text=>
 document.getElementById('status')?.textContent.includes(text),part,{timeout:45000});
let browser=null;
try{
 for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
  browser=await driver.launch({headless:true});
  for(const width of [320,390,430]){
   const ownerId=randomUUID(),otherOwner=randomUUID();
   const token='p141-unsigned-test-owner-A-'+ownerId;
   const otherToken='p141-unsigned-test-owner-B-'+otherOwner;
   accounts.set(ownerId,token);accounts.set(otherOwner,otherToken);
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
   page.on('pageerror',error=>events.pageErrors.push({engine,width,message:String(error)}));
   page.on('crash',()=>events.failed.push({engine,width,error:'actual browser crash'}));
   await page.goto(origin+'/research/cloud-roundtrip-browser-141/roundtrip-review.html',
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.research141?.seed==='function');
   const ready=await page.evaluate(data=>window.research141.seed(data),{
    ownerId,token,original:uri(original),originalSHA,
    cutout:uri(cutout),cutoutSHA
   });
   assert.equal(ready.ready,true);
   const flags=await page.evaluate(()=>window.research141.flags());
   assert.deepEqual(flags,{
    researchOnly:true,liveSignedJwt:false,actualP134BrowserMounted:true,
    actualP137BrowserMounted:true,productionAuthorized:false,familyAlpha:'HOLD'
   });
   assert.equal(docs.has(ownerId),false);

   // P134 true initial create-only rev 0 with real original+separate cutout.
   const beforeImages=events.storageReads,beforeUploads=events.uploads;
   await page.locator('#preview').click();await waitStatus(page,'Preview checked');
   assert.equal(events.storageReads,beforeImages);
   assert.equal(events.uploads,beforeUploads);
   assert.equal(await page.locator('#remoteClothes').innerText(),'0');
   await page.locator('#backup').click();await waitStatus(page,'Backup saved. Cloud revision 1');
   assert.equal(docs.get(ownerId).revision,1);
   const savedPaths=[...objects.keys()].filter(x=>x.startsWith(ownerId+'/'));
   assert.deepEqual(savedPaths.map(x=>x.split('/')[1]).sort(),
    [originalSHA+'.jpg',cutoutSHA+'.jpg'].sort());
   assert.equal(JSON.stringify(docs.get(ownerId).document).includes('data:image/jpeg'),false);
   await screenshot(page,engine,width,'01-create-only-backup');

   // P134 human-approved replacement records a new local owner-reviewed style.
   await page.evaluate(()=>window.research141.changeLocal('Red',true));
   await page.locator('#backup').click();await waitDialog(page,'confirm');
   assert.equal(await page.locator('#dialogLocalOutfits').innerText(),'2');
   assert.equal(await page.locator('#dialogRemoteOutfits').innerText(),'1');
   const backupPrompt=await page.locator('#confirm').innerText();
   for(const secret of ['research-p141-reviewed-shirt','cloud-outfit-p141',
      'local-only-p141-outfit','Red','Green','data:image/jpeg','closet-photo:'])
    assert.equal(backupPrompt.includes(secret),false,'no private owner data in backup dialog');
   await page.locator('#approve').click();await waitStatus(page,'Backup saved. Cloud revision 2');
   assert.equal(docs.get(ownerId).revision,2);
   assert.equal(docs.get(ownerId).document.items[0].color,'Red');
   assert.deepEqual(docs.get(ownerId).document.state['outfit-board'].saved.map(x=>x.id),
    ['cloud-outfit-p141','local-only-p141-outfit']);
   await screenshot(page,engine,width,'02-owner-approved-cloud-backup');

   // P137 reads the same P134-saved source within the SAME active account,
   // not a separately initialized toy restore service or independent browser.
   await page.evaluate(()=>window.research141.changeLocal('Violet',false));
   await page.evaluate(()=>window.research141.addLook('third-new-local-outfit-p141'));
   const previewReads=events.storageReads;
   await page.locator('#restorePreview').click();await waitStatus(page,'Restore preview checked');
   assert.equal(await page.locator('#localOutfits').innerText(),'3');
   assert.equal(await page.locator('#remoteOutfits').innerText(),'2');
   assert.equal(events.storageReads,previewReads,
    'owner restore preview must not download original/cutout bytes');
   await screenshot(page,engine,width,'03-cloud-to-local-readonly-preview');

   // Actual two-way owner dialog requests literal approval with counts only.
   await page.locator('#restore').click();await waitDialog(page,'restoreConfirm');
   assert.equal(await page.locator('#restoreLocalOutfits').innerText(),'3');
   assert.equal(await page.locator('#restoreRemoteOutfits').innerText(),'2');
   const restorePrompt=await page.locator('#restoreConfirm').innerText();
   for(const secret of ['research-p141-reviewed-shirt','cloud-outfit-p141',
    'third-new-local-outfit-p141','Violet','Red','data:image/jpeg','closet-photo:'])
    assert.equal(restorePrompt.includes(secret),false,'no private data in restore dialog');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
    true,'phone screen has no horizontal scrolling');
   await screenshot(page,engine,width,'04-real-owner-restore-dialog');

   // Declining restore NEVER replaces the newer local version.
   await page.locator('#restoreCancel').click();
   await waitStatus(page,'Restore cancelled.');
   let state=await read(page);
   assert.equal(state.color,'Violet');
   assert.deepEqual(state.outfits,
    ['cloud-outfit-p141','local-only-p141-outfit','third-new-local-outfit-p141']);
   assert.equal(docs.get(ownerId).revision,2);
   await screenshot(page,engine,width,'05-restore-cancel-local-protected');

   // Accept restore, prove the COMPLETE private JPEG+saved-style roundtrip.
   await page.locator('#restore').click();await waitDialog(page,'restoreConfirm');
   await page.locator('#restoreApprove').click();
   await waitStatus(page,'Restored verified cloud wardrobe and saved outfits.');
   state=await read(page);
   assert.equal(state.restore?.result?.restored,true);
   assert.equal(state.restore?.result?.atomic,true);
   assert.equal(state.color,'Red');
   assert.equal(state.originalSHA,originalSHA);
   assert.equal(state.cutoutSHA,cutoutSHA);
   assert.deepEqual(state.outfits,['cloud-outfit-p141','local-only-p141-outfit']);
   assert.equal(docs.get(ownerId).revision,2);
   await screenshot(page,engine,width,'06-original-and-cutout-outfits-recovered');

   // Real owner-local change while restore consent is awaiting approval fails.
   await page.evaluate(()=>window.research141.changeLocal('Blue',false));
   await page.evaluate(()=>window.research141.addLook('fourth-local-only-outfit-p141'));
   await page.locator('#restore').click();await waitDialog(page,'restoreConfirm');
   await page.evaluate(()=>window.research141.changeLocal('Purple',false));
   await page.locator('#restoreApprove').click();await waitStatus(page,'Local closet changed.');
   state=await read(page);
   assert.equal(state.restore?.code,'local-changed');assert.equal(state.color,'Purple');
   assert.equal(state.outfits.length,3);assert.equal(docs.get(ownerId).revision,2);
   await screenshot(page,engine,width,'07-post-dialog-local-edit-refused');

   // CAS revision race or same revision different manifest is rejected.
   await page.locator('#restore').click();await waitDialog(page,'restoreConfirm');
   const remote=docs.get(ownerId);
   if(width===320)remote.revision++;
   else{
    remote.document=structuredClone(remote.document);
    remote.document.items[0].color='Unapproved different-device edit';
   }
   await page.locator('#restoreApprove').click();await waitStatus(page,'Cloud backup changed.');
   state=await read(page);
   assert.equal(state.restore?.code,'remote-changed');assert.equal(state.color,'Purple');
   assert.equal(state.outfits.length,3);
   await screenshot(page,engine,width,'08-post-dialog-cloud-edit-refused');

   // Tamper the actual cutout object bytes, not just the manifest label.
   const key=ownerId+'/'+cutoutSHA+'.jpg';
   const intact=objects.get(key);
   assert(intact,'expected independently reviewed cutout storage object');
   const damaged=Buffer.from(intact);
   damaged[damaged.length-3]^=1;
   objects.set(key,damaged);
   await page.locator('#restore').click();
   await waitStatus(page,'Restore stopped safely.');
   state=await read(page);
   assert.equal(state.restore?.kind,'error');
   assert.equal(state.restoreModal,false,'malicious JPG cannot reach owner approval');
   assert.equal(state.color,'Purple');assert.equal(state.outfits.length,3);
   objects.set(key,intact);

   // Explicit owner logout/revocation during a pending restore prompt denies
   // the late click, and no additional cloud backup RPC may be dispatched.
   const revisionsBeforeRevoke=docs.get(ownerId).revision;
   await page.locator('#restore').click();await waitDialog(page,'restoreConfirm');
   await page.evaluate(()=>window.research141.invalidateOwner());
   await page.locator('#restoreApprove').click();
   await waitStatus(page,'Owner session changed.');
   state=await read(page);
   assert.equal(state.restore?.code,'owner-session-revoked');
   assert.equal(state.color,'Purple');assert.equal(state.outfits.length,3);
   assert.equal(docs.get(ownerId).revision,revisionsBeforeRevoke);
   await screenshot(page,engine,width,'09-session-revocation-refused');

   // An unrelated synthetic owner B must have no access to A metadata/photos.
   const bMetadata=await context.request.get(origin+
    '/rest/v1/closet_backups?owner_id=eq.'+otherOwner+
    '&select=owner_id,revision,document',{
     headers:{Authorization:'Bearer '+otherToken,apikey:'p141-synthetic-local-only'}
    });
   assert.equal(bMetadata.status(),200);assert.deepEqual(await bMetadata.json(),[]);
   const bImage=await context.request.get(origin+
    '/storage/v1/object/closet-private/'+ownerId+'/'+originalSHA+'.jpg',{
     headers:{Authorization:'Bearer '+otherToken,apikey:'p141-synthetic-local-only'}
    });
   assert.equal(bImage.status(),403);
   const props={
    engine,width,sharedOwnerIDBAndToken:true,
    actualP134AndP137MountedTogether:true,realP129SourceJPEGBackup:true,
    originalAndCutoutSHAProved:true,cloudRevisionAdvancedToTwo:true,
    originalClothingColorRestored:true,
    savedOutfitsRoundTripExactID:true,ownerCancelledAndPreservedLocal:true,
    ownerApprovedSourceVerifiedRestore:true,photoCorruptionRejected:true,
    postDialogLocalEditRejected:true,postDialogRemoteEditRejected:true,
    ownerRevocationNoWrite:true,syntheticSecondOwnerDenied:true,
    signedJwt:false,physicalDevice:false,shippingAppMounted:false,familyAlpha:'HOLD'
   };
   events.cases.push(props);
   await context.close();
  }
  await browser.close();browser=null;
 }
 assert.equal(events.cases.length,6);
 assert.equal(events.screenshots.length,54);
 assert.deepEqual(events.pageErrors,[]);
 assert.deepEqual(events.failed,[]);
 assert.deepEqual(events.externalNetwork,[]);
 assert.ok(events.crossOwnerDenied>=6);
 const results={
  priority:'P141-SAME-OWNER-CLOUD-BACKUP-RESTORE-ROUNDTRIP',
  parentExactHead:'b3405fc7c02d4c7daa598efcca15e2ab1079db7a',
  actualP134AndP137OneBrowserSession:true,
  realLicensedOriginalAndSeparateCutoutSHA:true,
  shippingCloudUIActuallyIntegrated:false,
  realHostedSignedJwtABAccountAcceptance:false,
  physicalIPhoneAndroidAcceptance:false,
  liveCloudDataChanged:false,productionOrStagingModified:false,
  familyAlpha:'HOLD',...events
 };
 await writeFile(out+'/results.json',JSON.stringify(results,null,2));
 console.log('P141_REAL_BROWSER_CLOUD_ROUNDTRIP '+JSON.stringify({
  realBrowserCases:6,
  chromiumWidths:[320,390,430],webkitWidths:[320,390,430],
  genuineScreenshots:events.screenshots.length,
  sameOwnerBackupRestore:true,independentlyVerifiedDoubleJPEG:true,
  savedOutfitIDsRecovered:true,realSignedJwt:false,
  shippingAppCloudUI:false,physicalPhones:false,familyAlpha:'HOLD'
 }));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
