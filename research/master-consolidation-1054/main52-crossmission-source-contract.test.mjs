/**
 * MAIN1054 M52: ACTUAL donor code loaded side-by-side into one disposable
 * M51 source tree, no merge. Safe proof is shared-source denial of premature
 * save/3D, NOT physical cloth fit nor combined native consumer UI.
 *
 * Copies imported into scratch by exact SHA (CI):
 *  - Mission #88 outfit-instance-review-840 (review-only)
 *  - Mission #89 source-contract + P86 observed front panel
 *  - Mission #90 native avatar viewer source admission bridge
 *
 * Public source JPEG is checked-in licensed Commons-0053 original.
 * No owners, tokens or hosted data are touched; Family Alpha HOLD.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {clothingLabelMap,clothingMaskGroups} from '../../public/outfit-segmentation.mjs';
import {clothingReviewInstances840} from '../../public/outfit-instance-review-840.mjs';
import {attestOriginalSource89,SOURCE_CLASSES89,auditSourceOutfit89} from '../parallel89/source-contract.mjs';
import {NATIVE_3D_05,validateNative3D05Selection,requireNative3D05Visible102} from '../native-3d-05/native-preview-bridge.mjs';
import {M48} from '../main1054-3d48/photo-neckline-edge-admission48.mjs';
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const bytes=id=>readFileSync('benchmark/fixtures/'+id+'.jpg');
const manifest=id=>locked.find(x=>x.id===id);
const sha=b=>createHash('sha256').update(b).digest('hex');
const approved=id=>attestOriginalSource89({
 sourceId:id,originalBytes:bytes(id),lockedRecord:manifest(id)
});
function semantic48(){
 const width=48,height=48,area=width*height,data=new Float32Array(area*18);
 data.fill(-10);for(let i=0;i<area;i++)data[i]=10;
 for(const [x,y,w,h] of [[4,7,6,8],[29,7,6,8]]){
  for(let v=y;v<y+h;v++)for(let u=x;u<x+w;u++){
   const pix=v*width+u;
   for(let cls=0;cls<18;cls++)data[cls*area+pix]=cls===4?10:-10;
  }
 }
 return clothingLabelMap(data,[1,18,height,width]);
}

test('M52 real donor #88 same-class disconnected source remains one UNSAVED unresolved review aggregate',()=>{
 const map=semantic48(),original=clothingMaskGroups(map).find(x=>x.id===4);
 const conservative=clothingReviewInstances840(map).filter(x=>x.id===4);
 const trial=clothingReviewInstances840(map,{splitNonFootwear:true}).filter(x=>x.id===4);
 assert.equal(original.count,96);
 assert.equal(conservative.length,1);
 assert.equal(conservative[0].count,96);
 assert.equal(conservative[0].componentReviewStatus,'unresolved_fragments_keep_source_mask');
 assert.equal(conservative[0].requiresReview,true);
 assert.equal(trial.length,2);
 assert.equal(trial.every(x=>x.requiresReview&&
  x.componentReviewStatus==='owner_must_confirm_garment_units'),true);
 assert.equal(trial.reduce((n,g)=>n+g.count,0),original.count);
 assert.equal(conservative.some(x=>x.ownerReviewGranted===true),false);
});
test('M52 authentic licensed dress JPEG source hash is independently identical in P89 and native M48/M51',()=>{
 const b=bytes('commons-0053');
 assert.equal(sha(b),M48.sourceSHA256);
 assert.equal(SOURCE_CLASSES89['commons-0053'].sha,M48.sourceSHA256);
 const original=approved('commons-0053');
 assert.equal(original.status,'ORIGINAL_JPEG_VERIFIED');
 assert.equal(original.originalSHA256,sha(b));
 assert.equal(original.category,'dress');
 assert.equal(original.originalByteCount,b.length);
 assert.equal(original.ownerApproved,false);
 assert.equal(original.sourceMaskApproved,false);
 assert.equal(original.actual163BoneFitProved,false);
 assert.equal(original.consumer3DAdmitted,false);
 assert.equal(original.releaseAuthorized,false);
});
test('M52 P89 original source JPG provenance rejects a tampered pixel but never promotes SHA text',()=>{
 const b=Buffer.from(bytes('commons-0053'));
 b[100]^=1;
 const result=attestOriginalSource89({sourceId:'commons-0053',
  originalBytes:b,lockedRecord:manifest('commons-0053')});
 assert.equal(result.status,'ORIGINAL_PHOTO_2D_REQUIRED');
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.consumer3DAdmitted,false);
});
test('M52 genuine multi-garment public-source upper+bottom is allowed ONLY as original 2D fallback',()=>{
 for(const avatar of ['female','male']){
  const good=auditSourceOutfit89({pieces:[approved('commons-0003'),approved('commons-0023')],avatar});
  assert.equal(good.status,'MULTICATEGORY_PUBLIC_SOURCE_PAIR_VERIFIED_3D_NOT_CLEARED');
  assert.equal(good.mode,'original-photo-2d-required');
  assert.equal(good.actualPairedSkinnedMeshesValidated,false);
  assert.equal(good.safeToRenderPhotorealistic3D,false);
  assert.equal(good.releaseAuthorized,false);
  const dressOverBottom=auditSourceOutfit89({
   pieces:[approved('commons-0053'),approved('commons-0023')],avatar});
  assert.equal(dressOverBottom.status,'ORIGINAL_PHOTO_2D_REQUIRED');
  assert.equal(dressOverBottom.releaseAuthorized,false);
 }
});
test('M52 P90 native viewer refuses saved original-photo outfit without approved explicit outfit3dId',()=>{
 const originalAuth={user:{id:'m52-public-fixture'},assertCurrent(){}};
 const win={closetAuth:originalAuth};
 const doc={getElementById:id=>({hidden:id==='authGate'})};
 const consumer={
  status:()=>({active:true,dirty:false}),
  selected:0,
  readOnlySnapshot:()=>({saved:[{
   id:'m52-saved',ownerId:'m52-public-fixture',
   name:'Original photo only',slots:{top:'m52-public-dress'}
  }]})
 };
 assert.throws(()=>validateNative3D05Selection({consumer,originalNativeAuth:originalAuth,
  win,doc}),/outfit3dId/);
 assert.equal(NATIVE_3D_05.productionEnabled,false);
 assert.equal(NATIVE_3D_05.releaseAuthorized,false);
 assert.equal(NATIVE_3D_05.familyAlpha,'HOLD');
 assert.equal(NATIVE_3D_05.anatomicalRigBones,163);
});
test('M52 P90 hidden mobile app cannot reuse stale owner-private WebGL admission',()=>{
 assert.throws(()=>requireNative3D05Visible102({
  doc:{hidden:true,visibilityState:'hidden'}
 }),/hidden browser/);
 assert.throws(()=>requireNative3D05Visible102({
  doc:{hidden:false,visibilityState:'prerender'}
 }),/hidden browser/);
});
test('M52 no research module can convert original photo or a synthetic split to released sewn 3D garment',()=>{
 assert.equal(M48.consumer3DAdmitted,false);
 assert.equal(M48.releaseAuthorized,false);
 assert.equal(M48.familyAlpha,'HOLD');
 const dress=approved('commons-0053');
 assert.equal(dress.actual163BoneFitProved,false);
 assert.equal(dress.releaseAuthorized,false);
 assert.equal(NATIVE_3D_05.productionEnabled,false);
 assert.equal(NATIVE_3D_05.releaseAuthorized,false);
});
