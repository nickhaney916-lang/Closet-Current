/**
 * PHOTO105: append ONLY to genuine PR541 detached research donor AFTER exact
 * PHOTO103 + PHOTO104 overlays; no default app, prod/staging, or source images.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const path=process.argv[2];
if(path!=='.photo103-donor-541')
 throw Error('PHOTO105 only detached .photo103-donor-541 research rig permitted');
const root=resolve(path);
if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==
 'df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('PHOTO105 exact SHA-locked original PR541 anatomical donor required');
const writes=new Map();
async function patch(filename,pairs){
 let value=await readFile(join(root,filename),'utf8');
 for(const [before,after] of pairs){
  if(value.split(before).length!==2)
   throw Error('PHOTO105 required original P104 integration anchor absent/duplicate '+filename+' '+before.slice(0,80));
  value=value.replace(before,after);
 }
 writes.set(filename,value);
}
await patch('research/three-d-15/outfit-controller.mjs',[
 ["import {auditSourceDenimPoseResponsiveFolds104} from '../three-d-104/pose-responsive-denim-folds.mjs';",
  "import {auditSourceDenimPoseResponsiveFolds104} from '../three-d-104/pose-responsive-denim-folds.mjs';\nimport {smoothActualPhotoDenimPanelNormals105} from '../three-d-105/rear-seam-normal-continuity.mjs';"],
 [' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,dispose};',
  [
  ' function auditKneePose105(left,right){',
  "  if(!photoDenimKneePose78||!parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)",
  "   throw Error('PHOTO105 only original source-SHA-verified 163-bone jeans shading eligible');",
  '  const posed=auditSourceDenimPoseResponsiveFolds104(parts.pants,root,{left,right});',
  '  parts.pants=smoothActualPhotoDenimPanelNormals105(posed);',
  '  return summarize();',
  ' }',
  ' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,auditKneePose105,dispose};'
  ].join('\n')]
]);
await patch('research/three-d-15/showroom.mjs',[
 ["  auditKneePose104:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO104 source rig not authorized');const proof=outfit.auditKneePose104(left,right);draw();return proof;},",
  "  auditKneePose104:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO104 source rig not authorized');const proof=outfit.auditKneePose104(left,right);draw();return proof;},\n  auditKneePose105:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO105 original source rig not authorized');const proof=outfit.auditKneePose105(left,right);draw();return proof;},"]
]);
await patch('research/three-d-69/index-to-real-garment-demo.mjs',[
 ['  window.cc104KneeStep=(left,right)=>app.auditKneePose104(left,right);',
  [
  '  window.cc104KneeStep=(left,right)=>app.auditKneePose104(left,right);',
  ' // Genuine source-only LOCAL research gate; no user photos or release.',
  " if(new URLSearchParams(location.search).get('knee78')==='on'&&",
  "    new URLSearchParams(location.search).get('knee103')==='on'&&",
  "    new URLSearchParams(location.search).get('knee104')==='on'&&",
  "    new URLSearchParams(location.search).get('knee105')==='on')",
  '  window.cc105KneeStep=(left,right)=>app.auditKneePose105(left,right);'
  ].join('\n')]
]);
for(const [name,value] of writes)await writeFile(join(root,name),value);
const target=join(root,'research/three-d-105');
await mkdir(target,{recursive:true});
await copyFile('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs',
 join(target,'rear-seam-normal-continuity.mjs'));
console.log('PHOTO105 actual 163-bone source-denim photographed rear seam normal geometry integration: exact pinned detached donor, three research viewer adapters + one neutral-rear original source-only shading module, no app or staging change.');
