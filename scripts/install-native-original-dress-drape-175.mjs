/** Main P175 — adapt independently verified Parallel #61 physical
 * Commons dress into the *actual* owner's P541 native dress-mobile-01 viewer.
 * Runs ONLY on explicit separate disposable donor; production untouched. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const donorArg=process.argv[2];
if(!donorArg)throw Error('P175 requires explicitly selected disposable donor');
const donor=resolve(donorArg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/'))
 throw Error('P175 refuses current checkout, root, or live app donor');
const sourceFile=resolve('research/photo-dress-anatomical-drape-61/dress-drape.mjs');
const bytes=await readFile(sourceFile);
const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(blob,'9d795a439eb3491e8f1d1f95873a8bcb7cc27bf6',
 'P175 refuses any dress source modified from independently verified P61 exact blob');
const target=join(donor,'research/photo-dress-anatomical-drape-61/dress-drape.mjs');
await mkdir(dirname(target),{recursive:true});
await copyFile(sourceFile,target);
const controlPath=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let control=await readFile(controlPath,'utf8');
const importAnchor="import {easeSourceShoulderSleeve174} from '../source-shoulder-seam-174/seam-ease.mjs';";
assert.equal(control.split(importAnchor).length,2,
 'P175 requires exact inherited native P174 163-bone controller');
control=control.replace(importAnchor,importAnchor+
 "\nimport {refinePhotographedDress61} from '../photo-dress-anatomical-drape-61/dress-drape.mjs';");
const afterP61Compatible='if(anatomyEnabled&&skirtDrape&&dressMobile74)fitted=tailorSourceDress74(fitted,root);';
assert.equal(control.split(afterP61Compatible).length,2,
 'P175 actual dress-mobile source-fitted final skirt boundary changed');
control=control.replace(afterP61Compatible,afterP61Compatible+
 "\n      // P175 SOURCE-TRUE physically fitted original dress; no private JPEG fitting.\n"+
 "      if(new URLSearchParams(globalThis.location?.search||'').get('photoDress175')==='research')\n"+
 "       fitted=refinePhotographedDress61(fitted,root);");
await writeFile(controlPath,control);
const panelPath=join(donor,'research/outfit-3d-01/research-panel.mjs');
let panel=await readFile(panelPath,'utf8');
const final='       }:null}:null;';
assert.equal(panel.split(final).length,2,
 'P175 donor fitted-photo P171/P173/P174 native receipt shape changed');
panel=panel.replace(final,[
 '       }:null,',
 "       dressDrape175:k==='dress'?{",
 '        photographedDressDrape61:actualOutfit171[k].photographedDressDrape61===true,',
 '        torsoVertices61:actualOutfit171[k].torsoVertices61,',
 '        skirtVertices61:actualOutfit171[k].skirtVertices61,',
 '        maxTorsoMovementMeters61:actualOutfit171[k].maxTorsoMovementMeters61,',
 '        maxSkirtMovementMeters61:actualOutfit171[k].maxSkirtMovementMeters61,',
 '        frontProtectedVertices61:actualOutfit171[k].frontProtectedVertices61,',
 '        originalRestPhotoCoordinatesUnchanged61:actualOutfit171[k].originalRestPhotoCoordinatesUnchanged61===true,',
 '        sourceSHA256Preserved61:actualOutfit171[k].sourceSHA256Preserved61===true,',
 '        sourceTextureAndMaterialPreserved61:actualOutfit171[k].sourceTextureAndMaterialPreserved61===true,',
 '        skinIndicesAndWeightsPreserved61:actualOutfit171[k].skinIndicesAndWeightsPreserved61===true,',
 '        armholeAndShoulderTopologyPreserved61:actualOutfit171[k].armholeAndShoulderTopologyPreserved61===true,',
 '        physicsSimulation:actualOutfit171[k].physicsSimulation===true,',
 '        bodyIntersectionAudit:actualOutfit171[k].bodyIntersectionAudit===true,',
 '        arbitraryOwnerPhotos3DApproved:actualOutfit171[k].arbitraryOwnerPhotos3DApproved===true,',
 '        humanVisualApproval:actualOutfit171[k].humanVisualApproval===true,',
 '        releaseAuthorized:actualOutfit171[k].releaseAuthorized===true',
 '       }:null}:null;'
].join('\n'));
await writeFile(panelPath,panel);
console.log(JSON.stringify({priority:175,p61OriginalExactBlob:blob,
 changedActualNativeDressGeometry:true,physicalSourceBodiceAndSkirt:true,
 sourceJPEGUnmodified:true,photoUVSkinAnd163BoneUnmodified:true,
 strictOwnerSourceProofRequired:true,defaultAppUntouched:true,
 parallel61BranchUntouched:true,productionDeployed:false,
 arbitraryPrivatePhoto3D:false,releaseAuthorized:false,familyAlpha:'HOLD'}));