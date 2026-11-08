/** P174 source-correct *physical* shoulder seams ONLY inside the detached
 * P541+P60+P171+P173 donor. All input source branches untouched. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
const donorArg=process.argv[2];
if(!donorArg)throw Error('P174 separate detached native donor worktree required');
const donor=resolve(donorArg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/'))
 throw Error('P174 refuses modifying current source checkout or root');
const from=resolve('research/source-shoulder-seam-174/seam-ease.mjs');
const target=join(donor,'research/source-shoulder-seam-174/seam-ease.mjs');
await mkdir(dirname(target),{recursive:true});await copyFile(from,target);
const controllerFile=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let controller=await readFile(controllerFile,'utf8');
const importAnchor="import {contourSourceVerifiedShirt172} from '../photo-torso-contour-172/torso-contour.mjs';";
assert.equal(controller.split(importAnchor).length,2,'P174 needs verified P173 original-photo native torso integration');
controller=controller.replace(importAnchor,importAnchor+
 "\nimport {easeSourceShoulderSleeve174} from '../source-shoulder-seam-174/seam-ease.mjs';");
const anchor='   if(built.shirt)built.shirt=contourSourceVerifiedShirt172(built.shirt,root);';
assert.equal(controller.split(anchor).length,2,'P174 actual native P173 source garment position moved');
controller=controller.replace(anchor,anchor+
 "\n   // P174 opt-in: physical original 163-bone shoulder/cap mesh, NOT shading.\n"+
 "   if(built.shirt&&new URLSearchParams(globalThis.location?.search||'').get('photoSleeve174')==='research')\n"+
 "    built.shirt=easeSourceShoulderSleeve174(built.shirt,root);");
await writeFile(controllerFile,controller);
const panelFile=join(donor,'research/outfit-3d-01/research-panel.mjs');
let panel=await readFile(panelFile,'utf8');
const panelAnchor='       }:null}:null;';
assert.equal(panel.split(panelAnchor).length,2,
 'P174 original native P173 owner-source fitted mesh receipts changed');
const insert=[
 '       }:null,',
 "       armhole174:k==='shirt'?{",
 '        sourcePhotoShoulderSleeve174:actualOutfit171[k].sourcePhotoShoulderSleeve174===true,',
 '        shoulder174SourceSHA:actualOutfit171[k].shoulder174SourceSHA,',
 '        shoulder174MovedVertices:actualOutfit171[k].shoulder174MovedVertices,',
 '        shoulder174MaxMeters:actualOutfit171[k].shoulder174MaxMeters,',
 '        shoulder174ProtectedCenter:actualOutfit171[k].shoulder174ProtectedCenter,',
 '        shoulder174SharedSeams:actualOutfit171[k].shoulder174SharedSeams,',
 '        shoulder174GapBefore:actualOutfit171[k].shoulder174GapBefore,',
 '        shoulder174GapAfter:actualOutfit171[k].shoulder174GapAfter,',
 '        shoulder174Sides:actualOutfit171[k].shoulder174Sides,',
 '        shoulder174OriginalPixelsUVSkinAnd163BonesPreserved:actualOutfit171[k].shoulder174OriginalPixelsUVSkinAnd163BonesPreserved===true,',
 '        shoulder174RearPhotoVerified:actualOutfit171[k].shoulder174RearPhotoVerified===true,',
 '        shoulder174HumanApproved:actualOutfit171[k].shoulder174HumanApproved===true,',
 '        shoulder174AllPoseCollisionCertified:actualOutfit171[k].shoulder174AllPoseCollisionCertified===true,',
 '        releaseAuthorized:actualOutfit171[k].releaseAuthorized===true',
 '       }:null}:null;'
].join('\n');
panel=panel.replace(panelAnchor,insert);
await writeFile(panelFile,panel);
console.log(JSON.stringify({priority:174,realOriginalShirtSkinnedCapSeam:true,
 physicallyModifiedOriginalGenuineGarment:true,sourceOriginalJPEGMutated:false,
 originalSkinnedBodyMutated:false,writeToPinnedDetachedDonorOnly:true,
 productionDeployed:false,parallel61DressTouched:false,
 humanPhotorealismApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
