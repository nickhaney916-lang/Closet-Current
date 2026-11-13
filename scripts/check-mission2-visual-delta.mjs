/** Independent rendered-pixel acceptance. Claims only visible change and distinct models,
 * not human photographic realism, physical collisions, fabric physics or phone hardware.
 * Filenames are composed exactly: "male" must never substring-match "female".
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

const STEP=Object.freeze({
 female:Object.freeze({front:'01',side:'02',rear:'03'}),
 male:Object.freeze({front:'04',side:'05',rear:'06'})
});
export function exactVisualName(engine,width,figure,view){
 if(!['chromium','webkit'].includes(engine)||![320,390,430].includes(width)||
    !Object.hasOwn(STEP,figure)||!Object.hasOwn(STEP[figure],view))throw Error('M2 visual exact filename contract');
 const suffix=view==='rear'?'inferred-rear':view;
 return `${engine}-${width}-${STEP[figure][view]}-${figure}-${suffix}-provisional-blouse.png`;
}
export async function visiblePixelDelta(first,second,width){
 if(!Number.isInteger(width)||width<128)throw Error('M2 visible crop width');
 const left=Math.floor(width*.20),right=Math.floor(width*.80);
 const crop={left,top:85,width:right-left,height:210};
 const read=async buf=>sharp(buf).extract(crop).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const [a,b]=await Promise.all([read(first),read(second)]);
 assert.deepEqual([a.info.width,a.info.height,a.info.channels],[crop.width,crop.height,3]);
 assert.deepEqual([b.info.width,b.info.height,b.info.channels],[crop.width,crop.height,3]);
 let changed=0;
 for(let i=0;i<a.data.length;i+=3){
  if(Math.max(Math.abs(a.data[i]-b.data[i]),
     Math.abs(a.data[i+1]-b.data[i+1]),
     Math.abs(a.data[i+2]-b.data[i+2]))>12)changed++;
 }
 return changed/(crop.width*crop.height);
}
export async function verifyMission2VisualDelta(engine,root='benchmark/mission2-source-length'){
 if(!['chromium','webkit'].includes(engine))throw Error('M2 visual browser required');
 const stageData=new Map();
 for(const stage of ['before','after']){
  const dir=resolve(root,stage+'-'+engine);
  const results=JSON.parse(await readFile(join(dir,'results.json'),'utf8'));
  assert.deepEqual(results.errors,[],stage+' browser errors');
  assert.equal(results.crashes.length,0,stage+' browser crashes');
  assert.equal(results.screens.length,22,stage+' expected complete screenshot manifest');
  const receipts=new Map(results.screens.map(x=>[x.name,x]));
  assert.equal(receipts.size,22,'unique exact screenshot receipts');
  stageData.set(stage,{dir,receipts});
 }
 const read=async(stage,width,figure,view)=>{
  const {dir,receipts}=stageData.get(stage),name=exactVisualName(engine,width,figure,view);
  const receipt=receipts.get(name);
  assert.ok(receipt,'missing exact '+stage+'/'+name);
  assert.equal(receipt.width,width,'visual width manifest');
  const png=await readFile(join(dir,name));
  assert.equal(createHash('sha256').update(png).digest('hex'),receipt.sha256,'visual original PNG SHA');
  const meta=await sharp(png).metadata();
  assert.equal(meta.width,width,'visual PNG width');
  assert.ok(meta.height>=300,'visual screenshot height');
  return png;
 };
 const metrics=[];
 for(const width of [320,390,430]){
  for(const view of ['front','side','rear']){
   const pictures={};
   for(const stage of ['before','after']){
    pictures[stage]={};
    for(const figure of ['female','male'])
     pictures[stage][figure]=await read(stage,width,figure,view);
    const distinction=await visiblePixelDelta(pictures[stage].female,pictures[stage].male,width);
    assert.ok(distinction>=.04,
      `M2 ${engine} ${width} ${stage} ${view}: male/female render pixel identity or insufficient anatomy change (${distinction})`);
    metrics.push({width,view,stage,comparison:'male-v-female',changedFraction:distinction});
   }
   for(const figure of ['female','male']){
    const change=await visiblePixelDelta(pictures.before[figure],pictures.after[figure],width);
    assert.ok(change>=.04,
      `M2 ${engine} ${width} ${figure} ${view}: photographed geometry/texture not visibly changed (${change})`);
    metrics.push({width,view,figure,comparison:'source-length-before-v-after',changedFraction:change});
   }
  }
 }
 assert.equal(metrics.length,36);
 return {engine,comparisons:metrics.length,realScreensVerified:36,minChangedFraction:Math.min(...metrics.map(x=>x.changedFraction)),
  means:metrics,claim:'Visible source change and distinct rendered anatomical figures only; NO photorealism/collision certification'};
}

/**
 * P2-C33: actual signed-fixture 163-bone WebGL scene, identical garment
 * geometry / original licensed JPEG and camera, with only a TEST-SCOPED
 * in-memory removal of the P2-C32 border RGB feather for the control.
 *
 * Pixel differences are count-only observations, NOT evidence of improved
 * photographic realism or confidence on any private wardrobe.
 */
