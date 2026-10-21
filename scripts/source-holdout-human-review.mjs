// Research-only family review intake. Never authenticates humans or promotes labels.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const BASE='47da6d3e854d2cf6cbb79d7a8fd0ef83e7faa7a2';
export const LOCK='benchmark/independent-source-holdout/locked.json';
export const LOCK_SHA='0ba1fae03ac1021d6ae58ccf17cd32026aabaa73364cf78618ce1cf7212581d9';
export const families=['sneakers','boots','dress','skirt','shorts','shirt','other-garment','negative','uncertain'];
export const attestations=['humanReviewer','originalFramesInspected','noModelPredictionsSeen','noProposedLabelsSeen','independentFromOtherReviewer'];
export const hash=b=>createHash('sha256').update(b).digest('hex');
const keys=(o,k)=>assert.ok(o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x)),'Unexpected or missing fields');
const text=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max&&!/[\p{Cc}\p{Cf}<>]/u.test(s);
const identity=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export function packetFromLock(bytes){
 assert.equal(hash(bytes),LOCK_SHA,'Pre-inference source lock changed');
 const lock=JSON.parse(bytes);
 return {schemaVersion:1,reviewType:'source-holdout-family-observations',sourceCommit:BASE,
  lockedManifestSha256:LOCK_SHA,photos:lock.photos.map(({id,image,sha256})=>({id,image,sha256}))};
}
export function blankSubmission(packet){
 return {schemaVersion:1,status:'UNREVIEWED',packetSha256:hash(JSON.stringify(packet)),reviewerAlias:null,reviewedAt:null,
  attestations:Object.fromEntries(attestations.map(x=>[x,false])),
  photos:packet.photos.map(({id,sha256})=>({id,sha256,observedFamily:null,uncertain:null,evidence:null}))};
}
export function validateSubmission(packet,s,{now=Date.now()}={}){
 keys(s,['schemaVersion','status','packetSha256','reviewerAlias','reviewedAt','attestations','photos']);
 assert.equal(s.schemaVersion,1);assert.equal(s.status,'REVIEWED','Unreviewed submission');
 assert.equal(s.packetSha256,hash(JSON.stringify(packet)),'Review packet mismatch');
 assert.ok(text(s.reviewerAlias,3,80),'Missing reviewer alias');
 const alias=identity(s.reviewerAlias);
 assert.ok(!/^(?:anonymous|reviewer(?:\s*[12ab])?|test|assistant|ai|chatgpt|codex)$/i.test(alias),'Placeholder or automated reviewer');
 assert.ok(typeof s.reviewedAt==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.reviewedAt)&&Number.isFinite(Date.parse(s.reviewedAt))&&new Date(s.reviewedAt).toISOString()===s.reviewedAt&&Date.parse(s.reviewedAt)<=now,'Invalid or future review timestamp');
 keys(s.attestations,attestations);
 assert.ok(attestations.every(k=>s.attestations[k]===true),'Missing independent human/blind source attestations');
 assert.ok(Array.isArray(s.photos)&&s.photos.length===packet.photos.length,'Incomplete photo review');
 const map=new Map();
 for(const r of s.photos){
  keys(r,['id','sha256','observedFamily','uncertain','evidence']);
  assert.ok(!map.has(r.id),'Duplicate review ID');map.set(r.id,r);
  assert.ok(families.includes(r.observedFamily)&&typeof r.uncertain==='boolean'&&text(r.evidence,10,1500),'Missing visible family evidence or uncertainty');
  assert.ok(r.observedFamily!=='uncertain'||r.uncertain,'Unknown family cannot be certain');
 }
 for(const p of packet.photos)assert.equal(map.get(p.id)?.sha256,p.sha256,'Original source hash or ID mismatch');
 return {alias,submissionSha256:hash(JSON.stringify(s)),rows:map};
}
export function reconcile(packet,submissions,{now=Date.now()}={}){
 assert.ok(Array.isArray(submissions)&&submissions.length<=2,'Supply zero, one or two separate submissions');
 const checked=submissions.map(s=>validateSubmission(packet,s,{now}));
 assert.equal(new Set(checked.map(s=>s.alias)).size,checked.length,'Reviewers need distinct identities (aliases cannot authenticate people)');
 const photos=packet.photos.map(p=>{
  const rows=checked.map(s=>s.rows.get(p.id));
  const complete=rows.length===2;
  const agreement=complete&&rows[0].observedFamily===rows[1].observedFamily;
  const uncertain=rows.some(r=>r.uncertain||r.observedFamily==='uncertain');
  return {id:p.id,sourceSha256:p.sha256,observations:rows.length,
   observedFamilies:rows.map(r=>r.observedFamily),agreement:complete?agreement:null,
   status:!complete?'AWAITING_REVIEW':uncertain?'UNCERTAIN':!agreement?'DISAGREEMENT':'SELF_ATTESTED_AGREEMENT',
   needsIndependentAdjudication:!complete||uncertain||!agreement};
 });
 return {schemaVersion:1,status:checked.length===2?'SELF_ATTESTED_OBSERVATIONS_ONLY':'AWAITING_INDEPENDENT_HUMANS',
  packetSha256:hash(JSON.stringify(packet)),lockedManifestSha256:packet.lockedManifestSha256,
  suppliedSubmissions:checked.length,submissionSha256:checked.map(s=>s.submissionSha256),
  sourcePhotos:photos.length,selfAttestedAgreements:photos.filter(p=>p.status==='SELF_ATTESTED_AGREEMENT').length,
  unresolved:photos.filter(p=>p.needsIndependentAdjudication).map(p=>p.id),photos,
  reviewerIdentityAuthenticated:false,independentHumanGoldLabels:false,approvedModelAccuracy:null,
  productionPromotion:'BLOCKED',canModifyModel:false,customerSaves:0,
  limitations:'Aliases and checkboxes cannot authenticate people or independence. Preserve raw submissions and verify reviewer identities, blinding and ambiguous garment boundaries externally. Family agreement does not verify exact subtype, item count or masks. Exposed discovery photos cannot become an untouched confirmation set.'};
}
export function reviewHTML(packet){
 // Packet contains neutral IDs + hashes only; never serialize source captions or proposed labels.
 const data=JSON.stringify({packet,blank:blankSubmission(packet),families,attestations}).replaceAll('<','\\u003c');
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original-photo family review</title>
<style>body{font:18px system-ui;max-width:850px;margin:auto;padding:20px}label{display:block;margin:16px 0}input,select,textarea,button{font:inherit;max-width:100%;box-sizing:border-box}textarea{width:100%;min-height:90px}button{padding:12px}img{max-width:100%;max-height:75vh}fieldset{margin:20px 0}#status{white-space:pre-wrap}input[type=checkbox]{width:24px;height:24px;vertical-align:middle}</style>
<h1>Independent original-photo review</h1><p>Review each entire original before opening source credits or any proposed labels/model output. Record what is visible; mark uncertain boundaries. “Negative” means no actual wearable garment, including garment-shaped sculpture. This form records observations, not gold labels or permission to change models. No answers are stored automatically. Download before closing.</p>
<label>Original JPEG files (select all) <input id="files" type="file" accept="image/jpeg" multiple></label><p id="status" role="status">No originals verified.</p>
<label>Your reviewer alias <input id="reviewer" maxlength="80" autocomplete="off"></label><div id="attestations"></div>
<label>Original <select id="source"></select></label><img id="photo" alt="Select verified original files"><p id="progress"></p>
<fieldset id="observation"><legend>Visible garment family</legend><label>Family <select id="family"><option value="">Choose after inspecting</option></select></label><label>Uncertain boundary? <select id="uncertainty"><option value="">Choose explicitly</option><option value="false">No</option><option value="true">Yes</option></select></label><label>Visible evidence and ambiguity (10–1500 characters)<textarea id="evidence" maxlength="1500"></textarea></label><button id="record" type="button">Record observation</button></fieldset>
<button id="export" type="button" disabled>Download reviewed observations</button>
<script>
const {packet,blank,families,attestations}=${data};
const $=id=>document.getElementById(id),rows=new Map(),urls=new Map();let verified=false,version=0;
const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
const messages={humanReviewer:'I am a human recording my own observations.',originalFramesInspected:'I inspected all entire original frames.',noModelPredictionsSeen:'I have not seen predictions for these photographs.',noProposedLabelsSeen:'I have not seen proposed labels or source credits for these photographs.',independentFromOtherReviewer:'I reviewed independently without another reviewer’s answers.'};
for(const key of attestations){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id=key;c.onchange=update;l.append(c,document.createTextNode(' '+messages[key]));$('attestations').append(l);}
for(const p of packet.photos){const o=new Option(p.id,p.id);$('source').add(o);}
for(const f of families)$('family').add(new Option(f,f));
function update(){ $('progress').textContent=rows.size+' / '+packet.photos.length+' recorded. Source-file changes clear all observations.';$('export').disabled=!verified||rows.size!==packet.photos.length||!$('reviewer').value.trim()||!attestations.every(k=>$(k).checked); }
function show(){const id=$('source').value,r=rows.get(id);$('photo').removeAttribute('src');if(urls.has(id))$('photo').src=urls.get(id);$('family').value=r?.observedFamily||'';$('uncertainty').value=r?String(r.uncertain):'';$('evidence').value=r?.evidence||'';}
$('source').onchange=show;$('reviewer').oninput=update;
for(const id of ['family','uncertainty','evidence'])$(id).addEventListener('input',()=>{rows.delete($('source').value);update();});
$('files').onchange=async()=>{const generation=++version;verified=false;rows.clear();for(const u of urls.values())URL.revokeObjectURL(u);urls.clear();show();update();$('status').textContent='Verifying originals…';
 try{const files=Array.from($('files').files),pending=new Map();if(files.length!==packet.photos.length)throw Error('Select every original JPEG, with no extra files.');
 for(const p of packet.photos){const matches=files.filter(f=>f.name===p.image);if(matches.length!==1)throw Error('Missing or duplicate original: '+p.id);const file=matches[0];if(await digest(await file.arrayBuffer())!==p.sha256)throw Error('Original hash mismatch: '+p.id);pending.set(p.id,file);}
 if(generation!==version)return;for(const [id,f] of pending)urls.set(id,URL.createObjectURL(f));verified=true;$('status').textContent=packet.photos.length+' original JPEG hashes verified.';show();update();
 }catch(e){if(generation!==version)return;$('status').textContent=e.message;verified=false;update();}};
$('record').onclick=()=>{if(!verified){$('status').textContent='Verify all originals first.';return;}const f=$('family').value,u=$('uncertainty').value,e=$('evidence').value.trim();if(!families.includes(f)||!['true','false'].includes(u)||e.length<10||(f==='uncertain'&&u!=='true')){$('status').textContent='Choose family, explicit uncertainty and visible evidence; unknown must be uncertain.';return;}const p=packet.photos.find(p=>p.id===$('source').value);rows.set(p.id,{id:p.id,sha256:p.sha256,observedFamily:f,uncertain:u==='true',evidence:e});$('status').textContent='Observation recorded.';update();};
$('export').onclick=()=>{if($('export').disabled)return;const s={...blank,status:'REVIEWED',reviewerAlias:$('reviewer').value.trim(),reviewedAt:new Date().toISOString(),attestations:Object.fromEntries(attestations.map(k=>[k,$(k).checked])),photos:packet.photos.map(p=>rows.get(p.id))};const u=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)+'\\n'],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='family-observations.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};update();
</script></html>`;
}
export function verifyScope(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',BASE,'HEAD');
 const allowed=new Set(['scripts/source-holdout-human-review.mjs','tests/source-holdout-human-review.test.mjs','scripts/test-source-holdout-human-review-browser.mjs','.github/workflows/source-holdout-human-review.yml','docs/SOURCE-HOLDOUT-HUMAN-REVIEW.md']);
 for(const name of git('diff','--name-only',BASE,'--').split('\n').filter(Boolean)){
  if(name==='docs/PROGRESS-CHECKPOINT.md')assert.ok(fs.readFileSync(name,'utf8').endsWith(execFileSync('git',['show',BASE+':'+name],{encoding:'utf8'})),'Checkpoint history changed');
  else {assert.ok(allowed.has(name),'Unexpected source change: '+name);assert.equal(git('ls-tree',BASE,'--',name),'','Existing source modified');}
 }
 packetFromLock(fs.readFileSync(LOCK));
 console.log('Human intake scope: old labels, recognition, runtime and benchmark bytes unchanged; release BLOCKED.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,...args]=process.argv.slice(2),packet=packetFromLock(fs.readFileSync(LOCK));
 if(mode==='verify'&&!args.length)verifyScope();
 else if(mode==='audit'&&args.length>=1&&args.length<=3){
  const report=reconcile(packet,args.slice(1).map(f=>JSON.parse(fs.readFileSync(f))));
  fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,suppliedSubmissions:report.suppliedSubmissions,sourcePhotos:report.sourcePhotos,productionPromotion:report.productionPromotion}));
 }else if(mode==='prepare'&&args.length===2){
  // Validate ALL bytes before creating a packet, never partial or reencoded photos.
  const originals=packet.photos.map(p=>{const bytes=fs.readFileSync(path.join(args[0],p.image));assert.equal(hash(bytes),p.sha256,'Original changed: '+p.id);return [p,bytes];});
  assert.ok(!fs.existsSync(args[1]),'Output directory already exists; preserve prior evidence');fs.mkdirSync(args[1],{recursive:true});
  for(const [p,bytes] of originals)fs.writeFileSync(path.join(args[1],p.image),bytes);
  for(const [name,content] of [['packet.json',JSON.stringify(packet,null,2)],['review-template.json',JSON.stringify(blankSubmission(packet),null,2)],['review.html',reviewHTML(packet)]])fs.writeFileSync(path.join(args[1],name),content);
  const locked=JSON.parse(fs.readFileSync(LOCK));
  fs.writeFileSync(path.join(args[1],'CREDITS-after-review.txt'),'Read only AFTER recording independent labels. Source names can reveal garment hints. Original EXIF is retained and may also reveal hints; blinding is procedural.\n\n'+locked.photos.map(p=>[p.id,p.attribution.author,p.attribution.license,p.attribution.licenseUrl,p.source].join('\n')).join('\n\n'));
  console.log('Prepared 13 hash-identical originals and blank form; no review completed.');
 }else throw Error('Usage: source-holdout-human-review.mjs verify | prepare ORIGINALS NEW_OUTPUT_DIRECTORY | audit OUTPUT.json [FIRST.json [SECOND.json]]');
}
