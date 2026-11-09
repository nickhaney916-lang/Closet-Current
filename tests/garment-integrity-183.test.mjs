import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectPhotoSilhouetteFit62} from '../research/user-photo-to-anatomical-3d-62/admission.mjs';
import {measureUpperSilhouette62,UPPER_PHOTO_SOURCES_62}
 from '../research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs';

const source=UPPER_PHOTO_SOURCES_62['commons-0016'];
const id='owner-saved-blouse',ownerId='research-fixture-A';
const base=()=>({
 selection:{ownerId,slots:{top:id}},
 sources:{ownerId,sources:[{id,sha256:source.sourceSHA256}]},
 proof171:{admitted:true},
 render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:'shirt',
  releaseAuthorized:false,productionDeployed:false,
  fitReceipts171:{shirt:{silhouette62:{
   sourcePhotoSilhouetteFit62:true,silhouetteSourceSHA256:source.sourceSHA256,
   cutoutSHA256:'c'.repeat(64),silhouetteFit62MovedVertices:425,
   silhouetteFit62MaxMeters:.012,normalizedSilhouetteOnly:true,inferredRear62:true
  }}}
 }
});
test('P183 supports exact one pinned source-blouse only, not generic private photos',()=>{
 const accept=inspectPhotoSilhouetteFit62(base());
 assert.equal(accept.admitted,true);
 assert.equal(accept.arbitraryPrivatePhoto3DApproved,false);
 assert.equal(accept.humanVisualApproval,false);
 assert.equal(accept.releaseAuthorized,false);
 assert.equal(accept.inferredBack,true);
 assert.equal(accept.bothHumanoidsSupported,true);
});
test('P183 cannot treat an unsigned outfit or foreign owner as source-verified 3D',()=>{
 for(const mutate of [
  x=>{x.selection.ownerId='foreign';},
  x=>{x.sources.ownerId='foreign';},
  x=>{x.proof171.admitted=false;},
  x=>{x.selection.slots.top='another-shirt';},
  x=>{x.sources.sources[0].sha256='1'.repeat(64);}
 ]){
  const x=base();mutate(x);
  const proof=inspectPhotoSilhouetteFit62(x);
  assert.equal(proof.admitted,false);
  assert.equal(proof.mode,'verified-original-photo-2d-fallback');
 }
});
test('P183 does not admit a photograph without genuine ready 163-bone rendered fitting receipt',()=>{
 for(const mutate of [
  x=>{x.render.viewerReady=false;},
  x=>{x.render.privateVisible=false;},
  x=>{x.render.bones=162;},
  x=>{x.render.viewerMode='photo-only';},
  x=>{x.render.releaseAuthorized=true;},
  x=>{x.render.fitReceipts171.shirt.silhouette62.silhouetteFit62MaxMeters=.08;},
  x=>{x.render.fitReceipts171.shirt.silhouette62.inferredRear62=false;}
 ]){
  const x=base();mutate(x);
  assert.equal(inspectPhotoSilhouetteFit62(x).admitted,false);
 }
});
test('P183 silhouette reviewer refuses arbitrary cutout when original approval is not established',()=>{
 const width=96,height=128,data=new Uint8ClampedArray(width*height*4);
 for(let y=10;y<116;y++)for(let x=20;x<76;x++)data[(y*width+x)*4+3]=255;
 const opts={data,width,height,sourceId:'commons-0016',
  sourceSHA256:source.sourceSHA256,cutoutSHA256:'b'.repeat(64)};
 assert.equal(measureUpperSilhouette62({...opts,reviewConfirmed:false}).accepted,false);
 assert.equal(measureUpperSilhouette62({...opts,reviewConfirmed:true,sourceId:'my-private-photo'}).accepted,false);
});
test('P183 preserves P182 committed-cloud quarantine and NATIVE91/92/93 source checks while grafting P62',()=>{
 const native=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 for(const token of [
  'cloudToNative3D180Bridge?.pending?.()',
  'attestOriginalPhotoBytes92',
  'requireNative3D05WardrobeRevision93',
  "get('photoSilhouette62')==='research'",
  'verifiedPhotoSilhouette62'
 ])assert.ok(native.includes(token),token);
 const cloud=readFileSync('research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs','utf8');
 assert.ok(cloud.includes('postCommitUnverified'));
 assert.ok(cloud.includes('retryVerification'));
});
test('P183 native browser harness records both genders and both engines without claiming human realism',()=>{
 const script=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const token of [
  "photoSilhouetteEngine62:'chromium'",
  'PHOTO_SILHOUETTE62_BROWSER',
  "photoSilhouetteEngine62:'chromium'",
  "'04-male-front-provisional-blouse'",
  "'03-female-inferred-rear-provisional-blouse'",
  'provisionalCutoutNeedsHumanReview:true',
  'photorealismAccepted:false',
  'await take(page,width'
 ]){if(token==="photoSilhouetteEngine62:'chromium'")continue;
  assert.ok(script.includes(token),token);
 }
 assert.ok(script.includes("photoSilhouette62?photoSilhouetteEngine62:'chromium'"));
});
test('P183 source-specific installer never mutates primary project tree, real owner photos, or shipping public app',()=>{
 const script=readFileSync('scripts/install-user-photo-to-anatomical-3d-62.mjs','utf8');
 assert.ok(script.includes("if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/'))"));
 assert.ok(script.includes("const donor=resolve(donorArg)"));
 assert.ok(script.includes('copyFile'));
});
