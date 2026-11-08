#!/usr/bin/env node
/** P176 disposable donor correction: canonical pants shell can copy an unused
 * out-of-range skin index whose weight is exactly zero from a body vertex.
 * Such a slot has no deformation effect; rewrite only that slot to bone 0.
 * Any active invalid influence aborts. This never edits the pinned donor tree
 * in Git, source skeleton, positions, effective weights, image, or texture.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const donor=resolve(process.argv[2]||'.native05-donor-541');
const shellPath=resolve(donor,'research/three-d-13/pants-shell.mjs');
const controllerPath=resolve(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
const shell=await readFile(shellPath,'utf8');
const anchor="geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();smoothSurfaceNormals(geometry,surfaceVertices);";
if(shell.split(anchor).length!==2)throw Error('P176 exact P541 pants-shell anchor is missing or ambiguous');
const repair=`const safeIndices=Uint16Array.from(indices),safeWeights=Float32Array.from(weights);let zeroWeightInvalidIndexSlots=0;
 for(let slot=0;slot<safeIndices.length;slot++)if(safeIndices[slot]>=original.skeleton.bones.length){
  if(safeWeights[slot]!==0)throw Error('P176 refuses active out-of-range pants skin influence at slot '+slot+' weight='+safeWeights[slot]);
  safeIndices[slot]=0;zeroWeightInvalidIndexSlots++;
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(safeIndices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(safeWeights,4));geometry.computeVertexNormals();smoothSurfaceNormals(geometry,surfaceVertices);`;
await writeFile(shellPath,shell.replace(anchor,repair));
const controller=await readFile(controllerPath,'utf8');
const summaryAnchor='pants:parts.pants?.stats||null,dress:';
if(controller.split(summaryAnchor).length!==2)throw Error('P176 exact P541 summary anchor is missing or ambiguous');
const summaryReplacement='pants:parts.pants?.stats||null,pantsSkinRepair176:parts.pants?.meshes?.map(m=>m.userData.p176SkinIndexRepair||null)||[],dress:';
await writeFile(controllerPath,controller.replace(summaryAnchor,summaryReplacement));
let patched=await readFile(shellPath,'utf8');
const marker='mesh.userData.work60Pants=true;mesh.userData.work56Garment=true;';
if(patched.split(marker).length!==2)throw Error('P176 exact generated-pants marker is missing or ambiguous');
patched=patched.replace(marker,'mesh.userData.p176SkinIndexRepair={zeroWeightInvalidIndexSlots,activeInvalidIndexSlots:0,weightsChanged:false,positionsChanged:false};mesh.userData.work60Pants=true;mesh.userData.work56Garment=true;');
await writeFile(shellPath,patched);
console.log('P176_ZERO_WEIGHT_SKIN_INDEX_GUARD_INSTALLED_DISPOSABLY');
