/**
 * P149 independent verified file byte + viewpoint difference audit.
 * This is source-licensed geometric evidence, NEVER a fabricated subjective
 * 10/10 photorealism or unphotographed rear-texture certification.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PHOTO149,evaluateVisualEvidence149}
 from '../research/dual-humanoid-visual-evidence-149/source-visual-gate.mjs';
const base=resolve('benchmark/dual-humanoid-visual-evidence-149');
const m=JSON.parse(await readFile(resolve(base,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(m.priority,149);
assert.equal(m.donorHead,PHOTO149.donorSourcePinned);
assert.ok(Array.isArray(m.frames));
assert.deepEqual(m.errors,[]);assert.deepEqual(m.crashes,[]);
assert.equal(m.familyAlpha,'HOLD');
assert.equal(m.actualPrivateWardrobePhotorealismAccepted,false);
assert.equal(m.actualPhysicalAndroidIphoneVerified,false);
const verified=[],pict=new Map();
for(const f of m.frames){
 const bytes=await readFile(resolve(base,f.file));
 assert.ok(bytes.length>3000);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(hash(bytes),f.imageSHA256);
 const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(meta.format,'png');assert.equal(meta.width,f.imageWidth);
 assert.equal(meta.height,f.imageHeight);
 assert.ok(stats.channels.some(s=>s.stdev>7),'original source rendered PNG must have nonblank pixels');
 const key=[f.engine,f.figure,f.width,f.denim,f.view].join('|');
 assert.ok(!pict.has(key));pict.set(key,bytes);
 verified.push(key);
}
function pixelChanges(a,b){
 return Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true}),
  sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 ]).then(([x,y])=>{
  assert.equal(x.info.width,y.info.width);
  assert.equal(x.info.height,y.info.height);
  let changed=0;
  for(let i=0;i<x.data.length;i+=4)
   if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+
      Math.abs(x.data[i+2]-y.data[i+2])>40)changed++;
  return changed;
 });
}
const turns=[];
for(const engine of m.engines)for(const figure of PHOTO149.figures)
 for(const width of PHOTO149.widths)for(const denim of Object.keys(PHOTO149.licensedDenim)){
  const prefix=[engine,figure,width,denim].join('|')+'|';
  const front=pict.get(prefix+'front'),rear=pict.get(prefix+'rear'),
   right=pict.get(prefix+'right'),left=pict.get(prefix+'left');
  if(!front||!rear||!right||!left)throw Error('P149 missing actual front/side/rear view');
  const diffRear=await pixelChanges(front,rear),diffSides=await pixelChanges(right,left);
  assert.ok(diffRear>500,'camera front vs rear must change actual pictured geometry');
  assert.ok(diffSides>250,'camera left vs right must change actual pictured geometry');
  turns.push({engine,figure,width,denim,changedFrontToRear:diffRear,
   changedLeftToRight:diffSides,onlyLicensedResearchSource:true});
 }
const coverage=evaluateVisualEvidence149({frames:m.frames,verifiedImageKeys:verified});
assert.equal(coverage.expectedFrames,144);
assert.equal(coverage.completeSourceGarmentViewportAngleCoverage,true,
 'two real browser engines, two figures, three mobile widths, two original denims, six angles required');
assert.equal(coverage.independentlyByteVerifiedFrames,144);
assert.equal(coverage.independentHumanRealismReviewComplete,false);
assert.equal(coverage.actualRealPersonalPhotoReconstructionAccepted,false);
assert.equal(coverage.dressShoesJacketLayeringVerified,false);
assert.equal(coverage.releaseAuthorized,false);
await mkdir(resolve(base,'audit'),{recursive:true});
const result={schema:'p149-actual-WebGL-dual-humanoid-source-evidence',
 donorHead:m.donorHead,independentScreenshotSHAAndPixelsAudited:verified.length,
 distinctCameraViewPairs:turns.length,angleProof:turns,
 coverage,modelPhotorealismHumanAccepted:false,
 current3DSourceOnlyShirtAndDenim:true,
 noOriginalGarmentBackPhotographed:true,
 noActualUserCameraPhoto3DGeneralization:true,
 noPhysicalAndroidOrIPhoneTest:true,
 noLiveSignedCloudRLSInThisVisualTest:true,
 familyAlpha:'HOLD',releaseAuthorized:false};
await writeFile(resolve(base,'audit','acceptance.json'),JSON.stringify(result,null,2)+'\n');
console.log('P149_INDEPENDENT_VISUAL_SOURCE_AUDIT '+JSON.stringify({
 realSkinnedOriginalSourceWebGLFrames:verified.length,
 independentMobileAnglePairs:turns.length,
 acceptedHumanPhotorealism:false,
 fullTwoEngineSourceAngleMatrix:true,
 photographedJacketsShoesDressNotVerified:true,
 familyAlpha:'HOLD'}));