export async function measuredIdenticalScenePixelDelta(first,second,width){
 if(![320,390,430].includes(width))throw Error('M2 C33 validated screenshot width required');
 const left=Math.floor(width*.15),right=Math.floor(width*.85);
 const crop={left,top:60,width:right-left,height:410};
 const decode=async png=>sharp(png).extract(crop).removeAlpha()
  .toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const [a,b]=await Promise.all([decode(first),decode(second)]);
 assert.deepEqual([a.info.width,a.info.height,a.info.channels],
  [crop.width,crop.height,3]);
 assert.deepEqual([b.info.width,b.info.height,b.info.channels],
  [crop.width,crop.height,3]);
 let changedOver2=0,changedOver8=0,changedOver12=0,absoluteChannelSum=0;
 let maxChannelDiff=0;
 for(let i=0;i<a.data.length;i+=3){
  const red=Math.abs(a.data[i]-b.data[i]),
   green=Math.abs(a.data[i+1]-b.data[i+1]),
   blue=Math.abs(a.data[i+2]-b.data[i+2]);
  const peak=Math.max(red,green,blue);
  absoluteChannelSum+=red+green+blue;
  maxChannelDiff=Math.max(maxChannelDiff,peak);
  if(peak>2)changedOver2++;
  if(peak>8)changedOver8++;
  if(peak>12)changedOver12++;
 }
 const sampledPixels=crop.width*crop.height;
 return Object.freeze({sampledPixels,changedOver2,changedOver8,changedOver12,
  fractionChangedOver2:changedOver2/sampledPixels,
  fractionChangedOver8:changedOver8/sampledPixels,
  fractionChangedOver12:changedOver12/sampledPixels,
  meanAbsoluteChannelError:absoluteChannelSum/(sampledPixels*3),
  maxChannelDiff,
  noOriginalPhotoPixelsReturned:true,
  humanAppearanceImprovementNotEstablished:true});
}
export async function verifyMission2ControlledPhotoEdgePixels(engine,
 root='benchmark/mission2-source-length',{seamNormal=false}={}){
 if(!['chromium','webkit'].includes(engine))throw Error('M2 C33 browser engine required');
 const dir=resolve(root);
 const stages={guarded:join(dir,'after-'+engine),
  control:join(dir,(seamNormal?'seam-control-':'control-')+engine)};
 const results={};
 for(const [stage,location] of Object.entries(stages)){
  results[stage]=JSON.parse(await readFile(join(location,'results.json'),'utf8'));
  const r=results[stage];
  assert.equal(r.browser,engine,'same actual WebGL engine required');
  assert.deepEqual(r.errors,[],'original photo rendering must have no browser errors');
  assert.deepEqual(r.crashes,[],'original photo rendering must have no browser crashes');
  assert.equal(r.screens.length,22,'full original-photo WebGL screenshot manifest');
  assert.equal(r.sourceLengthMode,true);
  assert.equal(r.sourceProjectionMode,true);
  assert.equal(r.sourceTriangleMode,true);
  assert.equal(r.sourceAdaptiveMode,false);
  assert.equal(r.sourceLengthEvidence.length,6);
  assert.equal(r.originalNativeAuthHTTPOnlyMocked,true);
  assert.equal(r.actual3DWithHonestUnsupportedPhotoFallback,true);
  assert.equal(r.familyAlpha,'HOLD');
  assert.equal(r.releaseAuthorized,false);
  if(stage==='control'&&seamNormal){
   assert.equal(r.seamNormalAblationControl,true);
   assert.ok(r.seamNormalAblationModuleRequests>=3&&
    r.seamNormalAblationModuleRequests<=24);
   assert.equal(r.sourceEdgeAblationControl,false);
  }else if(stage==='control'){
   assert.equal(r.sourceEdgeAblationControl,true);
   assert.ok(r.sourceEdgeAblationModuleRequests>=3&&
    r.sourceEdgeAblationModuleRequests<=24);
   assert.equal(r.seamNormalAblationControl,false);
  }else{
   assert.equal(r.sourceEdgeAblationControl,false);
   assert.equal(r.sourceEdgeAblationModuleRequests,0);
   assert.equal(r.seamNormalAblationControl,false);
   assert.equal(r.seamNormalAblationModuleRequests,0);
  }
 }
 // Same source, same skinned geometry and intersection gate on both figures.
 for(let i=0;i<6;i++){
  const a=results.guarded.sourceLengthEvidence[i],
   b=results.control.sourceLengthEvidence[i];
  for(const key of ['width','figure','sourceSHA256','oldHemY','newHemY',
   'movedVertices','extension','flare','intersectionPairsBefore',
   'intersectionPairsAfter','triangleContactsBefore','triangleContactsAfter',
   'newTriangleContacts','collisionCertified'])
   assert.deepEqual(a[key],b[key],
    'P2-C33 garment geometry/identity must be identical: '+key);
  assert.equal(a.sourceProjectionRGB,true);
  assert.equal(b.sourceProjectionRGB,true);
  assert.equal(a.sourceProjectionCompiledMaterialCount>=1,true);
  assert.equal(b.sourceProjectionCompiledMaterialCount>=1,true);
 }
 const read=async(stage,width,figure,view)=>{
  const filename=exactVisualName(engine,width,figure,view);
  const receipt=results[stage].screens.find(x=>x.name===filename);
  assert.ok(receipt,'missing actual source figure/frame '+stage+'/'+filename);
  assert.equal(receipt.width,width);
  const png=await readFile(join(stages[stage],filename));
  assert.equal(createHash('sha256').update(png).digest('hex'),receipt.sha256);
  const meta=await sharp(png).metadata();
  assert.equal(meta.width,width);
  assert.ok(meta.height>=880);
  return png;
 };
 const comparisons=[];
 for(const width of [320,390,430])
  for(const figure of ['female','male'])
   for(const view of ['front','side','rear']){
    const [guarded,control]=await Promise.all([
     read('guarded',width,figure,view),read('control',width,figure,view)]);
    comparisons.push({width,figure,view,
     ...(await measuredIdenticalScenePixelDelta(guarded,control,width))});
   }
 assert.equal(comparisons.length,18);
 const changed=comparisons.filter(x=>x.changedOver2>0);
 const front=comparisons.filter(x=>x.view==='front');
 return Object.freeze({
  engine,comparisonKind:seamNormal?'fabric-seam-lighting':'source-photo-edge',matchedOriginalPhotoScenes:18,
  originalSourcePhotoAndGeometryControlled:true,
  guardAgainstNoControlInterception:true,
  guardedAndAblatedSameOriginal163BoneGarments:true,
  originalPhotoPixelValuesNeverExported:true,
  screenshotMetricsOnly:true,
  scenePairsWithAny2PlusRGBDifference:changed.length,
  frontScenePairsWithAny2PlusRGBDifference:front.filter(x=>x.changedOver2>0).length,
  maxFractionChangedOver2:Math.max(...comparisons.map(x=>x.fractionChangedOver2)),
  maxMeanAbsoluteChannelError:Math.max(...comparisons.map(x=>x.meanAbsoluteChannelError)),
  actualPixelEffectDetected:changed.length>0,
  comparisons,
  claim:'Actual controlled same-geometry rendered-pixel difference only; not proof of better human realism or color accuracy',
  releaseAuthorized:false
 });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const promise=process.argv[3]==='edge-guard'?
  verifyMission2ControlledPhotoEdgePixels(process.argv[2]):
  process.argv[3]==='seam-normal'?
  verifyMission2ControlledPhotoEdgePixels(process.argv[2],undefined,{seamNormal:true}):
  verifyMission2VisualDelta(process.argv[2]);
 promise.then(x=>{
  if(process.argv[3]==='seam-normal')console.log('M2_CONTROLLED_SOURCE_FABRIC_NORMAL_PIXELS_'+x.engine+':'+JSON.stringify(x));
  else if(process.argv[3]==='edge-guard')console.log('M2_CONTROLLED_SOURCE_EDGE_RENDER_PIXELS_'+x.engine+':'+JSON.stringify(x));
  else console.log('M2_VISIBLE_DUAL_HUMANOID_'+x.engine+'_36_SHA_PIXEL_COMPARISONS_PASS');
  console.log(JSON.stringify({engine:x.engine,comparisons:x.comparisons,realScreensVerified:x.realScreensVerified,minChangedFraction:x.minChangedFraction,claim:x.claim}));
 }).catch(e=>{console.error(e);process.exitCode=1;});
}
