/** Source-pose original body and exact original-photo coordinate invariants.
 * This code checks actual male/female original rigs, but input Image is a test
 * stub; real original photographed jeans browser QA runs separately.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {PANTS_RESEARCH_SOURCE} from '../research/three-d-30/reviewed-photo-pants.mjs';
const sha=v=>createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex');
const source=()=>({
 id:PANTS_RESEARCH_SOURCE.id,type:'pants',
 sourceSHA256:PANTS_RESEARCH_SOURCE.originalSHA256,cutoutSHA256:PANTS_RESEARCH_SOURCE.cutoutSHA256,
 sourceAssetsVerified:true,originalVerified:true,cutoutVerified:true,
 visibleSourceRGBPreserved:true,frontOrientationReviewed:true,neutralColorRGB:[82,101,131],
 cropRect:[.085,.07,.87,.82],cutout:{width:435,height:650},
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true
});
function garment(root){let found;root.traverse(o=>{if(o.userData?.work60Pants)found=o;});return found;}
function bodyHashes(root){const rows=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)rows.push([o.name,sha(o.geometry.attributes.position.array),sha(o.geometry.attributes.skinWeight.array)]);});return rows;}
const meshBytes=mesh=>{const g=mesh.geometry;return Object.fromEntries(['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'].map(x=>[x,sha(g.attributes[x].array)]));};
for(const kind of ['female','male'])test(kind+' actual original-body bounded jeans ease and source RGB/photo mapping unchanged',async()=>{
 const root=await person(kind),body=bodyHashes(root);
 const ctrl=createOutfitController(root,{naturalPantsDrape:false});
 try{
  const baseline=ctrl.setOutfit('pants',null,{pantsCandidate:source(),pantsReviewed:true});
  const m=garment(root),before=meshBytes(m),bposition=Float32Array.from(m.geometry.attributes.position.array);
  assert.equal(baseline.pants.naturalJeansDrape,undefined);
  const first=ctrl.setOutfit('pants',null,{pantsCandidate:source(),pantsReviewed:true});
  assert.equal(first.pants.photoApplied,true);assert.equal(first.pants.sourceSHA256,PANTS_RESEARCH_SOURCE.originalSHA256);
  // Rebuild in a genuinely new rig, not by reapplying an already-mutated mesh.
  const nextRoot=await person(kind),nextBody=bodyHashes(nextRoot),fresh=createOutfitController(nextRoot,{naturalPantsDrape:true});
  try{
   const after=fresh.setOutfit('pants',null,{pantsCandidate:source(),pantsReviewed:true});
   const f=garment(nextRoot);
   assert.equal(after.pants.naturalJeansDrape,true);
   assert.ok(after.pants.drapeMovedUniqueVertices>150);
   assert.ok(after.pants.maxDrapeMovement>=.002&&after.pants.maxDrapeMovement<=.0150001);
   assert.ok(after.pants.thighVertices>20||after.pants.ankleVertices>20);
   assert.equal(after.pants.originalPhotoCoordinatesUnchanged,true);
   assert.equal(after.pants.originalSourceUVUnchanged,true);
   assert.equal(after.pants.fullCollisionValidated,false);
   assert.equal(after.pants.humanVisualApproval,false);
   assert.equal(after.pants.releaseAuthorized,false);
   assert.deepEqual(meshBytes(f),before,'Original photographed mapping, skin and image coordinates must remain exactly identical');
   assert.deepEqual(bodyHashes(root),body,'Original body untouched by baseline');
   assert.deepEqual(bodyHashes(nextRoot),nextBody,'Original body untouched by drape');
   const ap=f.geometry.attributes.position.array;
   assert.equal(ap.length,bposition.length);let diff=0;
   for(let i=0;i<ap.length;i++)if(Math.abs(ap[i]-bposition[i])>0.00001)diff++;
   assert.ok(diff>500,'Genuine original-pant 3D positions must change, not a fake shader flag: '+diff);
   for(const pose of ['source','relaxed','source','relaxed']){
    fresh.setPose(pose);assert.deepEqual(meshBytes(f),before,'Photo UV source remains invariant on every pose');
   }
   assert.equal(fresh.setOutfit('pants').pants.photoApplied,false,'No reviewed photo reverts to neutral, without drape');
   assert.equal(fresh.setOutfit('none').garmentMeshes,0);
  }finally{fresh.dispose();}
 }finally{ctrl.dispose();}
});
test('Invalid source, a dress or neutral pants never activates source jeans drape',async()=>{
 const root=await person('female'),ctrl=createOutfitController(root);
 try{
  assert.equal(ctrl.setOutfit('pants').pants.naturalJeansDrape,undefined);
  const prior=ctrl.getState();
  assert.throws(()=>ctrl.setOutfit('pants',null,{pantsCandidate:{...source(),sourceAssetsVerified:false},pantsReviewed:true}),/reviewed|cutout/i);
  assert.deepEqual(ctrl.getState(),prior,'Invalid source must not replace valid neutral pants');
  const dress=ctrl.setOutfit('dress',candidate('dress'),{reviewed:true});
  assert.equal(dress.pants,null);
 }finally{ctrl.dispose();}
});
