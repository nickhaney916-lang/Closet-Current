import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const donor=resolve(process.argv[2]||'');
if(!process.argv[2]||donor===resolve('.')||donor===resolve('/'))throw Error('P171 requires detached P541+P60 donor path');
const target=resolve(donor,'research/outfit-3d-01/research-panel.mjs');
const original=await readFile(target,'utf8');
const anchor='return {ready:true,privateVisible:dialog.open,viewerReady:ready,';
assert.equal(original.split(anchor).length,2,'P171 pinned donor panel state shape changed');
const patch=[
 'const actualOutfit171=scene?.getState()?.outfit||null;',
 '    // P60 fitted-photo receipts come only from actual attached skinned meshes.',
 '    const one171=k=>actualOutfit171?.[k]?.photoAnatomicalFitReceipt60?',
 '      {receipt:actualOutfit171[k].photoAnatomicalFitReceipt60,',
 '       photoFabricPBR164:actualOutfit171[k].photoFabricPBR164===true,',
 '       sourceSHA256:actualOutfit171[k].sourceSHA256}:null;',
 '    return {ready:true,privateVisible:dialog.open,viewerReady:ready,',
 "     fitReceipts171:{shirt:one171('shirt'),dress:one171('dress'),pants:one171('pants')},"
].join('\n');
await writeFile(target,original.replace(anchor,patch));
// The actual native saved-closet 3D UI uses *dress-mobile-01*, not
// three-d-15 (which P60's standalone installer patches). Integrate P60
// only into the pinned detached copy's real native outfit-controller.
const nativePath=resolve(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let nativeSource=await readFile(nativePath,'utf8');
const importAnchor="import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';";
const additionalImports=[
 "import {applyPhotoFabricPBR164} from '../photo-cloth-realism-164/pbr-fabric.mjs';",
 "import {inspectPhotographedFit60,attachPhotographedFitReceipt60} from '../photo-garment-anatomical-fitting-60/fit-contract.mjs';"
].join('\n');
assert.equal(nativeSource.split(importAnchor).length,2,
 'P171 exact P541 dress-mobile native controller import moved');
nativeSource=nativeSource.replace(importAnchor,importAnchor+'\n'+additionalImports);
const meshAnchor='   const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)skeletons.add(o.skeleton);});';
assert.equal(nativeSource.split(meshAnchor).length,2,
 'P171 actual native dress-mobile fitted garment mesh admission boundary changed');
const actualNativeFit171=[
 "   // P171 transplant the VERIFIED P60/P164 fitting contract into the actual",
 "   // native donor controller (not just the unused three-d-15 showroom).",
 "   // Source photos, geometry, UV, skeleton and material originals preserved.",
 "   for(const slot of Object.keys(built)){",
 "    const fit=inspectPhotographedFit60(built[slot],root);",
 "    const pbr=applyPhotoFabricPBR164(built[slot]);",
 "    if(pbr.applied){",
 "     if(!fit.accepted)throw Error('P171 native public source PBR lacks real 163-bone fit: '+fit.reason);",
 "     built[slot]=attachPhotographedFitReceipt60(pbr.garment,root);",
 "    }else if(fit.accepted){",
 "     throw Error('P171 native source fit PBR projection was rejected; keep original-photo 2D');",
 "    }",
 "   }"
].join('\n');
nativeSource=nativeSource.replace(meshAnchor,actualNativeFit171+'\n'+meshAnchor);
await writeFile(nativePath,nativeSource);
console.log(JSON.stringify({priority:171,detachedDonor:donor,geometryMutated:false,
 originalJPEGMutated:false,sourceFromRealP60SkinnedMeshes:true,
 releaseAuthorized:false,familyAlpha:'HOLD'}));