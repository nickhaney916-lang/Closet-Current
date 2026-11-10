/**
 * MISSION 1 P782 — same genuine CC-BY original photograph is first evaluated
 * by pinned real SegFormer B0 ONNX in the actual browser worker, then imported
 * into the genuine Closet Current app for simulated owner REVIEW -> local
 * owner-bound IndexedDB -> My Closet.
 *
 * The model supplies a real category-only semantic suggestion, NOT a learned
 * subtype, verified color, instance identity, signed owner or physical camera.
 * The app's weak worker/auth/cloud and human clicks remain research fixtures;
 * no new production model/service is deployed. Family Alpha HOLD #255.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import {routePinnedModelAsset,isPinnedModelAsset} from '../research/real-mask-evidence-31/model-assets.mjs';
import {createHash} from 'node:crypto';
import {reconcileRealSourceRegions785} from '../research/mission1-real-source-review-785/reconcile-regions.mjs';

const original=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sourceRecord=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0053');
const sourceSHA256=createHash('sha256').update(original).digest('hex');
assert.ok(sourceRecord?.verified && sourceRecord?.attribution?.license==='CC BY 4.0');
assert.match(sourceRecord.attribution.title,/Dress/i,'the source catalog must document a real dress');
assert.equal(sourceSHA256,sourceRecord.sha256,'real original public licensed photo bytes required');
const base=resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/mission1-model-probe'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
   res.end('<!doctype html><html><meta charset="utf-8"><title>P782 real pinned model source</title><body>Genuine CC BY original, real B0 worker only, no owner private bytes</body></html>');
   return;
  }
  if(!/^\/(?:public|research)\/[-a-zA-Z0-9_/\.]+$/.test(path)||path.includes('..'))
   throw Error('forbidden');
  const file=resolve(base,'.'+path);
  if(!file.startsWith(base+'/'))throw Error('outside checkout');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const out='benchmark/mission1-real-model-native-closet-782';
await mkdir(out,{recursive:true});
const auth=id=>'window.closetAuth={ready:Promise.resolve(),user:{id:'+JSON.stringify(id)+
 ',email:"fixture@example.invalid"},assertCurrent(){if(!this.user?.id)throw Error("Signed out");}};'+
 'document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;';
const cloud='window.closetCloud={beforeWrite:async()=>{},changed:()=>{},start:async()=>{},stop:async()=>{}};';
function weakWorker(){
 class WeakRecognitionWorker{
  constructor(url){this.url=String(url);this.onmessage=null;this.terminated=false;}
  postMessage(d){
   const msg={id:d.id,type:d.type==='classify'?'result':'ready',
    strong:false,categoryConfirmed:false,
    choices:[{category:'Bottoms',itemType:'Jeans',label:'a pair of jeans',score:.23}],
    details:{color:'Blue'}};
   setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:msg});},0);
  }
  terminate(){this.terminated=true;}
 }
 Object.defineProperty(window,'Worker',{configurable:true,value:WeakRecognitionWorker});
}
/**
 * Actual unmodified B0 source worker. The separate local model-probe tab
 * never sees an owner account or any saved private wardrobe images.
 * All outgoing model assets must match the pinned immutable asset resolver.
 */
