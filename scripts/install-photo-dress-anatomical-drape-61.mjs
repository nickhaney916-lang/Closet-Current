/** Install P61 only into an explicitly named detached P541 research donor. */
import assert from 'node:assert/strict';
import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
const donor=resolve(process.argv[2]||'');
if(!process.argv[2]||donor===resolve('.')||donor===resolve('/'))throw Error('P61 requires an explicit disposable P541 donor');
async function copy(src,dst){await mkdir(dirname(dst),{recursive:true});await copyFile(resolve(src),dst);}
await copy('research/photo-garment-anatomical-fitting-60/fit-contract.mjs',resolve(donor,'research/photo-garment-anatomical-fitting-60/fit-contract.mjs'));
await copy('research/photo-dress-anatomical-drape-61/dress-drape.mjs',resolve(donor,'research/photo-dress-anatomical-drape-61/dress-drape.mjs'));
const controllerPath=resolve(donor,'research/three-d-15/outfit-controller.mjs');
let c=await readFile(controllerPath,'utf8');
const importAnchor="import {registerDressNeckline,clearNeckTriangleInteriors} from '../three-d-29/registered-neckline.mjs';";
assert.equal(c.split(importAnchor).length,2,'Pinned P541 dress controller import anchor changed');
c=c.replace(importAnchor,importAnchor+"\nimport {refinePhotographedDress61} from '../photo-dress-anatomical-drape-61/dress-drape.mjs';\nimport {attachPhotographedFitReceipt60} from '../photo-garment-anatomical-fitting-60/fit-contract.mjs';");
const optionAnchor='photoDenimKneePose78=false}={}){',optionUpdated='photoDenimKneePose78=false,photoDressDrape61=false}={}){';
assert.equal(c.split(optionAnchor).length,2,'Pinned P541 controller options anchor changed');c=c.replace(optionAnchor,optionUpdated);
const dressAnchor='if(anatomyEnabled&&skirtDrape)fitted=softenAnatomicalSkirt(fitted,root);';
assert.equal(c.split(dressAnchor).length,2,'Pinned P541 skirt geometry integration anchor changed');
c=c.replace(dressAnchor,dressAnchor+"\n     if(photoDressDrape61)fitted=refinePhotographedDress61(fitted,root);\n     fitted=attachPhotographedFitReceipt60(fitted,root);");
await writeFile(controllerPath,c);
const showroomPath=resolve(donor,'research/three-d-15/showroom.mjs');
let s=await readFile(showroomPath,'utf8');
const showOption='photoDenimKneePose78=false,premiumTurntable67=false}={}){';
const showUpdated='photoDenimKneePose78=false,photoDressDrape61=false,premiumTurntable67=false}={}){';
assert.equal(s.split(showOption).length,2,'Pinned P541 showroom options anchor changed');s=s.replace(showOption,showUpdated);
const controllerCall='photoDenimContactAudit77,photoDenimKneePose78});outfit.setPose(pose);';
assert.equal(s.split(controllerCall).length,2,'Pinned P541 controller call anchor changed');s=s.replace(controllerCall,'photoDenimContactAudit77,photoDenimKneePose78,photoDressDrape61});outfit.setPose(pose);');
await writeFile(showroomPath,s);
const demoPath=resolve(donor,'research/three-d-15/demo.mjs');
let d=await readFile(demoPath,'utf8');
const demoAnchor="app=mountAnatomicalShowroom($('avatar'),{";
assert.equal(d.split(demoAnchor).length,2,'Pinned P541 demo showroom call anchor changed');
d=d.replace(demoAnchor,"app=mountAnatomicalShowroom($('avatar'),{photoDressDrape61:new URLSearchParams(location.search).get('dressDrape61')==='true',");
await writeFile(demoPath,d);
// Give the disposable browser harness a strict camera-only seam for both sides.
let d2=await readFile(demoPath,'utf8');
const diagAnchor='window.work61Diagnostics=()=>app.getState();';
assert.equal(d2.split(diagAnchor).length,2,'Pinned P541 diagnostics anchor changed');
d2=d2.replace(diagAnchor,diagAnchor+'window.work61ViewAt=degrees=>app.viewAt(degrees);');
await writeFile(demoPath,d2);
const browserPath=resolve(donor,'scripts/test-three-d-15-browser.mjs');
let b=await readFile(browserPath,'utf8');
const urlAnchor="await page.goto(origin+'/research/three-d-15/index.html?version='+version);";
assert.equal(b.split(urlAnchor).length,2,'Pinned P541 browser page navigation anchor changed');
b=b.replace(urlAnchor,"await page.goto(origin+'/research/three-d-15/index.html?version=after'+(version==='after'?'&dressDrape61=true':''));");
// Keep every builder, lighting, and camera option identical in both capture
// sets; the only changed variable is the P61 dress geometry switch.
b=b.replace("const expected=mode==='shirt-pants'?13:version==='after'?11:10;assert.equal(attached.geometries,expected);",
  "const expected=mode==='shirt-pants'?13:11;assert.equal(attached.geometries,expected);");
