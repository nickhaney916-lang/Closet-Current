/**
 * P87 detached-donor research installer. Run AFTER P86 installer on immutable
 * P541 disposable worktree; fail if any anchor or dependency changed.
 * Never edits consumer/public, source JPEGs, schemas or any live wardrobe.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const donor=resolve(process.argv[2]||'');
assert.notEqual(donor,resolve('.'),'cannot patch the repository itself');
await mkdir(donor+'/research/mission2-p87',{recursive:true});
await copyFile('research/mission2-p87/skinned-pose-preview.mjs',donor+'/research/mission2-p87/skinned-pose-preview.mjs');
const one=(source,anchor,insert)=>{
 assert.equal(source.split(anchor).length,2,'P87 exact donor anchor changed: '+anchor.slice(0,70));
 return source.replace(anchor,insert);
};
const cp=donor+'/research/dress-mobile-01/dress-outfit-controller.mjs';
let c=await readFile(cp,'utf8');
assert.match(c,/createRadialPreview86/,'P86 parent installation must run before P87');
assert.doesNotMatch(c,/createSkinnedPosePreview87/,'P87 must not install twice');
c="import {createSkinnedPosePreview87} from '../mission2-p87/skinned-pose-preview.mjs';\n"+c;
c=one(c,' let preview86=null;\n let contact=null;',' let preview86=null;\n let posePreview87=null;\n let contact=null;');
c=one(c,'preview86?.dispose();preview86=null;\n  if(closed)throw Error(\'Outfit controller closed\');',
 'preview86?.dispose();preview86=null;\n  posePreview87?.dispose();posePreview87=null;\n  if(closed)throw Error(\'Outfit controller closed\');');
c=one(c,'contact?.fit(next);return summarize();','contact?.fit(next);posePreview87?.update();return summarize();');
c=one(c,'function dispose(){preview86?.dispose();preview86=null;',
 'function dispose(){preview86?.dispose();preview86=null;posePreview87?.dispose();posePreview87=null;');
c=one(c,' researchPreview86(){',
 " researchPosePreview87(){posePreview87?.dispose();posePreview87=null;if(!parts.dress)throw Error('P87 original dress required');return posePreview87=createSkinnedPosePreview87(root,parts.dress);},\n researchPreview86(){");
await writeFile(cp,c);
const sp=donor+'/research/dress-mobile-01/dress-mobile-showroom.mjs';
let s=await readFile(sp,'utf8');
s=one(s,' researchPreview86:()=>outfit.researchPreview86(),',
 ' researchPosePreview87:()=>outfit.researchPosePreview87(),\n researchPreview86:()=>outfit.researchPreview86(),');
await writeFile(sp,s);
console.log('P87 source-pinned skinned moving dress research installed in detached donor; no consumer writes');