async function genuinelyInferSourceSegformer782(context,name){
 const probe=await context.newPage(),cache=new Map(),blocked=[];
 try{
  await probe.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(host+'/'))return route.continue();
   if(isPinnedModelAsset(url))return routePinnedModelAsset(route,cache);
   blocked.push(url);return route.abort();
  });
  await probe.goto(host+'/mission1-model-probe');
  const actual=await probe.evaluate(async ({originalBase64,sourceSHA256})=>{
   const data='data:image/jpeg;base64,'+originalBase64;
   const im=new Image();im.src=data;await im.decode();
   if(im.naturalWidth<32||im.naturalHeight<32||im.naturalWidth>3072||im.naturalHeight>3072)
    throw Error('genuine original exceeds pinned SegFormer source-analysis dimensions');
   const canvas=document.createElement('canvas');
   canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(im,0,0);
   const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   const worker=new Worker('/research/real-mask-evidence-31/worker.mjs',{type:'module'});
   const result=await new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('PINNED_REAL_B0_TIMED_OUT')),300000);
    worker.onmessage=e=>{
     if(e.data?.id!==782)return;
     if(e.data.type==='done'){clearTimeout(timer);done(e.data.result);}
     if(e.data.type==='error'){clearTimeout(timer);reject(Error('real B0 error '+JSON.stringify(e.data)));}
    };
    worker.postMessage({id:782,sourceId:'licensed-commons-0053-'+sourceSHA256,
     analysisImage:data,originalWidth:im.naturalWidth,originalHeight:im.naturalHeight,
     analysisRGBA:rgba,analysisWidth:im.naturalWidth,analysisHeight:im.naturalHeight},
     [rgba.buffer]);
   });
   worker.terminate();
   const {labelMapBase64,after,...other}=result;
   if(result.model!=='Xenova/segformer_b0_clothes'||
      result.modelRevision!=='a2489ea8e7ec1ee912190546bad31a4906ccca76'||
      result.maskPixelMembershipConserved!==true||
      result.sourcePixelsNeverReturned!==true||
      !Array.isArray(result.after)||!result.sourceMapLabelsSHA256)
    throw Error('genuine pinned SegFormer immutable revision/output receipt missing');
   const regions=result.after.filter(x=>[4,5,6,7,9].includes(x.regionId)&&x.selectedCount>0)
    .sort((a,b)=>b.selectedCount-a.selectedCount);
   return {
    sourceId:result.sourceId,sourceSHA256,
    model:result.model,modelRevision:result.modelRevision,
    labelMapSHA256:result.sourceMapLabelsSHA256,
    modelMask:result.modelMask,detectedRegions:regions.map(x=>({
     semanticRegionId:x.regionId,selectedCount:x.selectedCount,
     maskSHA256:x.selectedMaskSHA256,needsReview:x.needsReview})),
    exactSourcePixelsSent:true,
    sourceMaskConservation:result.maskPixelMembershipConserved,
    realModelExecuted:true,
    learnedSubtypeVerified:false,learnedPrimaryColorVerified:false,
    learnedInstanceIdentitiesVerified:false
   };
  },{originalBase64:original.toString('base64'),sourceSHA256});
  assert.deepEqual(blocked,[],'real pinned model must not download unapproved remote resources');
  assert.equal(actual.sourceSHA256,sourceSHA256);
  assert.equal(actual.realModelExecuted,true);
  assert.ok(actual.modelMask[0]>0&&actual.modelMask[1]>0);
  return actual;
 }finally{await probe.close();}
}
// Broad model REGION 4 is Tops OR Outerwear, not verified Tops.
const categoryBySemantic={4:'Tops or Outerwear',5:'Bottoms',6:'Bottoms',7:'Dresses',9:'Shoes'};