b=b.replace("assert.equal(attached.outfit.garmentMeshes,mode==='shirt-pants'?4:version==='after'?2:1);",
  "assert.equal(attached.outfit.garmentMeshes,mode==='shirt-pants'?4:2);");
b=b.replace("assert.equal((await state(page)).geometries,version==='after'?11:10);",
  "assert.equal((await state(page)).geometries,11);");
b=b.replace("dressGeometry:version==='after'?11:10","dressGeometry:11");
const angleLoop="for(const view of ['front','threequarter','side','back']){\n      await page.locator('#'+view).click();";
assert.equal(b.split(angleLoop).length,2,'Pinned P541 four-view capture loop changed');
b=b.replace(angleLoop,"for(const view of ['front','threequarter','side','side-left','side-right','back']){\n      if(view==='side-left')await page.evaluate(()=>window.work61ViewAt(-90));else if(view==='side-right')await page.evaluate(()=>window.work61ViewAt(90));else await page.locator('#'+view).click();");
b=b.replace("assert.equal(new Set(images).size,4,'Four genuine viewing angles');","assert.equal(new Set(images).size,6,'Six genuine viewing angles including both sides');");
await writeFile(browserPath,b);
const evidencePath=resolve(donor,'scripts/test-three-d-15-evidence.mjs');
let ev=await readFile(evidencePath,'utf8');
ev=ev.replace("['front','threequarter','side','back']","['front','threequarter','side','side-left','side-right','back']");
ev=ev.replace("`Work61 / ${model} / ${mode} / verified builders vs integrated finish / HOLD`,1280","`P61 / ${model} / ${mode} / source dress geometry before and after / HOLD`,1920");
ev=ev.replace("create:{width:1280,height:1820","create:{width:1920,height:1820");
ev=ev.replace('Object.keys(screenshotSHA256).length,204','Object.keys(screenshotSHA256).length,300');
const oldEnd="for(const model of ['male','female'])for(const mode of ['shirt-pants','dress'])assert.ok(changed.some(r=>r.model===model&&r.mode===mode&&r.fraction>.00002),'Actual edge/collar finish must change real pixels');";
assert.equal(ev.split(oldEnd).length,2,'Pinned P541 visual-difference audit anchor changed');
ev=ev.replace(oldEnd,"for(const model of ['male','female']){assert.ok(changed.some(r=>r.model===model&&r.mode==='dress'&&r.fraction>.00002),'P61 dress geometry must change actual WebGL pixels');assert.ok(changed.filter(r=>r.model===model&&r.mode==='shirt-pants').every(r=>r.fraction<.00002),'P61 must leave shirt rendering unchanged');}");
await writeFile(evidencePath,ev);
const receiptAnchor="assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].sourceSHA256,stock.find(r=>r.id===source).sourceSHA256);";
assert.equal(b.split(receiptAnchor).length,2,'Pinned P541 source SHA browser assertion anchor changed');
b=b.replace(receiptAnchor,receiptAnchor+"if(mode==='dress'){const d=attached.outfit.dress;assert.equal(d.photoAnatomicalFit60,true);assert.equal(d.photoAnatomicalFitReceipt60.common163BoneSkeletonChecked,true);assert.equal(d.photoAnatomicalFitReceipt60.originalSourceIdentityChecked,true);if(version==='after'){assert.equal(d.photographedDressDrape61,true);assert.ok(d.torsoVertices61>=100);assert.ok(d.skirtVertices61>=100);assert.ok(d.maxTorsoMovementMeters61>0.001&&d.maxTorsoMovementMeters61<=0.013);assert.ok(d.maxSkirtMovementMeters61>0.001&&d.maxSkirtMovementMeters61<0.020);assert.equal(d.originalRestPhotoCoordinatesUnchanged61,true);assert.equal(d.skinIndicesAndWeightsPreserved61,true);assert.equal(d.sourceTextureAndMaterialPreserved61,true);}else assert.equal(d.photographedDressDrape61,undefined);}");
const serverAllowlist=String.raw`if(!/^\/(?:research\/|benchmark\/|node_modules\/three\/)/.test(p)||`;
const serverAllowlistUpdated=String.raw`if(!/^\/(?:research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(p)||`;
assert.equal(b.split(serverAllowlist).length,2,'Pinned P541 local server allowlist changed');b=b.replace(serverAllowlist,serverAllowlistUpdated);
const requestAllowlist=String.raw`!/^\/(research\/|benchmark\/|node_modules\/three\/)/.test(new URL(u).pathname)`;
const requestAllowlistUpdated=String.raw`!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(new URL(u).pathname)`;
assert.equal(b.split(requestAllowlist).length,2,'Pinned P541 request audit allowlist changed');b=b.replace(requestAllowlist,requestAllowlistUpdated);
await writeFile(browserPath,b);
console.log(JSON.stringify({priority:61,donor,geometryModule:'research/photo-dress-anatomical-drape-61/dress-drape.mjs',receipt:'verified P60 exact-source 163-bone contract',mode:'detached-source-photo-only-research',defaultAppChanged:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
