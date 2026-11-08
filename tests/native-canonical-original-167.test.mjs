import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyOwnerSavedPhoto165,verifyLegacySavedPhoto165} from '../public/style-photo-preview-gate-165.mjs';
import {captureCanonicalJPEG,verifyStoredCanonical} from '../public/native-canonical-photo-source-167.mjs';

const jpeg=Buffer.concat([Buffer.from([255,216]),Buffer.alloc(180,37),Buffer.from([255,217])]);
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
const owner='private-p167-owner',epoch='source-epoch-p167',dbName='closet-current-user-'+owner;
const auth=()=>({authenticated:true,ownerId:owner,epoch,privateDbName:dbName});
const row=()=>({id:'p167-new-blouse',ownerId:owner,userAdjusted:true,ownerReviewed:true,
  sourceSHA256:sha,sourcePhotoOriginal:true,sourceHashVerified:true,
  originalPhoto:{image:photo,sha256:sha},image:photo,name:'Green blouse',itemType:'Blouse',category:'Tops'});

test('P167 capture exact original JPEG digest and preserve ownership-review distinction',async()=>{
 const proof=await captureCanonicalJPEG(photo,{width:240,height:320});
 assert.equal(proof.sourceSHA256,sha);
 assert.equal(proof.sourceHashVerified,true);
 assert.equal(proof.singleGarmentVerified,false);
 assert.equal(await verifyStoredCanonical(proof),true);
 const tampered={...proof,sourceSHA256:'f'.repeat(64)};
 assert.equal(await verifyStoredCanonical(tampered),false);
});
test('P167 actual async saved owner IndexedDB callback is awaited before original preview',async()=>{
 let reads=0;
 const result=await verifyOwnerSavedPhoto165({item:row(),getSession:auth,readOwnerItems:async()=>{
  reads++;await Promise.resolve();return [row()];}});
 assert.equal(reads,1);
 assert.equal(result.presentationMode,'verified-original-photo-2d');
 assert.equal(result.sourceSHA256,sha);
 assert.equal(result.garmentActuallyFittedIn3D,false);
});
test('P167 owner is revalidated after asynchronous saved record read and review flag mutation',async()=>{
 let epochNow=epoch;
 const getSession=()=>({...auth(),epoch:epochNow});
 await assert.rejects(verifyOwnerSavedPhoto165({
  item:row(),getSession,readOwnerItems:async()=>{await Promise.resolve();epochNow='revoked';return [row()];}
 }),/Account changed/);
 await assert.rejects(verifyOwnerSavedPhoto165({
  item:row(),getSession:auth,readOwnerItems:async()=>[{...row(),ownerReviewed:false}]
 }),/Saved garment changed/);
});
test('P167 never upgrades owner legacy photo to verified original without exact persisted canonical source proof',async()=>{
 const legacy={id:'old-blouse',image:photo,userAdjusted:true,category:'Tops',itemType:'Blouse'};
 const x=await verifyLegacySavedPhoto165({item:legacy,getSession:auth,readOwnerItems:async()=>[legacy]});
 assert.equal(x.presentationMode,'saved-photo-unverified-original-2d');
 assert.equal(x.originalSourceIndependentlyVerified,false);
 await assert.rejects(verifyOwnerSavedPhoto165({item:legacy,getSession:auth,readOwnerItems:async()=>[legacy]}),/owner review/);
});
test('P167 native app browser source uses NORMAL flag-free canonical camera/import save and source-honest card mount',()=>{
 const app=readFileSync('public/app.js','utf8');
 const stylist=readFileSync('public/closet-stylist.js','utf8');
 const build=readFileSync('scripts/build.mjs','utf8');
 for(const marker of ['nativeCanonical167Active=true','const captureProof01Active=nativeCanonical167Active',
  'const reviewedSave120Active=nativeCanonical167Active',
  "import('./native-canonical-photo-source-167.mjs')",
  "import('./native-reviewed-private-save-167.mjs')",
  'captureProofFromFile','captureProofFromJPEG','reviewConfirmed120.checked',
  'garmentConfirmed120.checked','commitHumanReviewedPhoto119'])
  assert.ok(app.includes(marker),'P167 required native source or private review integration missing '+marker);
 for(const marker of ['mountOriginalPhotoPreview167','signedOwnerSavedRows167',
  'await readAll()','sourcePhotoOriginal','style-photo-preview-gate-165.mjs',
  "grid:$('styledCollectionResults')",'void mountOriginalPhotoPreview167()',
  'originalPhotoPreview167?.dispose()','currentPhotoOwnerSession167'])
  if(marker!=='sourcePhotoOriginal')assert.ok(stylist.includes(marker),'P167 signed current native styling missing '+marker);
 for(const path of ['native-canonical-photo-source-167.mjs','native-original-index-gate-167.mjs',
  'native-owner-wardrobe-index-167.mjs','native-reviewed-private-save-167.mjs',
  'style-photo-preview-gate-165.mjs'])
  assert.equal(existsSync('public/'+path),true,'P167 missing static app bundled module '+path);
 assert.ok(build.includes("await cp('public','dist',{recursive:true})"));
});
test('P167 original camera, review and private index modules are self-contained public app dependencies',()=>{
 const paths=['native-canonical-photo-source-167.mjs','native-original-index-gate-167.mjs',
  'native-owner-wardrobe-index-167.mjs','native-reviewed-private-save-167.mjs'];
 for(const p of paths){
  const s=readFileSync('public/'+p,'utf8');
  assert.ok(!s.includes("from '../research/"),p+' must not rely on inaccessible research runtime');
  assert.ok(!s.includes("from '../../public/"),p+' must use built public paths');
 }
 const reviewed=readFileSync('public/native-reviewed-private-save-167.mjs','utf8');
 for(const m of ['./native-original-index-gate-167.mjs','./native-owner-wardrobe-index-167.mjs',
  'tx.objectStore','add(value)','sourceHashVerified!==true','assertLease'])
  assert.ok(reviewed.includes(m),'P167 canonical atomic owner-reviewed private save missing '+m);
});
test('P167 genuine mobile browser audit does not accept camera injection, unverified source, fake 3D or release',()=>{
 const s=readFileSync('scripts/test-native-canonical-original-167-browser.mjs','utf8');
 for(const m of ['#clothingPhotos',".setInputFiles({","mimeType:'image/jpeg'",
  'I verified the category, clothing type and color',
  'I confirmed this photo shows one garment',
  "source167.savedSourceSHA,createHash('sha256').update(capturePhoto).digest('hex')",
  "source167.originalPhotoFromFile,'import'",
  "preview167.mode,'verified-original-photo-2d'",
  "preview167.sha,source167.savedSourceSHA",
  'saveAndReload','oneOwnedPieceSwap','normalFlagFreeAppURL:true',
  'realPhysicalPhoneCamera:false',"familyAlpha:'HOLD'"])
  assert.ok(s.includes(m),'P167 native full app real UI QA missing '+m);
 assert.ok(!s.includes('candidate(image))throw Error('),'P167 browser cannot fake capture by direct candidate injection');
});
