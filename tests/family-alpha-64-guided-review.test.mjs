import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildIsolationReviewGuidance,createIsolationReviewNotice,SAFE_ISOLATION_REASONS}
 from '../research/work50/review-guidance.mjs';
import {verify,patchProviderGuidance,patchConfirmation,OUTPUT,PARENT,CONFIRM,PROVIDER}
 from '../scripts/build-family-alpha-64-guided-review-hold.mjs';
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.textContent='';this.attrs={};}
 setAttribute(k,v){this.attrs[k]=v;}
 append(...items){this.children.push(...items);}
}
const document={createElement(tag){return new Element(tag)}};
function texts(node){return [node.textContent,...node.children.flatMap(texts)].join('\n');}
test('real automatic status is never silently promoted to approval',()=>{
 const r=buildIsolationReviewGuidance({status:'prepared',confidence:{
  reasons:['semantic-mannequin-hanger-and-fabric-review-required','pale-fabric-or-background-ambiguity'],
  metrics:{visible:1000}}});
 assert.equal(r.status,'REVIEW_REQUIRED');
 assert.equal(r.release,'HOLD');
 assert.equal(r.ownerApproved,false);
 assert.equal(r.automaticApproval,false);
 assert.equal(r.humanReviewRequired,true);
 assert.deepEqual(r.codes,['semantic-mannequin-hanger-and-fabric-review-required','pale-fabric-or-background-ambiguity']);
 assert.equal(Object.isFrozen(r),true);
 assert.equal(Object.isFrozen(r.codes),true);
});
test('reason codes are whitelisted: image bytes, source filenames and arbitrary messages are never exposed',()=>{
 const malicious='INJECTED_PRIVATE_EMAIL_AND_TOKEN_Z';
 const d=buildIsolationReviewGuidance({status:'prepared',confidence:{reasons:[
  malicious,malicious,'pale-fabric-or-background-ambiguity',
  'pale-fabric-or-background-ambiguity','source-clipped-or-border-contamination']}});
 assert.deepEqual(d.codes,['pale-fabric-or-background-ambiguity','source-clipped-or-border-contamination']);
 const ui=createIsolationReviewNotice(document,{schema:'closet-isolation-review-v1',
  codes:[malicious,'pale-fabric-or-background-ambiguity']});
 assert.equal(ui.attrs.role,'note');
 assert.equal(ui.attrs['aria-label'],'Automatic isolation review checks');
 assert.match(texts(ui),/Pale clothing may blend/);
 assert.match(texts(ui),/manual review required/);
 assert.doesNotMatch(JSON.stringify(ui)+JSON.stringify(d),/INJECTED_PRIVATE_EMAIL_AND_TOKEN_Z/);
 assert.doesNotMatch(JSON.stringify(d),/metrics|visible|image|identity|token|email|ownerId/);
});
test('unknown/fabricated status cannot remove baseline person/hanger warning',()=>{
 for(const input of [null,{}, {codes:['private-data']},
  {schema:'closet-isolation-review-v1',codes:['private-data']}]){
  const ui=createIsolationReviewNotice(document,input);
  assert.match(texts(ui),/mannequins, hangers or person parts/);
 }
 for(const raw of [null,{status:'prepared',confidence:{reasons:['customer-name']}},
   {status:'review',reason:'unknown-status'}]){
  const d=buildIsolationReviewGuidance(raw);
  assert.ok(d.codes.includes('semantic-mannequin-hanger-and-fabric-review-required'));
  assert.equal(d.ownerApproved,false);
 }
 assert.ok(SAFE_ISOLATION_REASONS.length>7);
});
test('source-pinned overlay is two UI modules plus one fixed guidance file, no auth/photo/cutout changes',async()=>{
 const result=await verify();
 assert.equal(result.decision,'HOLD');
 assert.equal(result.evidenceConsistent,true);
 assert.equal(result.autoAccepted,false);
 assert.equal(result.deploymentAuthorized,false);
 const providerOld=await readFile(PARENT+'/'+PROVIDER,'utf8');
 const confirmOld=await readFile(PARENT+'/'+CONFIRM,'utf8');
 const providerNew=await readFile(OUTPUT+'/'+PROVIDER,'utf8');
 const confirmNew=await readFile(OUTPUT+'/'+CONFIRM,'utf8');
 assert.equal(providerNew,patchProviderGuidance(providerOld));
 assert.equal(confirmNew,patchConfirmation(confirmOld));
 assert.match(providerNew,/isolationGuidance:buildIsolationReviewGuidance\(raw\)/);
 assert.match(confirmNew,/if\(!event\.isTrusted\)return/);
 assert.match(confirmNew,/signal\?\.aborted\|\|!isActive\(\)/);
 assert.match(confirmNew,/createIsolationReviewNotice\(d,detail\.isolationGuidance\)/);
});
test('source guidance is network-free and privacy-safe; UI still needs trusted user input',async()=>{
 const content=await readFile('research/work50/review-guidance.mjs','utf8');
 assert.doesNotMatch(content,/fetch\(|localStorage|indexedDB|XMLHttpRequest|canvas\.toDataURL|innerHTML|document\.cookie|navigator/);
 const parent=await readFile(PARENT+'/'+CONFIRM,'utf8');
 assert.match(parent,/if\(!event\.isTrusted\)return/);
 assert.match(parent,/signal\?\.addEventListener\('abort'/);
});
