/**
 * Family Alpha #65 — cancel superseded review promises on the same DOM panel.
 * Strictly overlays the already audited Family Alpha #64 preview-confirmation
 * module. Never touches the mask, original JPEG, account or wardrobe data.
 */
import {readFile,writeFile,cp,rm,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build as build64,verify as verify64,OUTPUT as PARENT,CONFIRM}
 from './build-family-alpha-64-isolation-guidance-hold.mjs';
export {CONFIRM,PARENT};
export const OUTPUT='dist-family-alpha-65-review-lifecycle-HOLD';
export const PARENT_SHA='02456192d91f0a41b2061e5dcaa24087119fc7a3';
const once=(s,a,b)=>{
 assert.equal(s.split(a).length,2,'Audited review lifecycle source changed: '+a.slice(0,60));
 return s.replace(a,b);
};
export function patchReview(original){
 let s=once(original,
 "export function confirmReviewedPhotoInContainer(container,detail,{",
 "const activeReviews=new WeakMap();\nexport function confirmReviewedPhotoInContainer(container,detail,{");
 s=once(s,
 " if(signal?.aborted||!isActive())return Promise.resolve(false);\n return new Promise(resolve=>{",
 " if(signal?.aborted||!isActive())return Promise.resolve(false);\n // A newer, valid preview for THIS same panel invalidates the old decision.\n // The old promise resolves false and its DOM, abort/pagehide/click listeners\n // are released before any new garment image is displayed.\n activeReviews.get(container)?.();\n return new Promise(resolve=>{");
 s=once(s,
 "   container.replaceChildren();resolve(Boolean(value));",
 "   // Old work may never remove or confirm a newer review.\n   if(activeReviews.get(container)===cancelReview){\n    activeReviews.delete(container);\n    if(container.contains(panel))container.replaceChildren();\n   }\n   resolve(Boolean(value));");
 s=once(s,
 "  function onConfirm(event){if(!event.isTrusted)return;done(isActive());}",
 "  function cancelReview(){done(false);}\n  function onConfirm(event){\n   if(!event.isTrusted||activeReviews.get(container)!==cancelReview||!container.contains(panel))return;\n   done(isActive());\n  }");
 s=once(s,
 "  if(signal?.aborted||!isActive())done(false);",
 "  activeReviews.set(container,cancelReview);\n  if(signal?.aborted||!isActive())done(false);");
 return s;
}
async function files(dir,prefix=''){
 const out=[];
 for(const entry of await readdir(join(dir,prefix),{withFileTypes:true})){
  assert.equal(entry.isSymbolicLink(),false);
  const rel=prefix+entry.name;
  if(entry.isDirectory())out.push(...await files(dir,rel+'/'));
  else {assert.equal(entry.isFile(),true);out.push(rel);}
 }
 return out.sort();
}
export async function verify(){
 await verify64();
 const parent=await files(PARENT),current=await files(OUTPUT);
 assert.deepEqual(current,[...parent,'family-alpha-65-HOLD.json'].sort());
 for(const path of parent){
  const source=await readFile(join(PARENT,path));
  const actual=await readFile(join(OUTPUT,path));
  if(path===CONFIRM)assert.equal(actual.toString('utf8'),patchReview(source.toString('utf8')));
  else assert.deepEqual(actual,source,'No other app/owner/photo/backup asset may change: '+path);
 }
 const m=JSON.parse(await readFile(join(OUTPUT,'family-alpha-65-HOLD.json'),'utf8'));
 assert.equal(m.parentCommit,PARENT_SHA);
 assert.equal(m.decision,'HOLD');
 assert.equal(m.automaticApproved,false);
 assert.equal(m.deploymentAuthorized,false);
 assert.equal(m.visualOwnerApproved,false);
 return {decision:'HOLD',onlyReviewLifecycleChanged:true,automaticApproved:false,
  visualOwnerApproved:false,deploymentAuthorized:false,parentCommit:PARENT_SHA};
}
export async function build(){
 await build64();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await writeFile(join(OUTPUT,CONFIRM),
  patchReview(await readFile(join(PARENT,CONFIRM),'utf8')));
 await writeFile(join(OUTPUT,'family-alpha-65-HOLD.json'),JSON.stringify({
  decision:'HOLD',parentCommit:PARENT_SHA,automaticApproved:false,
  visualOwnerApproved:false,deploymentAuthorized:false,
  productionModified:false,stagingModified:false,
  livePhysicalPhonesVerified:false,realTwoOwnerJwtIsolationVerified:false,
  modifiedCompiledAssets:[CONFIRM],
  note:'Superseded reviews cancel with false and cannot clear or accept newer photo'
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_65_REVIEW_LIFECYCLE_HOLD',JSON.stringify(await build()));
