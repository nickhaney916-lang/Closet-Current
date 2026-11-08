import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyOwnerSavedPhoto165,verifyLegacySavedPhoto165} from '../public/style-photo-preview-gate-165.mjs';
const bytes=Buffer.alloc(256,42), original='data:image/jpeg;base64,'+bytes.toString('base64');
const id='owner-review-165-private',epoch='verified-session-165';
const sha=createHash('sha256').update(bytes).digest('hex');
const item=()=>({id:'new-owner-blouse',ownerId:id,name:'New reviewed blouse',category:'Tops',
 itemType:'Blouse',sourcePhotoOriginal:true,sourceHashVerified:true,sourceSHA256:sha,
 image:original,originalPhoto:{image:original,sha256:sha},userAdjusted:true,ownerReviewed:true});
const run=({row=item(),current=item(),getSession=()=>({authenticated:true,ownerId:id,epoch,privateDbName:'closet-current-user-'+id}),
  readOwnerItems=()=>[current]}={})=>
 verifyOwnerSavedPhoto165({item:row,getSession,readOwnerItems});
test('P165 real original SHA256 bytes accepted only for currently authenticated, saved, reviewed owner source photo',async()=>{
 const r=await run();
 assert.equal(r.ownerId,id);assert.equal(r.itemId,'new-owner-blouse');
 assert.equal(r.sourceSHA256,sha);assert.equal(r.photo,original);
 assert.equal(r.presentationMode,'verified-original-photo-2d');
 assert.equal(r.garmentActuallyFittedIn3D,false);
 assert.equal(r.unseenBackPhotographed,false);
 assert.equal(r.familyAlpha,'HOLD');assert.equal(r.releaseAuthorized,false);
});
test('P165 always displays original source JPEG rather than a cutout/replaced garment image',async()=>{
 const row=item(),current=item();row.image='data:image/png;base64,'+Buffer.alloc(280,9).toString('base64');current.image=row.image;
 const r=await run({row,current});
 assert.equal(r.photo,original);
 assert.equal(r.sourceSHA256,sha);
});
test('P165 rejects wrong owner, missing original verification, absent ID or corrupt source hash',async()=>{
 await assert.rejects(run({row:{...item(),ownerId:'another-owner'}}),/owner review/);
 await assert.rejects(run({row:{...item(),sourceHashVerified:false}}),/owner review/);
 await assert.rejects(run({row:{...item(),sourcePhotoOriginal:false}}),/owner review/);
 await assert.rejects(run({row:{...item(),id:''}}),/owner review/);
 await assert.rejects(run({row:{...item(),sourceSHA256:'f'.repeat(64)}}),/metadata changed/);
});
test('P165 rejects fake source JPEG bytes, invalid data schemes and unverified canonical source',async()=>{
 const tampered=item();tampered.originalPhoto.image='data:image/jpeg;base64,'+Buffer.alloc(256,99).toString('base64');
 await assert.rejects(run({row:tampered}),/source changed/);
 const x=item();x.originalPhoto.image='https://example.com/picture.jpg';
 await assert.rejects(run({row:x}),/unavailable as a verified local image/);
 const y=item();y.originalPhoto.image='data:image/svg+xml;base64,'+bytes.toString('base64');
 await assert.rejects(run({row:y}),/unavailable as a verified local image/);
});
test('P165 rejects actual owner revocation, changed epoch, deleted saved item, and stale source after async hash',async()=>{
 await assert.rejects(run({getSession:()=>({authenticated:false,ownerId:id,epoch,privateDbName:'closet-current-user-'+id})}),/Sign in/);
 await assert.rejects(run({readOwnerItems:()=>[]}),/changed during/);
 const changed=item();changed.sourceSHA256='f'.repeat(64);
 await assert.rejects(run({readOwnerItems:()=>[changed]}),/changed during/);
 let i=0;
 await assert.rejects(run({getSession:()=>({authenticated:true,ownerId:id,epoch:++i>1?'new-epoch':epoch,privateDbName:'closet-current-user-'+id})}),/Account changed/);
});
test('P165 source verified UI has accessible photo-only original output, never a fake Three.js fit, secure text insertion, handles owner lock/review changes',()=>{
 const s=readFileSync('public/style-photo-preview-gate-165.mjs','utf8');
 for(const marker of ['See saved photo (2D)','3D fitting is not yet verified',
  'No generic garment has been substituted','aria-label','aria-live',
  'closet:session-locked','closet:style-owned-inventory-committed',
  'crypto.subtle.digest','readOwnerItems','sourcePhotoOriginal',
  "presentationMode:'verified-original-photo-2d'","garmentActuallyFittedIn3D:false",
  'originalPhoto?.image||item.image','same(start,requireLive(getSession))',
  'saved-photo-unverified-original-2d','original-camera image provenance is not independently verified'])
  assert.ok(s.includes(marker),'signed original photo UI missing '+marker);
 assert.ok(s.includes("btn.setAttribute('data-style-photo-preview-165','true')"),'real mounted action must match CSS cleanup selector');
 assert.ok(s.includes("grid.querySelectorAll('button[data-style-photo-preview-165]')"),'session-lock cleanup must remove same actual DOM buttons');
 assert.equal(s.includes('innerHTML'),false,'never inject garment names or photo URLs as unsafe HTML');
 assert.equal(s.includes('new THREE.'),false,'never fabricate a generic 3D garment');
});
test('P165 scratch full-app Work source browser runner injects genuine owner photo preview in 6 mobile cases without overwriting original Work',()=>{
 const s=readFileSync('scripts/prepare-style-photo-preview-165-browser.mjs','utf8');
 for(const marker of ['assert.equal(generated.selected,focusedId)',
  "await card.getByRole('button',{name:'Save outfit'}).click();",
  "await page.locator('#saveBoard').click();",
  "See saved photo (2D)","mod.createStyledOwnerPhotoPreview165",
  'wrongOwnerRejected','sourceTamperingRejected','unreviewedRejected',
  'revokedSessionRejected','window.__P165.dispose()',
  'verified-original-2d.png','benchmark/style-photo-preview-165/results.json'])
  assert.ok(s.includes(marker),'original Work browser native UI or P165 security test missing '+marker);
});
test('P165 audit requires signed owner source, all six genuine UI screenshots and inherited 42 same-tree styling plus real WebGL results',()=>{
 const s=readFileSync('scripts/audit-style-photo-preview-165.mjs','utf8');
 for(const marker of ['p164.totalSourceSHA256CheckedBrowserScreenshots,42',
  "p165.verdict,'PASS'","assert.equal(p165.cases.length,6)",
  "assert.equal(files.length,6)",'wrongOwnerRejected','sourceTamperingRejected','revokedSessionRejected',
  "assert.equal(meta.width,width)","assert.equal(all.length,6)",
  'totalRealSourceVerifiedBrowserScreenshots:48',
  "familyAlpha:'HOLD',releaseAuthorized:false",
  'originalNewBlouse3DFitVerified:false'])
  assert.ok(s.includes(marker),'real source chain audit missing '+marker);
});
test('P165 no deploy CI strict six new research files; exact P164 parent, exact Work719 clone, keep original account and photo untouched',()=>{
 const s=readFileSync('.github/workflows/signed-styled-photo-preview-fallback-165-no-deploy.yml','utf8');
 for(const marker of ['BASE=ecaa0827f2ecb75a9b745e5d761d3a790544b0b7',
  'test "$(wc -l </tmp/p165-files)" -eq 6',
  '0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00',
  'scripts/test-style-focused-photo-preview-165.mjs',
  'node scripts/audit-style-photo-preview-165.mjs',
  'P165-original-source-signed-owner-2D-fallback',
  'benchmark/style-photo-preview-165/',
  'test -z "$(git ls-files -u)"'])
  assert.ok(s.includes(marker),'strict product source or no-deploy P165 evidence missing '+marker);
});

