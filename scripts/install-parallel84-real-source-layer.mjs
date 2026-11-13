/**
 * Assignment #84: disposable pinned P541 original-photograph two-piece donor.
 * Install a read-only source-contact receipt after the existing P69 outfit
 * fitting. Never patch the live application, other mission branches or GLBs.
 */
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
const base=resolve('.'),donor=resolve(process.argv[2]||'');
if(!process.argv[2]||donor===base||donor==='/'||
   base.startsWith(donor+'/')||
   donor.startsWith(base+'/public')||
   donor.startsWith(base+'/supabase'))
 throw Error('P84 disposable separate donor directory required');
const entry='research/parallel84-real-photo-layers';
for(const name of ['layer-contact84.mjs','actual-skinned-layers84.mjs',
 'source-bone-yoke-trial84.mjs','source-denim-side-trial84.mjs']){
 await mkdir(join(donor,entry),{recursive:true});
 await copyFile(join(base,entry,name),join(donor,entry,name));
}
const controllerPath=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let source=await readFile(controllerPath,'utf8');
const importAnchor="import {tailorSourceDress74} from './source-true-dress-tailoring.mjs';";
assert.equal(source.split(importAnchor).length,2,
 'P84 pinned P541 photographed two-piece controller import anchor changed');
source=source.replace(importAnchor,importAnchor+
 "\nimport {auditActualSkinnedOutfitLayers84} from '../parallel84-real-photo-layers/actual-skinned-layers84.mjs';"+
 "\nimport {trialSourceBoneShoulderYoke84} from '../parallel84-real-photo-layers/source-bone-yoke-trial84.mjs';"+
 "\nimport {trialSourceMeasuredDenimSide84} from '../parallel84-real-photo-layers/source-denim-side-trial84.mjs';");
const end="contact?.dispose();Object.values(parts).forEach(g=>g.dispose());parts=built;mode=next;contact=builtContact;changes++;return summarize();";
assert.equal(source.split(end).length,2,
 'P84 genuine P541 garments completed anchor missing');
const addition=[
"if(globalThis.location?.hostname==='127.0.0.1'&&next==='shirt-pants'){",
"  const p84Mode=new URLSearchParams(globalThis.location.search).get('parallel84Shape');",
"  if(p84Mode==='baseline')globalThis.__parallel84ShapeResult=Object.freeze({",
"   schema:'parallel84-source-bone-shoulder-yoke/v1',",
"   status:'BASELINE_UNMODIFIED',trialApplied:false,releaseAuthorized:false",
"  });",
"  if(p84Mode==='trial')globalThis.__parallel84ShapeResult=",
"   trialSourceBoneShoulderYoke84({",
"    root,shirt:built.shirt,pants:built.pants,",
"    avatar:globalThis.document?.getElementById('model')?.value,",
"    requestedDropMeters:.010,outwardClearanceMeters:.015",
"   });",
"}",
"if(globalThis.location?.hostname==='127.0.0.1'&&next==='shirt-pants'){",
"  const denimMode=new URLSearchParams(globalThis.location.search).get('parallel84Denim');",
"  if(denimMode==='baseline')globalThis.__parallel84DenimResult=Object.freeze({",
"   schema:'P84-original-denim-source-neutral-side-AB/v1',",
"   status:'BASELINE_UNMODIFIED',trialApplied:false,releaseAuthorized:false",
"  });",
"  if(denimMode==='trial'||denimMode==='legacy')globalThis.__parallel84DenimResult=",
"   trialSourceMeasuredDenimSide84({",
"    root,pants:built.pants,shirt:built.shirt,",
"    avatar:globalThis.document?.getElementById('model')?.value,",
"    sideEaseMeters:denimMode==='legacy'?.018:.011,",
"    rearEaseMeters:denimMode==='legacy'?.009:.004",
"   });",
"}",
"if(globalThis.location?.hostname==='127.0.0.1'&&",
"   new URLSearchParams(globalThis.location.search).get('parallel84Layers')==='research'){",
"  globalThis.__parallel84LayerEvidence=null;",
"  if(next==='shirt-pants'&&built.shirt&&built.pants){",
"   // The existing P69 source-verifier checks each original JPEG, mask and",
"   // licensed research capability before this read-only sampled audit.",
"   const shirtOK=candidate?.sourceSHA256===",
"     'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64'&&",
"     candidate?.realFabricTexture===true&&",
"     built.shirt.stats?.sourceSHA256===candidate.sourceSHA256;",
"   const pantsOK=pantsCandidate?.originalVerified===true&&",
"     pantsCandidate?.cutoutVerified===true&&",
"     built.pants.stats?.photoApplied===true&&",
"     built.pants.stats?.sourceSHA256===pantsCandidate.sourceSHA256;",
"   const items=[",
"    {slot:'top',sourceId:'licensed-shirt',sourceSHA256:candidate?.sourceSHA256,",
"     meshes:built.shirt.meshes,originalPhotoSHA256Verified:shirtOK,",
"     actualPhotoTexelsOnSkinnedMesh:shirtOK,",
"     actual163BoneSourceMesh:true,originalSourceGeometryUnmodified:true,",
"     rearViewPhotographed:false},",
"    {slot:'bottom',sourceId:pantsCandidate?.id,",
"     sourceSHA256:pantsCandidate?.sourceSHA256,",
"     meshes:built.pants.meshes,originalPhotoSHA256Verified:pantsOK,",
"     actualPhotoTexelsOnSkinnedMesh:pantsOK,",
"     actual163BoneSourceMesh:true,originalSourceGeometryUnmodified:true,",
"     rearViewPhotographed:false}",
"   ];",
"   globalThis.__parallel84LayerEvidence=auditActualSkinnedOutfitLayers84({",
"    root,items,avatar:globalThis.document?.getElementById('model')?.value,",
"    pose,maxFaces:30000,maxComparisons:800000,maxCandidatePairs:100000",
"   });",
"  }",
" }"
].join('\n');
source=source.replace(end,end.replace('return summarize();',
 addition+'\n return summarize();'));
await writeFile(controllerPath,source);
console.log('P84_DISPOSABLE_REAL_PHOTO_TWO_GARMENT_163_BONE_DIAGNOSTIC_INSTALLED_HOLD');
