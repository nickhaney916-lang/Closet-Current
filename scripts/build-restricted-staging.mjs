#!/usr/bin/env node
// Fail-closed STAGING-ONLY static bundle builder. Never publishes or connects
// to Supabase or Cloudflare; no paid inference is possible in this bundle.
// All input values are PUBLIC browser configuration, never API secrets.
import assert from 'node:assert/strict';
import {readFile,writeFile,cp,readdir} from 'node:fs/promises';
import {writeAtomicStagingBundle} from './atomic-staging-output.mjs';
import {createStagingAssetSeal,verifyStagingAssetSeal} from './staging-asset-seal.mjs';
import {createHash} from 'node:crypto';
import {stagingSupportLinks,stagingNavigationWorker} from './staging-support-navigation.mjs';
import {execFileSync} from 'node:child_process';

const PROD='hlkgymugtfbirlpunsra';
const OTHER_APP='qlwotqbqxpgkheitsboe';
const PROD_URL='https://'+PROD+'.supabase.co';
const PROD_KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO';
const OLD_CALLBACK='https://nickhaney916-lang.github.io/Closet-Current/';
const BASE='dist';
const OUTPUT='staging-dist';
function configFromEnv(env){
 const origin=new URL(env.CLOSET_STAGING_APP_ORIGIN||'');
 const backend=new URL(env.CLOSET_STAGING_SUPABASE_URL||'');
 const key=env.CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY||'';
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||
  origin.port||origin.pathname!=='/'||origin.hostname==='closet-current.pages.dev'||
  origin.hostname.endsWith('.github.io')||
  !((origin.hostname.endsWith('.closet-current-staging.pages.dev')&&
     origin.hostname!=='closet-current-staging.pages.dev')||
    (origin.hostname.startsWith('staging.')&&
      !origin.hostname.endsWith('.pages.dev'))))
  throw Error('Use an HTTPS restricted staging preview alias (on a separate Pages project) or staging. custom subdomain');
 if(backend.protocol!=='https:'||backend.port||backend.username||backend.password||
  backend.pathname!=='/'||backend.search||backend.hash||
  !/^[a-z0-9]{20}\.supabase\.co$/.test(backend.hostname))
  throw Error('Use an isolated Supabase project URL');
 const ref=backend.hostname.split('.')[0];
 if([PROD,OTHER_APP].includes(ref))throw Error('Staging may never access the existing Closet Current or Drive Duel project');
 if(!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)||key===PROD_KEY)
  throw Error('Only a different PUBLIC staging Supabase publishable key is permitted');
 return {appOrigin:origin.href,backendURL:backend.origin,publicKey:key,projectRef:ref};
}
function replaceExactly(source,oldValue,newValue,count,label){
 const n=source.split(oldValue).length-1;
 assert.equal(n,count,'Unexpected '+label+' source signature: '+n);
 return source.split(oldValue).join(newValue);
}
async function applyFile(dir,file,transform){
 const full=dir+'/'+file,source=await readFile(full,'utf8');
 await writeFile(full,transform(source));
}
async function walk(dir,prefix=''){
 const out=[];
 for(const ent of await readdir(dir,{withFileTypes:true})){
  const rel=prefix+ent.name;
  if(ent.isDirectory())out.push(...await walk(dir+'/'+ent.name,rel+'/'));
  else out.push(rel);
 }
 return out;
}
async function main(){
 assert.equal(process.argv.length,2,'Usage: staging env variables then node scripts/build-restricted-staging.mjs');
 const proof=await writeAtomicStagingBundle(OUTPUT,async stageDir=>{
  const config=configFromEnv(process.env);
  execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
  await cp(BASE,stageDir,{recursive:true});
 await applyFile(stageDir,'auth.js',source=>{
  // Remove legacy cross-origin advice: staging callbacks never use GitHub Pages.
  const start=source.indexOf(' function emailOriginNotice(){');
  const end=source.indexOf(' const STORE=',start);
  assert.ok(start>0&&end>start,'Auth redirect notice source layout changed');
  let next=source.slice(0,start)+" function emailOriginNotice(){return '';}"+"\n"+source.slice(end);
  next=replaceExactly(next,"const URL='"+PROD_URL+"';","const URL='"+config.backendURL+"';",1,'auth backend');
  next=replaceExactly(next,"const KEY='"+PROD_KEY+"';","const KEY='"+config.publicKey+"';",1,'auth public key');
  next=replaceExactly(next,"const APP_URL='"+OLD_CALLBACK+"';",
    "const APP_URL='"+config.appOrigin+"';",1,'auth callback');
  return next;
 });
 await applyFile(stageDir,'cloud-backup.js',source=>{
  let x=replaceExactly(source,"BASE='"+PROD_URL+"'","BASE='"+config.backendURL+"'",1,'backup backend');
  return replaceExactly(x,"KEY='"+PROD_KEY+"'","KEY='"+config.publicKey+"'",1,'backup public key');
 });
 await applyFile(stageDir,'ai-tryon.js',source=>{
  let x=replaceExactly(source,PROD_URL+'/functions/v1/ai-try-on',
    config.backendURL+'/functions/v1/ai-try-on',1,'try-on backend');
  return replaceExactly(x,'async function tryOnRequest(token,body,signal){',
   "async function tryOnRequest(token,body,signal){\n  throw Error('Paid AI is disabled for the restricted staging pilot.');",
   1,'paid inference block');
 });
 await applyFile(stageDir,'index.html',source=>{
  assert.ok(source.includes('<body>'),'Expected source app body');
  return replaceExactly(source,'<body>',
   '<body><div role="status" id="stagingBanner" style="background:#38215f;color:white;padding:12px 16px;text-align:center;font:700 15px system-ui">PRIVATE STAGING — DISPOSABLE TEST ACCOUNTS ONLY. NO PAID AI.</div>',
   1,'staging watermark');
 });
 const index=await readFile(stageDir+'/index.html','utf8');
 const match=index.match(/\?v=([a-f0-9]{12})/);
 assert.ok(match,'App build must have a versioned release');
 const previous=match[1];
 const version=createHash('sha256').update(await readFile('scripts/staging-support-navigation.mjs','utf8')).update('restricted-staging\0'+previous+'\0'+
  config.backendURL+'\0'+config.publicKey+'\0'+config.appOrigin).digest('hex').slice(0,12);
 for(const filename of ['index.html','sw.js','phone-photo-check.html','saved-closet-audit.html']){
  await applyFile(stageDir,filename,text=>text.split('?v='+previous).join('?v='+version)
   .split('closet-current-'+previous).join('closet-current-'+version)
   .split('"'+previous+'"').join('"'+version+'"'));
 }
 // A preview must never own or evict a production-named installed cache,
 // even if an operator later reconfigures hosting. Keep actual app assets
 // and the staging-only fingerprint unchanged.
 await applyFile(stageDir,'sw.js',source=>{
  let next=replaceExactly(source,"const CACHE='closet-current-"+version+"';",
    "const CACHE='closet-current-staging-"+version+"';",1,'isolated staging worker cache name');
  return replaceExactly(next,"key.startsWith('closet-current-')",
    "key.startsWith('closet-current-staging-')",1,'isolated staging cache cleanup');
 });
 await applyFile(stageDir,'index.html',stagingSupportLinks);
 await applyFile(stageDir,'sw.js',stagingNavigationWorker);
 // These headers are NOT access control; Cloudflare Access policy must
 // be independently enabled and tested before serving ANY staging bundle.
 await writeFile(stageDir+'/_headers',
  '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n');
 await writeFile(stageDir+'/robots.txt','User-agent: *\nDisallow: /\n');
 const paths=await walk(stageDir);
 for(const name of paths.filter(x=>/\.(?:html|js|mjs|json|css|webmanifest|txt)$/.test(x))){
  const text=await readFile(stageDir+'/'+name,'utf8');
  for(const forbidden of [PROD,OTHER_APP,PROD_KEY,OLD_CALLBACK,'closet-current.pages.dev']){
   assert.ok(!text.includes(forbidden),'Existing live service or legacy origin detected in staging file '+name);
  }
 }
 const result={format:'closet-current-restricted-staging-preflight',version:1,
  productionSourceChanged:false,
  backendProjectRef:config.projectRef,
  stagingOrigin:config.appOrigin,
  bundleFingerprint:version,
  allKnownLiveAuthBackupAndTryonEndpointsRemoved:true,
  paidAIHardBlocked:true,
  physicalDeviceTests:0,independentGarmentAccuracy:null,
  privateCloudflareAccessPolicyVerified:false,
  separateHostedSupabaseProjectVerifiedByOwner:false,
  externalStagingEmailConfirmed:false,
  authorizationToDeployProduction:false,
  restrictedStagingDeployed:false,
  productionReleaseApproved:false,
  releasePromotion:'BLOCKED'};
 await writeFile(stageDir+'/staging-preflight.json',JSON.stringify(result,null,2)+'\n');
 // Hash all final bytes, including binary icons/images, before atomic rename.
 await createStagingAssetSeal(stageDir);
 await verifyStagingAssetSeal(stageDir);
 return result;
 });
 console.log('RESTRICTED_STAGING_PREFLIGHT '+JSON.stringify(proof));
}
main().catch(e=>{console.error('STAGING_CONFIG_REJECTED '+e.message);process.exitCode=1;});
