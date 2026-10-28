/**
 * Family Alpha #64 — narrow, source-pinned Work50 risk disclosure UI.
 * Keeps automatic extraction, manual cutout and recovery, fit, privacy and
 * protected app byte-identical to successful #374. NO DEPLOY / HOLD.
 */
import {readFile,writeFile,cp,mkdir,rm,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build as build63,verify as verify63,OUTPUT as PARENT,PROVIDER}
 from './build-family-alpha-63-automatic-portable-hold.mjs';
export const OUTPUT='dist-family-alpha-64-isolation-guidance-HOLD';
export const CONFIRM='__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs';
export const GUIDANCE='__alpha_research/work50/review-guidance.mjs';
export const SOURCE_SHA='7e2b41f57685a97b45f18fe25526c1522b764dca';
const importAuto="import {prepareAutomaticGarment as prepareSyntheticGarmentOriginal} from '../work50/isolate.mjs';";
const importGuidance="import {buildIsolationReviewGuidance} from '../work50/review-guidance.mjs';";
function replaceOnce(source,from,to){
 assert.equal(source.split(from).length,2,'Source-pinned review hook changed');
 assert.ok(!source.includes(to),'Isolation guidance already patched');
 return source.replace(from,to);
}
export function patchProviderGuidance(source){
 let changed=replaceOnce(source,importAuto,importAuto+'\n'+importGuidance);
 const match="   description:'Automatic isolation preview; not realistic fit',";
 changed=replaceOnce(changed,match,
  "   isolationGuidance:buildIsolationReviewGuidance(raw),\n"+match);
 assert.match(changed,/reviewPreview\(Object\.freeze/);
 assert.match(changed,/validScope\(getScope,ownerId,epoch,isCurrent\)/);
 assert.match(changed,/await auditMask/);
 return changed;
}
export function patchConfirmation(source){
 let changed=replaceOnce(source,"export function confirmReviewedPhotoInContainer(",
  "import {createIsolationReviewNotice} from '../work50/review-guidance.mjs';\n"+
  "export function confirmReviewedPhotoInContainer(");
 changed=replaceOnce(changed,"  panel.append(title,caption,row,actions);",
  "  panel.append(title,caption,createIsolationReviewNotice(d,detail.isolationGuidance),row,actions);");
 assert.match(changed,/if\(!event\.isTrusted\)return/);
 assert.match(changed,/signal\?\.addEventListener\('abort'/);
 return changed;
}
async function files(dir,prefix=''){
 const found=[];
 for(const e of await readdir(join(dir,prefix),{withFileTypes:true})){
  assert.equal(e.isSymbolicLink(),false);
  const path=prefix+e.name;
  if(e.isDirectory())found.push(...await files(dir,path+'/'));
  else{assert.equal(e.isFile(),true);found.push(path);}
 }
 return found.sort();
}
export async function verify(){
 await verify63();
 const old=await files(PARENT),next=await files(OUTPUT);
 assert.deepEqual(next,[...old,GUIDANCE,'family-alpha-64-HOLD.json'].sort(),
  'Unexpected asset creation or deletion');
 for(const path of old){
  const before=await readFile(join(PARENT,path),'utf8');
  const after=await readFile(join(OUTPUT,path),'utf8');
  if(path===PROVIDER)assert.equal(after,patchProviderGuidance(before));
  else if(path===CONFIRM)assert.equal(after,patchConfirmation(before));
  else assert.equal(after,before,'Private ownership/auto segmentation/manual edit/fit asset drift: '+path);
 }
 assert.deepEqual(await readFile(join(OUTPUT,GUIDANCE)),
  await readFile('research/work50/review-guidance.mjs'));
 const hold=JSON.parse(await readFile(join(OUTPUT,'family-alpha-64-HOLD.json'),'utf8'));
 assert.equal(hold.decision,'HOLD');
 assert.equal(hold.visualOwnerApproved,false);
 assert.equal(hold.autoAccepted,false);
 assert.equal(hold.deploymentAuthorized,false);
 assert.equal(hold.physicalPhoneVerified,false);
 assert.equal(hold.realTwoOwnerJwtVerified,false);
 assert.equal(hold.baseHead,SOURCE_SHA);
 return {decision:'HOLD',evidenceConsistent:true,changedAssets:[PROVIDER,CONFIRM,GUIDANCE],
  autoAccepted:false,visualOwnerApproved:false,deploymentAuthorized:false};
}
export async function build(){
 await build63();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/work50'),{recursive:true});
 await cp('research/work50/review-guidance.mjs',join(OUTPUT,GUIDANCE));
 for(const [path,transform] of [[PROVIDER,patchProviderGuidance],[CONFIRM,patchConfirmation]]){
  const source=await readFile(join(PARENT,path),'utf8');
  await writeFile(join(OUTPUT,path),transform(source));
 }
 await writeFile(join(OUTPUT,'family-alpha-64-HOLD.json'),JSON.stringify({
  decision:'HOLD',deploymentAuthorized:false,visualOwnerApproved:false,
  autoAccepted:false,productionModified:false,stagingModified:false,
  physicalPhoneVerified:false,realTwoOwnerJwtVerified:false,
  originalJPEGUnchanged:true,manualCutoutEditorUnchanged:true,
  portableRecipesUnchanged:true,maskAssessment:'NOT_HUMAN_APPROVED',baseHead:SOURCE_SHA
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_64_GUIDANCE_HOLD',JSON.stringify(await build()));
