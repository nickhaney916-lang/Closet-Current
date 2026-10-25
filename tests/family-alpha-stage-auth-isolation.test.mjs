import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 STAGE_ID,STAGE_BASE,PROD_ID,PROD_BASE,SRC,OUT,stageConfigScript,
 APPROVED_STAGE_CALLBACK,validRedirect,
 stageAuthSource,stageCloudSource,stageAvatarPreflightSource,
 stageIndexSource,stagePwaSource,assertStagingAuthCandidate
} from '../scripts/build-family-alpha-staging-auth-hold.mjs';

const files=['public/auth.js','public/cloud-backup.js','public/family-alpha-2d-auth-preflight.mjs','dist/index.html'];
async function contents(){return Promise.all(files.map(p=>readFile(p,'utf8')));}
test('staged URL routes to real separate Closet Current Staging ref, never Drive Duel or production',()=>{
 assert.equal(STAGE_ID,'fbnplztkbsteuzrmbgib');
 assert.equal(STAGE_BASE,'https://fbnplztkbsteuzrmbgib.supabase.co');
 assert.equal(PROD_ID,'hlkgymugtfbirlpunsra');
 assert.notEqual(STAGE_BASE,PROD_BASE);
 assert.notEqual(SRC,OUT);
});
test('staged auth and cloud clients share ONE stage project, remain guarded, and never copy production session key',async()=>{
 const [auth,cloud,preflight,index]=await contents();
 const a=stageAuthSource(auth),b=stageCloudSource(cloud),p=stageAvatarPreflightSource(preflight),html=stageIndexSource(index);
 assert.ok(a.includes("const URL=stage.base"));
 assert.ok(b.includes('BASE=stage.base,KEY=stage.key'));
 assert.ok(a.includes("const STORE='closet-alpha-staging-auth-v1'"));
 assert.ok(a.includes('stage.ready!==true'));
 assert.ok(b.includes('stage.ready!==true'));
 assert.ok(a.includes('Staging sign-in unavailable'));
 assert.ok(b.includes('Staging cloud unavailable'));
 assert.ok(p.includes(STAGE_BASE+'/auth/v1/user'));
 assert.ok(![a,b,p].some(x=>x.includes(PROD_BASE)));
 assert.ok(html.indexOf('alpha-stage-config.js')<html.indexOf('src="auth.js'));
 assert.ok(!html.includes('src="alpha-stage-config.js" src="'));
});
test('unapproved stage config is HOLD and cannot accidentally sign in on a real website',()=>{
 const src=stageConfigScript();
 assert.match(src,/"key":""/);
 assert.match(src,/"redirect":""/);
 assert.match(src,/HOLD-NO-CALLBACK-OR-KEY/);
 assert.match(src,/releaseGate/);
 assert.match(src,/location\.origin==='https:\/\/closet-current-staging\.pages\.dev'/);
 assert.match(src,/location\.pathname==='\/'/);
 assert.match(src,/Object\.defineProperty\(window,'__CLOSET_ALPHA_STAGE_AUTH__'/);
 assert.doesNotMatch(src,/nickhaney916-lang\.github\.io|hlkgymugtfbirlpunsra/);
});
test('production, broken, non-HTTPS or missing staging callback/keys refuse an enabled QA config',()=>{
 for(const url of [
  'http://closet-alpha.example.com/','https://nickhaney916-lang.github.io/Closet-Current/',
  'https://localhost/','https://alpha.example.com/?secret=abc',
  'https://alpha.example.com/#frag','https://alpha.example.com/redirect',
  'https://user:pass@alpha.example.com/',
  'https://closet-current.pages.dev/',
  'https://pilot-access-check.closet-current-staging.pages.dev/',
  'https://a15254d6.closet-current-staging.pages.dev/',
  'https://closet-current-staging.pages.dev.evil.example/',
  'https://closet-current-staging.pages.dev/Closet-Current/',
  'https://closet-current-staging.pages.dev/?next=/'
 ])assert.throws(()=>stageConfigScript({
  approvedRedirect:url,publicKey:'sb_publishable_SYNTHETIC_123456',
  enableForTesting:true
 }),/Invalid staging callback/);
 assert.throws(()=>stageConfigScript({
  approvedRedirect:'https://alpha.example.com/',publicKey:'wrong-key',enableForTesting:true
 }),/Invalid staging callback or publishable public key/);
 assert.throws(()=>stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,enableForTesting:true
 }),/required together/);
 assert.throws(()=>stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,publicKey:'sb_publishable_SYNTHETIC_123456'
 }),/require explicit isolated test path/);
});
test('even explicit isolated QA needs correct HTTPS host and a separate publishable key',()=>{
 const src=stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,
  publicKey:'sb_publishable_SYNTHETIC_ONLY_12345678',enableForTesting:true
 });
 assert.match(src,/closet-current-staging\.pages\.dev/);
 assert.match(src,/location\.protocol==='https:'/);
 assert.match(src,/fbnplztkbsteuzrmbgib/);
 assert.doesNotMatch(src,/hlkgymugtfbirlpunsra|nickhaney916-lang\.github\.io/);
});
test('staged PWA never registers a service worker that could cache production credentials',()=>{
 const out=stagePwaSource();
 assert.match(out,/installApp/);
 assert.doesNotMatch(out,/register\(|serviceWorker|caches\./);
});
test('CI isolated staging Auth artifact has only intended changes and cannot be deployed as approved',async()=>{
 const m=await assertStagingAuthCandidate();
 assert.equal(m.releaseGate,'HOLD');
 assert.equal(m.routingReadyForQa,false);
 assert.equal(m.realAuthTested,false);
 assert.equal(m.publishingAuthorized,false);
 assert.equal(m.productionArtifactPreserved,true);
 assert.equal(m.protectedAccessVerified,false);
 const [auth,cloud,preflight,config,manifest,ordinary] = await Promise.all([
  readFile(OUT+'/auth.js','utf8'),readFile(OUT+'/cloud-backup.js','utf8'),
  readFile(OUT+'/family-alpha-2d-auth-preflight.mjs','utf8'),
  readFile(OUT+'/alpha-stage-config.js','utf8'),
  readFile(OUT+'/alpha-stage-auth-manifest.json','utf8'),
  readFile('dist/auth.js','utf8')
 ]);
 assert.ok([auth,cloud,preflight,config].every(x=>!x.includes(PROD_BASE)));
 assert.ok(ordinary.includes(PROD_BASE),'Existing normal build must not change');
 assert.equal(JSON.parse(manifest).emailRedirect,null);
});

test('only exact staging Pages root can be activated, even with a public QA key',()=>{
 assert.equal(validRedirect(APPROVED_STAGE_CALLBACK),APPROVED_STAGE_CALLBACK);
 for(const url of [
   'https://closet-current.pages.dev/',
   'https://pilot-access-check.closet-current-staging.pages.dev/',
   'https://4f4bd85e.closet-current-staging.pages.dev/',
   'https://closet-current-staging.pages.dev.evil.example/',
   'https://closet-current-staging.pages.dev/Closet-Current/',
   'https://closet-current-staging.pages.dev/?s=1',
   'https://closet-current-staging.pages.dev/#invite',
   'http://closet-current-staging.pages.dev/'
 ]){
  assert.equal(validRedirect(url),null,url);
  assert.throws(()=>stageConfigScript({
   approvedRedirect:url,publicKey:'sb_publishable_SYNTHETIC_ONLY_12345678',
   enableForTesting:true
  }),/Invalid staging callback/,url);
 }
 const src=stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,
  publicKey:'sb_publishable_SYNTHETIC_ONLY_12345678',enableForTesting:true
 });
 assert.match(src,/candidate.redirect==='https:\/\/closet-current-staging\.pages\.dev\/'/);
 assert.match(src,/location.pathname==='\/'/);
 assert.doesNotMatch(src,/pilot-access-check|alpha-preview\.example\.com|closet-current.pages.dev\/|hlkgymugtfbirlpunsra/);
});
