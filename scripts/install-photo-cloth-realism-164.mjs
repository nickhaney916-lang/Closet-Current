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

const controllerPath = resolve(donor, 'research/three-d-15/outfit-controller.mjs');
let controller = await readFile(controllerPath, 'utf8');
const importAnchor = "import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';";
const pbrImport = "import {applyPhotoFabricPBR164} from '../photo-cloth-realism-164/pbr-fabric.mjs';";
if (!controller.includes(pbrImport)) {
  assert.equal(controller.split(importAnchor).length, 2, 'pinned P541 outfit-controller import anchor changed');
  controller = controller.replace(importAnchor, importAnchor + '\n' + pbrImport);
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
     const upgraded=applyPhotoFabricPBR164(built[slot]);
     if(upgraded.applied)built[slot]=upgraded.garment;
    }
   }
${buildAnchor}`);
await writeFile(controllerPath, controller);

console.log(JSON.stringify({ priority: 164, donor, module: destModule,
  integration: 'exact P541 research outfit controller, verified source garments only',
  defaultRendererUnchanged: true, productionAndStagingTouched: false,
  ownerWardrobeReadWrite: false, releaseAuthorized: false, familyAlpha: 'HOLD' }));
