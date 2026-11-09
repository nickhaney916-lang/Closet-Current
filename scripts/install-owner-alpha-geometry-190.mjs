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
const p195=join(donor,'research/owner-bilateral-asymmetric-fit-195/side-profile.mjs');
await mkdir(dirname(p195),{recursive:true});
await copyFile('research/owner-bilateral-asymmetric-fit-195/side-profile.mjs',p195);
const proof196=join(donor,'research/owner-mesh-bilateral-readback-196/real-mesh-evidence.mjs');
await mkdir(dirname(proof196),{recursive:true});
await copyFile('research/owner-mesh-bilateral-readback-196/real-mesh-evidence.mjs',proof196);
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
        ownerBilateralActualPhotoShape195:actualOutfit171[k].ownerBilateralActualPhotoShape195===true,
        ownerBilateralMaskSHA195:actualOutfit171[k].ownerBilateralMaskSHA195||null,
        ownerBilateralLeftVertices195:actualOutfit171[k].ownerBilateralLeftVertices195||0,
        ownerBilateralRightVertices195:actualOutfit171[k].ownerBilateralRightVertices195||0,
        ownerBilateralPhysicalAsymmetryMeters195:actualOutfit171[k].ownerBilateralPhysicalAsymmetryMeters195||0,
        ownerBilateralSourceSpecificOnly195:true,
        ownerBilateralRearInferred195:true,
        ownerBilateralHumanApprovalCertified195:false,
        ownerPhysicalBilateralReadbackVerified196:actualOutfit171[k].ownerPhysicalBilateralReadbackVerified196===true,
        ownerTorsoReadbackMovedVertices196:actualOutfit171[k].ownerTorsoReadbackMovedVertices196||0,
        ownerLeftReadbackMovedVertices196:actualOutfit171[k].ownerLeftReadbackMovedVertices196||0,
        ownerRightReadbackMovedVertices196:actualOutfit171[k].ownerRightReadbackMovedVertices196||0,
        ownerLeftCapReadbackMovedVertices196:actualOutfit171[k].ownerLeftCapReadbackMovedVertices196||0,
        ownerRightCapReadbackMovedVertices196:actualOutfit171[k].ownerRightCapReadbackMovedVertices196||0,
        ownerMeasuredBilateralRatioDifference196:actualOutfit171[k].ownerMeasuredBilateralRatioDifference196||0,
        ownerLeftMeanRelativeContraction196:actualOutfit171[k].ownerLeftMeanRelativeContraction196||0,
        ownerRightMeanRelativeContraction196:actualOutfit171[k].ownerRightMeanRelativeContraction196||0,
        ownerReadbackSourceSHA196:actualOutfit171[k].ownerPhysicalBilateralReadbackVerified196===true?actualOutfit171[k].sourceSHA256:null,
        ownerReadbackMaskSHA196:actualOutfit171[k].ownerPhysicalBilateralReadbackVerified196===true?actualOutfit171[k].ownerMaskSHA256:null,
        ownerReadbackHumanSegmentationVerified196:false,
        ownerMaskOnlyUpperBlouse190:actualOutfit171[k].ownerMaskOnlyUpperBlouse190===true,
        inferredOwnerMaskRear190:actualOutfit171[k].inferredOwnerMaskRear190===true,
        ownerMaskHumanReviewCertified190:false,
        generalizedUserPhotoTo3D190:false,`);
for(const path of ['research/dress-mobile-01/dress-outfit-controller.mjs',
 'research/outfit-3d-01/research-panel.mjs',
 'research/owner-mask-geometry-190/owner-alpha-contour.mjs',
 'research/owner-bilateral-asymmetric-fit-195/side-profile.mjs',
 'research/owner-mesh-bilateral-readback-196/real-mesh-evidence.mjs'])
 execFileSync(process.execPath,['--check',join(donor,path)],{stdio:'inherit'});
console.log(JSON.stringify({priority:190,isolatedDonorOnly:true,
 true163BoneOwnerContourPhysicalMesh:true,pinnedBlouseOnly:true,
 bilateralCapSeamsPreserved:true,licensedBackInferred:true,
 noOriginalPhotoMutation:true,releaseAuthorized:false,familyAlpha:'HOLD'}));
