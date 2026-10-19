// One licensed full-body regression case through actual production workers.
// No model mocks, fabricated closet items, manual confirmations or paid calls.
// Test identity is local only; cloud backup and physical phones are not tested.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]||'benchmark/mobile-flow');
const flatLay=process.argv[3]==='commons-0059';
const source=JSON.parse(await readFile(flatLay?'benchmark/locked-photo-sources.json':'benchmark/manifest-visible-legwear-2.json','utf8')).find(x=>x.id===(flatLay?'commons-0059':'validation-0031'));
const photo=await readFile(join('benchmark/photos',source.image));
assert.equal(createHash('sha256').update(photo).digest('hex'),source.sha256);
assert.ok(source.verified&&source.attribution.license);
await mkdir(out,{recursive:true});
const report={status:'running',sourceId:source.id,sourceSha256:source.sha256,attribution:source.attribution,
 actualSegmentationWorker:true,actualRecognitionWorker:true,manualConfirmations:0,syntheticClosetItems:0,
 localTestIdentity:true,cloudBackupTested:false,physicalPhoneTested:false,
 expectedVisibleGarments:source.expectedVisibleGarments||[],expectedLabelsFromSourceDescription:true,
 independentlyApprovedMasks:false,segmentationPixelAccuracy:null,colorAccuracy:null,
 automaticSaved:[],pendingReview:[],styleChecks:[],pageErrors:[],productionAuthorized:false};
