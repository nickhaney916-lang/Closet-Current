/**
 * PHOTO106 research-only original public source jeans 163-bone calf fall
 * integration, after inherited P103 knee, P104 real folds, P105 normals.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const target=process.argv[2];
if(target!=='.photo103-donor-541')
 throw Error('PHOTO106 only detached exact original research .photo103-donor-541');
const root=resolve(target);
if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==
 'df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('PHOTO106 original CC0 PR541 163-bone source rig SHA changed');
const out=new Map();
async function patch(name,replacements){
 let s=await readFile(join(root,name),'utf8');
 for(const [original,revised] of replacements){
  if(s.split(original).length!==2)
   throw Error('PHOTO106 inherited P105 source adapter anchor absent/multiple '+name+' '+original.slice(0,90));
  s=s.replace(original,revised);
 }
 out.set(name,s);
}
await patch('research/three-d-15/outfit-controller.mjs',[
 ["import {smoothActualPhotoDenimPanelNormals105} from '../three-d-105/rear-seam-normal-continuity.mjs';",
  "import {smoothActualPhotoDenimPanelNormals105} from '../three-d-105/rear-seam-normal-continuity.mjs';\nimport {auditPhotographedDenimCalfDrape106} from '../three-d-106/source-ankle-calf-drape.mjs';"],
 [' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,auditKneePose105,dispose};',
  [
  ' function auditKneePose106(left,right){',
  "  if(!photoDenimKneePose78||!parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)",
  "   throw Error('PHOTO106 exact SHA source-verified anatomical jeans required');",
  '  const folded=auditSourceDenimPoseResponsiveFolds104(parts.pants,root,{left,right});',
  '  const shaded=smoothActualPhotoDenimPanelNormals105(folded);',
  '  parts.pants=auditPhotographedDenimCalfDrape106(shaded,root);',
  '  return summarize();',
  ' }',
  ' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,auditKneePose104,auditKneePose105,auditKneePose106,dispose};'
  ].join('\n')]
]);
await patch('research/three-d-15/showroom.mjs',[
 ["  auditKneePose105:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO105 original source rig not authorized');const proof=outfit.auditKneePose105(left,right);draw();return proof;},",
  "  auditKneePose105:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO105 original source rig not authorized');const proof=outfit.auditKneePose105(left,right);draw();return proof;},\n  auditKneePose106:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO106 genuine source 163-bone rig not authorized');const proof=outfit.auditKneePose106(left,right);draw();return proof;},"]
]);
await patch('research/three-d-69/index-to-real-garment-demo.mjs',[
 ['  window.cc105KneeStep=(left,right)=>app.auditKneePose105(left,right);',
  [
  '  window.cc105KneeStep=(left,right)=>app.auditKneePose105(left,right);',
  ' // Genuinely licensed original photographic fabric, local research only.',
  " if(new URLSearchParams(location.search).get('knee78')==='on'&&",
  "    new URLSearchParams(location.search).get('knee103')==='on'&&",
  "    new URLSearchParams(location.search).get('knee104')==='on'&&",
  "    new URLSearchParams(location.search).get('knee105')==='on'&&",
  "    new URLSearchParams(location.search).get('knee106')==='on')",
  '  window.cc106CalfDrape=(left,right)=>app.auditKneePose106(left,right);'
  ].join('\n')]
]);
for(const [path,code] of out)await writeFile(join(root,path),code);
const dest=join(root,'research/three-d-106');
await mkdir(dest,{recursive:true});
for(const file of ['calf-drape-policy.mjs','source-ankle-calf-drape.mjs'])
 await copyFile('research/photo-denim-calf-drape-geometry-106/'+file,join(dest,file));
console.log('PHOTO106 original photographed denim 163-bone knee-to-calf garment geometry research installed on exact PR541 detached donor only. No production, original photograph, staging or private wardrobe mutations.');
