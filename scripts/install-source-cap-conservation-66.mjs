/** Modify only the explicitly detached research donor used by P66 browser QA. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const arg=process.argv[2],root=resolve('.'),donor=resolve(arg||'.');
if(!arg||donor===root||donor==='/'||root.startsWith(donor+'/')||donor.startsWith(root+'/public/')||donor.startsWith(root+'/supabase/'))
 throw Error('P66 requires an explicitly detached disposable research donor');
const file=join(donor,'research/three-d-45/independent-shoulder-cap.mjs');
let s=await readFile(file,'utf8');
const swap=(a,b)=>{assert.equal(s.split(a).length,2,'P66 pinned cap source drift');s=s.replace(a,b);};
swap("const clamp=T.MathUtils.clamp,sm=T.MathUtils.smoothstep;",
 "import {partitionSourceCapFaces66} from '../real-garment-acceptance-66/cap-partition.mjs';\nconst clamp=T.MathUtils.clamp,sm=T.MathUtils.smoothstep;");
swap(' let originalFaces=0,retainedFaces=0,addedFaces=0,caps=0;',
 ' let originalFaces=0,retainedFaces=0,addedFaces=0,caps=0;let retainedSmallFaces66=0;');
swap('  if(excluded.size)plans.push({shell,g,idx,pos,worldAt,chosen,excluded});',
 `  // Selection is not removal: a panel below the retessellation threshold
  // stays in its original shell with original source attributes.
  const conserved66=partitionSourceCapFaces66(chosen);
  retainedSmallFaces66+=conserved66.originalFacesRetained;
  excluded.clear();for(const at of conserved66.excluded)excluded.add(at);
  if(excluded.size)plans.push({shell,g,idx,pos,worldAt,chosen,excluded});`);
swap('  independentArmholeCapPanels:true,realSeparateSkinnedCapMeshes:caps,',
 '  sourceCapPartitionConserved66:true,sourceSmallCapFacesRetained66:retainedSmallFaces66,\n  independentArmholeCapPanels:true,realSeparateSkinnedCapMeshes:caps,');
await writeFile(file,s);
const panelFile=join(donor,'research/outfit-3d-01/research-panel.mjs');
let panel=await readFile(panelFile,'utf8');
const anchor="    viewerMode:view.outfit?.mode||'none',meshCount:view.outfit?.garmentMeshes||0,";
assert.equal(panel.split(anchor).length,2,'P66 panel source drift');
panel=panel.replace(anchor,anchor+'\n    sourceCapPartitionConserved66:view.outfit?.shirt?.sourceCapPartitionConserved66===true,sourceSmallCapFacesRetained66:view.outfit?.shirt?.sourceSmallCapFacesRetained66||0,');
await writeFile(panelFile,panel);

for(const name of ['cap-partition.mjs']){
 const target=join(donor,'research/real-garment-acceptance-66',name);
 await mkdir(dirname(target),{recursive:true});
 await copyFile('research/real-garment-acceptance-66/'+name,target);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('P66 source cap face partition conserved; detached research only, HOLD');
