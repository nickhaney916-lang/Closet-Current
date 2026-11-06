/**
 * PHOTO108: add source-verified left/right/simultaneous knee replay
 * verification to the genuine original PR541 detached 163-bone denim donor.
 * Requires P103, P104, P105 and P106 overlays FIRST.
 *
 * No writes to app main, staging, production, cloud or source photos.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const arg=process.argv[2];
if(arg!=='.photo103-donor-541')
 throw Error('PHOTO108 only immutable SHA-pinned detached research .photo103-donor-541 permitted');
const root=resolve(arg),donor='df6885d6011cb33fb22dceb81a08f35a0ac4dd61';
if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==donor)
 throw Error('PHOTO108 original PR541 CC0 163-bone source donor SHA mismatch');
const files=new Map();
async function patch(path,edits){
 let s=await readFile(join(root,path),'utf8');
 for(const [from,to] of edits){
  if(s.split(from).length!==2)
   throw Error('PHOTO108 exact genuine P106 original research adapter anchor missing or ambiguous '+path+' '+from.slice(0,80));
  s=s.replace(from,to);
 }
 files.set(path,s);
}
await patch('research/three-d-15/outfit-controller.mjs',[
 ["import {auditPhotographedDenimCalfDrape106} from '../three-d-106/source-ankle-calf-drape.mjs';",
  "import {auditPhotographedDenimCalfDrape106} from '../three-d-106/source-ankle-calf-drape.mjs';\nimport {verifyPhotographedBilateralDenim108} from '../three-d-108/real-source-bilateral-audit.mjs';\nimport {validateBilateralSourcePose108} from '../three-d-108/bilateral-pose-policy.mjs';"],
 [' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,auditKneePose105,auditKneePose106,dispose};',
  [
  ' function auditKneePose108(left,right){',
  '  validateBilateralSourcePose108(left,right);',
  "  if(!photoDenimKneePose78||!parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)",
  "   throw Error('PHOTO108 exact SHA source 163-bone licensed denim required');",
  '  const folded=auditSourceDenimPoseResponsiveFolds104(parts.pants,root,{left,right});',
  '  const shaded=smoothActualPhotoDenimPanelNormals105(folded);',
  '  const calf=auditPhotographedDenimCalfDrape106(shaded,root);',
  '  parts.pants=verifyPhotographedBilateralDenim108(calf,{left,right});',
  '  return summarize();',
  ' }',
  ' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,auditKneePose105,auditKneePose106,auditKneePose108,dispose};'
  ].join('\n')]
]);
await patch('research/three-d-15/showroom.mjs',[
 ["  auditKneePose106:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO106 genuine source 163-bone rig not authorized');const proof=outfit.auditKneePose106(left,right);draw();return proof;},",
  "  auditKneePose106:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO106 genuine source 163-bone rig not authorized');const proof=outfit.auditKneePose106(left,right);draw();return proof;},\n  auditKneePose108:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO108 genuine source 163-bone rig not authorized');const proof=outfit.auditKneePose108(left,right);draw();return proof;},"]
]);
await patch('research/three-d-69/index-to-real-garment-demo.mjs',[
 ['  window.cc106CalfDrape=(left,right)=>app.auditKneePose106(left,right);',
  [
  '  window.cc106CalfDrape=(left,right)=>app.auditKneePose106(left,right);',
  ' // Exact original licensed denim donor; explicit LOCAL research-only flag.',
  " if(new URLSearchParams(location.search).get('knee78')==='on'&&",
  "    new URLSearchParams(location.search).get('knee103')==='on'&&",
  "    new URLSearchParams(location.search).get('knee104')==='on'&&",
  "    new URLSearchParams(location.search).get('knee105')==='on'&&",
  "    new URLSearchParams(location.search).get('knee106')==='on'&&",
  "    new URLSearchParams(location.search).get('knee108')==='on')",
  '  window.cc108BilateralPose=(left,right)=>app.auditKneePose108(left,right);'
  ].join('\n')]
]);
for(const [path,s] of files)await writeFile(join(root,path),s);
const target=join(root,'research/three-d-108');
await mkdir(target,{recursive:true});
for(const path of ['bilateral-pose-policy.mjs','real-source-bilateral-audit.mjs'])
 await copyFile('research/denim-bilateral-pose-replay-108/'+path,join(target,path));
console.log('PHOTO108 installed real 163-bone original source photographed jeans bilateral sequence evidence in exact SHA detached donor ONLY; no app/production/staging/cloud modifications.');
