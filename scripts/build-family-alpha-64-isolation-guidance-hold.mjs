/**
 * Family Alpha #64 — review-only uncertainty explanations for automatic
 * source-bound segmentation. Builds on verified Family Alpha #63 unchanged.
 */
import {readFile,writeFile,cp,mkdir,readdir,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

export const PARENT='dist-family-alpha-63-auto-portable-HOLD';
export const OUTPUT='dist-family-alpha-64-guidance-HOLD';
export const PARENT_SHA='8a1ec778dfa24521eeaa3133d6913becbfbbbd26';
export const PROVIDER='__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs';
export const CONFIRM='__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs';
export const GUIDE='__alpha_research/work50/isolation-review-guidance.mjs';
const once=(s,a,b)=>{
 assert.equal(typeof s,'string');
 assert.equal(s.split(a).length,2,'Source-pinned isolation review hook moved');
 return s.replace(a,b);
};
export function patchProvider(s){
 s=once(s,"import {prepareAutomaticGarment as prepareSyntheticGarmentOriginal} from '../work50/isolate.mjs';",
 "import {prepareAutomaticGarment as prepareSyntheticGarmentOriginal} from '../work50/isolate.mjs';\nimport {summarizeIsolationReview} from '../work50/isolation-review-guidance.mjs';");
 return once(s,"const approved=await reviewPreview(Object.freeze({",
 "const approved=await reviewPreview(Object.freeze({\n   isolationReview:summarizeIsolationReview(raw),");
}
export function patchConfirmation(s){
 const source="export function confirmReviewedPhotoInContainer(container,detail,{";
 s=once(s,source,"import {safeIsolationTips} from '../work50/isolation-review-guidance.mjs';\n"+source);
 const anchor="  panel.append(title,caption,row,actions);";
 const replacement=[
 "  const advisory=d.createElement('section');",
 "  advisory.setAttribute('aria-label','Automatic isolation: what to inspect');",
 "  const advisoryTitle=d.createElement('h3');",
 "  advisoryTitle.textContent='Check these details before using this cutout';",
 "  advisoryTitle.style.cssText='font:600 1rem system-ui;margin:12px 0 4px';",
 "  const advisoryList=d.createElement('ul');",
 "  advisoryList.style.cssText='font:1rem/1.45 system-ui;margin:4px 0 12px;padding-left:24px';",
 "  for(const tip of safeIsolationTips(detail.isolationReview)){",
 "   const item=d.createElement('li');item.textContent=tip;advisoryList.append(item);",
 "  }",
 "  const advisoryFooter=d.createElement('p');",
 "  advisoryFooter.textContent='This is guidance, not proof of fabric preservation. Compare the original photo. Retake if uncertain.';",
 "  advisoryFooter.style.cssText='font:.95rem/1.45 system-ui;margin:6px 0 12px';",
 "  advisory.append(advisoryTitle,advisoryList,advisoryFooter);",
 "  panel.append(title,caption,row,advisory,actions);"
 ].join('\n');
 return once(s,anchor,replacement);
}
async function files(dir,prefix=''){
 const out=[];
 for(const entry of await readdir(join(dir,prefix),{withFileTypes:true})){
  assert.equal(entry.isSymbolicLink(),false,'Unexpected linked asset');
  const rel=prefix+entry.name;
  if(entry.isDirectory())out.push(...await files(dir,rel+'/'));
  else{assert.equal(entry.isFile(),true);out.push(rel);}
 }
 return out.sort();
}
export async function verify(){
 const previous=await files(PARENT),current=await files(OUTPUT);
 assert.deepEqual(current,[...previous,GUIDE,'family-alpha-64-HOLD.json'].sort());
 for(const path of previous){
  const original=await readFile(join(PARENT,path));
  const actual=await readFile(join(OUTPUT,path));
  if(path===PROVIDER)assert.equal(actual.toString('utf8'),patchProvider(original.toString('utf8')));
  else if(path===CONFIRM)assert.equal(actual.toString('utf8'),patchConfirmation(original.toString('utf8')));
  else assert.deepEqual(actual,original,'Unexpected private source, garment, cloud, Auth or mask mutation: '+path);
 }
 assert.deepEqual(await readFile(join(OUTPUT,GUIDE)),await readFile('research/work50/isolation-review-guidance.mjs'));
 const m=JSON.parse(await readFile(join(OUTPUT,'family-alpha-64-HOLD.json'),'utf8'));
 assert.equal(m.parentCommit,PARENT_SHA);
 assert.equal(m.release,'HOLD');
 assert.equal(m.automaticApproved,false);
 assert.equal(m.visualOwnerApproved,false);
 assert.equal(m.deploymentAuthorized,false);
 return {decision:'HOLD',onlyUIExplanations:true,parentCommit:PARENT_SHA,
  automaticApproved:false,visualOwnerApproved:false,deploymentAuthorized:false};
}
export async function build(){
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/work50'),{recursive:true});
 await cp('research/work50/isolation-review-guidance.mjs',join(OUTPUT,GUIDE));
 await writeFile(join(OUTPUT,PROVIDER),patchProvider(await readFile(join(PARENT,PROVIDER),'utf8')));
 await writeFile(join(OUTPUT,CONFIRM),patchConfirmation(await readFile(join(PARENT,CONFIRM),'utf8')));
 await writeFile(join(OUTPUT,'family-alpha-64-HOLD.json'),JSON.stringify({
  release:'HOLD',parentCommit:PARENT_SHA,productionModified:false,stagingModified:false,
  originalPhotosModified:false,automaticApproved:false,visualOwnerApproved:false,
  deploymentAuthorized:false,realTwoOwnerJwtIsolationVerified:false,
  cloudBackupRestoreVerified:false,realPhysicalPhonesVerified:false,
  onlyUIExplanations:true
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_64_ISOLATION_REVIEW_HOLD',JSON.stringify(await build()));
