/**
 * COLOR-CONFIDENCE-SAFETY-19 — original JPEG browser color -> shared closet
 * record safety. Six real licensed sources, actual checkPhoto canvas sampling,
 * two engines. The public source TITLES are NOT independent color ground truth.
 * Do not call this color accuracy or release acceptance.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),dir=resolve('benchmark/color-confidence-19');
const consumerAppSource=await readFile('public/app.js','utf8');
const consumerFieldSlice=consumerAppSource.slice(consumerAppSource.indexOf('function node('),consumerAppSource.indexOf('function cropClothingPhoto('));
assert.ok(consumerFieldSlice.includes('function clothingFields(')&&consumerFieldSlice.includes("item.colorSource='user'"),'must test actual consumer color event');
const [samples,registry]=await Promise.all([
 readFile('research/color-confidence-safety-19/sources.json','utf8').then(JSON.parse),
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse)
]);
const rows=new Map(registry.map(x=>[x.id,x]));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(samples.requiredVerifiedOriginals,6);
assert.equal(samples.candidateCount,samples.samples.length);
assert.ok(samples.samples.length>=6);
assert.equal(new Set(samples.samples.map(x=>x.id)).size,samples.samples.length);
const cached=new Map();
async function originalPhoto(sample){
 if(cached.has(sample.id))return cached.get(sample.id);
 const source=rows.get(sample.id);
 assert.ok(source&&source.verified&&/^[0-9a-f]{64}$/.test(source.sha256));
 assert.ok(source.attribution?.license&&source.attribution?.source&&source.downloadUrl);
 const urls=[source.downloadUrl,...(source.alternateDownloadUrls||[])];
 let bytes=null,failures=[];
 for(const url of urls){
  for(let attempt=0;attempt<3;attempt++){
   try{
    const response=await fetch(url,{headers:{'user-agent':'ClosetCurrentColorConfidenceResearch/1.0'},signal:AbortSignal.timeout(35000)});
    if(!response.ok)throw Error('source HTTP '+response.status);
    const body=Buffer.from(await response.arrayBuffer());
    assert.equal(sha(body),source.sha256,'source original or thumbnail SHA changed');
    const meta=await sharp(body).metadata();
    assert.equal(meta.format,'jpeg');
    assert.ok(meta.width>=100&&meta.height>=100&&body.length>2000);
    bytes=body;break;
   }catch(err){failures.push(err.message.slice(0,150));
    // A SHA mismatch is conclusive for this URL; a changed source is NEVER accepted.
    if(/SHA changed|source original or thumbnail SHA changed/.test(err.message))break;
    if(attempt<2)await new Promise(r=>setTimeout(r,1200*(attempt+1)));}
  }
  if(bytes)break;
 }
 if(!bytes)throw Error('Cannot verify immutable original '+sample.id+': '+failures.slice(-2).join('; '));
 cached.set(sample.id,{bytes,source});
 return cached.get(sample.id);
}
await mkdir(dir,{recursive:true});
const html=[
 '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
 '<title>Closet Current original-photo color confidence audit</title>',
 '<style>body{margin:0;background:#f4eff7;color:#201d2b;font:15px/1.4 system-ui}',
 'main{max-width:540px;margin:auto;padding:14px}h1{font-size:19px;margin:0 0 6px}',
 'img{display:block;max-width:100%;max-height:520px;object-fit:contain;margin:8px auto;border-radius:12px}',
 '.panel{border:1px solid #d8cfdc;padding:10px;border-radius:12px;background:white}',
 '.small{font-size:12px;overflow-wrap:anywhere}p{margin:6px 0}</style></head><body>',
 '<main><h1>Original photo → color review safety</h1><p>Research only. An uncertain estimate must never become a saved color.</p>',
 '<img id="subject" alt="Verified licensed original clothing image">',
 '<section class="panel"><p id="source">Source integrity: pending</p><p id="estimate">Estimated color: pending</p>',
 '<p id="decision">Saved wardrobe value: pending</p><p id="hint" class="small"></p>',
 '<label for="manualColor">Your confirmed color</label><input id="manualColor" aria-label="Your confirmed color" value="" style="display:block;width:100%;padding:8px">',
 '<p id="authority" role="status">Manual correction not yet tested.</p></section>',
 '<p class="small">Source title is a label hint, not independently reviewed garment-color ground truth. No cloud or photo upload.</p></main>',
 '<script src="/public/taxonomy.js"></script>',
 '<script src="/public/photo-color.js"></script>',
 '<script src="/public/clothing-details.js"></script>',
 '<script src="/public/photo-check.js"></script>',
 '</body></html>'
].join('\n');
const jsTypes={'.js':'text/javascript','.html':'text/html'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});return res.end(html);
  }
  if(!['/public/photo-color.js','/public/clothing-details.js','/public/photo-check.js','/public/taxonomy.js'].includes(url.pathname))
   throw Error('path not allowed');
  const path=resolve(root,'.'+url.pathname);
  const body=await readFile(path);
  res.writeHead(200,{'content-type':jsTypes[extname(path)]||'text/plain','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const findings=[],screenshots=[],unexpectedUploads=[],runtimeErrors=[],quarantined=[];
const selected=[];
for(const candidate of samples.samples){
 try{await originalPhoto(candidate);selected.push(candidate);if(selected.length===samples.requiredVerifiedOriginals)break;}
 catch(err){quarantined.push({id:candidate.id,reason:/SHA changed|sha/i.test(err.message)?'source-sha-mismatch':'source-unavailable'});}
}
await writeFile(dir+'/source-quarantine.json',JSON.stringify({
 candidateCount:samples.samples.length,requiredVerifiedOriginals:samples.requiredVerifiedOriginals,
 selectedIds:selected.map(x=>x.id),quarantined,allAcceptedSourcesShaVerified:true
},null,2));
console.log('COLOR-CONFIDENCE-19 source verification '+JSON.stringify({
 verifiedIds:selected.map(x=>x.id),excluded:quarantined,
 required:samples.requiredVerifiedOriginals}));
assert.equal(selected.length,samples.requiredVerifiedOriginals,
 'insufficient verified immutable licensed originals; do not substitute changed bytes');
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const r=route.request(),u=r.url();
    if(!u.startsWith(origin+'/')&&r.method()!=='GET')unexpectedUploads.push({engine,kind:r.resourceType()});
    if(!u.startsWith(origin+'/'))return route.abort();
    return route.continue();
   });
   const page=await context.newPage();
   page.on('pageerror',err=>runtimeErrors.push({engine,type:err.name}));
   let n=0;
   for(const sample of selected){
    const {bytes,source}=await originalPhoto(sample);
    await page.goto(origin+'/',{waitUntil:'load'});
    await page.addScriptTag({content:'const items=[];\n'+consumerFieldSlice});
    const value=await page.evaluate(async input=>{
     const photo='data:image/jpeg;base64,'+input.base64;
     document.getElementById('subject').src=photo;
     const imageCheck=await checkPhoto(photo); // Actual production 16x16 canvas sampling.
     const proposed=imageCheck.colorEstimate||null;
     const stored=ClothingDetails.fillColor({id:'research-only',color:'',category:'Tops',sourceSHA256:input.sha256},proposed);
     document.getElementById('source').textContent='Original SHA-256: '+input.sha256.slice(0,14)+'…';
     document.getElementById('estimate').textContent='Color estimate: '+(proposed?.color||'None')+
       ' · needs confirmation: '+(proposed?.needsConfirmation===true?'YES':'NO');
     document.getElementById('decision').textContent='Auto-saved value: '+(stored.color||'None — review required');
     document.getElementById('hint').textContent='Source title hint only: '+input.hint;
     window.__colorUser20={category:'Tops',itemType:'T-shirt',ownerId:'research-only',sourceSHA256:input.sha256,
      originalPhoto:{sha256:input.sha256},color:'',colorSource:undefined,proposed};
     document.getElementById('manualColor').oninput=event=>{
      window.__colorUser20.color=event.target.value;
      window.__colorUser20.colorSource='user';
     };
     return {estimate:proposed?{color:proposed.color,needsConfirmation:proposed.needsConfirmation===true,
      support:proposed.support??null,source:proposed.source}:null,
      storedColor:stored.color||null,storedSource:stored.colorSource||null,
      originalSha256:stored.sourceSHA256,dimensions:[imageCheck.aspect]};
    },{base64:bytes.toString('base64'),sha256:source.sha256,hint:sample.sourceDeclaredHint});
    assert.equal(value.originalSha256,source.sha256);
    // A real browser user gesture changes the color field via an input event.
    // Green is a deliberate test correction, NOT independent garment color truth.
    await page.getByRole('textbox',{name:'Your confirmed color'}).fill('Green');
    const manual=await page.evaluate(()=>{
     const item=window.__colorUser20,choice={category:'Tops',sleeveLength:'Long sleeve'};
     const after=ClothingDetails.fill(item,choice,{color:'Blue',pattern:'Solid'},true);
     const afterPhoto=ClothingDetails.fillColor(after,item.proposed);
     document.getElementById('authority').textContent='User test choice Green → model overwrite attempted → '+afterPhoto.color;
     return {color:afterPhoto.color,colorSource:afterPhoto.colorSource,
      sourceSha256:afterPhoto.sourceSHA256,ownerId:afterPhoto.ownerId};
    });
    assert.equal(manual.color,'Green');assert.equal(manual.colorSource,'user');
    assert.equal(manual.sourceSha256,source.sha256);assert.equal(manual.ownerId,'research-only');
    await page.getByRole('textbox',{name:'Your confirmed color'}).fill('');
    const cleared=await page.evaluate(()=>{
     const item=window.__colorUser20,choice={category:'Tops',sleeveLength:'Long sleeve'};
     const after=ClothingDetails.fill(item,choice,{color:'Red',pattern:'Solid'},true);
     const afterPhoto=ClothingDetails.fillColor(after,item.proposed);
     document.getElementById('authority').textContent='User cleared color intentionally → guess rejected';
     return {color:afterPhoto.color,colorSource:afterPhoto.colorSource,sourceSha256:afterPhoto.sourceSHA256};
    });
    assert.equal(cleared.color,'');assert.equal(cleared.colorSource,'user');
    assert.equal(cleared.sourceSha256,source.sha256);
    // Run the ACTUAL consumer clothingFields form (from public/app.js),
    // not a reimplementation of its input provenance event handlers.
    const formProof=await page.evaluate(input=>{
     const original={id:'field-proof',image:'',name:'Research garment',
      category:'Tops',itemType:'T-shirt',color:'Blue',colorSource:'photo-estimate',
      notes:'',sourceSHA256:input.sha256,ownerId:'owner-research-only',
      seasons:['Summer'],pattern:'Solid',fit:'Regular',sleeveLength:'Short sleeve'};
     const section=document.createElement('section');
     section.setAttribute('data-provenance-review','23');
     document.querySelector('main').append(section);
     const form=document.createElement('form'),item={...original};
     section.append(form);
     const collect=clothingFields(form,item);
     const note=form.querySelector('[aria-label="Notes"]');
     note.value='Edited non-color text only';
     note.dispatchEvent(new Event('input',{bubbles:true}));
     const nonColor=collect();
     const color=form.querySelector('[aria-label="Color"]');
     color.value='Green';color.dispatchEvent(new Event('input',{bubbles:true}));
     const corrected=collect();
     color.value='';color.dispatchEvent(new Event('input',{bubbles:true}));
     const clearedColor=collect();
     section.querySelector('form').replaceWith(document.createTextNode(
      'Consumer review: note-only edit keeps photo estimate; user color edit and clear are tracked explicitly.'));
     return {estimatedStillSource:nonColor.colorSource,estimatedColor:nonColor.color,
      manualSource:corrected.colorSource,manualColor:corrected.color,
      clearedSource:clearedColor.colorSource,clearedColor:clearedColor.color,
      shaUnchanged:clearedColor.sourceSHA256===input.sha256,ownerId:clearedColor.ownerId};
    },{sha256:source.sha256});
    assert.equal(formProof.estimatedStillSource,'photo-estimate');
    assert.equal(formProof.estimatedColor,'Blue');
    assert.equal(formProof.manualSource,'user');
    assert.equal(formProof.manualColor,'Green');
    assert.equal(formProof.clearedSource,'user');
    assert.equal(formProof.clearedColor,'');
    assert.equal(formProof.shaUnchanged,true);
    assert.equal(formProof.ownerId,'owner-research-only');
    await page.getByRole('textbox',{name:'Your confirmed color'}).fill('Green');
    await page.evaluate(()=>{document.getElementById('authority').textContent=
     'User Green retained after model replay; user-cleared blank also retained. Green is a test selection, not photo truth.';});
    if(value.estimate?.needsConfirmation)assert.equal(value.storedColor,null,
     'uncertain actual photo color must not silently become a stored garment color');
    if(value.storedColor!==null){
     assert.equal(value.storedSource,'photo-estimate');
     assert.equal(value.storedColor,value.estimate.color);
    }
    findings.push({engine,id:sample.id,sha256:source.sha256,originalBytes:bytes.length,
     sourceTitleHint:sample.sourceDeclaredHint,groundTruthColor:null,
     sourcePage:source.attribution.source,license:source.attribution.license,
     ...value,consumerReviewForm:formProof,userAuthority:{manualWon:manual.color==='Green'&&manual.colorSource==='user',
       clearWon:cleared.color===''&&cleared.colorSource==='user',sourceUnchanged:cleared.sourceSha256===source.sha256}});
    if(n<3){
     const width=[320,390,430][n];
     await page.setViewportSize({width,height:780});
     const png=await page.screenshot({fullPage:true,animations:'disabled'});
     const meta=await sharp(png).metadata();
     assert.equal(meta.width,width);
     assert.ok(png.length>8000&&meta.height>500);
     const file=engine+'-'+width+'-'+sample.id+'.png';
     await writeFile(dir+'/'+file,png);
     screenshots.push({engine,width,file,sha256:sha(png)});
     await page.setViewportSize({width:390,height:780});
    }
    n++;
   }
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
assert.equal(findings.length,selected.length*2);
assert.deepEqual(unexpectedUploads,[],'model color test must never transmit original photos');
assert.deepEqual(runtimeErrors,[]);
assert.equal(screenshots.length,6);
const review=findings.filter(x=>x.estimate?.needsConfirmation||!x.estimate);
const automatic=findings.filter(x=>!!x.storedColor);
const report={
 priority:'COLOR-CONFIDENCE-SAFETY-19',
 actualBrowserEngines:['chromium','webkit'],
 uniqueLicensedOriginalPhotographs:selected.length,
 originalCandidateCount:samples.samples.length,
 quarantinedSourceIds:quarantined.map(x=>x.id),
 originalSha256Verified:true,
 trueIndependentColorGroundTruthAvailable:false,
 measuredColorAccuracy:null,
 releaseColorThreshold95PercentSatisfied:false,
 browserCases:findings.length,
 uncertainReviewCases:review.length,autoFilledCases:automatic.length,
 wrongUncertainAutoFills:findings.filter(x=>x.estimate?.needsConfirmation&&x.storedColor).length,
 explicitManualColorPreserved:findings.filter(x=>x.userAuthority?.manualWon).length,
 explicitlyClearedColorPreserved:findings.filter(x=>x.userAuthority?.clearWon).length,
 allManualColorSourcesUnchanged:findings.every(x=>x.userAuthority?.sourceUnchanged===true),
 noteOnlyColorProvenancePreserved:findings.filter(x=>x.consumerReviewForm?.estimatedStillSource==='photo-estimate').length,
 consumerManualEditsPreserved:findings.filter(x=>x.consumerReviewForm?.manualSource==='user').length,
 consumerManualClearsPreserved:findings.filter(x=>x.consumerReviewForm?.clearedSource==='user'&&x.consumerReviewForm?.clearedColor==='').length,
 noUnexpectedUploads:unexpectedUploads.length===0,
 jsErrors:runtimeErrors.length,
 mobileScreenshots:screenshots.length,
 familyAlpha:'HOLD',productionDeployed:false,
 cases:findings
};
await writeFile(dir+'/report.json',JSON.stringify(report,null,2));
await writeFile(dir+'/screenshots.json',JSON.stringify(screenshots,null,2));
assert.equal(report.wrongUncertainAutoFills,0);
assert.equal(report.explicitManualColorPreserved,12);
assert.equal(report.noteOnlyColorProvenancePreserved,12);
assert.equal(report.consumerManualEditsPreserved,12);
assert.equal(report.consumerManualClearsPreserved,12);
assert.equal(report.explicitlyClearedColorPreserved,12);
assert.equal(report.allManualColorSourcesUnchanged,true);
console.log('COLOR CONFIDENCE 19 REAL ORIGINALS '+JSON.stringify({
 uniquePhotos:report.uniqueLicensedOriginalPhotographs,engines:report.actualBrowserEngines,
 photoCases:report.browserCases,excludedSourceIds:report.quarantinedSourceIds,
 reviewCases:report.uncertainReviewCases,
 automaticCases:report.autoFilledCases,uncertainWrongAutoFills:report.wrongUncertainAutoFills,
 sourceShaVerified:true,colorAccuracy:null,screenshots:screenshots.length,
 realConsumerReviewNoteOnlyPreserved:report.noteOnlyColorProvenancePreserved,
 manualUserCorrectionsProtected:report.explicitManualColorPreserved,
 manualUserClearsProtected:report.explicitlyClearedColorPreserved,
 release:'HOLD'
}));