import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {prepareAutomaticGarment} from '../research/work50/isolate.mjs';
import {prepareSyntheticGarmentOriginal} from '../research/family-alpha-13/garment-photo-preparation.mjs';
import {createPortableCutoutEditRecipe,restorePortableCutoutEditRecipe} from '../research/work49/portable-edits.mjs';
import {applyMaskRefinement} from '../research/work49/refine-engine.mjs';
import {patchProvider,verify,PROVIDER,OUTPUT,PARENT}
 from '../scripts/build-family-alpha-63-automatic-portable-hold.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const scene=(id=1)=>{
 const width=128,height=160,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const inside=x>=30&&x<98&&y>=35&&y<135;
  const k=(y*width+x)*4,foreground=inside?33:250;
  data.set([foreground,foreground,foreground,255],k);
 }
 return {width,height,data,sourceIdentity:'synthetic-garment-'+id,
  sourceVersion:'synthetic-source-version-'+id};
};
const options=f=>({category:'Tops',sourceIdentity:f.sourceIdentity,sourceVersion:f.sourceVersion});
const sourceRecipe=prepared=>({
 originalImage:'data:image/jpeg;base64,'+Buffer.from('Synthetic-source-only-not-a-real-jpeg-'.repeat(3)).toString('base64'),
 maskFrame:{width:prepared.width,height:prepared.height,rgba:new Uint8ClampedArray(prepared.rgba)},
 category:'Tops'
});
test('Work50 proposal keeps prior crop and preserves original RGB, cannot auto-approve',()=>{
 const f=scene(),source=new Uint8ClampedArray(f.data);
 const legacy=prepareSyntheticGarmentOriginal(f,options(f));
 const next=prepareAutomaticGarment(f,options(f));
 assert.equal(legacy.status,'prepared');assert.equal(next.status,'prepared');
 assert.deepEqual(next.bounds,legacy.bounds,'Protected fitted landmarks cannot shift due to automatic source re-crop');
 assert.equal(next.width,legacy.width);assert.equal(next.height,legacy.height);
 assert.equal(next.requiresHumanReview,true);
 assert.equal(next.autoAccepted,false);
 assert.equal(next.qualityDecision,'REVIEW');
 assert.deepEqual(f.data,source,'Authoritative original must remain byte-identical');
 for(let i=0;i<next.rgba.length;i++){
  if(i%4!==3)assert.equal(next.rgba[i],legacy.rgba[i],'Original crop RGB bytes must never change');
  else assert.ok(next.rgba[i]<=legacy.rgba[i],'No new opaque cloth from automatic cleanup');
 }
});
test('portable manual edit recipe round-trips ONLY on current Work50 exact source cutout',async()=>{
 const f=scene(),auto=prepareAutomaticGarment(f,options(f));
 assert.equal(auto.status,'prepared');
 const source=sourceRecipe(auto);
 const edits=[{action:'remove',x:.42,y:.55,radius:.02}];
 const before=new Uint8ClampedArray(source.maskFrame.rgba);
 const recipe=await createPortableCutoutEditRecipe(source,edits);
 assert.equal(recipe.decision,'HOLD');assert.equal(recipe.ownerApproved,false);
 assert.equal(recipe.requiresReview,true);
 const recovered=await restorePortableCutoutEditRecipe(source,JSON.stringify(recipe));
 assert.deepEqual(recovered,edits);
 const refined=applyMaskRefinement(source.maskFrame,recovered);
 assert.notDeepEqual(refined.rgba,before,'Source-only manual correction must actually change cutout');
 assert.deepEqual(source.maskFrame.rgba,before,'Neither automatic proposal nor edit replay overwrites reviewed base');
 const failedAuto={...source,maskFrame:{...source.maskFrame,rgba:new Uint8ClampedArray(source.maskFrame.rgba)}};
 failedAuto.maskFrame.rgba[3]=failedAuto.maskFrame.rgba[3]===255?0:255;
 await assert.rejects(()=>restorePortableCutoutEditRecipe(failedAuto,JSON.stringify(recipe)),/different source/);
 const changedOriginal={...source,originalImage:source.originalImage+'A'};
 await assert.rejects(()=>restorePortableCutoutEditRecipe(changedOriginal,JSON.stringify(recipe)),/different source/);
 const forged={...recipe,ownerApproved:true};
 await assert.rejects(()=>restorePortableCutoutEditRecipe(source,JSON.stringify(forged)),/invalid|different source/);
});
test('Work50 fallback does not fabricate a garment; local manual cutout workflow is separately unchanged',()=>{
 const f=scene();for(let i=0;i<f.data.length;i+=4)f.data.set([50,90,120,255],i);
 const original=new Uint8ClampedArray(f.data);
 const r=prepareAutomaticGarment(f,options(f));
 assert.notEqual(r.status,'prepared');
 assert.deepEqual(f.data,original);
});
test('automatic isolation adapter changes exactly one provider import and preserves all authorization and human confirmation',async()=>{
 const original=await readFile('research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs','utf8');
 const replaced=patchProvider(original);
 assert.notEqual(replaced,original);
 const from="import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';";
 const to="import {prepareAutomaticGarment as prepareSyntheticGarmentOriginal} from '../work50/isolate.mjs';";
 assert.equal(replaced.replace(to,from),original);
 assert.match(replaced,/const approved=await reviewPreview/);
 assert.match(replaced,/if\(approved!==true\)return reviewOnly/);
 assert.match(replaced,/await auditMask/);
 assert.match(replaced,/fingerprintAlphaReviewContext/);
 assert.match(replaced,/validScope\(getScope,ownerId,epoch,isCurrent\)/);
 assert.match(replaced,/validateLiveRecord\(item,getItem,initial\)/);
});
test('byte-exact compiled overlay preserves recipe recovery, mask replay and full account/backup and fit files',async()=>{
 const result=await verify();
 assert.equal(result.decision,'HOLD');
 assert.equal(result.automaticApproved,false);
 assert.equal(result.deploymentAuthorized,false);
 assert.equal(result.portableEditRecoveryUnchanged,true);
 for(const rel of ['__alpha_research/work49/portable-edits.mjs',
  '__alpha_research/family-alpha-35/review-cutout.mjs',
  '__alpha_research/family-alpha-35/reviewed-mask-controls.mjs']){
  assert.deepEqual(await readFile(PARENT+'/'+rel),await readFile(OUTPUT+'/'+rel));
 }
 const p=await readFile(OUTPUT+'/'+PROVIDER,'utf8');
 assert.match(p,/prepareAutomaticGarment as prepareSyntheticGarmentOriginal/);
 const status=JSON.parse(await readFile(OUTPUT+'/family-alpha-63-HOLD.json','utf8'));
 assert.equal(status.sourceBoundRecipeRecheckRequired,true);
 assert.equal(status.visualOwnerApproved,false);
 assert.equal(status.realTwoOwnerJwtVerified,false);
 assert.equal(status.physicalPhoneVerified,false);
});
