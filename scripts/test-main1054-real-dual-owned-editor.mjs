/** MAIN1054: true native clothingFields plus M1 P875 policy in browser.
 * Generated decoded JPEG fixtures and synthetic owners; NEVER real customer
 * data, hosted cloud, model inference, physical phones or deploy.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('public'),out=resolve('benchmark/main1054-real-dual-owner-review');
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const ids=(process.env.MAIN1054_REAL_IDS||'commons-0035,commons-0062,commons-0078,commons-0059').split(',');
const fixed=['commons-0035','commons-0045','commons-0062','commons-0088','commons-0001','commons-0094','commons-0078','commons-0059'];
assert.ok(ids.length>=2&&ids.length<=8&&ids.every((id,i)=>fixed.includes(id)&&ids.indexOf(id)===i));
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const photos=[];
for(const id of ids){
 const receipt=manifest.find(row=>row.id===id);
 assert.ok(receipt?.verified&&receipt.sha256&&receipt.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 assert.ok(['CC0','Public domain','CC BY 2.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0'].includes(receipt.attribution.license));
 const bytes=await readFile('benchmark/photos/'+receipt.image);
 assert.equal(sha(bytes),receipt.sha256,id+' immutable public JPEG SHA check');
 assert.ok(bytes.length>1000&&bytes.length<8*1024*1024);
 photos.push({id,sourceSHA256:receipt.sha256,license:receipt.attribution.license,
  image:'data:image/jpeg;base64,'+bytes.toString('base64')});
}
const app=await readFile(resolve(root,'app.js'),'utf8');
const start=app.indexOf('function node('),end=app.indexOf('function cropClothingPhoto(');
assert.ok(start>0&&end>start,'true native clothingFields source boundaries absent');
const nativeFields=app.slice(start,end);
assert.match(nativeFields,/function clothingFields\(/);
const taxonomy=await readFile(resolve(root,'taxonomy.js'),'utf8');
const details=await readFile(resolve(root,'clothing-details.js'),'utf8');
const served={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.bin':'application/octet-stream','.onnx':'application/octet-stream','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'});return res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M4 M1 native owner-review test</title><body></body></html>');}
  const p=decodeURIComponent(url.pathname);
  if(req.method!=='GET'||p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))throw Error('bad resource');
  const model=p.startsWith('/_dual82/'),base=model?resolve('benchmark/p82-model-assets'):root,asset=model?p.slice('/_dual82'.length):p;const file=resolve(base,'.'+asset);if(!file.startsWith(base+'/'))throw Error('outside');
  const b=await readFile(file);res.writeHead(200,{'content-type':served[extname(file)]||'application/octet-stream'});res.end(b);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const boot=`
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
${taxonomy}
${details}
${nativeFields}
window.writes1054=0;
window.stage1054=async({hash=true,segmented=false,owned=false,owner='owner-A',mode='joint',onHold=false}={})=>{
 for(const p of document.querySelectorAll('dialog')){p.close();p.remove();}
 window.owner1054={id:owner};window.auth1054={user:window.owner1054};window.db1054={name:'closet-current-user-'+owner};
 window.epoch1054='test-epoch-'+crypto.randomUUID();window.writes1054=0;
 window.mode1054=mode;window.hold1054=onHold;window.requests1054=0;window.effects1054=0;window.actual1054=null;window.workerError1054=null;
 const raw=window.publicPhoto1054,sha=window.publicSHA1054;
 const item={
  id:'owner-photo-1',ownerId:owner,image:raw,
  originalPhoto:{image:raw,sha256:sha},sourceSHA256:hash?sha:'f'.repeat(64),
  sourceHashVerified:hash,category:'Bottoms',itemType:'Unknown',
  color:'Blue',colorSource:'user',userAdjusted:true,
  sleeveLength:'Not applicable',seasons:[],notes:''
 };
 if(segmented){item.segmentHint={clipped:true};item.outfitSourceId='different-photo';}
 window.item1054=item;window.items1054=owned?[item]:[];window.batch1054=owned?[]:[item];
 const dialog=document.createElement('dialog'),form=document.createElement('form');
 window.dialog1054=dialog;window.form1054=form;window.draft1054=structuredClone(item);
 clothingFields(form,window.draft1054);
 const ownerAck=document.createElement('input');ownerAck.type='checkbox';ownerAck.setAttribute('aria-label','I verified the garment photo before saving');form.append(ownerAck);window.ack1054=ownerAck;
 dialog.append(form);document.body.append(dialog);dialog.showModal();
 const {mountMission4DualReview1054}=await import('/m4-dual-review-1054.mjs');
 const {VERSION82,MODEL_ASSETS82}=await import('/dual-core-82.mjs');
 const {localCandidates}=await import('/local-catalog.mjs');
 const {observation81}=await import('/model-arbitration-81.mjs');
 const request=async(r,options)=>{
  window.requests1054++;
  try{
   const {browserRequest82}=await import('/dual-core-82.mjs');
   const output=await browserRequest82(r,options);
   window.actual1054={request:r,output};
   return output;
  }catch(error){window.workerError1054=String(error?.message||error);throw error;}
 };
 try{
  window.mounted1054=await mountMission4DualReview1054({
   form,dialog,item,draft:window.draft1054,
   editorSession:{current:()=>window.auth1054?.user===window.owner1054},
   getItems:()=>window.items1054,getBatch:()=>window.batch1054,
   getDb:()=>window.db1054,getEpoch:()=>window.epoch1054,
   getAuth:()=>window.auth1054,getSchema:()=>clothingSchema,
   saving:()=>false,request,supported:true
  });
  window.error1054=null;
 }catch(e){window.error1054=String(e.message||e);window.mounted1054=null;}
 return {mounted:!!window.mounted1054,error:window.error1054};
};
window.revoke1054=kind=>{
 if(kind==='owner')window.auth1054={user:{id:'owner-B'}};
 if(kind==='relogin')window.epoch1054='replacement-epoch';
 if(kind==='source')window.item1054.sourceSHA256='0'.repeat(64);
 if(kind==='lock')window.dispatchEvent(new Event('closet:session-locked'));
};
window.result1054=()=>({
 writes:window.writes1054,requests:window.requests1054,
 item:window.item1054.itemType,draft:window.draft1054.itemType,
 ack:window.ack1054.checked,photo:window.item1054.originalPhoto.image,
 panel:!!document.querySelector('[data-dual82]'),
 valid:window.mounted1054?.active()||false
});
`;
const results=[],requests=[],pageErrors=[];
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await ctx.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(host+'/')&&route.request().method()==='GET')return route.continue();
  requests.push({url:url.slice(0,160),method:route.request().method(),blocked:true});
  return route.abort();
 });
 const page=await ctx.newPage();
 page.setDefaultTimeout(300000);
 page.on('pageerror',e=>pageErrors.push(e.message));
 page.on('request',r=>requests.push({local:r.url().startsWith(host+'/'),method:r.method(),path:new URL(r.url()).pathname}));
 await page.goto(host+'/');
 await page.addScriptTag({content:boot});
 for(const photo of photos){
  await page.evaluate(p=>{window.publicPhoto1054=p.image;window.publicSHA1054=p.sourceSHA256;},photo);
  const mounted=await page.evaluate(()=>window.stage1054());
  assert.equal(mounted.mounted,true,photo.id+': '+JSON.stringify(mounted));
  const state=await page.evaluate(()=>window.result1054());
  assert.equal(state.requests,0);
  assert.equal(state.writes,0);
  assert.equal(state.ack,false);
  await page.getByRole('checkbox',{name:/I consent to a local two-model/}).check();
  await page.getByRole('checkbox',{name:/One garment is isolated/}).check();
  await page.getByRole('button',{name:'Compare with two models'}).click();
  await page.waitForFunction(()=>window.actual1054!==null||window.workerError1054!==null,null,{timeout:300000});
  const receipt=await page.evaluate(async()=>{
   if(window.workerError1054)return {error:window.workerError1054};
   const {validateResponse82}=await import('/dual-core-82.mjs');
   const {sharedRankChoices82}=await import('/dual-panel-82.mjs');
   const {output,request}=window.actual1054;
   const decision=validateResponse82(output,request);
   const choices=sharedRankChoices82(decision,output.observations);
   return {decisionStatus:decision.status,reasons:decision.reasons,
    modelKeys:output.observations.map(o=>o.modelKey),
    topRankings:output.observations.map(o=>({model:o.modelKey,
     category:o.ranking[0]?.category,type:o.ranking[0]?.itemType,count:o.ranking.length})),
    totalMs:output.totalMs,automaticAdmissions:output.automaticAdmissions,
    actionable:choices.map(x=>({category:x.category,type:x.itemType})),
    visibleOptions:[...document.querySelectorAll('[data-dual82] button')].filter(b=>b.textContent.startsWith('Use ')).length,
    draft:window.draft1054.itemType,savedItem:window.item1054.itemType,
    savedOriginal:window.item1054.image===window.item1054.originalPhoto.image,
    receiptSHA:window.item1054.sourceSHA256===window.item1054.originalPhoto.sha256,
    userConfirmed:window.ack1054.checked,writes:window.writes1054};
  });
  assert.equal(receipt.error,undefined,photo.id+': genuine model runner failed '+JSON.stringify(receipt));
  assert.deepEqual(new Set(receipt.modelKeys),new Set(['fashionclip','fashionSiglip']));
  assert.equal(receipt.automaticAdmissions,0);
  assert.equal(receipt.savedOriginal,true);assert.equal(receipt.receiptSHA,true);
  assert.equal(receipt.userConfirmed,false);assert.equal(receipt.writes,0);
  assert.equal(receipt.savedItem,'Unknown');
  assert.equal(receipt.visibleOptions,receipt.actionable.length);
  const button=page.locator('[data-dual82] button').filter({hasText:/^Use /}).first();
  if(receipt.actionable.length){
   await button.click();
   assert.equal((await page.evaluate(()=>window.result1054())).draft,'Unknown','no model suggestion applied without owner acknowledgement');
   await page.getByRole('checkbox',{name:/I compared the original photo/}).check();
   await button.click();
   const changed=await page.evaluate(()=>window.result1054());
   assert.notEqual(changed.draft,'Unknown','only explicitly chosen unsaved draft can change');
   assert.equal(changed.item,'Unknown');assert.equal(changed.ack,false);assert.equal(changed.writes,0);
  }else{
   assert.equal(receipt.visibleOptions,0);
  }
  results.push({id:photo.id,sourceSHA256:photo.sourceSHA256,license:photo.license,
   decisionStatus:receipt.decisionStatus,reasons:receipt.reasons,modelKeys:receipt.modelKeys,
   topRankings:receipt.topRankings,actionable:receipt.actionable,
   autoAdmissions:0,privateWrites:0,humanConfirmed:false,
   madeUnsavedSuggestion:receipt.actionable.length>0,
   modelRuntimeMs:receipt.totalMs,independentGroundTruth:false});
  console.log('MAIN1054_REAL_DUAL_NATIVE_ROW',JSON.stringify({id:photo.id,
   decision:receipt.decisionStatus,modelKeys:receipt.modelKeys,
   actionable:receipt.actionable.length,unsaved:receipt.actionable.length>0,
   realModelMilliseconds:Math.round(receipt.totalMs)}));
 }
 await page.evaluate(()=>window.revoke1054('lock'));
 assert.equal(await page.locator('[data-dual82]').count(),0);
 assert.equal(await page.evaluate(()=>window.writes1054),0);
 assert.deepEqual(pageErrors,[],'source-executed native page errors');
 assert.ok(requests.every(x=>x.local!==false&&x.method==='GET'&&x.blocked!==true),
  'network must be restricted to same-origin GET assets');
 const summary={schema:'MAIN1054_REAL_DUAL_NATIVE_PUBLIC_DEVELOPMENT_V1',status:'PUBLIC_DEVELOPMENT_ONLY',
  browser:'one-continuous-desktop-Chromium-session-'+photos.length+'-real-one-shot-workers',
  photos:results.length,models:['FashionCLIP q8 WASM','FashionSigLIP q8 WASM'],
  actualNativeClothingFields:true,sourcePhotoHashesVerified:true,
  injectedSyntheticModelOutput:false,syntheticOwner:true,
  blindIndependentHumanLabels:0,accuracy:null,physicalDevices:0,
  hostedSupabase:false,privateWardrobeWrites:0,autoAdmissions:0,
  fitted3D:false,releaseReady:false,familyAlpha:'HOLD'};
 await writeFile(out+'/results.json',JSON.stringify({summary,rows:results},null,2)+'\n');
 console.log('MAIN1054_REAL_DUAL_NATIVE_SUMMARY',JSON.stringify({photos:results.length,
  modelCount:2,actions:results.reduce((n,r)=>n+r.actionable.length,0),
  noAction:results.filter(r=>!r.actionable.length).length,
  realModels:true,zeroPrivateWrites:true,accuracy:null,physicalDevices:0}));
}catch(e){console.error('MAIN1054_REAL_DUAL_NATIVE_ERROR',String(e),JSON.stringify(pageErrors));process.exitCode=1;}
finally{await browser?.close();await new Promise(done=>server.close(done));}
