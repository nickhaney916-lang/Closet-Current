/**
 * CLOSET CURRENT P140 — genuine Chromium/WebKit owner-BACKUP UI exercise.
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

const root=resolve('.'),out='benchmark/cloud-backup-browser-140';
await mkdir(out,{recursive:true});
const file='benchmark/fixtures/commons-0002.jpg';
const original=readFileSync(file);
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const originalSHA=sha(original);
const evidence=locked.find(x=>x.id==='commons-0002');
assert.ok(evidence?.verified&&evidence.sha256===originalSHA&&
 evidence.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),
 'P140 use only legally sourced independently SHA-locked original JPEG');
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
  // and the P140 isolated HTML; no public app, staging or outside files served.
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
 const s=await window.research140.state();
 return {
  color:s.item?.color,
  outfits:s.board?.saved?.map(x=>x.id)||[],
  code:s.lastOutcome?.code||null,
  kind:s.lastOutcome?.kind||null,
  cancelled:s.lastOutcome?.result?.cancelled||false,
  saved:s.lastOutcome?.result?.saved||false,
  revision:s.lastOutcome?.result?.revision||null,
  busy:s.busy,dialogOpen:s.dialogOpen,status:s.status
 };
});
async function screenshot(page,engine,width,stage){
 const name=engine+'-'+width+'-'+stage+'.png';
 const bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.width,width);assert.equal(meta.height,860);
 assert.ok(bytes.length>4000&&stats.channels.some(c=>c.stdev>8),
  'real browser screenshot must be nonblank');
 await writeFile(out+'/'+name,bytes);
 events.screenshots.push({engine,width,stage,name,sha256:sha(bytes),bytes:bytes.length});
}
const waitDialog=p=>p.locator('#confirm').waitFor({state:'visible',timeout:45000});
const waitStatus=(p,value)=>p.waitForFunction(v=>
 document.getElementById('status')?.textContent.includes(v),value,{timeout:45000});
let browser=null;
try{
 for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
  browser=await driver.launch({headless:true});
  for(const width of [320,390,430]){
   const ownerId=randomUUID(),ownerB=randomUUID();
   const token='p140-unsigned-local-owner-'+ownerId;
   const tokenB='p140-unsigned-local-owner-B-'+ownerB;
   accounts.set(ownerId,token);accounts.set(ownerB,tokenB);
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
   page.on('crash',()=>events.failed.push({engine,width,error:'real browser crash'}));
   await page.goto(origin+'/research/cloud-backup-browser-140/backup-review.html',
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.research140?.seed==='function');
   const ready=await page.evaluate(data=>window.research140.seed(data),{
    ownerId,token,original:uri(original),originalSHA,
    cutout:uri(cutout),cutoutSHA
   });
   assert.equal(ready.ready,true);
   assert.equal(docs.has(ownerId),false,'cloud must initially be absent');

   // Read-only empty cloud preview must never transfer/upload JPEGs.
   const baselineUploads=events.uploads,baselineStorageReads=events.storageReads;
   await page.locator('#preview').click();
   await waitStatus(page,'Preview checked');
   assert.equal(await page.locator('#localClothes').innerText(),'1');
   assert.equal(await page.locator('#remoteClothes').innerText(),'0');
   assert.match(await page.locator('#revision').innerText(),/create-only/);
   assert.equal(events.uploads,baselineUploads);assert.equal(events.storageReads,baselineStorageReads);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
    true,'mobile UI must fit phone-sized width');
   await screenshot(page,engine,width,'01-no-cloud-preview');

   // New backup must be remote CAS 0 only, no destructive consent dialog.
   await page.locator('#backup').click();
   await waitStatus(page,'Backup saved. Cloud revision 1');
   assert.equal(await page.locator('#confirm').isVisible(),false);
   const initial=await snapshot(page);
   assert.equal(initial.saved,true);
   assert.equal(initial.revision,1);
   const first=docs.get(ownerId);
   assert.equal(first.revision,1);
   assert.equal(first.document.items[0].color,'Green');
   assert.equal(first.document.state['outfit-board'].saved.length,1);
   assert.equal(JSON.stringify(first.document).includes('data:image/jpeg'),false);
   const keys=[...objects.keys()].filter(x=>x.startsWith(ownerId+'/'));
   assert.deepEqual(keys.map(k=>k.split('/')[1]).sort(),
    [originalSHA+'.jpg',cutoutSHA+'.jpg'].sort(),
    'original and distinct reviewed cutout must both be immutable SHA objects');
   assert.equal(await page.locator('#remoteOutfits').innerText(),'1');
   await screenshot(page,engine,width,'02-create-only-backup');

   // A local-only edit makes cloud destructive, must show count-only dialog.
   await page.evaluate(()=>window.research140.changeLocal('Red',true));
   await page.locator('#preview').click();
   await waitStatus(page,'Preview checked');
   assert.equal(await page.locator('#localOutfits').innerText(),'2');
   assert.equal(await page.locator('#remoteOutfits').innerText(),'1');
   const objectReads=events.storageReads;
   await page.locator('#preview').click();
   await waitStatus(page,'Preview checked');
   assert.equal(events.storageReads,objectReads,'preview cannot request photo bytes');
   const beforeCancel=docs.get(ownerId).revision;
   await page.locator('#backup').click();
   await waitDialog(page);
   const modal=await page.locator('#confirm').innerText();
   for(const secret of [
    'research-p140-reviewed-shirt','cloud-outfit-p140','local-only-p140-outfit',
    'Red','Green','data:image/jpeg','closet-photo:'
   ])assert.equal(modal.includes(secret),false,
    'real owner dialog must exclude private garment identifiers, labels, photos');
   assert.equal(await page.locator('#dialogLocalOutfits').innerText(),'2');
   assert.equal(await page.locator('#dialogRemoteOutfits').innerText(),'1');
   await screenshot(page,engine,width,'03-owner-replacement-dialog');

   await page.locator('#cancel').click();
   await waitStatus(page,'Cancelled.');
   assert.equal(docs.get(ownerId).revision,beforeCancel);
   assert.equal(docs.get(ownerId).document.items[0].color,'Green');
   assert.equal((await snapshot(page)).color,'Red');
   assert.equal((await snapshot(page)).outfits.length,2);
   await screenshot(page,engine,width,'04-cancel-preserves-cloud');

   // Literal affirmative owner approval performs full cloud replacement.
   await page.locator('#backup').click();
   await waitDialog(page);
   await page.locator('#approve').click();
   await waitStatus(page,'Backup saved. Cloud revision 2');
   const receipt=await snapshot(page);
   assert.equal(receipt.saved,true);assert.equal(receipt.revision,2);
   assert.equal(docs.get(ownerId).revision,2);
   assert.equal(docs.get(ownerId).document.items[0].color,'Red');
   assert.equal(docs.get(ownerId).document.state['outfit-board'].saved.length,2);
   assert.equal((await snapshot(page)).outfits.length,2);
   await screenshot(page,engine,width,'05-approved-safe-replacement');

   // A local edit after modal opens must invalidate human approval.
   await page.locator('#backup').click();
   await waitDialog(page);
   const priorRevision=docs.get(ownerId).revision;
   await page.evaluate(()=>window.research140.changeLocal('Blue',false));
   await page.locator('#approve').click();
   await waitStatus(page,'Local closet changed.');
   const edit=await snapshot(page);
   assert.equal(edit.code,'local-changed');assert.equal(edit.color,'Blue');
   assert.equal(docs.get(ownerId).revision,priorRevision);
   await screenshot(page,engine,width,'06-local-conflict-rejected');

   // Reject a same-revision different cloud doc OR an advanced revision.
   await page.locator('#backup').click();
   await waitDialog(page);
   const cloud=docs.get(ownerId);
   if(width===320){
    cloud.revision++;
   }else{
    cloud.document=structuredClone(cloud.document);
    cloud.document.items[0].color='unreviewed-remote-device-edit';
   }
   await page.locator('#approve').click();
   await waitStatus(page,'Cloud backup changed.');
   const conflict=await snapshot(page);
   assert.equal(conflict.code,'remote-changed');
   assert.equal(conflict.color,'Blue');
   assert.equal(docs.get(ownerId).revision,priorRevision+(width===320?1:0));
   await screenshot(page,engine,width,'07-remote-conflict-rejected');

   // A revoked owner during an outstanding literal approval never commits.
   await page.locator('#backup').click();
   await waitDialog(page);
   const beforeRevoke=docs.get(ownerId).revision;
   await page.evaluate(()=>window.research140.invalidateOwner());
   await page.locator('#approve').click();
   await waitStatus(page,'Backup stopped');
   assert.equal(docs.get(ownerId).revision,beforeRevoke);
   assert.equal((await snapshot(page)).color,'Blue');
   await screenshot(page,engine,width,'08-owner-revoked-no-write');

   // Separate synthetic owner never sees A's photo or A's metadata.
   const bList=await context.request.get(origin+
    '/rest/v1/closet_backups?owner_id=eq.'+ownerB+
    '&select=owner_id,revision,document',{headers:{
     Authorization:'Bearer '+tokenB,apikey:'p140-synthetic-local-only'
    }});
   assert.equal(bList.status(),200);assert.deepEqual(await bList.json(),[]);
   const bForeign=await context.request.get(origin+
    '/storage/v1/object/closet-private/'+ownerId+'/'+originalSHA+'.jpg',
    {headers:{Authorization:'Bearer '+tokenB,
     apikey:'p140-synthetic-local-only'}});
   assert.equal(bForeign.status(),403);
   const flags=await page.evaluate(()=>window.research140.flags());
   assert.deepEqual(flags,{researchOnly:true,liveSignedJwt:false,
    actualP134BrowserMounted:true,productionAuthorized:false,familyAlpha:'HOLD'});
   events.cases.push({
    engine,width,actualBrowserP134Consent:true,
    createOnlyRevisionZero:true,originalAndCutoutSHAJPGStored:true,
    privateOwnerDialogNoClothingData:true,
    realOwnerCancellationBeforeOverwrite:true,
    actualOwnerApprovedCloudReplacement:true,
    localSourceEditDuringConsentRejected:true,
    remoteRevisionOrSameRevisionDocEditRejected:true,
    ownerRevokeDuringConsentDenied:true,
    secondSyntheticOwnerStorageDenied:true,
    liveSignedJWTVerified:false,physicalDeviceVerified:false,
    deployed:false,familyAlpha:'HOLD'
   });
   await context.close();
  }
  await browser.close();browser=null;
 }
 assert.equal(events.cases.length,6);
 assert.equal(events.screenshots.length,48);
 assert.deepEqual(events.pageErrors,[]);
 assert.deepEqual(events.failed,[]);
 assert.deepEqual(events.externalNetwork,[]);
 assert.ok(events.crossOwnerDenied>=6);
 const results={
  priority:'P140-CLOUD-BACKUP-BROWSER-OWNER-REVIEW',
  parentExactHead:'5a589dfe2f6fb744cade4150c3058f2d6a19ea3b',
  genuineOriginalLicensedAndSHAValidated:true,
  genuineOriginalAndCutoutJPEGsVerified:true,
  actualP134MountedInResearchBrowser:true,
  actualShippingCloudUIIntegrated:false,
  signedTokensAndHostedA_BAcceptance:false,
  realPhysicalAndroidOrIphone:false,
  productionOrExistingStagingModified:false,
  familyAlpha:'HOLD',...events
 };
 await writeFile(out+'/results.json',JSON.stringify(results,null,2));
 console.log('P140_ACTUAL_BROWSER_CLOUD_BACKUP_RESEARCH '+JSON.stringify({
  genuineBrowserCases:events.cases.length,
  chromiumWidths:[320,390,430],webkitWidths:[320,390,430],
  genuineScreenshots:events.screenshots.length,
  actualP134ResearchBrowserMounted:true,
  shippingAppCloudUI:false,signedJWT:false,
  physicalPhones:false,familyAlpha:'HOLD'
 }));
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
