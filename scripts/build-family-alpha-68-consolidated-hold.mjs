/**
 * Family Alpha #68 — no-deploy, source-pinned combination of the already
 * reviewed #66 stale-review lifecycle, #67 manual fit recovery and Work52
 * pale-background cleanup. NEVER changes canonical mask, original JPEG,
 * owners, cloud/auth, wardrobe or approval code.
 */
import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build as build66,verify as verify66,OUTPUT as PARENT,REVIEW,PLANNER as WORK51_PLANNER}
 from './build-family-alpha-66-work51-review-lifecycle-hold.mjs';
export {PARENT,REVIEW};
export const OUTPUT='dist-family-alpha-68-review-fit-pale-HOLD';
export const WORK52_PLANNER='__alpha_research/work52/propose.mjs';
export const FIT_EDITOR='__alpha_research/work47/editor.mjs';
export const FIT_PORTABLE='__alpha_research/work47/portable-fit.mjs';
export const MARKER='family-alpha-68-HOLD.json';
export const PINS=Object.freeze({
 work51:'043950847dcdaab98d82bdb07f8fe8c84341cc18',
 lifecycle66:'d7b2e361361580c37dad29621e2a116889a5d584',
 fit67:'8c0c077a23e4013ed6b51f9c6a99722b7251992f',
 pale52:'214c1b497241e8b1b5002a83a0e88819db4a1fdd'
});
const OLD="from '../work51/propose.mjs'";
const NEW="from '../work52/propose.mjs'";
export function patchReviewedEditor(s){
 assert.equal(s.split(OLD).length,2,'Exact Work51 integration import moved');
 assert.equal(s.includes(NEW),false,'Pale planner already applied');
 return s.replace(OLD,NEW);
}
async function paths(root,p=''){
 const a=[];
 for(const e of await readdir(join(root,p),{withFileTypes:true})){
  assert.ok(!e.isSymbolicLink(),'No symlinks in protected compiled app');
  const f=p+e.name;
  if(e.isDirectory())a.push(...await paths(root,f+'/'));
  else {assert.ok(e.isFile());a.push(f);}
 }
 return a.sort();
}
export async function verify(){
 await verify66();
 const before=await paths(PARENT),after=await paths(OUTPUT);
 assert.deepEqual(after,[...before,WORK52_PLANNER,MARKER].sort(),'Compiled asset inventory changed unexpectedly');
 for(const f of before){
  const previous=await readFile(join(PARENT,f));
  const current=await readFile(join(OUTPUT,f));
  if(f===REVIEW)assert.equal(current.toString(),patchReviewedEditor(previous.toString()));
  else assert.deepEqual(current,previous,'Unexpected owner, JPEG, manual recovery, fit or Auth change: '+f);
 }
 for(const [f,source] of [[WORK52_PLANNER,'research/work52/propose.mjs'],
  [FIT_EDITOR,'research/work47/editor.mjs'],
  [FIT_PORTABLE,'research/work47/portable-fit.mjs']])
  assert.deepEqual(await readFile(join(OUTPUT,f)),await readFile(source),'Wrong source asset: '+f);
 assert.deepEqual(await readFile(join(OUTPUT,WORK51_PLANNER)),
   await readFile('research/work51/propose.mjs'));
 const fit=await readFile(join(OUTPUT,FIT_EDITOR),'utf8');
 assert.match(fit,/createPortableFitRecipe,restorePortableFitRecipe/);
 assert.match(fit,/fitUpload\.onchange/);
 assert.match(fit,/fitDownload\.onclick/);
 const approval=await readFile(join(OUTPUT,'__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs'),'utf8');
 assert.match(approval,/activeReviews\.get\(container\)===cancelReview/);
 const marker=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.deepEqual(marker.pins,PINS);
 assert.equal(marker.decision,'HOLD');
 for(const name of ['automaticApproved','visualOwnerApproved','deploymentAuthorized',
  'stagingModified','productionModified','liveJwtOwnerIsolationVerified','physicalPhoneVerified'])
  assert.equal(marker[name],false,name+' must remain false');
 assert.deepEqual(marker.onlyAddedCompiledAssets,[WORK52_PLANNER]);
 assert.deepEqual(marker.onlyModifiedCompiledAssets,[REVIEW]);
 return {decision:'HOLD',sourceBoundWork52:true,fitRecipeRecoveredLocally:true,
  supersededReviewCancelPreserved:true,sourceAndOwnerAssetsUnchanged:true,
  realPhotoVisualPass:0,automaticApproved:false,deploymentAuthorized:false};
}
export async function build(){
 await build66();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/work52'),{recursive:true});
 await cp('research/work52/propose.mjs',join(OUTPUT,WORK52_PLANNER));
 await writeFile(join(OUTPUT,REVIEW),
  patchReviewedEditor(await readFile(join(PARENT,REVIEW),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  pins:PINS,decision:'HOLD',automaticApproved:false,visualOwnerApproved:false,
  deploymentAuthorized:false,stagingModified:false,productionModified:false,
  liveJwtOwnerIsolationVerified:false,physicalPhoneVerified:false,
  onlyAddedCompiledAssets:[WORK52_PLANNER],onlyModifiedCompiledAssets:[REVIEW],
  note:'Work52 source-constrained proposals plus #67 exact reviewed PNG-bound local fit recipes, preserving #66 stale review cancellation'
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_68_CONSOLIDATED_HOLD',JSON.stringify(await build()));
