// Standalone local-only review of original-first fixed-choice phone JSON.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const evidence=fs.readFileSync(new URL('./linked-phone-garment-evidence.mjs',import.meta.url),'utf8');
const triage=fs.readFileSync(new URL('./phone-recognition-triage.mjs',import.meta.url),'utf8');
const importLine="import {validateTrial,platforms,scenes,slots} from './linked-phone-garment-evidence.mjs';";
assert.ok(triage.includes(importLine),'Recognition triage dependency changed');
const inlineEvidence=evidence.replaceAll('export ','');
const inlineTriage=triage.replace(importLine,'').replaceAll('export ','');
for(const part of [inlineEvidence,inlineTriage]){
 assert.doesNotMatch(part,/<\/script/i,'Script break-out refused');
 assert.doesNotMatch(part,/^\s*import\s/m,'Unexpected dependency');
}
const UI=String.raw`
'use strict';
const $=id=>document.getElementById(id);
let epoch=0,report=null,downloadUrl=null;
function clear(){
 epoch++;report=null;
 if(downloadUrl)URL.revokeObjectURL(downloadUrl);
 downloadUrl=null;
 const link=$('download');link.hidden=true;link.removeAttribute('href');
 $('summary').textContent='No report reviewed. No device or independent recognition verified.';
 $('families').replaceChildren();$('problems').replaceChildren();$('downloadButton').disabled=true;
}
$('source').addEventListener('change',clear);
function line(parent,text){const li=document.createElement('li');li.textContent=text;parent.append(li);}
function render(r){
 const t=r.totals;
 $('summary').textContent='Recorded '+r.completedOriginalScenes+'/'+r.totalOriginalScenes+
 ' original scenes and '+t.recorded+'/'+t.required+' garment observations. Initial model exact: '+
 (t.initialExactPercentOfRecorded===null?'NOT MEASURED':t.initialExactPercentOfRecorded+'% of recorded')+
 '. Correctly saved WITH a clear image: '+
 (t.usableSavedPercentOfRecorded===null?'NOT MEASURED':t.usableSavedPercentOfRecorded+'% of recorded')+
 '. Physical phone and independent accuracy: UNVERIFIED. Release BLOCKED.';
 for(const group of r.byFamily)line($('families'),group.label+': '+group.recorded+'/'+group.required+
  ' recorded; initial exact '+group.initialCategoryAndColorCorrect+
  '; usable correctly saved '+group.usableCorrectlySaved+
  '; not saved '+group.issues['not-saved']+
  '; missing/pixelated images '+(group.issues['missing-photo']+group.issues['pixelated-photo'])+'.');
 if(!r.prioritizedIssues.length)line($('problems'),'No operator-reported problems; incomplete evidence still blocks release.');
 else for(const item of r.prioritizedIssues.slice(0,10))
  line($('problems'),item.label+' — '+item.issue+': '+item.count+' of '+
   (item.kind==='not-recorded'?item.outOfRequired:item.outOfRecorded)+
   (item.kind==='not-recorded'?' required':' recorded')+'.');
}
$('review').onclick=async()=>{
 clear();const now=epoch;
 $('status').textContent='Reviewing fixed-choice report locally…';
 try{
  const f=$('source').files[0];
  if(!f||f.size<16||f.size>131072)throw Error('Invalid file');
  const raw=await f.text();
  if(now!==epoch)return;
  const summary=parsePhoneTriageSource(raw);
  if(now!==epoch)return;
  report=summary;render(summary);
  $('downloadButton').disabled=false;
  $('status').textContent='Reviewed locally. This report contains only fixed-choice aggregate counts, not verified accuracy.';
 }catch{
  if(now===epoch)$('status').textContent='Report rejected. Use only the original-first PHONE-ORIGINALS fixed-choice JSON. No private contents displayed.';
 }
};
$('downloadButton').onclick=()=>{
 if(!report)return;
 if(downloadUrl)URL.revokeObjectURL(downloadUrl);
 downloadUrl=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'}));
 $('download').href=downloadUrl;$('download').hidden=false;
 $('status').textContent='Aggregate-only JSON prepared locally; nothing uploaded.';
};
window.addEventListener('pagehide',()=>{if(downloadUrl)URL.revokeObjectURL(downloadUrl);});
`;
const html=String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; font-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'">
<title>Closet Current — original-first failure triage</title>
<style>body{font:17px/1.5 system-ui,sans-serif;max-width:750px;margin:auto;padding:15px;background:#f7f9fa;color:#17362a}*{box-sizing:border-box}section{background:white;padding:15px;border:1px solid #bdccc5;border-radius:13px;margin:14px 0}h1{font-size:1.55rem}h2{font-size:1.2rem}label{display:block}input,button,a{display:block;font:inherit;width:100%;min-height:48px;margin:9px 0;padding:9px;border-radius:8px;max-width:100%}button,a{background:#155b47;border:0;color:white;text-align:center}button:disabled{opacity:.5}[hidden]{display:none!important}.warning{border-left:5px solid #aa682e;padding:12px;background:#fff4e2}li{padding:5px 0;overflow-wrap:anywhere}:focus-visible{outline:3px solid #ad7d00;outline-offset:2px}</style></head>
<body><h1>Recognition problems — private phone trial</h1>
<p class="warning">Offline diagnostic only. Use the separate original-first worksheet AFTER independent staging authorization. This page cannot certify actual phones, unique originals, independent labels, Cloudflare Access or accuracy. Release BLOCKED.</p>
<section><h2>1. Choose original-first report</h2><p>Use the fixed-choice JSON downloaded from PHONE-ORIGINALS.html. This page never reads, stores or uploads photos, names, accounts or original filenames.</p><label>Select private worksheet JSON<input id="source" type="file" accept=".json,application/json"></label><button id="review">Review garment problems</button><p id="status" role="status">Nothing uploaded. No report reviewed.</p></section>
<section><h2>2. Combined results</h2><p id="summary" role="status" aria-live="polite">No report reviewed. No device or independent recognition verified.</p><h2>Category breakdown</h2><ul id="families"></ul><h2>Highest-impact observed problems</h2><ul id="problems"></ul></section>
<section><h2>3. Export anonymous aggregates</h2><p>Only aggregate totals, predefined garment families and issue counts are included. No per-original rows or phone identifiers. Priorities are diagnostic, not verified statistical accuracy.</p><button id="downloadButton" disabled>Prepare aggregate-only JSON</button><a id="download" download="closet-phone-recognition-triage.json" hidden>Download anonymous problem summary</a></section>
<script>__OFFLINE_ENGINE__</script></body></html>`;

export function phoneTriageHTML(){
 const injected=inlineEvidence+'\n'+inlineTriage+'\n'+UI;
 assert.doesNotMatch(injected,/<\/script/i,'Inline source unsafe');
 return html.replace('__OFFLINE_ENGINE__',injected);
}
export function writePhoneTriageHTML(output){
 const p=path.resolve(output);
 fs.mkdirSync(path.dirname(p),{recursive:true,mode:0o700});
 fs.writeFileSync(p,phoneTriageHTML(),{flag:'wx',mode:0o600});
 return {output:p,offlineOnly:true,physicalHardwareVerified:false,independentAccuracyVerified:false,productionPromotion:'BLOCKED'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node scripts/build-phone-recognition-triage.mjs NEW-FILE.html');
 console.log(JSON.stringify(writePhoneTriageHTML(process.argv[2])));
}
