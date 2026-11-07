/**
 * CLOSET CURRENT P142 — genuine Chromium/WebKit owner-BACKUP UI exercise.
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

const root=resolve('.'),out='benchmark/cross-browser-cloud-recovery-142';
await mkdir(out,{recursive:true});
const file='benchmark/fixtures/commons-0002.jpg';
const original=readFileSync(file);
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const originalSHA=sha(original);
const evidence=locked.find(x=>x.id==='commons-0002');
assert.ok(evidence?.verified&&evidence.sha256===originalSHA&&
 evidence.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),
 'P142 use only legally sourced independently SHA-locked original JPEG');
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
  // and the P142 isolated HTML; no public app, staging or outside files served.
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



const state=async page=>page.evaluate(async()=>{
 const s=await window.research142.state();
 return {
  color:s.item?.color,
  originalSHA:s.item?.originalPhoto?.sha256,
  cutoutSHA:s.item?.cutoutSHA256,
  outfits:s.board?.saved?.map(x=>x.id)||[],
  backup:s.lastOutcome,restore:s.lastRestoreOutcome,
  backupDialogOpen:s.dialogOpen,restoreDialogOpen:s.restoreDialogOpen,
  busy:s.busy,status:s.status
 };
});
async function screenshot(page,role,order,width,stage){
 const name=order+'-'+width+'-'+role+'-'+stage+'.png';
 const bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.width,width);assert.equal(meta.height,860);
 assert.ok(bytes.length>4000&&stats.channels.some(c=>c.stdev>8),
  'actual browser screenshot must be nonblank');
 await writeFile(out+'/'+name,bytes);
 events.screenshots.push({order,width,role,stage,name,sha256:sha(bytes),bytes:bytes.length});
}
const status=(page,value)=>page.waitForFunction(expected=>
 document.getElementById('status')?.textContent.includes(expected),value,{timeout:45000});
const modal=(page,id)=>page.locator('#'+id).waitFor({state:'visible',timeout:45000});
const launch=async(engine,width,ownerId,token,label)=>{
 const driver=engine==='chromium'?chromium:webkit;
 const browser=await driver.launch({headless:true});
 const context=await browser.newContext({
  viewport:{width,height:860},deviceScaleFactor:1,hasTouch:true
 });
 await context.route('**/*',route=>{
  if(route.request().url().startsWith(origin+'/'))return route.continue();
  events.externalNetwork.push({label,engine,width,urlType:route.request().resourceType()});
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>events.pageErrors.push({label,engine,width,message:String(e)}));
 page.on('crash',()=>events.failed.push({label,engine,width,message:'browser process crash'}));
 await page.goto(origin+'/research/cross-browser-cloud-recovery-142/device-backup-restore.html',
  {waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.research142?.seed==='function');
 const initialized=await page.evaluate(data=>window.research142.seed(data),{
  ownerId,token,original:uri(original),originalSHA,
  cutout:uri(cutout),cutoutSHA
 });
 assert.equal(initialized.ready,true);
 assert.deepEqual(await page.evaluate(()=>window.research142.flags()),{
  researchOnly:true,liveSignedJwt:false,
  actualP134BrowserMounted:true,actualP137BrowserMounted:true,
  productionAuthorized:false,familyAlpha:'HOLD'
 });
 return {browser,context,page,engine,width,label};
};
let active=[];
try{
 for(const [fromEngine,toEngine] of [['chromium','webkit'],['webkit','chromium']]){
  for(const width of [320,390,430]){
   const order=fromEngine+'-to-'+toEngine;
   const ownerId=randomUUID(),otherOwner=randomUUID();
   const token='p142-unsigned-shared-owner-'+ownerId;
   const foreignToken='p142-unsigned-foreign-owner-'+otherOwner;
   accounts.set(ownerId,token);accounts.set(otherOwner,foreignToken);
   const a=await launch(fromEngine,width,ownerId,token,'device-A');
   const b=await launch(toEngine,width,ownerId,token,'device-B');
   active=[a,b];
   const A=a.page,B=b.page;
   assert.notEqual(a.browser,b.browser,'separate actual browser processes');
   assert.notEqual(a.engine,b.engine,'cross engine A/B acceptance required');
   assert.equal((await state(A)).color,'Green');
   assert.equal((await state(B)).color,'Green');

   // Device A produces an actual original+separate reviewed cutout owner
   // backup, immutable SHA Storage objects and create-only cloud revision one.
   const imagesBefore=events.storageReads,uploadsBefore=events.uploads;
   await A.locator('#preview').click();await status(A,'Preview checked');
   assert.equal(events.storageReads,imagesBefore);
   assert.equal(events.uploads,uploadsBefore);
   await A.locator('#backup').click();await status(A,'Backup saved. Cloud revision 1');
   assert.equal(docs.get(ownerId).revision,1);
   assert.deepEqual([...objects.keys()].filter(x=>x.startsWith(ownerId+'/'))
    .map(x=>x.split('/')[1]).sort(),
     [originalSHA+'.jpg',cutoutSHA+'.jpg'].sort());
   assert.equal(docs.get(ownerId).document.items[0].color,'Green');
   assert.equal(JSON.stringify(docs.get(ownerId).document).includes('data:image/jpeg'),false);
   await screenshot(A,'A',order,width,'01-cloud-owner-backup-revision1');

   // Different actual browser process B edits locally, then sees A backup,
   // cancels and later approves recovery, proving IDB is NOT shared.
   await B.evaluate(()=>window.research142.changeLocal('Blue',true));
   assert.equal((await state(B)).color,'Blue');
   assert.equal((await state(A)).color,'Green',
    'two independent browser contexts cannot mutate each others IndexedDB');
   const jpegReadsBefore=events.storageReads;
   await B.locator('#restorePreview').click();await status(B,'Restore preview checked');
   assert.equal(events.storageReads,jpegReadsBefore,
    'remote count-only preview must not download private JPEGs');
   assert.equal(await B.locator('#localOutfits').innerText(),'2');
   assert.equal(await B.locator('#remoteOutfits').innerText(),'1');
   await B.locator('#restore').click();await modal(B,'restoreConfirm');
   assert.equal(await B.locator('#restoreLocalOutfits').innerText(),'2');
   assert.equal(await B.locator('#restoreRemoteOutfits').innerText(),'1');
   for(const secret of ['Blue','Green','cloud-outfit-p142',
    'research-p142-reviewed-shirt','data:image/jpeg','closet-photo:'])
    assert.equal((await B.locator('#restoreConfirm').innerText()).includes(secret),false);
   assert.equal(await B.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
    true,'actual phone-sized viewport must not horizontally overflow');
   await screenshot(B,'B',order,width,'02-other-device-restore-consent');
   await B.locator('#restoreCancel').click();await status(B,'Restore cancelled.');
   assert.equal((await state(B)).color,'Blue');
   assert.equal((await state(B)).outfits.length,2);
   await screenshot(B,'B',order,width,'03-local-only-edits-preserved');

   await B.locator('#restore').click();await modal(B,'restoreConfirm');
   await B.locator('#restoreApprove').click();
   await status(B,'Restored verified cloud wardrobe and saved outfits.');
   let restored=await state(B);
   assert.equal(restored.restore?.result?.restored,true);
   assert.equal(restored.restore?.result?.atomic,true);
   assert.equal(restored.color,'Green');
   assert.equal(restored.originalSHA,originalSHA);
   assert.equal(restored.cutoutSHA,cutoutSHA);
   assert.deepEqual(restored.outfits,['cloud-outfit-p142']);
   assert.deepEqual((await state(A)).outfits,['cloud-outfit-p142']);
   await screenshot(B,'B',order,width,'04-double-JPEG-outfit-recovered');

   // Stale B owner backup approval remains open while actual A browser
   // commits a newly reviewed wardrobe, changing remote CAS 1 -> 2.
   await B.evaluate(()=>window.research142.changeLocal('Teal',false));
   await B.evaluate(()=>window.research142.addLook('B-only-stale-look-p142'));
   await B.locator('#backup').click();await modal(B,'confirm');
   assert.equal(await B.locator('#dialogLocalOutfits').innerText(),'2');
   assert.equal(await B.locator('#dialogRemoteOutfits').innerText(),'1');
   await screenshot(B,'B',order,width,'05-stale-backup-owner-decision');
   await A.evaluate(()=>window.research142.changeLocal('Orange',false));
   await A.evaluate(()=>window.research142.addLook('A-new-outfit-v2-p142'));
   await A.locator('#backup').click();await modal(A,'confirm');
   await A.locator('#approve').click();await status(A,'Backup saved. Cloud revision 2');
   assert.equal(docs.get(ownerId).revision,2);
   assert.equal(docs.get(ownerId).document.items[0].color,'Orange');
   assert.deepEqual(docs.get(ownerId).document.state['outfit-board'].saved.map(x=>x.id),
    ['cloud-outfit-p142','A-new-outfit-v2-p142']);
   await B.locator('#approve').click();await status(B,'Cloud backup changed.');
   assert.equal((await state(B)).backup?.code,'remote-changed');
   assert.equal((await state(B)).color,'Teal');
   assert.deepEqual((await state(B)).outfits,
    ['cloud-outfit-p142','B-only-stale-look-p142']);
   assert.equal(docs.get(ownerId).revision,2);
   await screenshot(B,'B',order,width,'06-stale-writer-refused-no-loss');

   // B can explicitly restore A's new revision 2 and exact saved looks.
   await B.locator('#restore').click();await modal(B,'restoreConfirm');
   await B.locator('#restoreApprove').click();
   await status(B,'Restored verified cloud wardrobe and saved outfits.');
   restored=await state(B);
   assert.equal(restored.color,'Orange');
   assert.deepEqual(restored.outfits,['cloud-outfit-p142','A-new-outfit-v2-p142']);
   assert.equal(restored.originalSHA,originalSHA);
   assert.equal(restored.cutoutSHA,cutoutSHA);
   await screenshot(B,'B',order,width,'07-new-backup-restored');

   // B's restore permission for remote rev2 invalidates when A commits
   // independently to rev3 while B's genuine owner modal is still visible.
   await B.locator('#restore').click();await modal(B,'restoreConfirm');
   await A.evaluate(()=>window.research142.changeLocal('Purple',false));
   await A.locator('#backup').click();await modal(A,'confirm');
   await A.locator('#approve').click();await status(A,'Backup saved. Cloud revision 3');
   assert.equal(docs.get(ownerId).revision,3);
   await B.locator('#restoreApprove').click();await status(B,'Cloud backup changed.');
   assert.equal((await state(B)).restore?.code,'remote-changed');
   assert.equal((await state(B)).color,'Orange');
   await screenshot(B,'B',order,width,'08-stale-restore-refused');

   // Local correction during B's next restore modal is preserved.
   await B.locator('#restore').click();await modal(B,'restoreConfirm');
   await B.evaluate(()=>window.research142.changeLocal('Pink',false));
   await B.locator('#restoreApprove').click();await status(B,'Local closet changed.');
   assert.equal((await state(B)).restore?.code,'local-changed');
   assert.equal((await state(B)).color,'Pink');
   assert.equal(docs.get(ownerId).revision,3);
   await screenshot(B,'B',order,width,'09-late-local-edit-preserved');

   // B deliberately chooses to make its own corrected private wardrobe the
   // authoritative remote backup. A now receives it on actual device A.
   await B.locator('#backup').click();await modal(B,'confirm');
   await B.locator('#approve').click();await status(B,'Backup saved. Cloud revision 4');
   assert.equal(docs.get(ownerId).revision,4);
   assert.equal(docs.get(ownerId).document.items[0].color,'Pink');
   assert.deepEqual(docs.get(ownerId).document.state['outfit-board'].saved.map(x=>x.id),
    ['cloud-outfit-p142','A-new-outfit-v2-p142']);
   await screenshot(B,'B',order,width,'10-other-device-backup-revision4');

   await A.locator('#restore').click();await modal(A,'restoreConfirm');
   await A.locator('#restoreApprove').click();
   await status(A,'Restored verified cloud wardrobe and saved outfits.');
   const finalA=await state(A),finalB=await state(B);
   assert.equal(finalA.color,'Pink');
   assert.equal(finalA.originalSHA,originalSHA);
   assert.equal(finalA.cutoutSHA,cutoutSHA);
   assert.deepEqual(finalA.outfits,finalB.outfits);
   assert.deepEqual(finalA.outfits,['cloud-outfit-p142','A-new-outfit-v2-p142']);
   assert.equal(docs.get(ownerId).revision,4);
   await screenshot(A,'A',order,width,'11-reversed-device-restore');

   // Third synthetic account is independent, never learns A/B saved outfits
   // and cannot read the SHA-protected original private Storage object.
   const externalList=await a.context.request.get(origin+
    '/rest/v1/closet_backups?owner_id=eq.'+otherOwner+
    '&select=owner_id,revision,document',{
     headers:{Authorization:'Bearer '+foreignToken,
      apikey:'p142-synthetic-local-only'}
    });
   assert.equal(externalList.status(),200);
   assert.deepEqual(await externalList.json(),[]);
   const foreignManifest=await a.context.request.get(origin+
    '/rest/v1/closet_backups?owner_id=eq.'+ownerId+
    '&select=owner_id,revision,document',{
     headers:{Authorization:'Bearer '+foreignToken,
      apikey:'p142-synthetic-local-only'}
    });
   assert.equal(foreignManifest.status(),403);
   const foreignImage=await a.context.request.get(origin+
    '/storage/v1/object/closet-private/'+ownerId+'/'+originalSHA+'.jpg',{
     headers:{Authorization:'Bearer '+foreignToken,
      apikey:'p142-synthetic-local-only'}
    });
   assert.equal(foreignImage.status(),403);
   assert.equal(events.pageErrors.length,0);
   events.cases.push({
    order,width,actualSeparateChromiumAndWebKitProcesses:true,
    sameSyntheticOwnerOnTwoIndependentIndexedDBStores:true,
    cloudOriginalAndCutoutSHAImmutable:true,
    deviceBBackupRevisionOneRestored:true,
    ownerDeclinePreservedLocalOnlyLook:true,
    lateRemoteBackupCASRefused:true,
    staleBrowserLocalOutfitsPreserved:true,
    updatedRev2OutfitIDsRestored:true,
    postConsentRemoteRestoreRaceRefused:true,
    localOwnerEditDuringRestoreRefused:true,
    deviceBExplicitBackupRevisionFour:true,
    bidirectionalAtoBThenBtoARecovery:true,
    originalAndCutoutSHAReverifiedBothDirections:true,
    foreignSyntheticOwnerDenied:true,
    liveSignedJWT:false,
    shippingCloudUI:false,
    physicalAndroidIPhone:false,
    familyAlpha:'HOLD'
   });
   await b.context.close();await b.browser.close();
   await a.context.close();await a.browser.close();active=[];
  }
 }
 assert.equal(events.cases.length,6);
 assert.equal(events.screenshots.length,66);
 assert.deepEqual(events.pageErrors,[]);
 assert.deepEqual(events.failed,[]);
 assert.deepEqual(events.externalNetwork,[]);
 assert.ok(events.crossOwnerDenied>=12);
 const results={
  priority:'P142-TWO-SEPARATE-BROWSER-ENGINES-OWNER-CLOUD-RECOVERY',
  sourceParent:'e5f4c524a5bb943f4ab98813ceeadfc907b228f0',
  genuineLegalOriginalAndReviewedCutoutSHA:true,
  actualSeparateChromiumAndWebKitBrowserProcesses:true,
  sameSyntheticOwnerAtoBThenBtoARoundTrip:true,
  includedActualP134P137P129P128P126Modules:true,
  realHostedCryptographicSignedJWTA_BTested:false,
  physicalSmartphonesTested:false,
  shippingCloudUIInstalled:false,
  productionOrStagingModified:false,
  familyAlpha:'HOLD',...events
 };
 await writeFile(out+'/results.json',JSON.stringify(results,null,2));
 console.log('P142_CROSS_BROWSER_CLOUD_RECOVERY '+JSON.stringify({
  independentEnginePairs:events.cases.length,
  bothDirections:['chromium-to-webkit','webkit-to-chromium'],
  widths:[320,390,430],genuineScreenshots:events.screenshots.length,
  verifiedOriginalCutoutAndOutfitRecovery:true,
  staleWriterBlocked:true,staleRestoreBlocked:true,
  realSignedJWT:false,shippingAppCloudUI:false,
  physicalPhones:false,familyAlpha:'HOLD'
 }));
}finally{
 for(const entry of active){try{await entry.context.close()}catch{}try{await entry.browser.close()}catch{}}
 await new Promise(ok=>server.close(ok));
}
