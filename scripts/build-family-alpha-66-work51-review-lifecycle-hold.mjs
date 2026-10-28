/**
 * Family Alpha #66 — Work51 source-contour proposal atop #65 review lifecycle.
 * Offline only. Every other compiled asset is compared byte for byte.
 */
import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build as build65,verify as verify65,OUTPUT as PARENT}
 from './build-family-alpha-65-review-lifecycle-hold.mjs';
export {PARENT};
export const OUTPUT='dist-family-alpha-66-work51-review-lifecycle-HOLD';
export const WORK51_SHA='043950847dcdaab98d82bdb07f8fe8c84341cc18';
export const WORK65_SHA='37ed07499e642f16cb893c09f694a3762a10edaa';
export const REVIEW='__alpha_research/family-alpha-35/review-cutout.mjs';
export const PLANNER='__alpha_research/work51/propose.mjs';
export const MARKER='family-alpha-66-HOLD.json';
const once=(s,a,b)=>{
 assert.equal(s.split(a).length,2,'Audited Work49/Work51 hook changed: '+a.slice(0,60));
 return s.replace(a,b);
};
export function patchReviewedEditor(original){
 let s="import {proposeIsolationCleanup} from '../work51/propose.mjs';\n"+original;
 s=once(s,
 "  const undo=button('Undo eraser')",
 "  const auto=button('Find automatic cleanup');controls.append(auto);\n  const undo=button('Undo eraser')");
 s=once(s,"  function paint(){",[
 "  auto.onclick=(event)=>{",
 "   if(!event.isTrusted||finished||signal?.aborted||!isActive()||edits.length)return;",
 "   try{const proposal=proposeIsolationCleanup(base,{category:detail.category,existingEdits:edits});",
 "    if(!proposal.edits.length){recipeNotice.textContent='No safe automatic proposal. Previous cutout and recovery base kept; review manually.';return;}",
 "    edits.push(...proposal.edits);redoStack.length=0;ack.checked=false;shoes.checked=false;paint();",
 "    recipeNotice.textContent='Automatic cleanup proposal applied for review. Check every fabric edge; Undo or Reset restores the source. No approval granted.';",
 "   }catch{recipeNotice.textContent='Automatic cleanup unavailable; previous cutout kept.';}",
 "  };",
 "  function paint(){"
 ].join('\n'));
 s=once(s,
 "    undo.disabled=!edits.length",
 "    auto.disabled=edits.length>0||outlineMode;undo.disabled=!edits.length");
 s=once(s,"   outline.onclick=null;","   auto.onclick=null;outline.onclick=null;");
 return s;
}
async function files(root,prefix=''){
 const out=[];
 for(const e of await readdir(join(root,prefix),{withFileTypes:true})){
  assert.ok(!e.isSymbolicLink(),'No symlinks in compiled protected app');
  const rel=prefix+e.name;
  if(e.isDirectory())out.push(...await files(root,rel+'/'));
  else{assert.ok(e.isFile());out.push(rel);}
 }
 return out.sort();
}
export async function verify(){
 await verify65();
 const a=await files(PARENT),b=await files(OUTPUT);
 assert.deepEqual(b,[...a,PLANNER,MARKER].sort());
 for(const f of a){
  const original=await readFile(join(PARENT,f));
  const result=await readFile(join(OUTPUT,f));
  if(f===REVIEW)assert.equal(result.toString(),patchReviewedEditor(original.toString()));
  else assert.deepEqual(result,original,'Unexpected original JPEG, owner, Auth, recipe, staging or fit change: '+f);
 }
 assert.deepEqual(await readFile(join(OUTPUT,PLANNER)),await readFile('research/work51/propose.mjs'));
 const marker=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(marker.parentCommit,WORK65_SHA);
 assert.equal(marker.work51SourceCommit,WORK51_SHA);
 assert.equal(marker.decision,'HOLD');
 assert.equal(marker.automaticApproved,false);
 assert.equal(marker.deploymentAuthorized,false);
 assert.deepEqual(marker.onlyAddedCompiledAssets,[PLANNER]);
 assert.deepEqual(marker.onlyModifiedCompiledAssets,[REVIEW]);
 const approval=await readFile(join(OUTPUT,
  '__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs'),'utf8');
 assert.match(approval,/const activeReviews=new WeakMap\(\)/);
 assert.match(approval,/activeReviews\.get\(container\)\?\.\(\)/);
 return {decision:'HOLD',parentCommit:WORK65_SHA,work51SourceCommit:WORK51_SHA,
  sourceBoundProposal:true,supersededPhotoReviewsCancel:true,
  originalJpegUnchanged:true,manualRecipesUnchanged:true,
  automaticApproved:false,visualOwnerApproved:false,
  deploymentAuthorized:false,liveJwtVerified:false,physicalPhoneVerified:false};
}
export async function build(){
 await build65();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/work51'),{recursive:true});
 await cp('research/work51/propose.mjs',join(OUTPUT,PLANNER));
 await writeFile(join(OUTPUT,REVIEW),
  patchReviewedEditor(await readFile(join(PARENT,REVIEW),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  decision:'HOLD',parentCommit:WORK65_SHA,work51SourceCommit:WORK51_SHA,
  automaticApproved:false,visualOwnerApproved:false,deploymentAuthorized:false,
  stagingModified:false,productionModified:false,
  realTwoOwnerJwtVerified:false,physicalPhoneVerified:false,
  onlyAddedCompiledAssets:[PLANNER],onlyModifiedCompiledAssets:[REVIEW],
  note:'Human-reviewed Work51 source-color support proposal; stale photo confirmation cancels'
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_66_INTEGRATED_REVIEW_HOLD',JSON.stringify(await build()));
