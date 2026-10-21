// Generate one OFFLINE, browser-openable HTML coordinator that uses the
// canonical, unchanged three-report Node validators, not alternate scoring.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MODULES=[
 'public/local-catalog.mjs',
 'public/phone-photo-benchmark.mjs',
 'benchmark/review-phone-pilot-reports.mjs',
 'benchmark/private-end-to-end-pilot-review.mjs',
 'benchmark/private-saved-closet-review.mjs',
 'benchmark/private-pilot-cohort-consistency.mjs'
];
const JS_FILES=[
 ['public/device-check-engine.js','deviceCheckEngine'],
 ['public/saved-closet-audit-engine.js','savedEngine']
];
const IMPORTS={
 'public/local-catalog.mjs':[],
 'public/phone-photo-benchmark.mjs':["import {localCandidates} from './local-catalog.mjs';"],
 'benchmark/review-phone-pilot-reports.mjs':["import deviceCheckEngine from '../public/device-check-engine.js';"],
 'benchmark/private-end-to-end-pilot-review.mjs':[
  "import assert from 'node:assert/strict';",
  "import {lockPhotoLabels} from '../public/phone-photo-benchmark.mjs';",
  "import {scorePhonePhotos} from '../public/phone-photo-benchmark.mjs';",
  "import {comparePrivatePhonePilotReports} from './review-phone-pilot-reports.mjs';"
 ],
 'benchmark/private-saved-closet-review.mjs':["import savedEngine from '../public/saved-closet-audit-engine.js';"],
 'benchmark/private-pilot-cohort-consistency.mjs':[
  "import {reviewPrivatePilotEvidence} from './private-end-to-end-pilot-review.mjs';",
  "import {reviewSavedClosetReports} from './private-saved-closet-review.mjs';"
 ]
};
const UI = String.raw`
'use strict';
const $=id=>document.getElementById(id);
let epoch=0,accepted=null,downloadUri=null;
function clearOutput(){
 if(downloadUri){URL.revokeObjectURL(downloadUri);downloadUri=null;}
 const link=$('download');link.hidden=true;link.removeAttribute('href');
 $('results').hidden=true;$('save').disabled=true;
 accepted=null;$('problems').replaceChildren();$('resultsSummary').textContent='';
}
function reset(){
 ++epoch;clearOutput();
 $('status').textContent='Files changed. Run the private review again.';
}
for(const id of ['android','iphone','model','saved'])
 $(id).addEventListener('change',reset);
function showItems(items){
 const ul=$('problems');ul.replaceChildren();
 for(const message of (items.length?items:['No self-reported diagnostic thresholds flagged. Production still blocked.'])){
  const li=document.createElement('li');
  li.textContent=message;ul.append(li);
 }
}
async function readJSON(file){
 if(!file||file.size<10||file.size>512000)
  throw Error('Invalid local report');
 const raw=await file.text();
 if(raw.length>512000)throw Error('Oversized JSON');
 return JSON.parse(raw);
}
async function collect(id,min,max){
 const files=Array.from($(id).files||[]);
 if(files.length<min||files.length>max)
  throw Error('Incorrect number of local reports');
 return files;
}
$('review').onclick=async()=>{
 reset();const current=epoch;
 $('status').textContent='Validating selected private reports locally…';
 try{
  const a=await collect('android',1,1),i=await collect('iphone',1,1),
   m=await collect('model',1,40),s=await collect('saved',2,40);
  const files=[...a,...i,...m,...s];
  if(new Set(files).size!==files.length||
     files.reduce((n,f)=>n+f.size,0)>12000000)
   throw Error('Invalid report set or oversized collection');
  const reports=await Promise.all(files.map(readJSON));
  if(epoch!==current)return;
  // Same canonical validator as the local Node CLI. Unlike this browser,
  // the source project tests its internal formulas and schema restraints.
  const report=reviewPrivatePilotCohort(
   reports[0],reports[1],reports.slice(2,2+m.length),reports.slice(2+m.length)
  );
  if(epoch!==current)return;
  accepted=report;
  $('resultsSummary').textContent=
   'Same build: '+report.appRelease+'; Android '+
   report.deviceCheck.androidChecks+'/'+report.deviceCheck.requiredEach+
   ', iPhone '+report.deviceCheck.iphoneChecks+'/'+report.deviceCheck.requiredEach+
   '; model-photo entries '+report.modelProposalDiagnostics.labeledGarments+
   '; saved-closet attempts '+report.savedClosetDiagnostics.labeledGarmentAttempts+
   '; reported wrong automatic saves '+report.savedClosetDiagnostics.wrongAutomaticallySaved+
   '. No individual originals can be linked across forms. Release BLOCKED.';
  showItems([...report.diagnosticBlockers,...report.releaseBlockers]);
  $('results').hidden=false;$('save').disabled=false;
  $('status').textContent='Private files validated in this browser. Nothing was uploaded. This is not a hardware or release approval.';
 }catch{
  if(epoch===current)$('status').textContent=
   'Reports were not accepted. Check their formats, required Android/iPhone files, identical app build, and any missing or private fields. No output was created.';
 }
};
$('save').onclick=()=>{
 if(!accepted)return;
 if(downloadUri){URL.revokeObjectURL(downloadUri);downloadUri=null;}
 const link=$('download');
 downloadUri=URL.createObjectURL(new Blob([JSON.stringify(accepted,null,2)+'\n'],
   {type:'application/json'}));
 link.href=downloadUri;link.hidden=false;link.click();
};
`;
const HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; font-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'">
<title>Closet Current — Private full pilot review</title>
<style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#273047;background:#f7f8fc;color-scheme:light}
*{box-sizing:border-box}body{max-width:780px;margin:0 auto;padding:18px;line-height:1.5}
h1{font-size:1.8rem;line-height:1.2}h2{font-size:1.1rem}section{background:white;border:1px solid #d5dce8;padding:16px;border-radius:14px;margin:15px 0}
p{overflow-wrap:anywhere}.hint{color:#536079}label{display:block;font-weight:650;margin:13px 0}
input{display:block;font:inherit;width:100%;min-height:48px;margin:5px 0;border-radius:8px}
button{font:inherit;padding:12px 17px;border-radius:10px;background:#34468d;color:white;border:0;min-height:48px;cursor:pointer}
button:disabled{opacity:.6}#status{font-weight:600;overflow-wrap:anywhere}li{padding:4px 0;overflow-wrap:anywhere}
a{color:#34468d;font-weight:650}#download{display:inline-block;margin-top:10px}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #db8500;outline-offset:2px}
</style></head><body>
<h1>Private phone and clothing results</h1>
<p class="hint">Open this page directly from your files — no login, internet or software installation required. Review the exact same exported JSON reports as the project’s private desktop tool. This tool cannot examine your clothing pictures or independently verify physical phones.</p>
<section><h2>1. Select reports from My account → Device help</h2>
<label>Android device-check report<input id="android" type="file" accept=".json,application/json"></label>
<label>iPhone device-check report<input id="iphone" type="file" accept=".json,application/json"></label></section>
<section><h2>2. Select Check clothing photo recognition reports</h2>
<label>Model suggestions — one or more JSON files<input id="model" type="file" multiple accept=".json,application/json"></label></section>
<section><h2>3. Select Check what was actually saved reports</h2>
<label>Saved closet — at least one Android and one iPhone JSON<input id="saved" type="file" multiple accept=".json,application/json"></label></section>
<section><h2>4. Review results privately</h2>
<button id="review" type="button">Check all reports</button>
<p id="status" role="status" aria-live="polite">Choose reports above. Nothing uploads.</p>
<div id="results" hidden><p id="resultsSummary" role="status"></p>
<h2>Missing evidence and problems</h2><ul id="problems"></ul>
<button id="save" type="button" disabled>Save private redacted summary</button>
<a id="download" download="closet-private-pilot-summary.json" hidden>Save redacted summary JSON</a>
<p class="hint">Even perfect self-reported checklists cannot prove original-photo accuracy, unique items, hardware, live cloud backup, legally approved terms or readiness to deploy. Preserve raw evidence privately.</p></div></section>
<script>__BUNDLED_SOURCE_AND_UI__</script></body></html>`;

function stripModule(p){
 let source=fs.readFileSync(p,'utf8');
 for(const line of IMPORTS[p]||[]){
  assert.ok(source.includes(line),'Canonical validator dependency changed: '+p);
  source=source.replace(line,'');
 }
 assert.doesNotMatch(source,/^\s*import\s/m,'New import requires explicit bundler review: '+p);
 assert.doesNotMatch(source,/^\s*export\s*\{/m,'Changed export requires bundler review: '+p);
 return source.replace(/^export\s+(?=(?:const|let|function|class)\s)/gm,'');
}
export function createOfflinePilotCohortHTML(){
 const head=`const assert={
 ok(x,m){if(!x)throw Error(m||'Invalid local evidence');},
 equal(a,b,m){if(a!==b)throw Error(m||'Inconsistent local evidence');},
 match(a,re,m){if(typeof a!=='string'||!re.test(a))throw Error(m||'Invalid evidence field');}
};\n`;
 const common=JS_FILES.map(([p,varName])=>{
  const source=fs.readFileSync(p,'utf8');
  assert.ok(!source.toLowerCase().includes('</script'),'Unsafe shared validator script');
  return `const ${varName}=(()=>{const module={exports:{}};\n${source}\nreturn module.exports;})();\n`;
 }).join('\n');
 const injected=head+common+MODULES.map(stripModule).join('\n')+'\n'+UI;
 assert.ok(!injected.toLowerCase().includes('</script'),'Unsafe executable source in HTML');
 assert.ok(injected.includes('function reviewPrivatePilotCohort('));
 assert.ok(injected.includes("productionPromotion:'BLOCKED'"));
 const page=HTML.replace('__BUNDLED_SOURCE_AND_UI__',injected);
 assert.ok(!page.includes('__BUNDLED_SOURCE_AND_UI__'));
 return page;
}
export function writeOfflinePilotCohort(directory){
 assert.ok(!fs.existsSync(directory),'Never overwrite a previous private review organizer');
 const html=createOfflinePilotCohortHTML();
 fs.mkdirSync(directory,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(directory,'OPEN-PRIVATE-PILOT-REVIEW.html'),html,{mode:0o600,flag:'wx'});
 fs.writeFileSync(path.join(directory,'START-HERE.txt'),
  'Closet Current PRIVATE pilot review\n\n'+
  '1. Open OPEN-PRIVATE-PILOT-REVIEW.html locally in Chrome, Safari or Firefox. No installation, account or internet needed.\n'+
  '2. Choose the private Android and iPhone Device help JSON exports (one each).\n'+
  '3. Choose your anonymous original-photo model checks; then saved-closet audit reports from both types of phone.\n'+
  '4. Tap Check all reports. The exact source validator rejects mismatched app builds, forged counters and private extra fields.\n'+
  '5. Save the redacted JSON summary locally. Raw input JSON and photos never leave your device via this tool.\n'+
  '6. Manual original-photo review, real-phone hardware, separate live two-account Auth/backup and privacy/legal signoff remain necessary. No approval to deploy.\n',
  {mode:0o600,flag:'wx'});
 return {created:true,independentRealPhonesVerified:false,actualGenuinePhotos:0,
  savedClosetProductionAccuracy:null,productionReleaseApproved:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.ok(process.argv[2]==='prepare'&&process.argv.length===4,
  'Usage: node scripts/offline-pilot-cohort-organizer.mjs prepare NEW_DIRECTORY');
 console.log(JSON.stringify(writeOfflinePilotCohort(process.argv[3])));
}
