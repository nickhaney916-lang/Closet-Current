/** Inject the actual P172 shirt geometry correction ONLY into a detached P541
 * donor after the exact P60/P164 installer. NEVER edit a source branch. */
import assert from 'node:assert/strict';
import {copyFile,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
const argument=process.argv[2];
if(!argument)throw Error('P172 requires explicit detached donor path');
const donor=resolve(argument),self=resolve('.');
if(donor===self||donor==='/'||self.startsWith(donor+'/'))
 throw Error('P172 refuses repository-root or ancestor as donor');
await stat(join(donor,'.git'));
const donorModule=join(donor,'research/photo-torso-contour-172/torso-contour.mjs');
await mkdir(dirname(donorModule),{recursive:true});
await copyFile(resolve('research/photo-torso-contour-172/torso-contour.mjs'),donorModule);
const path=join(donor,'research/three-d-15/outfit-controller.mjs');
let source=await readFile(path,'utf8');
const srcImport="import {inspectPhotographedFit60,attachPhotographedFitReceipt60} from '../photo-garment-anatomical-fitting-60/fit-contract.mjs';";
const addImport="import {contourSourceVerifiedShirt172} from '../photo-torso-contour-172/torso-contour.mjs';";
assert.equal(source.split(srcImport).length,2,'P172 verified P60 fit contract absent');
assert.ok(!source.includes(addImport),'P172 never double-applies torso deformation');
source=source.replace(srcImport,srcImport+'\n'+addImport);
const anchor='   if(photoFabricRealism164){\n    for(const slot of Object.keys(built)){';
assert.equal(source.split(anchor).length,2,'P172 verified P60/P164 geometric validation anchor changed');
source=source.replace(anchor,
 '   if(photoFabricRealism164&&built.shirt)built.shirt=contourSourceVerifiedShirt172(built.shirt,root);\n'+anchor);
await writeFile(path,source);
// The EXISTING P60 real Chromium/WebGL benchmark must now prove its shirt
// renderer actually carries the moved source-mesh vertices, not merely a
// nominal P172 flag in an isolated unit test.
const browserPath=join(donor,'scripts/test-three-d-15-browser.mjs');
let browser=await readFile(browserPath,'utf8');
const webglAnchor="assert.equal(attached.outfit[mode==='dress'?'dress':'shirt'].photoAnatomicalFit60,true,'P60 source garment must carry an independently checked 163-bone fit receipt');";
assert.equal(browser.split(webglAnchor).length,2,'P172 real P60 WebGL acceptance anchor missing');
const proof="if(mode!=='dress'){assert.equal(attached.outfit.shirt.sourcePhotoTorsoContour172,true,'actual source skinned shirt geometry must be deformed');assert.ok(attached.outfit.shirt.physicalTorsoContourMovedVertices172>30);assert.ok(attached.outfit.shirt.physicalTorsoContourMaxMeters172>.006);}";
browser=browser.replace(webglAnchor,webglAnchor+proof);
await writeFile(browserPath,browser);
console.log(JSON.stringify({priority:172,detachedOnly:true,sourceP60Unchanged:true,
 sourcePhotographUnchanged:true,physicalRestMeshChange:true,
 arbitraryOwnerPhotoApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
