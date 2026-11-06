#!/usr/bin/env node
/**
 * PHOTO104 detached exact-PR541 research-only overlay. First run inherited
 * scripts/install-photographed-denim-knee-103.mjs in .photo103-donor-541;
 * this overlays pose-conditioned actual photographed denim folded geometry.
 * Never patches default app, a deployed branch, or a private user closet.
 */
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const target=process.argv[2];
if(target!=='.photo103-donor-541')
 throw Error('PHOTO104 only exact detached .photo103-donor-541 research donor supported');
const root=resolve(target);
if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('PHOTO104 exact pinned 163-bone PR541 SHA required');
const updates=new Map();
async function patch(path,edits){
 let contents=await readFile(join(root,path),'utf8');
 for(const [oldText,newText] of edits){
  if(contents.split(oldText).length!==2)
   throw Error('PHOTO104 pinned PHOTO103 overlay anchor missing/duplicated: '+path+' '+oldText.slice(0,90));
  contents=contents.replace(oldText,newText);
 }
 updates.set(path,contents);
}
await patch('research/three-d-15/outfit-controller.mjs',[
 ["import {auditPhotographedDenimKneeStep103} from '../three-d-103/actual-skinned-denim-103.mjs';",
  "import {auditPhotographedDenimKneeStep103} from '../three-d-103/actual-skinned-denim-103.mjs';\nimport {auditSourceDenimPoseResponsiveFolds104} from '../three-d-104/pose-responsive-denim-folds.mjs';"],
 [' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,dispose};',
 [
  ' function auditKneePose104(left,right){',
  "  if(!photoDenimKneePose78||!parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)",
  "   throw Error('PHOTO104 exact SHA-bound genuine original 163-bone denim source required');",
  '  parts.pants=auditSourceDenimPoseResponsiveFolds104(parts.pants,root,{left,right});',
  '  return summarize();',
  ' }',
  ' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,dispose};'
 ].join('\n')]
]);
await patch('research/three-d-15/showroom.mjs',[
 ["  auditKneePose103:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO103 source rig not authorized');const proof=outfit.auditKneePose103(left,right);draw();return proof;},",
  "  auditKneePose103:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO103 source rig not authorized');const proof=outfit.auditKneePose103(left,right);draw();return proof;},\n  auditKneePose104:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO104 source rig not authorized');const proof=outfit.auditKneePose104(left,right);draw();return proof;},"]
]);
await patch('research/three-d-69/index-to-real-garment-demo.mjs',[
 ["  window.cc103KneeStep=(left,right)=>app.auditKneePose103(left,right);",
  [
  '  window.cc103KneeStep=(left,right)=>app.auditKneePose103(left,right);',
  ' // Genuine original denim only, localhost and explicit independent research flag.',
  " if(new URLSearchParams(location.search).get('knee78')==='on'&&",
  "    new URLSearchParams(location.search).get('knee103')==='on'&&",
  "    new URLSearchParams(location.search).get('knee104')==='on')",
  '  window.cc104KneeStep=(left,right)=>app.auditKneePose104(left,right);'
  ].join('\n')]
]);
for(const [path,body] of updates)await writeFile(join(root,path),body);
const out=join(root,'research/three-d-104');
await mkdir(out,{recursive:true});
for(const f of ['fold-profile.mjs','pose-responsive-denim-folds.mjs'])
 await copyFile('research/photo-denim-pose-fold-contact-104/'+f,join(out,f));
console.log('PHOTO104 actual 163-bone original JEANS dynamic knee rear cloth source-only patch applied in detached pinned donor; 3 files + 2 research fold modules. No production/staging/private source modified.');
