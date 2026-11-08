/**
 * P157 injects genuine source SHA256 verified, independent P156 face/hair
 * assets ONLY into exact pinned detached PR541 research donor. Every output
 * remains within disposable .p150-donor-541 and never changes Closet
 * Current shipping app, production/staging, parallel P150, cloud or photos.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';

const arg=process.argv[2],donor=resolve(arg||''),root=resolve('.');
if(arg!=='.p150-donor-541'||!donor.startsWith(root+sep))
 throw Error('P157 only pinned isolated PR541 donor approved');
const commit=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(commit!=='df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('P157 source original 163-bone PR541 donor SHA changed');
const source='research/real-face-original-photo-body-graft-157/attach-licensed-head.mjs';
const dest=resolve(donor,source);
await mkdir(dirname(dest),{recursive:true});
await copyFile(resolve(source),dest);
const folder=resolve(donor,'research/real-face-original-photo-body-graft-157/assets');
await mkdir(folder,{recursive:true});
const src='benchmark/rocketbox-wardrobe-separation-156/heads';
const sourceHeads=[
 {gender:'female',filename:'female-licensed-face-hair-only.glb',size:3186360,
  sha:'dd3772a97d2459975b34f8b1ca7902cb7d7e47d20091766a342b53425c9202e4'},
 {gender:'male',filename:'male-licensed-face-hair-only.glb',size:3208432,
  sha:'a4aed621b347f5ed2c6564ca4bb66c8d18681d94e7d3fdc246fdd64adbcc1f72'}
];
for(const item of sourceHeads){
 const bytes=await readFile(resolve(src,item.filename));
 if(bytes.length!==item.size||
  createHash('sha256').update(bytes).digest('hex')!==item.sha)
  throw Error('P157 original immutable 80-bone MIT licensed P156 source head changed '+item.gender);
 await writeFile(resolve(folder,item.filename),bytes);
}
const file=resolve(donor,'research/dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs');
let code=await readFile(file,'utf8');
function one(from,to){
 assert.equal(code.split(from).length,2,
  'P157 pinned P154 research-only bridge anchor mismatch: '+from.slice(0,100));
 code=code.replace(from,to);
}
const imp="import {applyOriginalFaceContours154,clearOriginalFaceContours154} from '../dual-humanoid-facial-contours-154/face-contours.mjs';";
one(imp,imp+"\nimport {applyLicensedSourceHead157,clearLicensedSourceHead157} from '../real-face-original-photo-body-graft-157/attach-licensed-head.mjs';");
one(" clearOriginalFaceContours154(root);"," clearLicensedSourceHead157(root);\n clearOriginalFaceContours154(root);");
one(" const faceContours154=applyOriginalFaceContours154(root,figure);",
 " const faceContours154=applyOriginalFaceContours154(root,figure);\n const licensedHead157=applyLicensedSourceHead157(root,figure);");
one("figure,sourceRigBones:163,skinHair,face,headHair153,faceContours154,",
 "figure,sourceRigBones:163,skinHair,face,headHair153,faceContours154,licensedHead157,");
await writeFile(file,code);
// The donor's ORIGINAL GLTF/owned-wardrobe load(kind) is already async.
// Await the real licensed head only AFTER original 163-bone source and
// verified source JPEG wardrobe controllers exist. Never await asset
// loading at ES module import time (that can deadlock native app startup).
const showroom=resolve(donor,'research/dress-mobile-01/dress-mobile-showroom.mjs');
let panel=await readFile(showroom,'utf8');
const panelImport="import {applyDualHumanoid150} from '../dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs';";
assert.equal(panel.split(panelImport).length,2,'P157 original donor showroom P150 import shifted');
panel=panel.replace(panelImport,panelImport+
 "\nimport {preloadLicensedSourceHead157} from '../real-face-original-photo-body-graft-157/attach-licensed-head.mjs';");
const beforeShade="installOpeningSkinAttribute(selected);outfit.setOutfit('pants');syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();";
assert.equal(panel.split(beforeShade).length,2,'P157 donor async 163-bone load source clothing barrier changed');
panel=panel.replace(beforeShade,
 "installOpeningSkinAttribute(selected);outfit.setOutfit('pants');syncOutfit();reapDetachedGarmentGeometries();shade(lastColor);front();if(faceDefinition150)void preloadLicensedSourceHead157(kind).then(readyHead=>{if(!readyHead||finish||token!==loading||!selected||current!==kind)return;try{shade(lastColor);front();console.info('P157_VERIFIED_LICENCED_HEAD_ON_AUTHENTIC_OWNER_OUTFIT',kind);}catch(e){console.error('P157_RESEARCH_FACE_GRAFT_REFUSED',String(e?.message||e));}});");
await writeFile(showroom,panel);
console.log('P157_EXACT_PINNED_LICENCED_SOURCE_HEAD_INSTALLED '+JSON.stringify({
 originalSourceSHA:commit,
 extractedHeadSources:sourceHeads.map(x=>({gender:x.gender,sha256:x.sha})),
 originalSourceHumanoidBones:163,licensedHeadBones:80,
 userSourceOutfitPhotographsUnmodified:true,
 onlyDetachedTestDonorPatched:true,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
