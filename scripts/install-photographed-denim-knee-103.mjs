#!/usr/bin/env node
/**
 * PHOTO103 — install isolated research-only sampled knee geometry into exact
 * immutable PR541 donor checkout for independent test, never into app/main.
 * Invoke ONLY on CI's .photo103-donor-541 detached worktree, after verifying
 * HEAD=df6885d6011cb33fb22dceb81a08f35a0ac4dd61.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const target=process.argv[2];
if(target!=='.photo103-donor-541')
 throw Error('PHOTO103 requires only isolated .photo103-donor-541 pinned test checkout');
const root=resolve(target),expected='df6885d6011cb33fb22dceb81a08f35a0ac4dd61';
const git=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(git!==expected)throw Error('PHOTO103 actual pinned 163-bone donor SHA changed');
const updates=new Map();
async function patch(path,edits){
 const before=await readFile(join(root,path),'utf8');
 let text=before;
 for(const [oldValue,newValue] of edits){
  if(text.split(oldValue).length!==2)
   throw Error('PHOTO103 original donor anchor missing or duplicated: '+path+' '+oldValue.slice(0,90));
  text=text.replace(oldValue,newValue);
 }
 if(text===before)throw Error('PHOTO103 no genuine integration in '+path);
 updates.set(path,text);
}
await patch('research/three-d-78/genuine-skinned-denim-knee-poses.mjs',[
 ['function findOriginalLowerLegBones78(root,pants){',
  'export function findOriginalLowerLegBones78(root,pants){']
]);
await patch('research/three-d-15/outfit-controller.mjs',[
 ["import {auditSourcePhotoDenimAlternativeKneePose78} from '../three-d-78/genuine-skinned-denim-knee-poses.mjs';",
  "import {auditSourcePhotoDenimAlternativeKneePose78} from '../three-d-78/genuine-skinned-denim-knee-poses.mjs';\nimport {auditPhotographedDenimKneeStep103} from '../three-d-103/actual-skinned-denim-103.mjs';"],
 [" setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,dispose};",
  [
  ' function auditKneePose103(left,right){',
  "  if(!photoDenimKneePose78||!parts.pants?.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77)",
  "   throw Error('PHOTO103 only original SHA-vetted independent 163-bone source denim may move');",
  '  parts.pants=auditPhotographedDenimKneeStep103(parts.pants,root,{left,right});',
  '  return summarize();',
  ' }',
  ' setPose(pose);return {setOutfit,setPose,getState:summarize,auditKneePose78,auditKneePose103,dispose};'
  ].join('\n')]
]);
await patch('research/three-d-15/showroom.mjs',[
 ["  auditKneePose78:next=>{if(!photoDenimKneePose78)throw Error('3D78 research knee pose not authorized');const proof=outfit.auditKneePose78(next);draw();return proof;},",
  "  auditKneePose78:next=>{if(!photoDenimKneePose78)throw Error('3D78 research knee pose not authorized');const proof=outfit.auditKneePose78(next);draw();return proof;},\n  auditKneePose103:(left,right)=>{if(!photoDenimKneePose78)throw Error('PHOTO103 source rig not authorized');const proof=outfit.auditKneePose103(left,right);draw();return proof;},"]
]);
await patch('research/three-d-69/index-to-real-garment-demo.mjs',[
 [" if(new URLSearchParams(location.search).get('knee78')==='on')\n  window.cc78KneePose=pose=>app.auditKneePose78(pose);",
  [
  " if(new URLSearchParams(location.search).get('knee78')==='on')",
  '  window.cc78KneePose=pose=>app.auditKneePose78(pose);',
  ' // Explicit localhost original-source research gate; not shipped in app.',
  " if(new URLSearchParams(location.search).get('knee78')==='on'&&",
  "    new URLSearchParams(location.search).get('knee103')==='on')",
  '  window.cc103KneeStep=(left,right)=>app.auditKneePose103(left,right);'
  ].join('\n')]
]);
for(const [path,value] of updates)await writeFile(join(root,path),value);
const out=join(root,'research/three-d-103');
await mkdir(out,{recursive:true});
for(const file of ['knee-angles-policy.mjs','actual-skinned-denim-103.mjs'])
 await copyFile('research/source-photo-denim-intermediate-knee-103/'+file,join(out,file));
console.log('PHOTO103 isolated 163-bone donor sampled knee research overlay installed: '+updates.size+' verified original modules + two research modules; no app/source-photo bytes/production modified.');
