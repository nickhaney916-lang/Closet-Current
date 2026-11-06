import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 RESEARCH_OWNER_110,RESEARCH_SOURCE_110,
 planReviewedSourceLook110,requireUnchangedReviewedLook110
} from '../research/reviewed-closet-3d-handoff-110/owner-bound-look-policy.mjs';
const make=(owner=RESEARCH_OWNER_110,generation=1,denim='public')=>{
 const session={authenticated:true,ownerId:owner,generation};
 const shirt={id:'licensed-shirt',sourceId:'licensed-shirt',
  ownerId:owner,category:'Tops',itemType:'T-shirt',color:'Black',
  sourceSHA256:RESEARCH_SOURCE_110.shirt,ownerReviewed:true,
  sourcePhotoOriginal:true,photographic3DReconstructionApproved:false};
 const jeans={id:denim==='public'?'licensed-jeans-1':'licensed-jeans-2',
  sourceId:denim==='public'?'licensed-jeans-1':'licensed-jeans-2',
  ownerId:owner,category:'Bottoms',itemType:'Jeans',color:'Blue',
  sourceSHA256:RESEARCH_SOURCE_110[denim],ownerReviewed:true,
  sourcePhotoOriginal:true,photographic3DReconstructionApproved:false};
 const indexed={ownerId:owner,generation,releaseAuthorized:false,
  byId:new Map([[shirt.id,shirt],[jeans.id,jeans]])};
 const board={slots:{top:shirt.id,bottom:jeans.id}};
 return {session,indexed,board,readCurrentSession:()=>session};
};
test('PHOTO110 benchmark owner original two licensed source photos mapped to exact genuine 163-bone research only',()=>{
 for(const denim of ['public','second']){
  const p=planReviewedSourceLook110(make(RESEARCH_OWNER_110,1,denim));
  assert.equal(p.status,'verified-public-research-3d');
  assert.equal(p.selectedPublicDenimSource,denim);
  assert.equal(p.sourceSHA256s.bottom,RESEARCH_SOURCE_110[denim]);
  assert.equal(p.sourceSHA256s.top,RESEARCH_SOURCE_110.shirt);
  assert.equal(p.genuineResearch163Bone3DReady,true);
  assert.equal(p.truePrivateWardrobe3DReady,false);
  assert.equal(p.realSignedCloudRLSVerified,false);
  assert.equal(p.independentOwnerAuthenticityProven,false);
  assert.equal(p.familyAlpha,'HOLD');
  assert.equal(p.releaseAuthorized,false);
  assert.equal(Object.isFrozen(p),true);
  assert.equal(Object.isFrozen(p.outfitSlots),true);
 }
});
test('PHOTO110 reviewed private-like synthetic owner stays ORIGINAL photo/2D, no fabricated fitted 3D',()=>{
 const d=make('synthetic-owner-private-A',3);
 const p=planReviewedSourceLook110(d);
 assert.equal(p.status,'original-photo-2d-fallback');
 assert.equal(p.selectedPublicDenimSource,null);
 assert.equal(p.genuineResearch163Bone3DReady,false);
 assert.equal(p.fallback,'existing-original-photograph-or-2d-board');
 assert.equal(p.originalPhotoNotReconstructed,true);
 assert.equal(p.truePrivateWardrobe3DReady,false);
 assert.equal(p.realSignedCloudRLSVerified,false);
});
test('PHOTO110 fake customer-derived JPEG hash can never inherit benchmark 3D capabilities',()=>{
 const d=make('synthetic-owner-private-B',1);
 d.indexed.byId.get('licensed-jeans-1').sourceSHA256='a'.repeat(64);
 const p=planReviewedSourceLook110(d);
 assert.equal(p.status,'original-photo-2d-fallback');
 assert.equal(p.sourceSHA256s.bottom,'a'.repeat(64));
 assert.equal(p.selectedPublicDenimSource,null);
});
test('PHOTO110 stale live session, owner rotation, generation increment and logout fail closed',()=>{
 const d=make();
 for(const live of [
  {...d.session,ownerId:'different-owner'},
  {...d.session,generation:2},
  {...d.session,authenticated:false},
  null
 ])assert.throws(()=>planReviewedSourceLook110({
  ...d,readCurrentSession:()=>live
 }),/PHOTO110/);
 for(const s of [
  {...d.session,ownerId:''},{...d.session,generation:-1},
  {...d.session,authenticated:false},{...d.session,generation:'1'}
 ])assert.throws(()=>planReviewedSourceLook110({...d,session:s}),/PHOTO110/);
});
test('PHOTO110 cross-owner source item, unreviewed photo or unsafe reconstructed claims rejected',()=>{
 for(const edit of [
  {ownerId:'wrong-person'},{ownerReviewed:false},
  {sourcePhotoOriginal:false},{photographic3DReconstructionApproved:true},
  {sourceSHA256:'bad'},{category:'Shoes'},{itemType:'Shorts'},
  {sourceId:null}
 ]){
  const d=make();
  Object.assign(d.indexed.byId.get('licensed-jeans-1'),edit);
  assert.throws(()=>planReviewedSourceLook110(d),/PHOTO110/,'wrong source: '+JSON.stringify(edit));
 }
});
test('PHOTO110 invalid duplicate, category swapped, excess or missing saved outfit slots rejected',()=>{
 for(const slots of [
  {top:'licensed-shirt',bottom:'licensed-shirt'},
  {top:'licensed-jeans-1',bottom:'licensed-shirt'},
  {top:'licensed-shirt',bottom:'not-owned'},
  {top:'licensed-shirt',bottom:'licensed-jeans-1',shoes:'licensed-shirt'},
  {top:'licensed-shirt'},
  [],{},null
 ]){
  const d=make();d.board={slots};
  assert.throws(()=>planReviewedSourceLook110(d),/PHOTO110/);
 }
});
test('PHOTO110 old source hash or source-selected denim cannot be reopened after altered indexed wardrobe',()=>{
 const d=make();
 const saved=planReviewedSourceLook110(d);
 assert.equal(requireUnchangedReviewedLook110(saved,d).selectedPublicDenimSource,'public');
 d.indexed.byId.get('licensed-jeans-1').sourceSHA256='a'.repeat(64);
 assert.throws(()=>requireUnchangedReviewedLook110(saved,d),/PHOTO110/);
});
test('PHOTO110 saved look reopening requires same exact owner and generation',()=>{
 const d=make();
 const saved=planReviewedSourceLook110(d);
 for(const patch of [{ownerId:'cross-owner'},{generation:2},{authenticated:false}]){
  const session={...d.session,...patch};
  assert.throws(()=>requireUnchangedReviewedLook110(saved,{
   ...d,session,readCurrentSession:()=>session
  }),/PHOTO110/);
 }
});
test('PHOTO112 saved look preserves only existing reviewed label and source-record identity, never predicts color',()=>{
 const d=make();
 const plan=planReviewedSourceLook110(d);
 assert.deepEqual(plan.reviewedColors,{top:'Black',bottom:'Blue'});
 assert.deepEqual(plan.sourceIds,{top:'licensed-shirt',bottom:'licensed-jeans-1'});
 assert.equal(plan.reviewedColorProvenance,'owner-reviewed-index-claim-not-independently-model-verified');
 assert.equal(Object.isFrozen(plan.reviewedColors),true);
 assert.equal(Object.isFrozen(plan.sourceIds),true);
 assert.equal(requireUnchangedReviewedLook110(plan,d).status,'verified-public-research-3d');
 assert.equal(plan.truePrivateWardrobe3DReady,false);
 assert.equal(plan.realSignedCloudRLSVerified,false);
 assert.equal(plan.familyAlpha,'HOLD');
});
test('PHOTO112 corrected reviewed color or new source record must revoke saved outfit, even if original JPEG SHA is unchanged',()=>{
 for(const owner of [RESEARCH_OWNER_110,'synthetic-private-color-owner']){
  for(const patch of [{color:'Navy'},{sourceId:'new-original-record-same-bytes'}]){
   const d=make(owner);
   const saved=planReviewedSourceLook110(d);
   const jeans=d.indexed.byId.get('licensed-jeans-1');
   const unchangedSHA=jeans.sourceSHA256;
   Object.assign(jeans,patch);
   assert.equal(jeans.sourceSHA256,unchangedSHA);
   assert.throws(()=>requireUnchangedReviewedLook110(saved,d),/PHOTO110/);
   const now=planReviewedSourceLook110(d);
   assert.equal(now.status,'original-photo-2d-fallback',
    'unapproved benchmark-label/source changes must not claim genuine 3D');
   assert.equal(now.originalPhotoNotReconstructed,true);
  }
 }
});
test('PHOTO112 refuse missing or unsafe reviewed color; never copy model guessed label into saved look',()=>{
 for(const color of [undefined,null,'',' Blue','Blue ','Blue\nRed','<script>','Very'.repeat(20),{},'Blue  Red']){
  const d=make();d.indexed.byId.get('licensed-jeans-1').color=color;
  assert.throws(()=>planReviewedSourceLook110(d),/PHOTO110/,'color '+String(color));
 }
 for(const patch of [
  {reviewedColors:undefined},{sourceIds:undefined},
  {reviewedColors:{top:'Black',bottom:'Navy'}},
  {sourceIds:{top:'licensed-shirt',bottom:'different-source'}}
 ]){
  const d=make('synthetic-private-source-owner');
  const saved=planReviewedSourceLook110(d);
  assert.throws(()=>requireUnchangedReviewedLook110({...saved,...patch},d),/PHOTO110/);
 }
});
test('PHOTO110 does not read private image bytes or network or persistent browser storage',()=>{
 const source=readFileSync('research/reviewed-closet-3d-handoff-110/owner-bound-look-policy.mjs','utf8');
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|getUserMedia|indexedDB|supabase|FormData/);
 for(const t of [
  "item.photographic3DReconstructionApproved!==true",
  "item.ownerReviewed===true&&item.sourcePhotoOriginal===true",
  "indexed.byId instanceof Map",
  "indexed.ownerId!==session.ownerId",
  "indexed.generation!==session.generation",
  "saved.sourceSHA256s.bottom!==next.sourceSHA256s.bottom",
  "originalPhotoNotReconstructed:!benchmark",
  "realSignedCloudRLSVerified:false"
 ])assert.ok(source.includes(t),'missing source-original gate '+t);
});
test('PHOTO110 P109 real source UI chooses full saved-look reconstruction only for licensed benchmark; ordinary original photo 2D fallback',()=>{
 const s=readFileSync('research/reviewed-closet-3d-handoff-110/reviewed-look-panel.mjs','utf8');
 for(const t of [
  "get('look110')!=='on'",
  "get('knee109')!=='on'",
  "planReviewedSourceLook110({",
  "requireUnchangedReviewedLook110(saved,{",
  "getElementById('review')",
  "host.cc110ResearchSelect?.(",
  "clear.click()",
  "mode='private-fallback'",
  "mode='restored-public'",
  "mode='owner-rotated'",
  "if(!e.isTrusted",
  "syntheticAccountOnly:true",
  "realAuthenticatedAccount:false",
  "customerPhotoBytesAccessible:false",
  "signedCloudRLSVerified:false"
 ])assert.ok(s.includes(t),'missing guarded real UI source '+t);
});
test('PHOTO110 actual UI 48px mobile tap and lifecycle cleanup, no personal photo or private cloud',()=>{
 const s=readFileSync('research/reviewed-closet-3d-handoff-110/reviewed-look-panel.mjs','utf8');
 for(const t of [
  "#cc110Buttons button{width:100%;min-height:48px",
  'aria-live="polite"',
  "host.addEventListener('pagehide',dispose,{once:true})",
  "observer.disconnect()",
  "doc.getElementById('status')",
  "readCurrentSession:()=>simulated",
  "guest.addEventListener('click',changeOwner)"
 ])assert.ok(s.includes(t),t);
 assert.doesNotMatch(s,/getUserMedia|localStorage|sessionStorage|navigator\.sendBeacon|XMLHttpRequest|supabase/i);
});
test('PHOTO110 source integration installer is only exact PR541 source-photo detached donor and actual original saved 3D index',()=>{
 const s=readFileSync('scripts/install-reviewed-closet-3d-handoff-110.mjs','utf8');
 for(const t of [
  "arg!=='.photo103-donor-541'",
  "df6885d6011cb33fb22dceb81a08f35a0ac4dd61",
  "research/three-d-69/index.html",
  "research/three-d-69/index-to-real-garment-demo.mjs",
  "research/reviewed-closet-3d-handoff-110",
  'cc110ResearchSession',
  'cc110ResearchIndex',
  'cc110ResearchSelect',
  "if(!ready||closed||!$('review').checked",
  "r.anatomicalSkeletonBones!==163"
 ])assert.ok(s.includes(t),t);
 assert.doesNotMatch(s,/git push|npm publish|deploy-pages|public\/app|supabase\/migrations/);
});
test('PHOTO110 actual Chromium original source 163-bone saved look screenshot, restored photo and synthetic owner boundary acceptance',()=>{
 const s=readFileSync('scripts/test-reviewed-closet-3d-handoff-110-browser.mjs','utf8');
 for(const t of [
  'cc110LookState',
  'cc110Save',
  'cc110Reopen',
  'cc110Private',
  'cc110OwnerSwitch',
  'cc110ResearchSelect',
  'cc109Both8',
  'cc69Diagnostics',
  'assert.equal(diff,0',
  'assert.equal(frames.length,16)',
  'assert.equal(scenarios.length,4)',
  'realSignedCloudRLSVerified:false'
 ])assert.ok(s.includes(t),t);
});
test('PHOTO110 independent original real WebGL 16 image SHA audit must keep release gates explicitly false',()=>{
 const s=readFileSync('scripts/audit-reviewed-closet-3d-handoff-110.mjs','utf8');
 for(const t of [
  'assert.equal(r.scenarios.length,4)',
  'assert.equal(r.screenshots.length,16)',
  "createHash('sha256')",
  'assert.equal(r.originalPhoto2DFallbackForUnsupportedPersonalClothing,true)',
  'independentOwnerGenerationSourceGuardDemonstratedWithSyntheticOwner:true',
  'actualLiveSignedAccountRLSVerified:false',
  'actualPhysicalMobileHardwareTested:false',
  "familyAlpha:'HOLD'"
 ])assert.ok(s.includes(t),t);
});
test('PHOTO110 strict exact source parent and 8 allowed research files no deploy',()=>{
 const s=readFileSync('.github/workflows/reviewed-closet-3d-handoff-110-no-deploy.yml','utf8');
 for(const t of [
  'BASE=c5930d200b8bbd1632b188fb5216bc233cffae8d',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/install-denim-mobile-pose-controls-109.mjs .photo103-donor-541',
  'node scripts/install-reviewed-closet-3d-handoff-110.mjs .photo103-donor-541',
  'node scripts/test-denim-mobile-pose-controls-109-browser.mjs',
  'node scripts/test-reviewed-closet-3d-handoff-110-browser.mjs',
  'node scripts/audit-reviewed-closet-3d-handoff-110.mjs',
  'test "$(wc -l </tmp/photo110-allowed)" -eq 8'
 ])assert.ok(s.includes(t),t);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