test('P165 legacy standard-app owner-scoped saved photo visibly loads only as original-source-UNVERIFIED 2D and computes ephemeral bytes SHA',async()=>{
 const legacy={id:'new-reviewed-blouse',name:'New reviewed blouse',userAdjusted:true,category:'Tops',itemType:'Blouse',image:original};
 const g=()=>({authenticated:true,ownerId:id,epoch,privateDbName:'closet-current-user-'+id});
 const r=await verifyLegacySavedPhoto165({item:legacy,getSession:g,readOwnerItems:()=>[legacy]});
 assert.equal(r.presentationMode,'saved-photo-unverified-original-2d');
 assert.equal(r.sourceSHA256,sha);
 assert.equal(r.originalSourceIndependentlyVerified,false);
 assert.equal(r.privateOwnerDatabaseVerified,true);
 assert.equal(r.garmentActuallyFittedIn3D,false);
});
test('P165 legacy photo source cannot escape signed owner db, review, or photo-change identity',async()=>{
 const legacy={id:'new-reviewed-blouse',userAdjusted:true,category:'Tops',image:original};
 const auth=()=>({authenticated:true,ownerId:id,epoch,privateDbName:'closet-current-user-'+id});
 const verify=(item,session=auth,read=()=>[item])=>verifyLegacySavedPhoto165({item,getSession:session,readOwnerItems:read});
 await assert.rejects(verify({...legacy,ownerId:'another-account'}),/owner wardrobe/);
 await assert.rejects(verify({...legacy,userAdjusted:false}),/owner wardrobe/);
 await assert.rejects(verify({...legacy,sourceSHA256:'f'.repeat(64)}),/owner wardrobe/);
 await assert.rejects(verify({...legacy,image:'https://other.example/fake.jpg'}),/local JPEG or PNG/);
 await assert.rejects(verify(legacy,()=>({authenticated:true,ownerId:id,epoch,privateDbName:'closet-current-user-other'})),/Sign in/);
 await assert.rejects(verify(legacy,auth,()=>[]),/changed while checking/);
 let c=0;
 await assert.rejects(verify(legacy,()=>({authenticated:true,ownerId:id,epoch:++c>1?'new':epoch,privateDbName:'closet-current-user-'+id})),/Account changed/);
});
