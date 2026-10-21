// Review delivery/readiness only. Decoded photographs are not human judgments.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {packetFromLock,reviewHTML,reconcile,LOCK,LOCK_SHA,hash} from './source-holdout-human-review.mjs';
export const BASE='6ebcf6d9dcfd18611c3248242b62208eb9923385';
export function displayedOriginalReady(s){
 return s.verified===true&&typeof s.expectedSource==='string'&&s.expectedSource.startsWith('blob:')&&
  s.imageSource===s.expectedSource&&s.displaySource===s.expectedSource&&s.complete===true&&
  Number.isSafeInteger(s.width)&&s.width>0&&Number.isSafeInteger(s.height)&&s.height>0;
}
export function guardedReviewHTML(packet){
 const original=reviewHTML(packet);
 const guard=`<script>
// Additional presentation gate; imported PR #113 source is unchanged.
const displayedOriginalReady=${displayedOriginalReady.toString()};
function selectedOriginalIsDisplayed(){const image=$('photo');return displayedOriginalReady({verified,
 expectedSource:urls.get($('source').value),imageSource:image.getAttribute('src'),displaySource:image.currentSrc,
 complete:image.complete,width:image.naturalWidth,height:image.naturalHeight});}
function refreshOriginalPresentation(){ $('record').disabled=!selectedOriginalIsDisplayed(); }
$('record').addEventListener('click',event=>{
 if(!selectedOriginalIsDisplayed()){event.preventDefault();event.stopImmediatePropagation();
  $('status').textContent='Wait for the selected verified original to display before recording an observation.';}
},true);
for(const name of ['load','error'])$('photo').addEventListener(name,refreshOriginalPresentation);
for(const name of ['source','files'])$(name).addEventListener('change',refreshOriginalPresentation);
refreshOriginalPresentation();
</script>`;
 assert.ok(original.endsWith('</html>'),'Unexpected source review template');
 return original.slice(0,-7)+guard+'</html>';
}
export function readinessReport(packet,checks){
 const canonical=packetFromLock(fs.readFileSync(LOCK));assert.deepEqual(packet,canonical,'Changed original packet');
 assert.ok(Array.isArray(checks)&&checks.length===2,'Both browser engines required');
 const engines=new Set();
 for(const check of checks){
  assert.ok(['chromium','webkit'].includes(check.engine)&&!engines.has(check.engine),'Missing or duplicate engine');engines.add(check.engine);
  assert.equal(check.stalledImageBlocked,true);assert.equal(check.failedImageBlocked,true);
  assert.equal(check.observationsRecorded,0,'Automation cannot supply human observations');
  assert.equal(check.blankExportBlocked,true);assert.equal(check.blankTemplateUnchanged,true);
  assert.ok(Array.isArray(check.photos)&&check.photos.length===packet.photos.length,'Incomplete original rendering');
  const rows=new Map();for(const row of check.photos){assert.ok(!rows.has(row.id),'Duplicate rendered source');rows.set(row.id,row);}
  for(const p of packet.photos){
   const r=rows.get(p.id);assert.equal(r?.sha256,p.sha256,'Rendered source mismatch');
   assert.ok(Number.isSafeInteger(r.width)&&r.width>0&&Number.isSafeInteger(r.height)&&r.height>0);
   assert.equal(r.width,r.expectedWidth,'Rendered EXIF width mismatch');assert.equal(r.height,r.expectedHeight,'Rendered EXIF height mismatch');
  }
 }
 const pending=reconcile(packet,[]);
 return {schemaVersion:1,status:'SOFTWARE_READY_AWAITING_REAL_INDEPENDENT_HUMANS',sourceBase:BASE,
  lockedManifestSha256:LOCK_SHA,sourcePhotos:packet.photos.length,browserRenderChecks:checks.length*packet.photos.length,
  browserChecks:checks,actualHumanSubmissions:pending.suppliedSubmissions,independentHumanGoldLabels:false,
  measuredHumanAccuracy:null,productionPromotion:'BLOCKED',customerSaves:0,
  nextStep:'Two genuinely independent humans must inspect the originals blind and return their downloaded JSON files. Verify their identities/blinding externally, reconcile uncertainty/disagreement and preserve raw files. Do not invent reviews or relabel discovery references.',
  limitation:'Automated decoding and form gates prove neither human inspection nor correct garment labels. No physical-phone or untouched confirmation data. Existing source/assistant-label inference remains provisional.'};
}
export function prepareHandoff(originals,out){
 // The original preparation verifies every JPEG hash before copying. No source
 // code changes, reencoding, masking, label migration or fabricated submissions.
 execFileSync(process.execPath,['scripts/source-holdout-human-review.mjs','prepare',originals,out],{stdio:'pipe'});
 const packet=packetFromLock(fs.readFileSync(LOCK));
 fs.writeFileSync(path.join(out,'review.html'),guardedReviewHTML(packet));
 fs.writeFileSync(path.join(out,'START-HERE.txt'),`Independent garment-photo observations\n\nGive separate copies of this folder to two people. Each should review alone and not consult predictions, proposed labels, source credits or the other person's answers. If you have already seen those answers, you cannot truthfully attest to a blind review; ask another person.\n\n1. Extract the entire folder. Open review.html in a browser on a computer.\n2. Select all 13 original JPEGs together. Wait for the original hashes to verify.\n3. Inspect each entire photograph. Wait for it to display before recording. Choose only what the pixels support, record uncertainty and visible evidence, and do not guess hidden garments.\n4. Use an alias and only truthful attestations. Download observations before closing; there is no automatic storage or upload.\n5. Return your JSON file separately to the coordinator. Do not share answers with another reviewer. Read CREDITS-after-review.txt after recording labels; original EXIF may contain source hints, so blinding is procedural.\n\nThe folder contains unchanged high-resolution originals. The page does not predict garments or save wardrobe items. A computer browser was tested; physical-phone file handling has not been validated. Agreement alone cannot authenticate people or establish gold labels, exact subtypes, item counts or masks.\n`);
 return packet;
}
export function verifyScope(){
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();git('merge-base','--is-ancestor',BASE,'HEAD');
 const allowed=new Set(['scripts/human-original-review-readiness.mjs','scripts/test-human-original-review-readiness.mjs','tests/human-original-review-readiness.test.mjs','.github/workflows/human-original-review-readiness.yml','docs/HUMAN-ORIGINAL-REVIEW-READINESS.md']);
 for(const p of git('diff','--name-only',BASE,'--').split('\n').filter(Boolean)){
  if(p==='docs/PROGRESS-CHECKPOINT.md')assert.ok(fs.readFileSync(p,'utf8').endsWith(execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'})),'Historical checkpoint changed');
  else{assert.ok(allowed.has(p),'Unexpected source change: '+p);assert.equal(git('ls-tree',BASE,'--',p),'','Existing integration source changed');}
 }
 packetFromLock(fs.readFileSync(LOCK));console.log('All PR #115 app/model/source/review bytes unchanged; additive handoff readiness only.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,...args]=process.argv.slice(2);
 if(mode==='prepare'&&args.length===2){prepareHandoff(...args);console.log('Prepared unchanged 13 originals and blank guarded review form; no human submissions.');}
 else if(mode==='report'&&args.length===2){const packet=packetFromLock(fs.readFileSync(LOCK)),checks=JSON.parse(fs.readFileSync(args[0]));
  const report=readinessReport(packet,checks);fs.writeFileSync(args[1],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,sourcePhotos:report.sourcePhotos,browserRenderChecks:report.browserRenderChecks,actualHumanSubmissions:0,measuredHumanAccuracy:null,productionPromotion:'BLOCKED'}));
 }else if(mode==='verify'&&!args.length)verifyScope();
 else throw Error('Use prepare ORIGINALS NEW_DIRECTORY | report BROWSER_CHECKS.json OUTPUT.json | verify');
}