const results=[],errors=[],outbound=[];
let browser;
try{
 for(const [name,engine,widths] of [
  ['chromium',chromium,[390]],['webkit',webkit,[390]]
 ]){
  browser=await engine.launch({headless:true,
   args:name==='chromium'?['--disable-dev-shm-usage']:[]});
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:920},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{
    const realSegmentation=await genuinelyInferSourceSegformer782(context,name);
    assert.ok(realSegmentation.detectedRegions.length>0,
     'model must genuinely detect a visible clothing region on this verified photo');
    const actualRegion=realSegmentation.detectedRegions[0]||null;
    const actualCategory=categoryBySemantic[actualRegion?.semanticRegionId]||null;
    const regionReview=reconcileRealSourceRegions785({sourceSHA256,modelEvidence:realSegmentation});
    assert.ok(regionReview.possibleCategories.includes('Dresses'),
     'actual frozen model must retain its visible Dress region');
    assert.ok(regionReview.possibleCategories.includes('Tops')&&regionReview.possibleCategories.includes('Outerwear'),
     'upper garment is broad, never a confirmed top');
    assert.equal(regionReview.automaticCategory,null);
    assert.equal(regionReview.autoSaveAllowed,false);
    // This bridge is intentionally LOW-CONFIDENCE. The actual pinned B0
    // semantic class never supplies subtype or primary color ground truth.
    console.log('M1_P782_ACTUAL_SEMANTIC_PROPOSAL_VS_DOCUMENTED_SOURCE',JSON.stringify({
     browser:name,sourceCatalogTitle:sourceRecord.attribution.title,
     modelTopSemanticCategory:actualCategory,sourceDocumentedCategory:'Dresses',
     allModelCategoryPossibilities:regionReview.possibleCategories,
     modelSemanticCategoryNotGarmentIdentity:true,
     modelRegions:realSegmentation.detectedRegions.map(x=>({semanticRegionId:x.semanticRegionId,selectedCount:x.selectedCount})),
     noAutomaticSavingOrValidatedSubtype:true}));
    const sourceModelResult={strong:false,categoryConfirmed:false,
     choices:[],details:{},sourceCategoryReview:realSegmentation};
    assert.deepEqual(sourceModelResult.choices,[],
     'actual model never supplies a fabricated fallback subtype');
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(name+'/'+width+': '+e.message));
    await page.addInitScript(weakWorker);
    const ownerId='p120-'+name+'-'+width+'-fixture';
    await page.route('**/*',route=>{
     const url=route.request().url();
     if(url===host+'/public/auth.js')return route.fulfill({
      status:200,contentType:'text/javascript',body:auth(ownerId)});
     if(url===host+'/public/cloud-backup.js')return route.fulfill({
      status:200,contentType:'text/javascript',body:cloud});
     if(url===host+'/public/cloud-backup-bridge.js')return route.fulfill({
      status:200,contentType:'text/javascript',body:''});
     if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'))
      return route.continue();
     if(url.startsWith('https://fonts.googleapis.com/')||
        url.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?'))
      return route.abort();
     outbound.push(name+'/'+width+': '+url);return route.abort();
    });
    await page.goto(host+'/public/index.html?captureProof01=after&index04=after&reviewedSave120=research&index02=after&mission1SourceReview785=research',
     {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,
     null,{timeout:30000});
    assert.equal(await page.evaluate(()=>reviewedSave120Active),true);
    // Genuine source B0 segmentation category, but no fabricated subtype or
    // color: owner must explicitly review and confirm. Worker model inference
    // was run in a separate browser tab against the SAME source original JPEG.
    await page.evaluate(modelOutput=>{
     localReady=true;localRequest=async()=>modelOutput;
    },sourceModelResult);
    await page.locator('#clothingPhotos').setInputFiles({
     name:'source-licensed-original.jpg',mimeType:'image/jpeg',buffer:original
    });
    await page.waitForFunction(()=>batch.length===1&&
     batch[0].sourceHashVerified===true&&!!batch[0].originalPhoto?.sha256,
      null,{timeout:30000});
    await page.waitForFunction(()=>!localPending.has(batch[0].id),null,{timeout:20000});
    const nativeEvidence=await page.evaluate(()=>({
     proof:batch[0].recognitionDiagnostics?.sourceCategoryReview785,
     category:batch[0].category,itemType:batch[0].itemType,
     saved:items.some(x=>x.id===batch[0].id),status:batch[0].localStatus
    }));
    assert.deepEqual(nativeEvidence.proof?.possibleCategories,regionReview.possibleCategories);
    assert.equal(nativeEvidence.proof?.sourceSHA256,sourceSHA256);
    assert.equal(nativeEvidence.proof?.autoSaveAllowed,false);
    assert.equal(nativeEvidence.saved,false);
    assert.equal(nativeEvidence.category,'Uncategorized');
    assert.equal(nativeEvidence.itemType,'Unknown');
    assert.match(nativeEvidence.status,/possible Tops, Outerwear, Dresses/);
    const before=await page.evaluate(async()=>{
     await writes;
     const it=batch[0],saved=await readAll(),draft=await readDraft();
     return {savedCount:saved.length,ownerBound:it.ownerId===window.closetAuth.user.id,
      originalPhotoPreserved:it.originalPhoto?.image===it.image,
      originalSourceHashClaim:it.originalPhoto?.sha256===it.sourceSHA256,
      singleGarmentStillUnproven:it.singleGarmentVerified!==true,
      originalIsJPEG:it.image.startsWith('data:image/jpeg;base64,'),
      draftPersisted:draft.some(x=>x.id===it.id),batchCount:batch.length};
    });
    for(const [key,expected] of Object.entries({
     savedCount:0,ownerBound:true,originalPhotoPreserved:true,
     originalSourceHashClaim:true,singleGarmentStillUnproven:true,
     originalIsJPEG:true,draftPersisted:true,batchCount:1
    }))assert.equal(before[key],expected,name+'/'+width+' initial '+key);
    await page.screenshot({path:out+'/'+name+'-'+width+'-01-actual-photo-review.png',fullPage:true});
    await page.locator('#reviewGrid .photo-result').first()
     .getByRole('button',{name:'Adjust',exact:true}).click();
    const dialog=page.locator('dialog.photo-adjust[open]');
    await dialog.waitFor({state:'visible'});
    await assert.equal(await dialog.getByText(/Source model regions:.*Dress/).count(),1,
     'manual Adjust displays all genuine source semantic classes, not just largest region');
    await dialog.locator('select[aria-label="Main category"]').selectOption('Dresses');
    // Native reviewed source accepts only explicit catalog types; do not offer Other.
    assert.equal(await dialog.locator('select[aria-label="Item type"] option[value="Other"]').count(),0);
    await dialog.locator('select[aria-label="Item type"]').selectOption('Unknown');
    await dialog.locator('input[aria-label="Color"]').fill('Black');
    assert.equal(await dialog.locator('input[aria-label="I verified the category, clothing type and color"]').isChecked(),false);
    assert.equal(await dialog.locator('input[aria-label="I confirmed this photo shows one garment"]').isChecked(),false);
    // Native required checkboxes block Save until deliberately confirmed.
    await dialog.getByRole('button',{name:'Save changes'}).click();
    assert.equal(await page.evaluate(async()=>(await readAll()).length),0);
    assert.equal(await dialog.isVisible(),true);
    await dialog.locator('input[aria-label="I verified the category, clothing type and color"]').check();
    await dialog.locator('input[aria-label="I confirmed this photo shows one garment"]').check();
    await page.screenshot({path:out+'/'+name+'-'+width+'-02-real-adjust-confirm.png',fullPage:true});
    // P784: Unknown is a visible placeholder, never an accepted specific
    // subtype. Reject it before attempting original-photo private persistence.
    // No attestation or valid photo hash can turn a placeholder into identity.
    await dialog.getByRole('button',{name:'Save changes'}).click();
    await page.waitForFunction(()=>document.getElementById('message')?.textContent?.includes('Reviewed garment was not saved.'),
     null,{timeout:20000});
    assert.equal(await page.evaluate(async()=>(await readAll()).length),0);
    assert.equal(await page.evaluate(()=>batch.length),1);
    assert.equal(await dialog.isVisible(),true);
    assert.equal(await dialog.locator('select[aria-label="Item type"]').inputValue(),'Unknown');
    assert.match(await page.locator('#message').textContent(),/specific supported clothing type/);
    // Simulated reviewer chooses a supported subtype. This is deliberately
    // NOT an independently human-verified subtype accuracy claim.
    await dialog.locator('select[aria-label="Item type"]').selectOption('Casual dress');
    await page.screenshot({path:out+'/'+name+'-'+width+'-02b-catalog-supported-dress-subtype.png',fullPage:true});
    await dialog.getByRole('button',{name:'Save changes'}).click();
    await page.waitForFunction(()=>items.length===1&&batch.length===0,
     null,{timeout:30000});
    const after=await page.evaluate(async()=>{
     await writes;
     const saved=await readAll(),draft=await readDraft(),item=saved[0];
     await window.closetIndex02.refresh();
     return {
      actualSavedRows:saved.length,category:item?.category,itemType:item?.itemType,
      color:item?.color,sourceSHAUnchanged:item?.originalPhoto?.sha256===item?.sourceSHA256,
      originalJPEGUnchanged:item?.originalPhoto?.image===item?.image,
      ownerBinding:item?.ownerId===window.closetAuth.user.id,
      humanReviewed:item?.userAdjusted===true&&item?.ownerReviewed===true,
      manualColorProvenance:item?.colorSource==='user',
      sourceVerified:item?.sourceHashVerified===true,
      remainingDraftItems:draft.length,ownerIndexTotal:window.closetIndex02.state().total,
      dialogClosed:!document.querySelector('dialog.photo-adjust[open]'),
      status:document.getElementById('message').textContent
     };
    });
    for(const [key,value] of Object.entries({
     actualSavedRows:1,category:'Dresses',itemType:'Casual dress',color:'Black',
     sourceSHAUnchanged:true,originalJPEGUnchanged:true,ownerBinding:true,
     humanReviewed:true,manualColorProvenance:true,sourceVerified:true,
     remainingDraftItems:0,ownerIndexTotal:1,dialogClosed:true
    }))assert.equal(after[key],value,name+'/'+width+' saved '+key);
    assert.match(after.status,/saved to your private closet/);
    await page.evaluate(()=>{window.closetBrowseAll=true;switchView('closet');});
    await page.locator('#index02Category').selectOption('Dresses');
    await page.waitForFunction(()=>window.closetIndex02.state().matched===1);
    assert.equal(await page.locator('#closetGrid article.card').count(),1);
    assert.match(await page.locator('#closetGrid article.card').innerText(),/Black/);
    await page.screenshot({path:out+'/'+name+'-'+width+'-03-real-my-closet-dress.png',fullPage:true});
    await page.evaluate(()=>switchView('scan'));
    await page.locator('#clothingPhotos').setInputFiles({
     name:'exact-original-repeat.jpg',mimeType:'image/jpeg',buffer:original
    });
    await page.waitForFunction(()=>!busy,null,{timeout:30000});
    assert.equal(await page.evaluate(async()=>(await readAll()).length),1);
    assert.equal(await page.evaluate(()=>batch.length),0);
    const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
    assert.equal(noOverflow,true);
    results.push({browser:name,width,realAppPage:true,actualPhotoUploadInput:true,
     actualUnmodifiedPinnedSegformerWorkerExecuted:true,
     realModelOriginalSHA256:realSegmentation.sourceSHA256,
     actualModelRevision:realSegmentation.modelRevision,
     exactSourceModelMapSHA256:realSegmentation.labelMapSHA256,
     sourceSemanticCount:realSegmentation.detectedRegions.length,
     actualModelTopSemanticRegion:actualRegion?.semanticRegionId??null,
     actualModelTopBroadRegionOnly:actualCategory,
     allSemanticCategoriesSurfacedWithoutTopOnlyPromotion:true,
     observedDressRegionPreserved:true,
     modelTopSemanticDidNotSetItemType:true,
     sourceCatalogDocumentsDress:true,simulatedManualChoiceUsesDocumentedDressCategory:true,
     nativeReviewedOtherOptionNotOffered:true,
     simulatedManualUnknownSubtypeRefusedBeforeSave:true,
     simulatedManualSubtypeSelectedFromNativeCatalog:true,
     modelCategoryAloneDidNotDetermineSavedGarment:true,
     ownerReviewStillSimulated:true,actualHumanGroundTruthIndependentlyVerified:false,
     originalSourceIndependentHash:true,actualUserCorrectionForm:true,
     actualOwnerBoundIndexedDB:true,actualMyClosetSaved:true,
     duplicateSourceRejected:true,manualConfirmationRequired:true,
     noHorizontalOverflow:true,physicalCameraTested:false,
     actualAIModelExecution:true,actualSignedCloudRLS:false,
     physicalPhoneTested:false,productionDeployed:false,
     familyAlpha:'HOLD',releaseAuthorized:false});
   }finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assert.equal(errors.length,0,'App errors: '+errors.join('; '));
 assert.equal(outbound.length,0,'Unexpected external network: '+outbound.join('; '));
 assert.equal(results.length,2);
 await writeFile(out+'/browser-results.json',JSON.stringify({
  researchOnly:true,realLicensedOriginalJPEG:true,
  onlySyntheticModelScores:false,originalRealB0CategoryOnly:true,
  sourceLicenseIsCCBY4:true,simulatedHumanReviewNotTrueOwnerVerification:true,
  actualModelSubtypeOrColorVerified:false,realAuthenticatedCloudUsers:false,
  physicalPhoneCameraVerified:false,productionDeployed:false,
  familyAlpha:'HOLD',releaseAuthorized:false,scenarios:results
 },null,2));
 console.log('MISSION1_P782_GENUINE_SEGFORMER_B0_SOURCE_TO_APP_OWNER_REVIEW_AND_PRIVATE_INDEXEDDB_CHROMIUM_WEBKIT_2_OF_2_RESEARCH_ONLY_NO_RELEASE');
}catch(e){
 await writeFile(out+'/failure.json',JSON.stringify({
  error:String(e),stack:String(e?.stack||''),errors,outbound,results
 },null,2));
 throw e;
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
