/**
 * MAIN P173: use exact P172 physical shirt geometry in the ACTUAL native
 * dress-mobile saved-outfit renderer, not the standalone 3D-15 showroom.
 * The pinned P541 donor must already contain P60/P164 and P171 installers.
 * All writes happen in a disposable donor worktree. Never touch the
 * source P172/P171 branch, main, staging or production.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve,join} from 'node:path';
const donorArg=process.argv[2],sourceArg=process.argv[3];
if(!donorArg||!sourceArg)throw Error('P173 requires separate detached P541+P171 donor and pinned P172 worktree');
const donor=resolve(donorArg),source=resolve(sourceArg),cwd=resolve('.');
if(donor===cwd||source===cwd||donor===source||donor==='/'||
  cwd.startsWith(donor+'/')||cwd.startsWith(source+'/'))
 throw Error('P173 refuses source/workspace as donor');
const p172path=join(source,'research/photo-torso-contour-172/torso-contour.mjs');
const bytes=await readFile(p172path);
const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(blob,'cb83ce59cd88ca207b1d6d82b7682635589f8c4f',
 'P173 refuses changed/unverified exact P172 source photo geometry implementation');
const targetModule=join(donor,'research/photo-torso-contour-172/torso-contour.mjs');
await mkdir(dirname(targetModule),{recursive:true});
await copyFile(p172path,targetModule);
const controllerPath=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let controller=await readFile(controllerPath,'utf8');
const fitImport="import {inspectPhotographedFit60,attachPhotographedFitReceipt60} from '../photo-garment-anatomical-fitting-60/fit-contract.mjs';";
const p172Import="import {contourSourceVerifiedShirt172} from '../photo-torso-contour-172/torso-contour.mjs';";
assert.equal(controller.split(fitImport).length,2,'P173 actual native P171 P60 source-fit import unavailable');
assert.ok(!controller.includes(p172Import),'P173 donor contour already installed');
controller=controller.replace(fitImport,fitImport+'\n'+p172Import);
const p171Anchor='   // P171 transplant the VERIFIED P60/P164 fitting contract into the actual';
assert.equal(controller.split(p171Anchor).length,2,'P173 actual P171 native source-fit boundary changed');
// Must mutate genuine skinned source shirt geometry before independent P60/P164
// fit/source/material verification. The dress and jeans remain unchanged.
controller=controller.replace(p171Anchor,
 '   if(built.shirt)built.shirt=contourSourceVerifiedShirt172(built.shirt,root);\n'+p171Anchor);
await writeFile(controllerPath,controller);
const panelPath=join(donor,'research/outfit-3d-01/research-panel.mjs');
let panel=await readFile(panelPath,'utf8');
const panelAnchor='       sourceSHA256:actualOutfit171[k].sourceSHA256}:null;';
assert.equal(panel.split(panelAnchor).length,2,'P173 authentic donor P171 mesh-evidence state shape changed');
const panelNext=[
 '       sourceSHA256:actualOutfit171[k].sourceSHA256,',
 "       torsoContour173:k==='shirt'?{",
 '        sourcePhotoTorsoContour172:actualOutfit171[k].sourcePhotoTorsoContour172===true,',
 '        physicalTorsoContourMovedVertices172:actualOutfit171[k].physicalTorsoContourMovedVertices172,',
 '        physicalTorsoContourFrontVertices172:actualOutfit171[k].physicalTorsoContourFrontVertices172,',
 '        physicalTorsoContourProtectedBackVertices172:actualOutfit171[k].physicalTorsoContourProtectedBackVertices172,',
 '        physicalTorsoContourMaxMeters172:actualOutfit171[k].physicalTorsoContourMaxMeters172,',
 '        originalFrontPhotoSourceSHA172:actualOutfit171[k].originalFrontPhotoSourceSHA172,',
 '        sourcePhotoPixelsAndRigUnchanged172:actualOutfit171[k].sourcePhotoPixelsAndRigUnchanged172===true,',
 '        anatomical163BoneSkeletonPreserved172:actualOutfit171[k].anatomical163BoneSkeletonPreserved172===true,',
 '        originalPhotographedBackVerified:actualOutfit171[k].originalPhotographedBackVerified===true,',
 '        humanVisualApproved:actualOutfit171[k].humanVisualApproved===true,',
 '        releaseAuthorized:actualOutfit171[k].releaseAuthorized===true',
 '       }:null}:null;'
].join('\n');
panel=panel.replace(panelAnchor,panelNext);
await writeFile(panelPath,panel);
console.log(JSON.stringify({priority:173,sourceP172Blob:blob,
 actualNativeSavedShirtMeshMutated:true,originalPhotoUnchanged:true,
 onlyDetachedP541WorktreeWrites:true,unmerged:true,undeployed:true,
 arbitraryOwner3D:false,realism10of10:false,familyAlpha:'HOLD'}));
