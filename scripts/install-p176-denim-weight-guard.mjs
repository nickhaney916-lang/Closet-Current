#!/usr/bin/env node
/** P176 disposable donor correction: canonical pants shell can copy an unused
 * out-of-range skin index whose weight is exactly zero from a body vertex.
 * Repair such no-effect slots only; any active invalid influence aborts.
 * The final P60 boundary repeats the same zero-weight-only repair because
 * later source-denim modifiers may reconstruct the index attribute.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const donor=resolve(process.argv[2]||'.native05-donor-541');
const shellPath=resolve(donor,'research/three-d-13/pants-shell.mjs');
const dressPath=resolve(donor,'research/photo-dress-anatomical-drape-61/dress-drape.mjs');
let dress=await readFile(dressPath,'utf8');
for(const [from,to] of [
 ['const pleat = .16 + .84*Math.pow(.5 + .5*Math.cos(phase), 1.55);','const pleat = .07 + .93*Math.pow(.5 + .5*Math.cos(phase), 1.8);'],
 ['p.needsUpdate=true; g.computeBoundingBox(); g.computeBoundingSphere();','p.needsUpdate=true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();']
]){
 if(dress.split(from).length!==2)throw Error('P176 exact P61 dress drape anchor is missing or ambiguous: '+from);
 dress=dress.replace(from,to);
}
await writeFile(dressPath,dress);
const controllerPath=resolve(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
const shell=await readFile(shellPath,'utf8');
const shoulderImport="import {easeSourceShoulderSleeve174} from '../source-shoulder-seam-174/seam-ease.mjs';";
const shoulderImportAnchor="import {prepareBodyPresentation,attachReviewedShirt,releaseBodyPresentation} from '../three-d-11/dress-in-source-pose.mjs';";
if(controller.split(shoulderImportAnchor).length!==2)throw Error('P176 final P174 shoulder import anchor missing or ambiguous');
controller=controller.replace(shoulderImportAnchor,shoulderImportAnchor+'\\n'+shoulderImport);
const shellAnchor="geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();smoothSurfaceNormals(geometry,surfaceVertices);";
if(shell.split(shellAnchor).length!==2)throw Error('P176 exact P541 pants-shell anchor is missing or ambiguous');
const shellPatch=[
 "const safeIndices=Uint16Array.from(indices),safeWeights=Float32Array.from(weights);let zeroWeightInvalidIndexSlots=0;",
 " for(let slot=0;slot<safeIndices.length;slot++)if(safeIndices[slot]>=original.skeleton.bones.length){",
 "  if(safeWeights[slot]!==0)throw Error('P176 refuses active out-of-range pants skin influence at slot '+slot+' weight='+safeWeights[slot]);",
 "  safeIndices[slot]=0;zeroWeightInvalidIndexSlots++;",
 " }",
 " geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(safeIndices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(safeWeights,4));geometry.computeVertexNormals();smoothSurfaceNormals(geometry,surfaceVertices);"
].join('\n');
let patchedShell=shell.replace(shellAnchor,shellPatch);
const marker='mesh.userData.work60Pants=true;mesh.userData.work56Garment=true;';
if(patchedShell.split(marker).length!==2)throw Error('P176 exact generated-pants marker is missing or ambiguous');
patchedShell=patchedShell.replace(marker,'mesh.userData.p176SkinIndexRepair={zeroWeightInvalidIndexSlots,activeInvalidIndexSlots:0,weightsChanged:false,positionsChanged:false};mesh.userData.work60Pants=true;mesh.userData.work56Garment=true;');
await writeFile(shellPath,patchedShell);
let controller=await readFile(controllerPath,'utf8');
const fitAnchor="    const fit=inspectPhotographedFit60(built[slot],root);";
if(controller.split(fitAnchor).length!==2)throw Error('P176 exact P171 fitted-mesh audit anchor is missing or ambiguous');
const finalAudit=[
 "    const p176SkinAudits=[];",
 "    for(const garmentMesh of built[slot]?.meshes||[]){",
 "     const attribute=garmentMesh.geometry?.getAttribute?.('skinIndex');",
 "     const influence=garmentMesh.geometry?.getAttribute?.('skinWeight');",
 "     const boneCount=garmentMesh.skeleton?.bones?.length||0;",
 "     let repairedZeroWeightSlots=0,activeInvalidSlots=0,nonFiniteWeightComponents=0,outOfRangeWeightComponents=0,nonTolerableInvalidWeightComponents=0,repairedWeightSlots=0,maxWeightCorrection=0,maxWeightSumError=0;",
 "     if(attribute&&influence&&attribute.count===influence.count&&attribute.itemSize>=4&&influence.itemSize>=4){",
 "      for(let vertex=0;vertex<attribute.count;vertex++){",
 "       let roundoffVertex=false;",
 "       for(let component=0;component<4;component++){",
 "        const id=attribute.getComponent(vertex,component),weight=influence.getComponent(vertex,component);",
 "        if(!Number.isFinite(weight))nonFiniteWeightComponents++;",
 "        else if(weight<0||weight>1){",
 "         outOfRangeWeightComponents++;",
 "         if(weight>=-1e-6&&weight<=1+1e-6){const clamped=Math.max(0,Math.min(1,weight));influence.setComponent(vertex,component,clamped);repairedWeightSlots++;maxWeightCorrection=Math.max(maxWeightCorrection,Math.abs(weight-clamped));roundoffVertex=true;}",
 "         else nonTolerableInvalidWeightComponents++;",
 "        }",
 "        if(!Number.isInteger(id)||id<0||id>=boneCount){if(weight===0){attribute.setComponent(vertex,component,0);repairedZeroWeightSlots++;}else activeInvalidSlots++;}",
 "       }",
 "       if(roundoffVertex){let sum=0;for(let component=0;component<4;component++)sum+=influence.getComponent(vertex,component);if(!Number.isFinite(sum)||sum<=1e-8||Math.abs(sum-1)>.025)nonTolerableInvalidWeightComponents++;else for(let component=0;component<4;component++){const prior=influence.getComponent(vertex,component),next=prior/sum;influence.setComponent(vertex,component,next);maxWeightCorrection=Math.max(maxWeightCorrection,Math.abs(prior-next));}}",
 "      }",
 "      if(repairedZeroWeightSlots)attribute.needsUpdate=true;",
 "      if(repairedWeightSlots)influence.needsUpdate=true;",
 "      for(let vertex=0;vertex<influence.count;vertex++){let sum=0;for(let component=0;component<4;component++)sum+=influence.getComponent(vertex,component);if(Number.isFinite(sum))maxWeightSumError=Math.max(maxWeightSumError,Math.abs(1-sum));}",
 "     }else activeInvalidSlots++;",
 "     if(maxWeightCorrection>1e-6)throw Error('P176 refuses skin-weight correction above 1e-6');",
 "     p176SkinAudits.push({mesh:garmentMesh.name,bones:boneCount,repairedZeroWeightSlots,activeInvalidSlots,nonFiniteWeightComponents,outOfRangeWeightComponents,nonTolerableInvalidWeightComponents,repairedWeightSlots,maxWeightCorrection,maxWeightSumError,weightsChanged:repairedWeightSlots>0,positionsChanged:false});",
 "    }",
 "    globalThis.__P176SkinAuditHistory176=[...(globalThis.__P176SkinAuditHistory176||[]),{slot,audits:p176SkinAudits}];",
 "    globalThis.__P176SkinAudits176=globalThis.__P176SkinAuditHistory176;",
 "    if(p176SkinAudits.some(x=>x.repairedZeroWeightSlots||x.activeInvalidSlots||x.repairedWeightSlots||x.nonTolerableInvalidWeightComponents)){",
 "     built[slot].stats={...built[slot].stats,p176FinalSkinAudit:p176SkinAudits};",
 "     console.log('P176_FINAL_SKIN_ATTRIBUTE_AUDIT',JSON.stringify({slot,audits:p176SkinAudits}));",
 "    }",
 "    if(built.shirt&&new URLSearchParams(globalThis.location?.search||'').get('photoSleeve174')==='research'&&!built.shirt.stats?.sourcePhotoShoulderSleeve174)built.shirt=easeSourceShoulderSleeve174(built.shirt,root);",
 "    const fit=inspectPhotographedFit60(built[slot],root);"
].join('\n');
controller=controller.replace(fitAnchor,finalAudit);
const summaryAnchor='pants:parts.pants?.stats||null,dress:';
if(controller.split(summaryAnchor).length!==2)throw Error('P176 exact P541 summary anchor is missing or ambiguous');
controller=controller.replace(summaryAnchor,'pants:parts.pants?.stats||null,pantsSkinRepair176:parts.pants?.meshes?.map(m=>m.userData.p176SkinIndexRepair||null)||[],dress:');
await writeFile(controllerPath,controller);
console.log('P176_ZERO_WEIGHT_SKIN_INDEX_GUARD_INSTALLED_DISPOSABLY');
