/**
 * #84 original-source neutral jeans SIDE panel geometry A/B — genuine licensed photographed
 * P541 shirt+denim on male/female 163-bone anatomical GLBs.
 * Browser canvas screenshots only; not physical phones or human approval.
 * A trial is visible only if it introduces zero NEW witnessed actual posed
 * body or shirt/denim triangle crossing pairs and preserves sewn seams.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve(process.argv[2]||'.'),engine=process.env.P84_BROWSER||'chromium';
if(root===resolve('.')||root==='/'||!['webkit','chromium'].includes(engine))
 throw Error('Separated immutable photographed source donor required');
const dest='benchmark/parallel84-source-denim-side-visual/'+engine;
await mkdir(dest,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(pathname)||
     pathname.includes('\\')||pathname.includes('\0')||
     pathname.split('/').includes('..'))
   throw Error('Untrusted research file');
  const file=resolve(root,'.'+pathname);
  if(!file.startsWith(root+'/'))throw Error('Outside detached donor');
  const bytes=await readFile(file);
  const mim={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
   '.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png',
   '.json':'application/json','.css':'text/css'};
  res.writeHead(200,{'content-type':mim[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const source={
 shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
};
const sha=b=>createHash('sha256').update(b).digest('hex');
const figures=['female','male'],denims=['public','second'],views=[0,90,180];
const captures=[],experiments=[],errors=[],offsite=[];
const width=390;
let browser;
async function visit(context,figure,denim,variant){
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e.message).slice(0,180)}));
 page.on('crash',()=>errors.push({type:'crash'}));
 page.on('request',r=>{
  const u=r.url();
  if(!u.startsWith(origin)&&!u.startsWith('blob:'+origin)&&!u.startsWith('data:'))
   offsite.push({type:'blocked-offsite',variant});
 });
 await page.route('**/*',r=>{
  const u=r.request().url();
  if(u.startsWith(origin)||u.startsWith('blob:'+origin)||u.startsWith('data:'))
   return r.continue();
  return r.abort();
 });
 await page.goto(origin+'/research/dress-mobile-01/index.html?parallel84Denim='+variant,
  {waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
  null,{timeout:180000});
 if(figure==='male'){
  await page.locator('#model').selectOption('male');
  await page.waitForFunction(()=>window.ccDress12Diagnostics?.()?.phase==='ready',
   null,{timeout:180000});
 }
 await page.locator('#review').check();
 if(denim==='second')await page.locator('#swap').click();
 const start=Date.now();
 await page.locator('#two').click();
 const elapsed=Date.now()-start;
 const result=await page.evaluate(()=>({
  state:window.ccDress12Diagnostics(),
  shape:window.__parallel84DenimResult??null,
  frame:Number(document.getElementById('avatar').dataset.frames||0),
  webgl2:!!document.getElementById('avatar').getContext('webgl2')
 }));
 const {state,shape}=result;
 assert.equal(state.phase,'ready','Source original 3D pipeline must remain usable');
 assert.equal(state.figure,figure);
 assert.equal(state.bones,163);
 assert.equal(state.outfitMode,'shirt-pants');
 assert.deepEqual(state.outfitSlots,['shirt','pants']);
 assert.equal(state.shirt.sourceSHA256,source.shirt);
 assert.equal(state.pants.sourceSHA256,source[denim]);
 assert.equal(state.pants.photoApplied,true);
 assert.equal(state.visibleFallback,false);
 assert.equal(state.releaseAuthorized,false);
 assert.equal(state.noOriginalPhotoModified,true);
 assert.equal(result.webgl2,true);
 assert.ok(result.frame>1);
 assert.equal(shape?.schema,'P84-original-denim-source-neutral-side-AB/v1');
 assert.equal(shape?.releaseAuthorized,false);
 if(variant==='baseline'){
  assert.equal(shape.status,'BASELINE_UNMODIFIED');
  assert.equal(shape.trialApplied,false);
 }else{
  assert.ok(['SAMPLED_CONTACT_NONWORSENING_ONLY','REFUSED_NEW_CONTACT','REFUSED_UNCHANGED'].includes(shape.status),
   'Unsafe source trial must never be silently admitted: '+JSON.stringify(shape));
  assert.equal(shape.humanRealismApproved,false);
  assert.equal(shape.original163BoneSkinUnchanged,true);
  assert.equal(shape.photoAndSourceAttributesUnchanged,true);
  if(shape.trialApplied){
   assert.equal(shape.status,'SAMPLED_CONTACT_NONWORSENING_ONLY');
   assert.equal(shape.newlyIntroducedBodyTrianglePairs,0);
   assert.equal(shape.newlyIntroducedShirtTrianglePairs,0);
   assert.ok(shape.maxAppliedWorldShiftMeters>0);
   assert.equal(shape.sourceFrontPhotographProtected,true);
  }
 }
 const shots=[];
 for(const angle of views){
  await page.evaluate(a=>window.ccDress12SetView(a),angle);
  await page.waitForTimeout(80);
  const canvas=page.locator('#avatar'),png=await canvas.screenshot({animations:'disabled'});
  const meta=await sharp(png).metadata();
  assert.ok(meta.width>100&&meta.height>100);
  const raw=await sharp(png).resize(48,48).removeAlpha().raw().toBuffer();
  assert.ok(Math.max(...raw)-Math.min(...raw)>18);
  const name=['P84-real-source-denim-side',engine,width,figure,denim,variant,angle].join('-')+'.png';
  await writeFile(join(dest,name),png);
  const shot={name,angle,sha256:sha(png),
   actualLicencedShirtAndDenim163BoneWebGL:true,
   newSewnMaterialNotInvented:true,
   rearPhotoUnobserved:true,physicalDevice:false,realismApproved:false};
  shots.push({png,shot});captures.push({...shot,width,figure,denim,variant});
 }
 await page.close();
 return {shape,elapsed,shots,figure,denim,variant};
}
function perceptualDifference(before,after){
 assert.equal(before.length,after.length);
 let changed=0,sum=0,max=0;
 for(let i=0;i<before.length;i++){
  const v=Math.abs(before[i]-after[i]);
  if(v>12)changed++;sum+=v;max=Math.max(max,v);
 }
 return {changedChannelsAbove12:changed,
  meanAbsoluteRGBChannelDifference:sum/before.length,
  maximumChannelDifference:max,
  dataPoints:before.length,
  semanticRealismImprovementNotEstablished:true};
}
try{
 const launcher=engine==='chromium'?chromium:webkit;
 browser=await launcher.launch({headless:true,...(engine==='chromium'?{
  args:['--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--enable-webgl']
 }: {})});
 const context=await browser.newContext({viewport:{width,height:900},
  deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 for(const figure of figures)for(const denim of denims){
  const base=await visit(context,figure,denim,'baseline');
  const trial=await visit(context,figure,denim,'trial');
  assert.equal(base.shots.length,3);assert.equal(trial.shots.length,3);
  const differences=[];
  for(let i=0;i<base.shots.length;i++){
   const p=await sharp(base.shots[i].png).removeAlpha().raw().toBuffer({resolveWithObject:true});
   const q=await sharp(trial.shots[i].png).removeAlpha().raw().toBuffer({resolveWithObject:true});
   assert.deepEqual({w:p.info.width,h:p.info.height,c:p.info.channels},
    {w:q.info.width,h:q.info.height,c:q.info.channels});
   differences.push({angle:views[i],...perceptualDifference(p.data,q.data)});
  }
  if(trial.shape.trialApplied){
   // Actual source-panel geometry differences are NOT human realism proof.
   assert.ok(differences.some(d=>d.changedChannelsAbove12>250),
    'Accepted original-source denim rear/side geometry must change genuine WebGL pixels');
  }else{
   // Even rejected experiments MUST restore the existing original photo fit.
   assert.ok(differences.every(d=>d.changedChannelsAbove12<50),
    'Rejected original-source denim change leaked into WebGL screenshot');
  }
  experiments.push({width,figure,denim,
   baselineMs:base.elapsed,trialMs:trial.elapsed,
   variant:trial.shape.status,
   ...trial.shape,visualDifferences:differences,
   visualChangedNotEquivalentToImprovedRealism:true});
 }
 assert.deepEqual(offsite,[]);
 assert.deepEqual(errors,[]);
 assert.equal(captures.length,24);
 assert.equal(experiments.length,4);
 const report={schema:'P84-actual-licensed-denim-side-163-bone-visual-ab-v1',
  browser:engine,width,sourceOriginalSHA256:source,
  sampleDescriptions:'P541 source-tied 163-bone skinned garment, not real owner wardrobe',
  fullScreenshotCount:captures.length,matchedBaselineTrialPairs:experiments.length,
  sourceHeadWasDetached:true,photoPixelBytesAndUVUnmodified:true,
  existingCollisionChecksNotWaived:true,
  continuousGarmentContactCertified:false,realClothDynamicsValidated:false,
  humanRealismImprovementApproved:false,physicalAndroidIPhoneTested:false,
  originalUnphotographedBackNotInvented:true,
  productionChanged:false,familyAlpha:'HOLD',releaseAuthorized:false,
  experiments,captures};
 await writeFile(join(dest,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log('P84_REAL_SOURCE_DENIM_SIDE_AB_'+engine.toUpperCase(),JSON.stringify({
  screenshots:captures.length,comparisons:experiments.length,
  acceptedResearchVariants:experiments.filter(x=>x.trialApplied).length,
  refusedResearchVariants:experiments.filter(x=>!x.trialApplied).length,
  statuses:Object.fromEntries([...new Set(experiments.map(x=>x.status))]
   .map(status=>[status,experiments.filter(x=>x.status===status).length])),
  imagesAlteredWhenTrialApplied:experiments.filter(x=>x.trialApplied).every(x=>
   x.visualDifferences.some(v=>v.changedChannelsAbove12>250)),
  released:false,phoneHumanRealismApproved:false
 }));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
