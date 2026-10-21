// Offline review coordinator. Never attributes simulated answers to humans or computes gold accuracy.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {packetFromLock,LOCK,hash} from './source-holdout-human-review.mjs';
export function coordinatorHTML(packet){
 assert.equal(packet.photos.length,13,'Unexpected source-locked original count');
 assert.ok(packet.photos.every(p=>/^[a-z0-9_-]+$/.test(p.id)&&/^[a-f0-9]{64}$/.test(p.sha256)));
 const data=JSON.stringify({packet,packetSha256:hash(JSON.stringify(packet)),
  families:['sneakers','boots','dress','skirt','shorts','shirt','other-garment','negative','uncertain'],
  attestations:['humanReviewer','originalFramesInspected','noModelPredictionsSeen','noProposedLabelsSeen','independentFromOtherReviewer']})
  .replaceAll('<','\\u003c');
 const html=String.raw`<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Closet Current — independent observations coordinator</title>
<style>
body{font:17px system-ui;line-height:1.45;max-width:830px;margin:auto;padding:20px}
input,button{font:inherit;max-width:100%;box-sizing:border-box}
input{display:block;margin:10px 0 20px;width:100%}button{min-height:52px;padding:10px}
section{border:1px solid #888;padding:15px;border-radius:12px;margin:15px 0}
table{width:100%;border-collapse:collapse}th,td{padding:8px;text-align:left;border-bottom:1px solid #aaa}
#status{white-space:pre-wrap}small{display:block}
</style>
<h1>Independent garment review — coordinator only</h1>
<p>This page is for the organizer, <strong>not</strong> for blind reviewers. Keep their answers separate until both people have finished. This works entirely offline and never uploads the files.</p>
<section><label for="first">Reviewer 1 — completed observations JSON</label>
<input id="first" type="file" accept=".json,application/json">
<label for="second">Reviewer 2 — completed observations JSON</label>
<input id="second" type="file" accept=".json,application/json">
<button id="verify" type="button">Check both reviews</button>
<p id="status" role="status">Waiting for two independently completed human-review files. Drafts are not accepted.</p>
</section>
<section id="results" hidden>
<h2>Observation reconciliation (not accuracy)</h2>
<p id="summary"></p><table><thead><tr><th>Original photo</th><th>Review status</th><th>Recorded families</th></tr></thead><tbody id="rows"></tbody></table>
<p><strong>Identity and independence have not been authenticated.</strong> Matching self-attested answers do not establish gold labels, shoe subtypes, masks, recognition accuracy, or permission to ship.</p>
<button id="export" type="button" disabled>Download offline review audit JSON</button>
</section>
<script>
const sourceData=__LOCKED_REVIEW_PACKET__;
const {packet,packetSha256,families,attestations}=sourceData;
const $=id=>document.getElementById(id);
let verifiedAudit=null,auditVersion=0;
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(f=>Object.hasOwn(o,f));
const validText=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max&&
 !/[\p{Cc}\p{Cf}<>]/u.test(v);
const identity=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const digest=async(bytes)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
 b=>b.toString(16).padStart(2,'0')).join('');
const utf8=new TextEncoder();
const normalizedAlias=s=>identity(s.reviewerAlias);
function checkSubmission(s,now){
 const fail=message=>{throw Error(message);};
 if(!exact(s,['schemaVersion','status','packetSha256','reviewerAlias','reviewedAt','attestations','photos'])||
  s.schemaVersion!==1||s.status!=='REVIEWED')
  fail('Only final REVIEWED submissions are accepted. A saved draft is not a human review.');
 if(s.packetSha256!==packetSha256)fail('Wrong original-photo packet');
 if(!validText(s.reviewerAlias,3,80)||
  /^(?:anonymous|reviewer(?:\s*[12ab])?|test|assistant|ai|chatgpt|codex)$/i.test(normalizedAlias(s)))
  fail('Invalid or automated reviewer alias');
 if(typeof s.reviewedAt!=='string'||
  !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.reviewedAt)||
  !Number.isFinite(Date.parse(s.reviewedAt))||
  new Date(s.reviewedAt).toISOString()!==s.reviewedAt||Date.parse(s.reviewedAt)>now)
  fail('Invalid or future review timestamp');
 if(!exact(s.attestations,attestations)||!attestations.every(k=>s.attestations[k]===true))
  fail('Missing truthful human, independence or blind-review attestation');
 if(!Array.isArray(s.photos)||s.photos.length!==packet.photos.length)
  fail('Missing review observations');
 const map=new Map(),orig=new Map(packet.photos.map(p=>[p.id,p.sha256]));
 for(const r of s.photos){
  if(!exact(r,['id','sha256','observedFamily','uncertain','evidence'])||
   !orig.has(r.id)||r.sha256!==orig.get(r.id)||map.has(r.id)||
   !families.includes(r.observedFamily)||typeof r.uncertain!=='boolean'||
   !validText(r.evidence,10,1500)||(r.observedFamily==='uncertain'&&!r.uncertain))
   fail('Missing, duplicated or invalid source observation');
  map.set(r.id,r);
 }
 return {alias:normalizedAlias(s),map};
}
function reconcile(s1,s2,digests){
 const reviewed=[checkSubmission(s1,Date.now()),checkSubmission(s2,Date.now())];
 if(reviewed[0].alias===reviewed[1].alias)
  throw Error('Both uploads identify the same reviewer alias. Two independently verified people are required.');
 const photos=packet.photos.map(p=>{
  const rows=reviewed.map(s=>s.map.get(p.id));
  const agreement=rows[0].observedFamily===rows[1].observedFamily;
  const uncertain=rows.some(r=>r.uncertain||r.observedFamily==='uncertain');
  const status=uncertain?'UNCERTAIN':!agreement?'DISAGREEMENT':'SELF_ATTESTED_AGREEMENT';
  return {id:p.id,sourceSha256:p.sha256,observations:2,observedFamilies:rows.map(r=>r.observedFamily),
   agreement, status,needsIndependentAdjudication:status!=='SELF_ATTESTED_AGREEMENT'};
 });
 return {schemaVersion:1,status:'SELF_ATTESTED_OBSERVATIONS_ONLY',
  packetSha256,lockedManifestSha256:packet.lockedManifestSha256,
  suppliedSubmissions:2,submissionSha256:digests,
  sourcePhotos:photos.length,selfAttestedAgreements:photos.filter(p=>p.status==='SELF_ATTESTED_AGREEMENT').length,
  unresolved:photos.filter(p=>p.needsIndependentAdjudication).map(p=>p.id),photos,
  reviewerIdentityAuthenticated:false,independentHumanGoldLabels:false,approvedModelAccuracy:null,
  productionPromotion:'BLOCKED',canModifyModel:false,customerSaves:0,
  limitations:'Aliases and checkboxes cannot authenticate people or independence. Preserve raw submissions and verify reviewer identities, blinding and ambiguous garment boundaries externally. Family agreement does not verify exact subtype, item count or masks. Exposed discovery photos cannot become an untouched confirmation set.'};
}
async function fileInput(id){
 const file=$(id).files?.[0];if(!file||file.size>128*1024||file.size<10)
  throw Error('Choose a completed review JSON file smaller than 128 KB for '+id);
 const bytes=await file.arrayBuffer();
 const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 return {value,hash:await digest(utf8.encode(JSON.stringify(value)))};
}
$('verify').onclick=async()=>{
 const version=++auditVersion;
 verifiedAudit=null;$('export').disabled=true;$('results').hidden=true;
 $('rows').replaceChildren();$('status').textContent='Checking original identity and completed review fields locally…';
 try{
  if(!crypto.subtle)throw Error('This browser cannot verify review hashes.');
  const [a,b]=await Promise.all([fileInput('first'),fileInput('second')]);
  // Ignore any verification whose inputs changed while async hashing was pending.
  if(version!==auditVersion)return;
  // Check both, then publish; failed or partial work can never remain accepted.
  const report=reconcile(a.value,b.value,[a.hash,b.hash]);
  verifiedAudit=report;
  const fragment=document.createDocumentFragment();
  for(const r of report.photos){
   const tr=document.createElement('tr');
   for(const value of [r.id,r.status,r.observedFamilies.join(' / ')]){
    const td=document.createElement('td');td.textContent=value;tr.appendChild(td);
   }
   fragment.appendChild(tr);
  }
  $('rows').appendChild(fragment);
  $('summary').textContent='13 source-verified observations per submission. '+report.selfAttestedAgreements+
   ' self-attested agreements, '+report.unresolved.length+' uncertain/disagreed originals. Human accuracy unavailable.';
  $('status').textContent='Both JSON structures are valid against the frozen source packet. Human identities and blinding remain unverified.';
  $('results').hidden=false;$('export').disabled=false;
 }catch(e){
  if(version===auditVersion)$('status').textContent='Not accepted: '+e.message;
 }
};
for(const id of ['first','second'])$(id).addEventListener('change',()=>{
 auditVersion++;
 verifiedAudit=null;$('export').disabled=true;$('results').hidden=true;
 $('status').textContent='Files changed. Check both reviews again.';
});
$('export').onclick=()=>{
 if(!verifiedAudit)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(verifiedAudit,null,2)+'\n'],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='self-attested-review-audit.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
};
</script></html>`;
 assert.ok(html.includes('__LOCKED_REVIEW_PACKET__'));
 return html.replace('__LOCKED_REVIEW_PACKET__',data);
}
export function prepareCoordinator(output){
 const packet=packetFromLock(fs.readFileSync(LOCK));
 assert.ok(!fs.existsSync(output),'Never overwrite previous coordinator evidence');
 const html=coordinatorHTML(packet);
 fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'OPEN-COORDINATOR.html'),html);
 fs.writeFileSync(path.join(output,'READ-ME.txt'),
  'Closet Current — OFFLINE coordinator ONLY (not for blind reviewers)\n\n'+
  '1. Give each of TWO genuine independent reviewers the reviewer packet, NOT this coordinator page or prior observations.\n'+
  '2. Have them return separately downloaded COMPLETED family-observations.json. Draft files are not accepted.\n'+
  '3. Open OPEN-COORDINATOR.html locally, choose both completed JSON files and click Check both reviews.\n'+
  '4. Resolve any uncertainty/disagreements with independent human adjudication before interpreting model performance. Keep original raw files separately.\n'+
  '5. Download self-attested-review-audit.json as a convenience copy; use the existing authoritative Node CLI audit to confirm if bringing real responses into developer QA.\n\n'+
  'The page never uploads files. Aliases/checkboxes cannot authenticate two humans, so no accuracy or production approval is possible from this page alone.\n');
 return {sourcePhotos:packet.photos.length,originalLock:packet.lockedManifestSha256,independentHumansReviewed:0,accuracy:null,productionPromotion:'BLOCKED'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,out,...extra]=process.argv.slice(2);
 assert.ok(mode==='prepare'&&out&&extra.length===0,'Usage: node scripts/offline-review-coordinator.mjs prepare NEW_DIRECTORY');
 console.log(JSON.stringify(prepareCoordinator(out)));
}
