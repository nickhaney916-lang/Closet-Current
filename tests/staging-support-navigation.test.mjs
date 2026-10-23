import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stagingNavigationWorker,stagingSupportLinks} from '../scripts/staging-support-navigation.mjs';
import {createStagingAssetSeal} from '../scripts/staging-asset-seal.mjs';
import {auditStagingSupportRoutes} from '../scripts/audit-staging-support-routes.mjs';
const origin='https://pilot-access-check.closet-current-staging.pages.dev';
const raw=await readFile('public/sw.js','utf8');
function worker(saved){
 const handlers={};let key;
 const source=stagingNavigationWorker(raw.replace('__VERSION__','123456789abc').replace('__ASSETS__',JSON.stringify(['index.html','pilot-data-notice.html','saved-closet-audit.html','phone-photo-check.html','auth.js?v=123456789abc'])));
 const c={URL,Set,Map,Response,Error,self:{registration:{scope:origin+'/'},location:{origin},addEventListener(n,fn){handlers[n]=fn;}},caches:{async open(){return {async match(v){key=typeof v==='string'?v:v.url;return saved;}}}}};
 vm.runInNewContext(source,c);
 return {async request(path,mode='navigate',method='GET'){
  let reply;handlers.fetch({request:{url:origin+path,method,mode},respondWith(v){reply=v;}});
  return {intercepted:reply!==undefined,response:await reply,key};
 }};
}
function redirected(url,type='basic',contentType='text/html; charset=utf-8'){
 const r=new Response('EXACT_REVIEWED_HTML',{headers:{'Content-Type':contentType,'X-Release':'pinned'}});
 Object.defineProperties(r,{redirected:{value:true},url:{value:url},type:{value:type}});return r;
}
for(const route of ['pilot-data-notice','saved-closet-audit','phone-photo-check'])
 test('canonical '+route+' and .html navigation reuse exact cached bytes without redirect history',async()=>{
  for(const path of ['/'+route,'/'+route+'.html']){
   const h=worker(redirected(origin+'/'+route)),{response,key}=await h.request(path);
   assert.equal(key,origin+'/'+route+'.html');assert.equal(response.status,200);
   assert.equal(response.redirected,false);assert.equal(response.headers.get('X-Release'),'pinned');
   assert.equal(await response.text(),'EXACT_REVIEWED_HTML');
  }
 });
for(const destination of [origin+'/cdn-cgi/access/login',origin+'/other-page','https://access.invalid/login'])
 test('cached unexpected or Access redirect refuses normalization: '+destination,async()=>{
  const {response}=await worker(redirected(destination)).request('/pilot-data-notice.html');
  assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/EXACT_REVIEWED_HTML/);
 });
test('opaque/non-HTML redirects, missing cache and private/POST requests remain fail-closed',async()=>{
 for(const saved of [undefined,redirected(origin+'/pilot-data-notice','cors'),redirected(origin+'/pilot-data-notice','basic','text/plain')]){
  const {response}=await worker(saved).request('/pilot-data-notice.html');assert.equal(response.status,503);
 }
 assert.equal((await worker().request('/private-photo.jpg')).intercepted,false);
 assert.equal((await worker().request('/pilot-data-notice.html','navigate','POST')).intercepted,false);
 assert.equal((await worker().request('/nonexistent')).intercepted,false);
});
test('same-tab staging link transform changes support targets only and source layout drift fails',()=>{
 const input='<a href="pilot-data-notice.html" target="_blank" rel="noopener">notice</a><a href="https://example.com" target="_blank">external</a>';
 assert.equal(stagingSupportLinks(input),'<a href="pilot-data-notice.html" rel="noopener">notice</a><a href="https://example.com" target="_blank">external</a>');
 assert.throws(()=>stagingNavigationWorker('unrecognized source'),/Unexpected/);
});
async function fixture(run){
 const root=await mkdtemp(join(tmpdir(),'cc-route185-')),dir=join(root,'bundle');await mkdir(dir);
 const pages=['pilot-data-notice.html','saved-closet-audit.html','phone-photo-check.html'];
 const contents={
  'index.html':pages.map(p=>'<a href="'+p+'">Support</a>').join(''),
  ...Object.fromEntries(pages.map(p=>[p,'<a href="./">Back</a><script src="page.js?v=123456789abc"></script>'])),
  'page.js':'/* safe offline fixture */',
  'auth.js':"const URL='https://fbnplztkbsteuzrmbgib.supabase.co'",
  'cloud-backup.js':"BASE='https://fbnplztkbsteuzrmbgib.supabase.co'",
  'ai-tryon.js':"throw Error('Paid AI is disabled for the restricted staging pilot.')",
  'staging-preflight.json':JSON.stringify({backendProjectRef:'fbnplztkbsteuzrmbgib',stagingOrigin:origin+'/',bundleFingerprint:'123456789abc',paidAIHardBlocked:true,productionReleaseApproved:false})};
 const seal=async()=>{await rm(join(dir,'staging-asset-seal.json'),{force:true});await createStagingAssetSeal(dir);};
 try{for(const [p,s]of Object.entries(contents))await writeFile(join(dir,p),s);await seal();await run({dir,seal});}
 finally{await rm(root,{recursive:true,force:true});}
}
test('inventory is deterministic, checks return links and never grants hosted approval',async()=>{
 await fixture(async({dir})=>{const a=await auditStagingSupportRoutes(dir),b=await auditStagingSupportRoutes(dir);assert.deepEqual(a,b);assert.equal(a.requiredPages.length,4);assert.equal(a.hostedRoutesVerified,false);assert.equal(a.deployAuthorized,false);});
});
test('resealed wrong-case link, stale script query and missing dependencies are rejected',async()=>{
 for(const href of ['Pilot-data-notice.html','page.js?v=ffffffffffff','missing.js'])await fixture(async({dir,seal})=>{
  await writeFile(join(dir,'pilot-data-notice.html'),'<a href="./">Back</a><script src="'+href+'"></script>');await seal();
  await assert.rejects(auditStagingSupportRoutes(dir),/Broken or wrong-case|Stale versioned/);
 });
});
test('corrupt/deleted required page and wrong nested bundle root fail inspection',async()=>{
 await fixture(async({dir})=>{await writeFile(join(dir,'saved-closet-audit.html'),'altered');await assert.rejects(auditStagingSupportRoutes(dir),/changed asset/);});
 await fixture(async({dir,seal})=>{await rm(join(dir,'pilot-data-notice.html'));await seal();await assert.rejects(auditStagingSupportRoutes(dir),/Missing root standalone/);});
 await fixture(async({dir})=>{await assert.rejects(auditStagingSupportRoutes(join(dir,'nested')));});
});
