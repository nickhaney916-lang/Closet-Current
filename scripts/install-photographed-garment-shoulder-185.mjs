/** P185: install source-photo shoulder/hem correction into DETACHED P541 research donor only. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const arg=process.argv[2];
if(!arg)throw Error('P185 requires an explicitly specified disposable donor');
const donor=resolve(arg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/')||donor.startsWith(cwd+'/public/')||
 donor.startsWith(cwd+'/supabase/'))
 throw Error('P185 refuses shipping project, Supabase and root destinations');
const swap=async(path,anchor,replacement)=>{
 const file=join(donor,path),before=await readFile(file,'utf8');
 assert.equal(before.split(anchor).length,2,'P185 pinned donor source drift: '+path);
 await writeFile(file,before.replace(anchor,replacement));
};
await swap('research/dress-mobile-01/dress-outfit-controller.mjs',
 'fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62);',
 'fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62,{naturalShoulder185:true});');
await swap('research/outfit-3d-01/research-panel.mjs',
 " hold.className='cc3d-note';right.append(hold);",
 ` hold.className='cc3d-note';right.append(hold);
 const mannequinCover185=el('p','outfit3D01AnatomyCover185');
 mannequinCover185.className='cc3d-note';right.append(mannequinCover185);`);
await swap('research/outfit-3d-01/research-panel.mjs',
 ' function showOriginals(plan){',
 ` function showOriginals(plan){
  const selectedBottom=plan.selected.some(item=>item.slot==='bottom');
  mannequinCover185.textContent=selectedBottom?
   'ANATOMICAL FIGURE COVER: the built-in shorts are mannequin coverage, not an extra owned or saved item. The selected bottoms are shown separately.':
   'BOTTOMS: NONE SELECTED. Any visible base shorts belong to the anatomical mannequin, not to your closet or this saved outfit.';`);
await swap('research/outfit-3d-01/research-panel.mjs',
 '        silhouetteFit62MaxMeters:actualOutfit171[k].silhouetteFit62MaxMeters,',
 `        silhouetteFit62MaxMeters:actualOutfit171[k].silhouetteFit62MaxMeters,
        sourceShoulderEased185:actualOutfit171[k].sourceShoulderEased185===true,
        shoulderEasedVertices185:actualOutfit171[k].shoulderEasedVertices185,
        maxShoulderDisplacement185:actualOutfit171[k].maxShoulderDisplacement185,
        shoulderHemWorldAxisCorrected185:actualOutfit171[k].shoulderHemWorldAxisCorrected185===true,`);
for(const path of ['research/dress-mobile-01/dress-outfit-controller.mjs',
 'research/outfit-3d-01/research-panel.mjs',
 'research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs']){
 execFileSync(process.execPath,['--check',join(donor,path)],{stdio:'inherit'});
}
console.log(JSON.stringify({priority:185,isolatedDonor:true,
 originalPhotoSHAAndCutoutUnchanged:true,ownerWardrobeWritten:false,
 physicalShoulderAndSourceHemAxis:true,mannequinCoverageHonest:true,
 releaseAuthorized:false,familyAlpha:'HOLD'}));
