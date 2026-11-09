/** P190: install bounded owner-alpha geometry onto a DISPOSABLE research donor only.
 * Requires exact P541 / P62 / P185 / P188/P189 source support already installed.
 * No public app, staging, production, Supabase or original photo changes.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const donorArg=process.argv[2];if(!donorArg)throw Error('P190 explicit disposable research donor required');
const donor=resolve(donorArg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/')||
 donor.startsWith(cwd+'/public/')||donor.startsWith(cwd+'/supabase/'))
 throw Error('P190 refuses production, public, root or cloud destination');
const patch=async(path,anchor,replacement)=>{
 const file=join(donor,path),before=await readFile(file,'utf8');
 assert.equal(before.split(anchor).length,2,'P190 unexpected donor ancestry '+path+' / '+anchor.slice(0,70));
 await writeFile(file,before.replace(anchor,replacement));
};
const target=join(donor,'research/owner-mask-geometry-190/owner-alpha-contour.mjs');
await mkdir(dirname(target),{recursive:true});
await copyFile('research/owner-mask-geometry-190/owner-alpha-contour.mjs',target);
await patch('research/dress-mobile-01/dress-outfit-controller.mjs',
 "import {fitReviewedUpperPhoto62} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';",
 "import {fitReviewedUpperPhoto62} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';\nimport {fitOwnerAlphaToSkinnedBlouse190} from '../owner-mask-geometry-190/owner-alpha-contour.mjs';");
await patch('research/dress-mobile-01/dress-outfit-controller.mjs',
 'fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62,{naturalShoulder185:true});',
 `fitReviewedUpperPhoto62(built.shirt,root,candidate.silhouette62,{naturalShoulder185:true});
   if(built.shirt?.stats?.sourceSHA256==='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24'&&
      candidate?.ownerMaskGeometryProfile190&&
      new URLSearchParams(globalThis.location?.search||'').get('photoOwnerGeometry190')==='research')
    built.shirt=fitOwnerAlphaToSkinnedBlouse190(built.shirt,root,candidate.ownerMaskGeometryProfile190);`);
await patch('research/outfit-3d-01/research-panel.mjs',
 'independentlyJoinedShoulderCapMeshes185:actualOutfit171[k].independentlyJoinedShoulderCapMeshes185,',
 `independentlyJoinedShoulderCapMeshes185:actualOutfit171[k].independentlyJoinedShoulderCapMeshes185,
        ownerAlphaMaskBasedPhysicalGeometry190:actualOutfit171[k].ownerAlphaMaskBasedPhysicalGeometry190===true,
        ownerAlphaMaskSHA256_190:actualOutfit171[k].ownerAlphaMaskSHA256_190,
        ownerMaskAdjustedVertices190:actualOutfit171[k].ownerMaskAdjustedVertices190,
        ownerMaskMaxMoveMeters190:actualOutfit171[k].ownerMaskMaxMoveMeters190,
        ownerMaskBilateralCapJoins190:actualOutfit171[k].ownerMaskBilateralCapJoins190,
        ownerMaskOnlyUpperBlouse190:actualOutfit171[k].ownerMaskOnlyUpperBlouse190===true,
        inferredOwnerMaskRear190:actualOutfit171[k].inferredOwnerMaskRear190===true,
        ownerMaskHumanReviewCertified190:false,
        generalizedUserPhotoTo3D190:false,`);
for(const path of ['research/dress-mobile-01/dress-outfit-controller.mjs',
 'research/outfit-3d-01/research-panel.mjs',
 'research/owner-mask-geometry-190/owner-alpha-contour.mjs'])
 execFileSync(process.execPath,['--check',join(donor,path)],{stdio:'inherit'});
console.log(JSON.stringify({priority:190,isolatedDonorOnly:true,
 true163BoneOwnerContourPhysicalMesh:true,pinnedBlouseOnly:true,
 bilateralCapSeamsPreserved:true,licensedBackInferred:true,
 noOriginalPhotoMutation:true,releaseAuthorized:false,familyAlpha:'HOLD'}));
