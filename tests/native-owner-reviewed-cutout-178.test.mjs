import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID,webcrypto} from 'node:crypto';
import {researchMode178,createOwnerReviewedCloudTransport178}
 from '../research/native-owner-reviewed-cutout-178/owner-transport.mjs';
const loop=(search='?ownerReview145=research&ownerReview146=research&ownerCutout178=research')=>
 ({protocol:'http:',hostname:'127.0.0.1',origin:'http://127.0.0.1:46381',search});
function fixture(){
 const ownerId=randomUUID(),loc=loop(),auth={
  user:{id:ownerId},
  assertCurrent(){if(this.user?.id!==ownerId)throw Error('owner change');},
  async getAccessToken(){return 'p146-synthetic-local-only-'+ownerId;}
 };
 return {auth,db:{name:'closet-current-user-'+ownerId},loc,
  engine:{mapImages:async()=>{},validateDocument:()=>{}},
  legacy:{ownerReviewHold145:()=>true},subtle:webcrypto.subtle,
  fetcher:async()=>{throw Error('live remote call must never occur in unit gate');}};
}
test('P178 only enables exact THREE flags on explicit HTTP loopback, never production/staging HTTPS or arbitrary host',()=>{
 for(const host of ['127.0.0.1','localhost','[::1]'])
  assert.equal(researchMode178({...loop(),hostname:host}),true);
 for(const loc of [
  {...loop(),protocol:'https:'},{...loop(),hostname:'hlkgymugtfbirlpunsra.supabase.co'},
  {...loop(),hostname:'fbnplztkbsteuzrmbgib.supabase.co'},
  {...loop(),hostname:'myevil.local'},loop('?ownerReview145=research&ownerReview146=research'),
  loop('?ownerReview145=research&ownerCutout178=research'),
  loop('?ownerReview146=research&ownerCutout178=research'),
  null
 ])assert.equal(researchMode178(loc),false);
});
test('P178 refuses legacy writer still active, missing native engine, owner mismatch and absent source hash',()=>{
 for(const change of [
  f=>f.legacy.ownerReviewHold145=()=>false,
  f=>f.engine=null,
  f=>f.engine.mapImages=null,
  f=>f.engine.validateDocument=null,
  f=>f.db.name='closet-current-user-'+randomUUID(),
  f=>f.auth.user.id=randomUUID(),
  f=>f.subtle=null,
  f=>f.fetcher=null
 ]){
  const f=fixture();change(f);
  assert.throws(()=>createOwnerReviewedCloudTransport178(f),/P178/);
 }
});
test('P178 rejecting non synthetic real signed Supabase token BEFORE network, without P129 owner request',async()=>{
 const f=fixture(),id=f.auth.user.id;
 f.auth.getAccessToken=async()=> 'real-jwt-without-isolated-owner-fence';
 const bridge=createOwnerReviewedCloudTransport178(f);
 try{await assert.rejects(bridge.local(),/real hosted or unrecognized token refused/);}
 finally{bridge.revoke();}
 assert.equal(f.engine.__p177Installed,undefined);
});
test('P178 when owner revoked, native mapper restored and all cloud reads fail closed',async()=>{
 const f=fixture(),before=f.engine.mapImages,bridge=createOwnerReviewedCloudTransport178(f);
 assert.equal(bridge.status().actualNativeEngineGuard,true);
 assert.equal(bridge.status().shippingReleaseAuthorized,false);
 assert.equal(bridge.status().realSignedJwtVerified,false);
 assert.notEqual(f.engine.mapImages,before);
 bridge.revoke();
 assert.equal(f.engine.mapImages,before);
 assert.equal(f.engine.__p177Installed,undefined);
 await assert.rejects(bridge.remote(),/revoked/);
 assert.throws(()=>bridge.status(),/revoked/);
});
test('P178 real owner account bridge opt-in preflights both JPEGs and confirms readback before declaring successful backup',()=>{
 const path='research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs';
 const bridge=readFileSync(path,'utf8');
 for(const term of [
  "get('ownerCutout178')==='research'",
  "import('../native-owner-reviewed-cutout-178/owner-transport.mjs')",
  'cutout178=createOwnerReviewedCloudTransport178',
  "engine:globalThis.window?.ClosetBackupEngine",
  'const preflight=cutout178?await cutout178.local():null',
  'revision:r.revision,document:preflight.originalDocument',
  'if(!proved.originalJPEGShaAndCutoutVerified)',
  'await cutout178.remote({revision:v.remoteRevision})',
  'cutout178?.revoke()'
 ])assert.ok(bridge.includes(term),term);
 assert.ok(bridge.includes('backupService.backupWithReviewedConsent()'));
 assert.ok(bridge.includes('restoreService.restoreWithOwnerReview()'));
 assert.ok(bridge.includes('legacy?.ownerReviewHold145?.()===true'));
});
test('P178 original source and crop owner-private cloud map independent P126/177 SHA, no fabricated private 3D',()=>{
 const src=readFileSync('research/native-owner-reviewed-cutout-178/owner-transport.mjs','utf8');
 for(const term of ['installNativeCloudCutout177','validateRestore01',
  'await engine.mapImages(input','await engine.mapImages(row.document',
  "source=installNativeCloudCutout177",
  'BEFORE showing destructive consent',
  "same(doc,expected.document)",
  "new URLSearchParams(loc.search)",
  "response=await fetcher(loc.origin+path", // exact local scope only
  "p146-synthetic-local-only-",
  "shippingReleaseAuthorized:false",
  "realSignedJwtVerified:false",
  "familyAlpha:'HOLD'"
 ])assert.ok(src.includes(term),term);
 const browser=readFileSync('scripts/test-native-owner-reviewed-cloud-ui-146-browser.mjs','utf8');
 for(const term of ["process.env.P178_NATIVE==='1'",
  '&ownerCutout178=research',
  'activated.actualNativeEngineGuard',
  'state178.localVerified,1',
  'state178.remoteVerified,1',
  'guard.remoteVerified,3',
  'P178_NATIVE_OWNER_REVIEWED_SOURCE_CUTOUT_BROWSER'])
  assert.ok(browser.includes(term),term);
});
test('P178 live production, staging, Supabase schema and private garment source untouched by integration',()=>{
 const w=readFileSync('.github/workflows/native-owner-reviewed-cutout-178-no-deploy.yml','utf8');
 for(const term of ['BASE=e67b75eeac918dd91a0edf142e0018f6a0743c60',
  'git diff --exit-code "$BASE" HEAD -- public supabase',
  'P178_NATIVE=1 node scripts/test-native-owner-reviewed-cloud-ui-146-browser.mjs',
  'node scripts/test-native-owner-reviewed-cloud-ui-146-browser.mjs',
  "node --test tests/*.test.cjs tests/*.test.mjs",
  'scripts/test-two-owner-postgres-rls-128.mjs',
  'original-review','familyAlpha'])
  assert.ok(w.includes(term),term);
});
