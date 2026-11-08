/** Install P164 only into the disposable, exact pinned P541 research donor. */
import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const donor = resolve(process.argv[2] || '');
if (!process.argv[2] || donor === resolve('.') || donor === resolve('/'))
  throw Error('P164 requires an explicit detached research donor path');
const modulePath = resolve('research/photo-cloth-realism-164/pbr-fabric.mjs');
const destModule = resolve(donor, 'research/photo-cloth-realism-164/pbr-fabric.mjs');
await mkdir(dirname(destModule), { recursive: true });
await copyFile(modulePath, destModule);
const fitPath60 = resolve('research/photo-garment-anatomical-fitting-60/fit-contract.mjs');
const fitDest60 = resolve(donor, 'research/photo-garment-anatomical-fitting-60/fit-contract.mjs');
await mkdir(dirname(fitDest60), { recursive: true });
await copyFile(fitPath60, fitDest60);

const controllerPath = resolve(donor, 'research/three-d-15/outfit-controller.mjs');
let controller = await readFile(controllerPath, 'utf8');
const importAnchor = "import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';";
const pbrImport = "import {applyPhotoFabricPBR164} from '../photo-cloth-realism-164/pbr-fabric.mjs';";
const fitImport60 = "import {inspectPhotographedFit60,attachPhotographedFitReceipt60} from '../photo-garment-anatomical-fitting-60/fit-contract.mjs';";
if (!controller.includes(pbrImport)) {
  assert.equal(controller.split(importAnchor).length, 2, 'pinned P541 outfit-controller import anchor changed');
  controller = controller.replace(importAnchor, importAnchor + '\n' + pbrImport);
}
if (!controller.includes(fitImport60)) {
  assert.equal(controller.split(pbrImport).length, 2, 'pinned P541 P164 import anchor changed');
  controller = controller.replace(pbrImport, pbrImport + '\n' + fitImport60);
}
const signatureAnchor = 'photoDenimKneePose78=false}={}){';
const pbrSignature = 'photoDenimKneePose78=false,photoFabricRealism164=true}={}){';
if (!controller.includes(pbrSignature)) {
  assert.equal(controller.split(signatureAnchor).length, 2, 'pinned P541 outfit-controller signature changed');
  controller = controller.replace(signatureAnchor, pbrSignature);
}
const buildAnchor = '   const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)skeletons.add(o.skeleton);});';
assert.equal(controller.split(buildAnchor).length, 2, 'pinned P541 garment build boundary changed');
if (!controller.includes('applyPhotoFabricPBR164(built[slot])')) controller = controller.replace(buildAnchor, `   if(photoFabricRealism164){
    for(const slot of Object.keys(built)){
     const fitReceipt=inspectPhotographedFit60(built[slot],root);
     const upgraded=applyPhotoFabricPBR164(built[slot]);
     if(upgraded.applied){
      if(!fitReceipt.accepted)throw Error('P60 refuses source photo PBR without a verified anatomical skin-fit receipt: '+fitReceipt.reason);
      built[slot]=attachPhotographedFitReceipt60(upgraded.garment,root);
     }
    }
   }
${buildAnchor}`);
await writeFile(controllerPath, controller);

const showroomPath = resolve(donor, 'research/three-d-15/showroom.mjs');
let showroom = await readFile(showroomPath, 'utf8');
const showroomSignature = 'photoDenimContactAudit77=false,photoDenimKneePose78=false,premiumTurntable67=false}={}){';
const showroomPbrSignature = 'photoDenimContactAudit77=false,photoDenimKneePose78=false,photoFabricRealism164=true,premiumTurntable67=false}={}){';
if (!showroom.includes(showroomPbrSignature)) {
  assert.equal(showroom.split(showroomSignature).length, 2, 'pinned P541 showroom options anchor changed');
  showroom = showroom.replace(showroomSignature, showroomPbrSignature);
}
const showroomCall = 'photoDenimContactAudit77,photoDenimKneePose78});outfit.setPose(pose);';
if (!showroom.includes('photoDenimContactAudit77,photoDenimKneePose78,photoFabricRealism164')) {
  assert.equal(showroom.split(showroomCall).length, 2, 'pinned P541 showroom controller call changed');
  showroom = showroom.replace(showroomCall, 'photoDenimContactAudit77,photoDenimKneePose78,photoFabricRealism164});outfit.setPose(pose);');
}
await writeFile(showroomPath, showroom);

const browserTestPath = resolve(donor, 'scripts/test-three-d-15-browser.mjs');
let browserTest = await readFile(browserTestPath, 'utf8');
const serverAllowlist60 = String.raw`if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||`;
const serverAllowlist60Updated = String.raw`if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||`;
if (!browserTest.includes(serverAllowlist60Updated)) {
  assert.equal(browserTest.split(serverAllowlist60).length, 2, 'pinned P541 browser local-asset allowlist anchor changed');
  browserTest = browserTest.replace(serverAllowlist60, serverAllowlist60Updated);
}
const requestAllowlist60 = String.raw`!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(new URL(u).pathname)`;
const requestAllowlist60Updated = String.raw`!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(new URL(u).pathname)`;
if (!browserTest.includes(requestAllowlist60Updated)) {
  assert.equal(browserTest.split(requestAllowlist60).length, 2, 'pinned P541 browser request-audit allowlist anchor changed');
  browserTest = browserTest.replace(requestAllowlist60, requestAllowlist60Updated);
}
const verifiedSourceAnchor = "assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].sourceSHA256,stock.find(r=>r.id===source).sourceSHA256);";
if (!browserTest.includes("photoFabricPBR164,true")) {
  assert.equal(browserTest.split(verifiedSourceAnchor).length, 2, 'pinned P541 actual garment browser test anchor changed');
  browserTest = browserTest.replace(verifiedSourceAnchor, verifiedSourceAnchor +
    "assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].photoFabricPBR164,true,'P164 source-verified PBR material must be on the actual skinned photo garment');" +
    "assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].photoFabricProfile164,mode==='dress'?'dress-woven':'cotton-jersey');" +
    "assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].photoAnatomicalFit60,true,'P60 source garment must carry an independently checked 163-bone fit receipt');" +
    "assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].photoAnatomicalFitReceipt60?.common163BoneSkeletonChecked,true);");
}
await writeFile(browserTestPath, browserTest);

console.log(JSON.stringify({ priority: 164, donor, module: destModule,
  integration: 'exact P541 detached research showroom and source-verified browser assertions',
  defaultRendererUnchanged: true, productionAndStagingTouched: false,
  ownerWardrobeReadWrite: false, releaseAuthorized: false, familyAlpha: 'HOLD' }));
