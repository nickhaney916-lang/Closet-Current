import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';

// Apply the pinned, research-only P118 + P131 appearance to a detached PR541
// donor used by the existing owner-authenticated native 3D preview. No app,
// production, staging, identity, garment, or cloud source is rewritten.
const target=resolve(process.argv[2]||'.p150-donor-541');
const source=resolve('research/dual-humanoid-face-definition-131/face-definition.mjs');
const dest=resolve(target,'research/dual-humanoid-face-definition-131/face-definition.mjs');
await mkdir(dirname(dest),{recursive:true});await copyFile(source,dest);
await mkdir(resolve(target,'research/dual-humanoid-photorealistic-integration-150'),{recursive:true});
await copyFile(resolve('research/dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs'),resolve(target,'research/dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs'));
const showroom=resolve(target,'research/dress-mobile-01/dress-mobile-showroom.mjs');
let src=await readFile(showroom,'utf8');
const importAnchor="import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';";
if(!src.includes('applyDualHumanoid150')){
 assert.equal(src.split(importAnchor).length,2,'P150 pinned showroom import anchor missing');
 src=src.replace(importAnchor,importAnchor+"\nimport {applyDualHumanoid150} from '../dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs';");
}
const signature='premiumTurntable67=false}={})';
if(!src.includes('faceDefinition150=false')){
 assert.equal(src.split(signature).length,2,'P150 showroom options anchor missing');
 src=src.replace(signature,'premiumTurntable67=false,faceDefinition150=false}={})');
}
// The overlay must be present before the first body-material draw; otherwise
// WebGL can briefly compile the unmodified shader, which weakens visual QA.
const late="shade(lastColor);if(faceDefinition150){const p150=applyDualHumanoid150(selected,current);canvas.dataset.humanoid150=JSON.stringify(p150);}else delete canvas.dataset.humanoid150;front();";
if(src.includes(late))src=src.replace(late,'shade(lastColor);front();');
const shadeAnchor='draw();return lastColor;';
if(!src.includes('canvas.dataset.humanoid150=JSON.stringify(p150)')){
 assert.equal(src.split(shadeAnchor).length,2,'P150 pre-render shade anchor missing');
 src=src.replace(shadeAnchor,"if(faceDefinition150){const p150=applyDualHumanoid150(selected,current);canvas.dataset.humanoid150=JSON.stringify(p150);}else delete canvas.dataset.humanoid150;draw();return lastColor;");
}
const loadAnchor="installOpeningSkinAttribute(selected);outfit.setOutfit('pants');syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();";
assert.ok(src.includes(loadAnchor)||src.includes('shade(lastColor);front();'),'P150 source figure initial shade missing');
await writeFile(showroom,src);
const panel=resolve(target,'research/outfit-3d-01/research-panel.mjs');
let p=await readFile(panel,'utf8');
const panelAnchor='    dressMobile74:true\n   });';
if(!p.includes('faceDefinition150:new URLSearchParams(window.location.search)')){
 assert.equal(p.split(panelAnchor).length,2,'P150 native outfit panel source anchor missing');
 p=p.replace(panelAnchor,"    dressMobile74:true,\n    faceDefinition150:new URLSearchParams(window.location.search).get('humanoid150')==='research'\n   });");
}
await writeFile(panel,p);
console.log(JSON.stringify({installed:true,target:'detached PR541 donor only',integration:'native saved-outfit preview',gate:'humanoid150=research',pinnedAppearance:'P118+P131',figures:['female','male'],sourceRigModified:false,garmentSourceModified:false,productionDeployed:false,familyAlpha:'HOLD'}));
