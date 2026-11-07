/**
 * P154 isolated research-only installer. Copies source-conforming facial
 * overlay into the pinned original P541 donor and wires it AFTER real P131
 * eyes, P152 skin fix, P153 source-scalp hair. Not the shipping application.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';
const arg=process.argv[2];
if(arg!=='.p150-donor-541')throw Error('P154 only detached .p150-donor-541 research donor allowed');
const root=resolve('.'),donor=resolve(arg);
if(!donor.startsWith(root+sep))throw Error('P154 target path escaped repository');
const commit=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(commit!=='df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('P154 requires pinned original 163-bone CC0 figure donor');
const src='research/dual-humanoid-facial-contours-154/face-contours.mjs';
const dst=resolve(donor,src);
await mkdir(dirname(dst),{recursive:true});
await copyFile(resolve(src),dst);
const path=resolve(donor,'research/dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs');
let code=await readFile(path,'utf8');
function once(a,b){
 assert.equal(code.split(a).length,2,'P154 exact P153 donor bridge anchor changed: '+a.slice(0,90));
 code=code.replace(a,b);
}
const imp="import {applySourceHeadHair153,clearSourceHeadHair153} from '../dual-humanoid-head-hair-153/source-head-hair.mjs';";
once(imp,imp+"\nimport {applyOriginalFaceContours154,clearOriginalFaceContours154} from '../dual-humanoid-facial-contours-154/face-contours.mjs';");
once(" clearSourceHeadHair153(root);"," clearOriginalFaceContours154(root);\n clearSourceHeadHair153(root);");
once(" const headHair153=applySourceHeadHair153(root,figure);",
 " const headHair153=applySourceHeadHair153(root,figure);\n const faceContours154=applyOriginalFaceContours154(root,figure);");
once("figure,sourceRigBones:163,skinHair,face,headHair153,",
 "figure,sourceRigBones:163,skinHair,face,headHair153,faceContours154,");
await writeFile(path,code);
console.log('P154_PINNED_SOURCE_FACE '+JSON.stringify({
 sourceHead:commit,onlyTemporaryDonorChanged:true,
 existingP153SourceScalpPreserved:true,
 existingP131EyeMeshesPreserved:true,
 originalPhotographedClothingUnmodified:true,
 originalSkeletonBones:163,
 productionAuthorized:false,familyAlpha:'HOLD'
}));
