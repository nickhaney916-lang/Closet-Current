import test from 'node:test';
import assert from 'node:assert/strict';
import {FIELDS,FORMAT,makePrivateFeedback} from '../research/family-alpha-71/private-feedback.mjs';
import {patchPage,OUTPUT,MODULE,ENTRY,PARENT_HEAD} from '../scripts/build-family-alpha-71-private-feedback-hold.mjs';
const sample={area:'avatar-fit',symptom:'looked-wrong',device:'android-browser',severity:'needs-improvement'};
test('only predefined safe values make a local, anonymous, non-approved note',()=>{
 const note=makePrivateFeedback(sample);
 const result=JSON.parse(note);
 assert.equal(result.format,FORMAT);
 assert.equal(result.familyAlphaRelease,'HOLD');
 assert.equal(result.sentAutomatically,false);
 assert.equal(result.photoAttached,false);
 assert.equal(result.area,'avatar-fit');
 assert.equal(note.length<480,true);
 assert.deepEqual(Object.keys(result),['format','area','symptom','device','severity','sentAutomatically','photoAttached','requiresHumanReview','familyAlphaRelease']);
 assert.equal(new Set(Object.keys(FIELDS)).size,4);
});
test('private fields, arbitrary text and untrusted device/symptom values rejected',()=>{
 const edits=[
  x=>x.email='family@example.com',x=>x.jwt='private',x=>x.photo='data:image/jpeg;base64,AA',
  x=>x.accountId='123',x=>x.area='a parent wrote an issue',
  x=>x.device='user-agent with IP address',x=>x.symptom='script<img src=x>',
  x=>x.severity='release-approved',x=>delete x.area,
  x=>x.area=null,x=>x.device={},x=>x.severity=true
 ];
 for(const [i,edit] of edits.entries()){
  const x=structuredClone(sample);edit(x);
  assert.throws(()=>makePrivateFeedback(x),undefined,'Sensitive/free-text change '+i);
 }
 for(const bad of [null,{},[],undefined,'untrusted'])assert.throws(()=>makePrivateFeedback(bad));
});
test('all whitelisted categories remain a small local HOLD report',()=>{
 for(const [k,options] of Object.entries(FIELDS))for(const opt of options){
  const note=JSON.parse(makePrivateFeedback({...sample,[k]:opt}));
  assert.equal(note[k],opt);
  assert.equal(note.familyAlphaRelease,'HOLD');
  assert.equal(note.sentAutomatically,false);
 }
});
test('protected app gets exactly one Device help panel and one module, no original Auth edits',()=>{
 const html='<body><section id="authGate"></section><div id="appShell" hidden>'+
 '<section id="devicecheck"><p id="deviceCheckStatus" class="fine" role="status" aria-live="polite"></p></section></div></body>';
 const output=patchPage(html);
 assert.match(output,/id="alphaPrivateFeedback"/);
 assert.match(output,/src="\.\/__alpha_research\/family-alpha-71\/private-feedback\.mjs"/);
 assert.match(output,/id="authGate"/);
 assert.equal(output.includes('id="appShell" hidden'),true);
 assert.equal(output.split('id="alphaPrivateFeedback"').length,2);
 assert.throws(()=>patchPage(output));
 assert.throws(()=>patchPage(html.replace('id="authGate"','id="missingAuth"')));
 assert.throws(()=>patchPage(html.replace('id="appShell" hidden','id="appShell"')));
 assert.equal(PARENT_HEAD.length,40);
 assert.equal(OUTPUT.includes('HOLD'),true);
 assert.equal(MODULE.endsWith('.mjs'),true);
 assert.equal(ENTRY,'index.html');
});
