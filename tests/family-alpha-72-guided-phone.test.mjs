import test from 'node:test';
import assert from 'node:assert/strict';
import {STEPS,STATUSES,FORMAT,validateAnswers,makeWalkthroughReport} from '../research/family-alpha-72/phone-walkthrough.mjs';
import {patchPage,BASE,OUTPUT,MODULE} from '../scripts/build-family-alpha-72-guided-phone-hold.mjs';
import {readFile} from 'node:fs/promises';
const qa=JSON.parse(await readFile('research/family-alpha-70/device-qa-manifest.json','utf8'));
const empty=()=>STEPS.map(x=>({id:x.id,status:'not-tried'}));
test('all nine phone steps match four-person source test codes',()=>{
 assert.equal(STEPS.length,9);
 assert.deepEqual(STEPS.map(x=>x.id),Array.from({length:9},(_,i)=>'P0'+(i+1)));
 for(const role of ['adult-a','adult-b','child-a','child-b'])
  assert.deepEqual(qa.cases.filter(x=>x.id.startsWith(role+'/')).map(x=>x.id.split('/')[1]),STEPS.map(x=>x.id));
 assert.deepEqual(STATUSES,['not-tried','worked','needs-help','blocked']);
});
test('status-only local report never represents verified actual devices or release',()=>{
 const note=JSON.parse(makeWalkthroughReport(empty()));
 assert.equal(note.format,FORMAT);assert.equal(note.familyAlpha,'HOLD');
 assert.equal(note.releaseAuthorization,false);assert.equal(note.transmitted,false);
 assert.deepEqual(note.counts,{notTried:9,worked:0,needsHelp:0,blocked:0});
 const full=empty().map(x=>({...x,status:'worked'}));
 const claim=JSON.parse(makeWalkthroughReport(full));
 assert.equal(claim.counts.worked,9);
 assert.equal(claim.releaseAuthorization,false);
 assert.equal(claim.source,'local-self-report-unverified');
});
test('mixed statuses counted and no photos or identifiers included',()=>{
 const a=empty();a[0].status='worked';a[1].status='needs-help';a[2].status='blocked';
 const report=makeWalkthroughReport(a),v=JSON.parse(report);
 assert.deepEqual(v.counts,{notTried:6,worked:1,needsHelp:1,blocked:1});
 assert.ok(report.length<1600);
 assert.doesNotMatch(report,/@|https?:|data:image|password|token|accountId/i);
});
test('reject fake statuses, private notes, reordered or missing/extra steps',()=>{
 const edits=[
  x=>x[0].email='tester@example.com',
  x=>x[0].photo='data:image/jpeg;base64,AAA',
  x=>x[0].jwt='secret',
  x=>x[0].notes='minor details',
  x=>x[0].status='APPROVED',
  x=>x[0].status=true,
  x=>x[0].id='P02',
  x=>x[3].status=null,
  x=>x.reverse(),
  x=>x.pop(),
  x=>x.push({id:'P10',status:'worked'})
 ];
 for(const [i,edit] of edits.entries()){
  const a=empty();edit(a);assert.throws(()=>makeWalkthroughReport(a),undefined,'invalid '+i);
 }
 for(const value of [null,{},'all pass',undefined])assert.throws(()=>validateAnswers(value));
});
test('exact protected app HTML insertion rejects duplicates, missing shell and missing feedback anchor',()=>{
 const html='<body><section id="authGate"></section><div id="appShell" hidden>'+
 '<section id="devicecheck"><section id="alphaPrivateFeedback"></section></section></div></body>';
 const next=patchPage(html);
 assert.match(next,/id="alphaPhoneWalkthrough"/);
 assert.match(next,/family-alpha-72\/phone-walkthrough\.mjs/);
 assert.equal(next.split('id="alphaPhoneWalkthrough"').length,2);
 assert.throws(()=>patchPage(next));
 assert.throws(()=>patchPage(html.replace('id="appShell" hidden','id="appShell"')));
 assert.throws(()=>patchPage(html.replace('alphaPrivateFeedback','notThere')));
 assert.equal(BASE.length,40);assert.ok(OUTPUT.includes('HOLD'));assert.ok(MODULE.endsWith('.mjs'));
});