const save=()=>writeFile(join(out,'real-whole-outfit-flow.json'),JSON.stringify(report,null,2));
await save();
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{const u=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
  if(!file.startsWith(root+'/'))throw Error('Invalid path');
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
 }catch{res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname!=='127.0.0.1'&&!['GET','HEAD'].includes(request.method()))return route.abort('blockedbyclient');
  return route.continue();
 });
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
  "window.closetAuth={user:{id:'real-whole-outfit-test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
 const page=await context.newPage();
 // Only this isolated research browser opts into worker diagnostics; the user
 // app never collects, stores or uploads such records during normal use.
 await page.addInitScript(()=>{
  window.__outfitModelDiagnostics=[];
  const NativeWorker=window.Worker;
  window.Worker=function(url,options){
   const worker=new NativeWorker(url,options);
   if(String(url).includes('outfit-worker.mjs')){
    worker.addEventListener('message',event=>{
     if(event.data?.type==='diagnostics')window.__outfitModelDiagnostics.push(event.data.summary);
    });
    const send=worker.postMessage.bind(worker);
    worker.postMessage=(payload,...args)=>send(payload?.image&&payload?.id?{...payload,diagnostics:true}:payload,...args);
   }
   return worker;
  };
  window.Worker.prototype=NativeWorker.prototype;
 });
 page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 await page.locator('.tab[data-view="scan"]').click();
 await page.locator('#captureOutfit').click();
 await page.locator('#outfitUpload').setInputFiles({name:source.image,mimeType:'image/jpeg',buffer:photo});
 await page.waitForFunction(()=>!!outfitActiveId&&!outfitSplitJob&&!busy,null,{timeout:330000});
 await page.waitForFunction(()=>!automaticRunning&&localPending.size===0,null,{timeout:180000});
 const observed=await page.evaluate(()=>{
  const summarize=(x)=>({id:x.id,category:x.category,itemType:x.itemType,color:x.color||null,
   segmentHint:x.segmentHint,cropBounds:x.cropBounds,localStatus:x.localStatus||null,
   scanFailed:!!x.scanFailed,saveFailed:!!x.saveFailed,possibleDuplicate:!!x.possibleDuplicate,
   originalPreserved:x.originalPhoto?.image===lastOutfitPhoto,
   recognitionCropPresent:!!x.recognitionPhoto?.image,
   sourceDifferentFromDisplay:x.recognitionPhoto?.image!==x.image});
  return {saved:items.filter(x=>x.outfitSourceId===outfitActiveId).map(summarize),
   pending:batch.filter(x=>x.outfitSourceId===outfitActiveId).map(summarize),
   splitStatus:document.querySelector('#outfitSplitStatus').textContent,
   splitFailed:!document.querySelector('#outfitRetry').hidden,group:outfitActiveId};
 });
 // Export the actual source/display crop pair for visual diagnosis, with no
 // generated or approved-mask claim. Source license is retained in the report.
 const crops=await page.evaluate(()=>[...items,...batch].filter(x=>x.outfitSourceId===outfitActiveId)
  .map((x,index)=>({index,display:x.image,recognition:x.recognitionPhoto?.image})));
 for(const crop of crops)for(const kind of ['display','recognition']){
  assert.match(crop[kind],/^data:image\/jpeg;base64,/);
  await writeFile(join(out,source.id+'-piece-'+crop.index+'-'+kind+'.jpg'),Buffer.from(crop[kind].split(',')[1],'base64'));
 }
 report.modelRegionDiagnostics=await page.evaluate(()=>window.__outfitModelDiagnostics?.[0]||null);
 assert.equal(report.modelRegionDiagnostics?.version,1,
  'Real worker should provide aggregate opt-in segmentation evidence');
 report.automaticSaved=observed.saved;report.pendingReview=observed.pending;
 report.splitStatus=observed.splitStatus;report.splitFailed=observed.splitFailed;
 report.emittedPieceCount=observed.saved.length+observed.pending.length;
 assert.ok(report.modelRegionDiagnostics.emittedGroups>=report.emittedPieceCount,
  'The diagnostic must count at least every delivered region');
 report.automaticSaveCount=observed.saved.length;report.reviewPendingCount=observed.pending.length;
 await save();
 assert.equal(observed.splitFailed,false,'Actual worker must finish; a model/download error is not a passing accuracy test');
 assert.ok(report.emittedPieceCount>0,'No garments reached the app');
 assert.ok([...observed.saved,...observed.pending].every(x=>x.originalPreserved&&x.recognitionCropPresent));
 // Report visible-category coverage only. An emitted class is NOT proof of a
 // correctly isolated garment, and tights are unsupported in this taxonomy.
 const actual=new Set(observed.saved.map(x=>x.category));
 report.expectedSupportedCategories=flatLay?['Dresses']:['Tops','Outerwear','Bottoms','Shoes'];
 report.missingAutomaticCategories=report.expectedSupportedCategories.filter(x=>!actual.has(x));
 report.unexpectedAutomaticCategories=[...actual].filter(x=>!report.expectedSupportedCategories.includes(x));
 report.unsupportedVisibleGarments=flatLay?[]:['Tights'];
 await save();
 assert.deepEqual(report.unexpectedAutomaticCategories,[],
  'Unexpected or unsupported garment must not be saved');
 if(flatLay){
  assert.equal(observed.saved.length,0,'unworn research candidates must never auto-save');
  assert.ok(observed.pending.some(x=>x.segmentHint?.displayFallbackReason==='no-person-evidence-review-only'),
   'licensed flat-lay photo must yield an explicitly unapproved source review candidate');
 }
 for(const item of observed.saved){
  await page.locator('.tab[data-view="closet"]').click();
  await page.locator('#closetAllPieces').click();
  // IDs are generated by the app; pass via locator attribute, not injected JS.
  const selected=page.locator('#closetGrid article[data-item-id="'+item.id+'"]');
  const button=selected.getByRole('button',{name:'Style this'});
  if(!await button.count()){report.styleChecks.push({id:item.id,status:'unsupported-category',options:0});continue;}
  await button.click();
  await page.waitForFunction(()=>!document.querySelector('#createCollectionOutfits').disabled);
  const result=await page.evaluate(id=>({id,anchor:stylistAnchorItemId,
   options:styledCollectionResults.map(x=>Object.values(x.board.slots)),owned:items.map(x=>x.id)}),item.id);
  assert.equal(result.anchor,item.id);
  assert.ok(result.options.every(ids=>ids.includes(item.id)&&ids.every(id=>result.owned.includes(id))));
  report.styleChecks.push({id:item.id,status:result.options.length?'verified':'no-compatible-option',options:result.options.length});
 }
 report.styleWorkflowTested=report.styleChecks.some(x=>x.status==='verified');
 report.automaticWorkflowOutcome=observed.saved.length?'has-automatic-saves':'blocked-no-automatic-saves';
 // Flush existing app persistence before reload, without changing any records.
 await page.evaluate(()=>queued(()=>Promise.resolve()));
 const beforeReload=await page.evaluate(group=>({
  saved:items.filter(x=>x.outfitSourceId===group),pending:batch.filter(x=>x.outfitSourceId===group)
 }),observed.group);
 await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
 const restored=await page.evaluate(group=>({
  saved:items.filter(x=>x.outfitSourceId===group),pending:batch.filter(x=>x.outfitSourceId===group)
 }),observed.group);
 for(const state of ['saved','pending']){
  assert.deepEqual(restored[state].map(x=>x.id).sort(),beforeReload[state].map(x=>x.id).sort());
  for(const before of beforeReload[state]){
   const after=restored[state].find(x=>x.id===before.id);
   assert.equal(after.originalPhoto?.image,before.originalPhoto?.image);
   assert.equal(after.recognitionPhoto?.image,before.recognitionPhoto?.image);
   assert.equal(after.image,before.image);
  }
 }
 // Empty saved collections must never count as verified successful saves.
 report.localSavedReloadVerified=observed.saved.length?true:null;
 report.pendingReviewReloadVerified=observed.pending.length?true:null;
 assert.deepEqual(report.pageErrors,[]);
 report.status='complete';await save();
 console.log('REAL_WHOLE_OUTFIT '+JSON.stringify(report));
 await context.close();
}catch(error){report.status='failed';report.error=error.message;await save();throw error;}
finally{await browser?.close();await new Promise(done=>server.close(done));}
