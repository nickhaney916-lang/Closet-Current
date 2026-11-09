/** P188: patch ONLY an explicitly disposable P541 research donor, after P62/P185. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const arg=process.argv[2];
if(!arg)throw Error('P188 requires explicit disposable donor path');
const donor=resolve(arg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/')||
 donor.startsWith(cwd+'/public/')||donor.startsWith(cwd+'/supabase/'))
 throw Error('P188 refuses shipping public app, cloud, root or staging');
const swap=async(file,anchor,next)=>{
 const path=join(donor,file),before=await readFile(path,'utf8');
 assert.equal(before.split(anchor).length,2,'P188 unexpected donor drift '+file+' / '+anchor.slice(0,80));
 await writeFile(path,before.replace(anchor,next));
};
await swap('research/outfit-3d-01/source-true-viewer.mjs',
 'export async function loadVettedOutfit3D01Sources(){',
 'export async function loadVettedOutfit3D01Sources({ownerReviewedCutout188=null}={}){');
await swap('research/outfit-3d-01/source-true-viewer.mjs',
 'const blouse=Object.freeze({...rawBlouse,originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true});',
 `let blouse=Object.freeze({...rawBlouse,originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true});
 if(ownerReviewedCutout188){
  const {compositeOwnerReviewedCutout188}=await import('/research/owner-reviewed-cutout-texture-188/private-cutout-texture.mjs');
  blouse=await compositeOwnerReviewedCutout188({blouse,asset:ownerReviewedCutout188});
 }`);
await swap('research/outfit-3d-01/research-panel.mjs',
 'export async function mountOutfit3D01Research({doc=document,auth=window.closetAuth}={}){',
 'export async function mountOutfit3D01Research({doc=document,auth=window.closetAuth,ownerReviewedCutout188=null}={}){');
await swap('research/outfit-3d-01/research-panel.mjs',
 'sources=await loadVettedOutfit3D01Sources();still();',
 'sources=await loadVettedOutfit3D01Sources({ownerReviewedCutout188});still();');
await swap('research/outfit-3d-01/research-panel.mjs',
 `sourceFrontOnly:true,productionDeployed:false,familyAlpha:'HOLD',physicalPhonesApproved:false`,
 `sourceFrontOnly:true,
    privateCutoutTexelsOnMesh188:ready===true&&view.outfit?.mode==='shirt'&&
     view.outfit?.shirt?.sourceSHA256===sources?.blouse?.sourceSHA256&&
     view.outfit?.garmentMeshes>0&&sources?.blouse?.privateCutoutTexelsComposited188===true,
    reviewedPrivateCutoutJPEG_SHA188:sources?.blouse?.privateCutoutTexelsComposited188===true?
     sources.blouse.privateCutoutJPEG_SHA256188:null,
    reviewedSourceMaskSHA188:sources?.blouse?.privateCutoutTexelsComposited188===true?
     sources.blouse.cutoutSourceMaskSHA256188:null,
    ownerCutoutMaskFromOwnerPhoto188:false,privateCutoutHumanApprovalIndependentlyVerified188:false,
    ownerMaskPixelsOnSkinnedGarment189:ready===true&&view.outfit?.mode==='shirt'&&
     view.outfit?.garmentMeshes>0&&sources?.blouse?.privateOwnerAlphaPixelMask189===true,
    reviewedPrivateOwnerMaskSHA189:sources?.blouse?.privateOwnerAlphaPixelMask189===true?
     sources.blouse.ownerAlphaMaskSHA256_189:null,
    ownerMaskGeometryFromPrivatePNG189:false,
    ownerMaskHumanReviewIndependentlyVerified189:false,
    productionDeployed:false,familyAlpha:'HOLD',physicalPhonesApproved:false`);
await swap('research/outfit-3d-01/research-panel.mjs',
 "status.after(mannequinCover185);",
 `status.after(mannequinCover185);
 if(ownerReviewedCutout188){
  const provenance188=el('p','outfit3D01OwnerTextureDisclosure188');
  provenance188.className='cc3d-note';provenance188.setAttribute('role','note');
  provenance188.textContent=ownerReviewedCutout188?.ownerAlphaPNG189?
   'PRIVATE REVIEWED JPEG fabric + OWNER-ASSERTED PNG alpha are visible on the real 3D mesh. Mask SHA verified independently, but mask accuracy and owner human review are NOT independently witnessed. The 163-bone garment GEOMETRY still uses the licensed source silhouette; rear remains inferred.':
   'PRIVATE REVIEWED JPEG fabric pixels on 3D; PINNED LICENSED PNG supplies approximate alpha/shape. Mask is NOT user-derived, rear remains inferred. Owner review is an assertion, not independently witnessed.';
  mannequinCover185.after(provenance188);
 }`);
for(const path of ['research/outfit-3d-01/source-true-viewer.mjs','research/outfit-3d-01/research-panel.mjs'])
 execFileSync(process.execPath,['--check',join(donor,path)],{stdio:'inherit'});
console.log(JSON.stringify({priority:188,disposableResearchDonorOnly:true,
 privateJPEGTexelComposite:true,ownerMaskSegmentationCertified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'}));
