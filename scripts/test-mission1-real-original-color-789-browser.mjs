/**
 * P789 — genuine original, immutable B0 semantic pixels and source-photo color.
 * Five pre-exposed Wikimedia originals are publisher-title color proxies,
 * NOT independent color masks, human adjudication or a fresh holdout.
 * Only hashes, proposal counts and aggregate labels enter the artifact.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import {isPinnedModelAsset,routePinnedModelAsset} from '../research/real-mask-evidence-31/model-assets.mjs';
const HASH=x=>createHash('sha256').update(x).digest('hex');
const ids=[
 {id:'commons-0002',titleColor:'Red',family:'UpperGarment',requiredTitle:/Rood t-shirt/i},
 {id:'commons-0003',titleColor:'Black',family:'UpperGarment',requiredTitle:/Zwart shirt/i},
 {id:'commons-0023',titleColor:'Blue',family:'Bottoms',requiredTitle:/Blauwe jeans/i},
 {id:'commons-0033',titleColor:'Orange',family:'Bottoms',requiredTitle:/Old Bull Lee - Orange/i},
 {id:'validation-0017',titleColor:'Gray',family:'Bottoms',requiredTitle:/Grey Jeans/i}
];
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const source=[];
for(const expected of ids){
 const m=manifest.find(x=>x.id===expected.id);
 assert.ok(m?.verified&&m?.attribution?.license&&m.attribution?.source&&
  expected.requiredTitle.test(m.attribution.title),'published exact source/category/color title');
 const bytes=await readFile('benchmark/mission1-original-mask-color-789/originals/'+m.image);
 assert.equal(HASH(bytes),m.sha256,'SHA-pinned genuine published original required');
 assert.ok(bytes.length>1024&&bytes.length<8*1024*1024);
 source.push({...expected,sourceSHA256:m.sha256,license:m.attribution.license,
  attributionTitle:m.attribution.title,data:'data:image/jpeg;base64,'+bytes.toString('base64')});
}
const root=resolve('.'),out='benchmark/mission1-original-mask-color-789';
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||path.includes('..')||path.includes('\\'))throw Error('forbidden');
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><meta charset="utf-8"><script src="/public/photo-color.js"></script><p>Genuine already-exposed publisher-photo model color diagnostics; all findings review only</p>');return;}
  if(!/^\/(?:public|research)\/[-\w./]+\.(?:mjs|js)$/.test(path))throw Error('forbidden');
  const absolute=resolve(root,'.'+path);
  if(!absolute.startsWith(root+'/'))throw Error('forbidden');
  res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});
  res.end(await readFile(absolute));
 }catch{res.writeHead(404).end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const rows=[],blocked=[];
try{
 for(const [engine,launcher,entries] of [
  ['chromium',chromium,source],
  ['webkit',webkit,source.filter(x=>['commons-0002','commons-0023','commons-0033'].includes(x.id))]
 ]){
  const browser=await launcher.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const context=await browser.newContext({viewport:{width:390,height:900},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const cache=new Map();
   await context.route('**/*',route=>{
    const url=route.request().url();
    if(!['GET','HEAD'].includes(route.request().method())){blocked.push('write');return route.abort();}
    if(url.startsWith(origin+'/'))return route.continue();
    if(isPinnedModelAsset(url))return routePinnedModelAsset(route,cache);
    blocked.push(new URL(url).origin);return route.abort();
   });
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/');
    for(const entry of entries){
     const receipt=await page.evaluate(async({entry})=>{
      const img=new Image();img.src=entry.data;await img.decode();
      if(!img.naturalWidth||!img.naturalHeight)throw Error('invalid actual original decode');
      const max=3072,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const aw=Math.round(img.naturalWidth*scale),ah=Math.round(img.naturalHeight*scale);
      const cv=document.createElement('canvas');cv.width=aw;cv.height=ah;
      cv.getContext('2d').drawImage(img,0,0,aw,ah);
      const analysisRGBA=cv.getContext('2d',{willReadFrequently:true}).getImageData(0,0,aw,ah).data;
      const analysisImage=cv.toDataURL('image/jpeg',.92);
      window.worker789??=new Worker('/research/real-mask-evidence-31/worker.mjs',{type:'module'});
      window.m1ColorSequence789=(window.m1ColorSequence789||789)+1;
      const seq=window.m1ColorSequence789;
      const observed=await new Promise((done,reject)=>{
       const timeout=setTimeout(()=>reject(Error('real frozen B0 timeout')),390000);
       window.worker789.onmessage=e=>{
        if(e.data.id!==seq)return;
        if(e.data.type==='done'){clearTimeout(timeout);done(e.data.result);}
        if(e.data.type==='error'){clearTimeout(timeout);reject(Error(JSON.stringify(e.data)));}
       };
       window.worker789.postMessage({id:seq,sourceId:entry.id+'-'+entry.sourceSHA256,
        analysisImage,originalWidth:img.naturalWidth,originalHeight:img.naturalHeight,
        analysisRGBA,analysisWidth:aw,analysisHeight:ah},[analysisRGBA.buffer]);
      });
      if(observed.model!=='Xenova/segformer_b0_clothes'||
         observed.modelRevision!=='a2489ea8e7ec1ee912190546bad31a4906ccca76'||
         observed.maskPixelMembershipConserved!==true||
         observed.sourcePixelsNeverReturned!==true)
       throw Error('actual pinned SegFormer original source provenance missing');
      const [w,h]=observed.modelMask;
      if(!Number.isInteger(w)||!Number.isInteger(h)||w>512||h>512)throw Error('model map resolution');
      const map=Uint8Array.from(atob(observed.labelMapBase64),c=>c.charCodeAt(0));
      if(map.length!==w*h)throw Error('worker model pixel count mismatch');
      // Resample ORIGINAL decoded photo once to true B0 model-raster size.
      // Do not insert pixels from external color labels or model masks.
      const raw=document.createElement('canvas');raw.width=w;raw.height=h;
      const context=raw.getContext('2d',{willReadFrequently:true});
      context.drawImage(img,0,0,w,h);
      const rgba=context.getImageData(0,0,w,h).data;
      const {modelMaskedColorReview789}=await import('/research/mission1-original-mask-color-789/source-color-evidence.mjs');
      const proposed=await modelMaskedColorReview789({
       sourceSHA256:entry.sourceSHA256,
       sourceLabelMapSHA256:observed.sourceMapLabelsSHA256,
       rgba,labelMap:map,width:w,height:h,
       categoryFamily:entry.family,maskedPalette:window.PhotoColor.maskedPalette
      });
      const naive=window.PhotoColor.estimate(rgba,w,h);
      return {sourceId:entry.id,sourceSHA256:entry.sourceSHA256,originalDims:[img.naturalWidth,img.naturalHeight],
       actualFrozenB0Inference:true,modelMapSHA256:observed.sourceMapLabelsSHA256,
       modelDims:[w,h],sourceWasResizedForModel:scale<1,
       wholeImageCenterColor:naive?.color||null,
       modelMaskColorReview:proposed};
     },{entry});
     assert.equal(receipt.sourceSHA256,entry.sourceSHA256);
     assert.equal(receipt.modelMaskColorReview.sourceSHA256,entry.sourceSHA256);
     assert.equal(receipt.modelMaskColorReview.autoSaveAllowed,false);
     assert.equal(receipt.modelMaskColorReview.maskMembershipVerifiedBySHA,true);
     rows.push({engine,titleColorProxy:entry.titleColor,sourceAttribution:entry.attributionTitle,
      sourceLicense:entry.license,...receipt});
     console.log('M1_P789_REAL_ORIGINAL_COLOR',JSON.stringify({
      sourceId:entry.id,engine,titleColorProxy:entry.titleColor,
      wholeCenter:receipt.wholeImageCenterColor,
      masked:receipt.modelMaskColorReview.possiblePrimaryColor,
      selected:receipt.modelMaskColorReview.selectedSourcePixels,
      ownerHumanTruthVerified:false,noAutoSave:true
     }));
    }
    assert.deepEqual(errors,[],'actual mobile browser unhandled JS errors');
    await page.close();
   }finally{await context.close();}
  }finally{await browser.close();}
 }
 assert.deepEqual(blocked,[],'unapproved model asset or write request');
 const summarize=engine=>{
  const list=rows.filter(r=>r.engine===engine);
  const masked=list.filter(x=>x.modelMaskColorReview.possiblePrimaryColor);
  const naive=list.filter(x=>x.wholeImageCenterColor);
  return {sources:list.length,maskedAvailable:masked.length,
   maskedTitleAgreement:masked.filter(x=>x.modelMaskColorReview.possiblePrimaryColor===x.titleColorProxy).length,
   wholeCenterAvailable:naive.length,
   wholeCenterTitleAgreement:naive.filter(x=>x.wholeImageCenterColor===x.titleColorProxy).length};
 };
 const report={
  schema:'mission1-real-original-verified-B0-color-review-789/v1',
  sourceCohort:'five previously exposed SHA-verified publisher originals',
  descriptiveTitleColorsOnly:true,independentHumanPrimaryColorTruth:false,
  independentlyVerifiedGarmentMask:false,sourceDisjointNovelty:false,
  realPhotoSegformerOnOriginals:true,comparisonThresholdTuned:false,
  modelWeightsChanged:false,ownerPhotoUploaded:false,
  userColorAutomaticallyConfirmed:false,modelPromotionAuthorized:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  engines:{chromium:summarize('chromium'),webkit:summarize('webkit')},
  rows
 };
 await writeFile(out+'/research-color-results.json',JSON.stringify(report,null,2)+'\n');
 console.log('M1_P789_REAL_COLOR_TITLE_PROXY_DIAGNOSTIC',JSON.stringify(report.engines));
}finally{await new Promise(done=>server.close(done));}
