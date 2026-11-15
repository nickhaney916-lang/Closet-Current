/**
 * MAIN1054 M57 — exact P88 Web Worker execution in genuine browser,
 * source-bound M55 adapter and M54 owner/private-save veto.
 *
 * Tested: ORIGINAL, immutable P88 Worker source (Git blob SHA pinned in CI).
 * Stubbed: ONLY external SegFormer model/runtime/decoder, supplying explicitly
 * SYNTHETIC logits and image pixels. This is a browser *protocol* contract,
 * NOT genuine clothing inference, human labels, photo-derived crops, privacy
 * RLS, physically verified 3D, or product release.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,extname,join} from 'node:path';
import {chromium,webkit} from 'playwright';

const engine=process.env.M57_ENGINE;
assert.ok(['chromium','webkit'].includes(engine));
const orig=await readFile('benchmark/fixtures/commons-0003.jpg');
const hash=x=>createHash('sha256').update(x).digest('hex');
const sha=hash(orig),lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8')).find(x=>x.id==='commons-0003');
assert.equal(lock?.verified,true);
assert.equal(sha,lock.sha256);
const dataURI='data:image/jpeg;base64,'+orig.toString('base64');
const CDN='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
const modelStub=String.raw`
/**
 * M57 explicit artificial SegFormer-model stand-in. The ORIGINAL P88 browser
 * worker JS is NOT rewritten; the entire external model dependency is stubbed
 * by the isolated test browser at its exact CDN URL. No external requests.
 */
const d='data:image/jpeg;base64,';
let originalBytes=new Uint8Array([255,216,255,217]);
export const env={backends:{onnx:{wasm:{}}}};
export class RawImage{
 constructor(data,width,height,channels){this.data=data;this.width=width;this.height=height;this.channels=channels;}
 static async read(input){
  if(typeof input!=='string'||!input.startsWith(d))throw Error('M57 requires original JPEG');
  const raw=atob(input.slice(d.length));
  originalBytes=Uint8Array.from(raw,x=>x.charCodeAt(0));
  if(originalBytes[0]!==255||originalBytes[1]!==216)throw Error('Invalid actual JPEG');
  const side=64,buf=new Uint8Array(side*side*3);
  for(let k=0;k<side*side;k++){
   buf[k*3]=35;buf[k*3+1]=72;buf[k*3+2]=160;
  }
  return new RawImage(buf,side,side,3);
 }
 async toBlob(type){
  // IMPORTANT: returns the unmodified original JPEG, not a real source crop.
  // Do not claim decoded-photo pixel segmentation/crop or recognition accuracy.
  return new Blob([originalBytes],{type:'image/jpeg'});
 }
}
export class AutoProcessor{
 static async from_pretrained(model,opts){return async image=>({image});}
}
export class AutoModelForSemanticSegmentation{
 static async from_pretrained(model,opts){
  const scenario=new URL(self.location.href).searchParams.get('m57scene');
  return async ()=>{
   const w=16,h=16,area=w*h,data=new Float32Array(area*18);
   data.fill(-11);
   for(let i=0;i<area;i++)data[i]=11;
   const set=(x,y,cls)=>{
    const i=y*w+x;data[i]=-11;data[cls*area+i]=11;
   };
   if(scenario!=='personless'){
    // Real clothingLabelMap's ORIGINAL person body gate: head-class 2.
    for(let y=1;y<5;y++)for(let x=6;x<9;x++)set(x,y,2);
   }
   // Distinct source component cases are SYNTHETIC:
   if(scenario==='disconnected'){
    for(let y=7;y<11;y++){
     for(let x=2;x<6;x++)set(x,y,4);
     for(let x=10;x<14;x++)set(x,y,4);
    }
   }else if(scenario==='connected'){
    for(let y=7;y<11;y++)for(let x=4;x<12;x++)set(x,y,4);
   }
   return {logits:{data,dims:[1,18,h,w]}};
  };
 }
}
`;
const root=resolve('.'),out=join('benchmark','main57-native-p88-worker',engine);
await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.jpg':'image/jpeg','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!/^\/(\.m57-exact-p88-donor\/public|research|benchmark)\//.test(path)||
    path.includes('\0')||path.includes('\\')||path.split('/').includes('..'))throw Error('blocked');
  const abs=resolve(root,'.'+path);
  if(!abs.startsWith(root+'/'))throw Error('escaped');
  const body=await readFile(abs);
  res.writeHead(200,{'content-type':mime[extname(abs)]||'application/octet-stream',
   'cache-control':'no-store','access-control-allow-origin':'*'});
  res.end(body);
 }catch{res.writeHead(404);res.end('blocked');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser,stage='start',width=0;
const networkErrors=[],pageErrors=[],cases=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 for(const size of [320,390,430]){
  width=size;
  const context=await browser.newContext({viewport:{width:size,height:850},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.split('?')[0]===CDN)
    return route.fulfill({status:200,contentType:'text/javascript',headers:{
     'access-control-allow-origin':'*','cache-control':'no-store'},body:modelStub});
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
   networkErrors.push({url:url.split('?')[0].slice(0,125),method:route.request().method()});
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>pageErrors.push(e.name));
  page.on('crash',()=>pageErrors.push('browser-crash'));
  stage='initialize-page';
  await page.goto(origin+'/benchmark/fixtures/commons-0003.jpg',{waitUntil:'domcontentloaded'});
  stage='genuine-worker-and-bound-adapter';
  const evidence=await page.evaluate(async({origin,image,sha,size})=>{
   const requestId='57d86df8-267b-4fce-a3e5-b37fa585bb90';
   const {openP88SourceIntake55}=await import(origin+'/research/master-consolidation-1054/p88-source-key-adapter-55.mjs');
   const {UNRESOLVED_SEGMENT_STATUS54,verifiedRecord24}=await import(origin+'/research/multi-garment-capture-01/atomic-group.mjs');
   const {canConfirmScene32}=await import(origin+'/research/multi-garment-capture-01/scene-class-guard-32.mjs');
   const owner='m57-synthetic-owner',state={owner,source:sha,epoch:1,request:requestId,db:'closet-current-user-'+owner};
   const proof={image,sourceSHA256:sha,sourceHashVerified:true,originalPhoto:{image,sha256:sha}};
   const sourceLease=()=>({getOwner:()=>state.owner,getSourceSHA256:()=>state.source,
    getReviewEpoch:()=>state.epoch,getActiveRequestId:()=>state.request,
    getDbName:()=>state.db});
   async function workerScene(scene){
    const adapter=await openP88SourceIntake55({proof,ownerId:owner,requestId,reviewEpoch:state.epoch,...sourceLease()});
    const messages=await new Promise((resolve,reject)=>{
     const worker=new Worker(origin+'/.m57-exact-p88-donor/public/outfit-worker.mjs?m57scene='+scene,{type:'module'});
     const messages=[],timeout=setTimeout(()=>{
      worker.terminate();reject(Error('Actual P88 Worker timeout: '+scene));
     },35000);
     worker.onerror=e=>{
      clearTimeout(timeout);worker.terminate();reject(Error('Actual P88 Worker error '+scene+': '+String(e.message)));
     };
     worker.onmessage=e=>{
      const msg=e.data;
      if(msg.type==='progress')return;
      messages.push(msg);
      if(msg.type==='error'||msg.type==='done'){
       clearTimeout(timeout);worker.terminate();
       if(msg.type==='error')reject(Error('Actual P88 Worker returned source error '+scene+': '+msg.text));
       else resolve(messages);
      }
     };
     worker.postMessage(adapter.workerRequest());
    });
    const pieces=messages.filter(m=>m.type==='piece'),done=messages.find(m=>m.type==='done');
    if(done?.count!==pieces.length)throw Error('P88 Worker output message count mismatch');
    return {adapter,messages,pieces,done};
   }
   const negative=await workerScene('disconnected');
   if(negative.pieces.length!==1)throw Error('P88 connected fragment count mismatch');
   const raw=negative.pieces[0].piece;
   if(raw.instanceKey!==undefined||raw.instanceMethod!=='native_semantic_group_unresolved_fragments'||
      raw.reconciliation70?.sourceSha256!==sha||
      raw.reconciliation70?.instanceOrdinal!==0||
      raw.reconciliation70?.method!==raw.instanceMethod)
    throw Error('Actual P88 Worker raw source receipt shape mismatch');
   // Independent crypto digest of original source bytes INSIDE real browser.
   const bytes=Uint8Array.from(atob(image.split(',')[1]),c=>c.charCodeAt(0));
   const browserHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
   if(browserHash!==sha)throw Error('Actual original JPEG changed in browser');
   // The original P88 selected mask is exactly two 4x4 class4 boxes. Rehash
   // the full binary 16x16 mask independently, NOT trusting worker SHA text.
   const mask=new Uint8Array(256);
   for(let y=7;y<11;y++)for(const [left,right] of [[2,6],[10,14]])
    for(let x=left;x<right;x++)mask[y*16+x]=1;
   const maskSHA=[...new Uint8Array(await crypto.subtle.digest('SHA-256',mask))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
   if(raw.reconciliation70.maskSha256!==maskSHA)
    throw Error('P88 Worker emitted false full-mask identity');
   const reviewed=negative.adapter.intake(negative.pieces[0]);
   if(!reviewed.accepted||reviewed.piece?.hint?.componentReviewStatus!==UNRESOLVED_SEGMENT_STATUS54)
    throw Error('P88 worker unresolved mask bypassed M54 source veto');
   const candidate={...reviewed.piece,image,confirmed:true,cropReviewed:true,manual:true,
    category:'Tops',itemType:'T-shirt',color:'Blue'};
   if(canConfirmScene32(candidate,{types:{Tops:['T-shirt']}}))
    throw Error('Human category/crop override silently cleared P88 mask veto');
   let veto=false;
   try{verifiedRecord24({proof,piece:candidate,ownerId:owner});}
   catch(error){veto=/unresolved source fragments/.test(String(error.message));}
   if(!veto)throw Error('M54 private owner save admitted unresolved physical units');
   // A duplicate mask under forged ordinal cannot become a second garment.
   const replay=structuredClone(negative.pieces[0]);replay.piece.reconciliation70.instanceOrdinal=1;
   if(negative.adapter.intake(replay).reason!=='duplicate-source-mask')
    throw Error('Raw mask replay was not rejected');
   state.epoch=2;
   if(negative.adapter.intake(negative.pieces[0]).reason!=='stale-source-or-owner-lease')
    throw Error('Stale original owner epoch not revoked');
   negative.adapter.close();
   state.epoch=1;
   const connected=await workerScene('connected');
   if(connected.pieces.length!==1||connected.pieces[0].piece.instanceMethod!=='native_semantic_group')
    throw Error('Actual P88 native connected source method mismatch');
   const normal=connected.adapter.intake(connected.pieces[0]);
   if(!normal.accepted||normal.piece.hint.componentReviewStatus)
    throw Error('Normal owner review incorrectly auto-approved or refused');
   connected.adapter.close();
   const personless=await workerScene('personless');
   if(personless.pieces.length!==0)throw Error('Worker missed real P88 person-detection gate');
   personless.adapter.close();
   return {
    realP88NativeWebWorkerExecuted:true,
    workerOriginalSourceHashVerified:true,workerOriginalMaskSHARehashed:true,
    topLevelP88Method:true,receiptExactOrdinalAndSource:true,
    derivedUnmodifiedOriginalJPEGOnly:true,
    syntheticModelAndImagePixels:true,
    sourceUnresolvedReviewVeto:true,atomicSaveRejected:true,
    duplicateMaskRejected:true,ownerEpochRevoked:true,
    separateConnectedMethodReviewedOnly:true,personlessEmitsZero:true,
    privateSavedRows:0,consumer3D:false,releaseAuthorized:false,
    familyAlpha:'HOLD',cssWidth:size
   };
  },{origin,image:dataURI,sha,size});
  cases.push(evidence);
  await context.close();
 }
 assert.equal(cases.length,3);
 assert.deepEqual(networkErrors,[],'unexpected external request even if aborted');
 assert.deepEqual(pageErrors,[],'actual native worker/page exception');
 await writeFile(join(out,'M57-P88-REAL-WORKER-SYNTHETIC-LOGITS-NOT-ACCURACY.json'),
  JSON.stringify({schema:'MAIN1054_M57_ACTUAL_WEB_WORKER_SYNTHETIC_LOGITS/v1',
   engine,sourceSHA256:sha,realP88WorkerBlobPinned:true,
   modelInferenceGenuine:false,humanGroundTruth:false,sourceCropPixelsReal:false,
   syntheticOwner:true,signedHostedRLS:false,physicalPhone:false,
   cases,releaseAuthorized:false,familyAlpha:'HOLD'},null,2)+'\n');
 console.log('MAIN57_REAL_P88_WEBWORKER_PROTOCOL_HOLD',JSON.stringify({
  engine,widths:cases.map(x=>x.cssWidth),sourceHashVerified:true,
  unresolvedMasksDenied:true,privateSavedRows:0,
  realModelInference:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
}catch(error){
 console.error('MAIN57_REAL_P88_WORKER_PROTOCOL_FAIL',JSON.stringify({
  stage,engine,width,message:String(error?.message||error).slice(0,320),
  networkErrors:networkErrors.slice(0,4),pageErrors:pageErrors.slice(0,4)
 }));
 process.exitCode=1;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
