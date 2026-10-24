/**
 * Family Alpha staging-only AUTH/BACKUP routing candidate.
 *
 * Separate output from ordinary dist/ and from previously audited photo
 * candidate. NEVER deploy this folder or enable staging host access without
 * explicit owner authorization. Default build is intentionally UNUSABLE.
 *
 * Staging project reference is public metadata, NOT a permission credential.
 * Publishable key and APPROVED https callback must be explicitly supplied
 * at build time for a later authorized dry-run; CI never supplies either.
 * The project URL, Auth callback and backup route are one atomic selection.
 */
import {createHash} from 'node:crypto';
import {readFile,writeFile,cp,rm,readdir,stat} from 'node:fs/promises';
import {resolve,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {assertCandidate,listFiles} from './build-family-alpha-staging.mjs';
const run=promisify(execFile);
export const STAGE_ID='fbnplztkbsteuzrmbgib';
export const PROD_ID='hlkgymugtfbirlpunsra';
export const STAGE_BASE='https://'+STAGE_ID+'.supabase.co';
export const PROD_BASE='https://'+PROD_ID+'.supabase.co';
export const SRC='dist-family-alpha-candidate';
export const OUT='dist-family-alpha-staging-auth-hold';
export const CHANGED=['index.html','auth.js','cloud-backup.js','family-alpha-2d-auth-preflight.mjs','pwa.js','alpha-stage-config.js','alpha-stage-auth-manifest.json'];
const CONTENT_FENCE=/^dist-family-alpha-staging-auth-hold$/;
const sha=x=>createHash('sha256').update(x).digest('hex');
function replaceOnce(text,oldValue,newValue){
 const pieces=text.split(oldValue);
 if(pieces.length!==2)throw Error('Staging auth expected exactly one original: '+oldValue.slice(0,90));
 return pieces.join(newValue);
}
function validRedirect(url){
 if(typeof url!=='string'||!url)return null;
 try{
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||!parsed.hostname||parsed.username||parsed.password||
   parsed.search||parsed.hash||parsed.port||
   !['/','/Closet-Current/'].includes(parsed.pathname)||
   parsed.hostname==='nickhaney916-lang.github.io'||
   parsed.hostname==='localhost'||parsed.hostname.endsWith('.invalid')===false&&
    parsed.hostname.endsWith('.github.io'))
   return null;
  return parsed.href;
 }catch{return null;}
}
export function stageConfigScript({approvedRedirect,publicKey,enableForTesting=false}={}){
 const redirect=validRedirect(approvedRedirect);
 const key=typeof publicKey==='string'&&/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(publicKey)?publicKey:'';
 // The default file is an inert staging AUTH contract. It includes ZERO
 // production or stage secrets and cannot sign anyone in.
 if((approvedRedirect&&!redirect)||(publicKey&&!key))
  throw Error('Invalid staging callback or publishable public key');
 if(Boolean(redirect)!==Boolean(key)&&enableForTesting)
  throw Error('Both staged Auth callback and publishable key are required together');
 if(enableForTesting!==true&&(redirect||key))
  throw Error('Approved host/key cannot be embedded by default; require explicit isolated test path');
 const config={projectRef:STAGE_ID,base:STAGE_BASE,
  key:enableForTesting?key:'',redirect:enableForTesting?redirect:'',
  intent:enableForTesting?'explicit-qa-only':'HOLD-NO-CALLBACK-OR-KEY',
  releaseGate:'HOLD'};
 return "'use strict';\n// Generated staging AUTH config. NEVER deploy without Access + redirect approval.\n"+
  "(function(){const candidate=Object.freeze("+JSON.stringify(config)+");\n"+
  " const sameHost=Boolean(candidate.redirect)&&location.origin===new URL(candidate.redirect).origin;\n"+
  " const ready=candidate.intent==='explicit-qa-only'&&location.protocol==='https:'&&"+
   "sameHost&&candidate.key.startsWith('sb_publishable_')&&"+
   "candidate.base==='https://"+STAGE_ID+".supabase.co'&&"+
   "candidate.releaseGate==='HOLD';\n"+
  " const value=Object.freeze({...candidate,ready:Boolean(ready)});\n"+
  " Object.defineProperty(window,'__CLOSET_ALPHA_STAGE_AUTH__',"+
   "{value,writable:false,configurable:false,enumerable:false});\n})();\n";
}
const safeAuthGuard=` const stage=window.__CLOSET_ALPHA_STAGE_AUTH__;
 if(!stage||stage.ready!==true||stage.base!=='${STAGE_BASE}'||
    stage.releaseGate!=='HOLD'||!stage.redirect.startsWith(location.origin+'/')||
    location.protocol!=='https:'){
  // A missing approved redirect/key MUST NOT silently fall back to the
  // production Supabase account or a previous device's local Auth token.
  const auth=document.getElementById('authGate'),shell=document.getElementById('appShell');
  if(auth)auth.hidden=false;if(shell)shell.hidden=true;
  const message=document.getElementById('authStatus');
  if(message)message.textContent='Family Alpha staging sign-in is not enabled. Private staging verification is required.';
  window.closetAuth={user:null,ready:new Promise(()=>{}),
   getSessionGeneration:()=>0,getPublicKey:()=>'',getAccessToken:async()=>{throw Error('Staging sign-in unavailable');}};
  return;
 }
`;
const safeCloudGuard=` const stage=window.__CLOSET_ALPHA_STAGE_AUTH__;
 if(!stage||stage.ready!==true||stage.base!=='${STAGE_BASE}'||
    stage.releaseGate!=='HOLD'){
  window.closetCloud={getOwnerId:()=>null,
   invalidateSession(){},async beforeWrite(){throw Error('Staging cloud unavailable');},
   changed(){},async start(){throw Error('Staging cloud unavailable');},
   async sync(){throw Error('Staging cloud unavailable');}};
  return;
 }
`;
export function stageAuthSource(original){
 let code=replaceOnce(original,"(function(){\n const URL='"+PROD_BASE+"';",
  "(function(){\n"+safeAuthGuard+" const URL=stage.base;");
 code=replaceOnce(code,"const KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO';","const KEY=stage.key;");
 code=replaceOnce(code,"const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';","const APP_URL=stage.redirect;");
 code=replaceOnce(code,"const STORE='closet-current-auth-v1';","const STORE='closet-alpha-staging-auth-v1';");
 if(code.includes(PROD_ID)||code.includes('nickhaney916-lang.github.io')||
    code.includes('sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO'))
  throw Error('Production Auth reference remains in staged Auth script');
 return code;
}
export function stageCloudSource(original){
 const old="(function(){\n const E=window.ClosetBackupEngine,BASE='"+PROD_BASE+"',KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO',BUCKET='closet-private';";
 const replacement="(function(){\n"+safeCloudGuard+
  " const E=window.ClosetBackupEngine,BASE=stage.base,KEY=stage.key,BUCKET='closet-private';";
 const code=replaceOnce(original,old,replacement);
 if(code.includes(PROD_ID)||code.includes('sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO'))
  throw Error('Production backup reference remains in staged cloud client');
 return code;
}
export function stageAvatarPreflightSource(original){
 const code=replaceOnce(original,
  "const SUPABASE_AUTH_USER='"+PROD_BASE+"/auth/v1/user';",
  "const SUPABASE_AUTH_USER='"+STAGE_BASE+"/auth/v1/user';");
 if(code.includes(PROD_ID))throw Error('Staged 2D server preflight still references production');
 return code;
}
export function stageIndexSource(original){
 const match=original.match(/<script src="auth\.js(?:\?v=[a-f0-9]+)?"\><\/script>/);
 if(!match||original.split(match[0]).length!==2)
  throw Error('Cannot safely inject staging configuration before production Auth script');
 return replaceOnce(original,match[0],
  '<script src="alpha-stage-config.js"></script>'+match[0]);
}
export function stagePwaSource(){
 return "'use strict';\n// HOLD: staging auth must never register normal production PWA/service worker.\n"+
 "const install=document.getElementById('installApp');if(install)install.hidden=true;\n";
}
async function verifyPreserved(before,after){
 const allowed=new Set(CHANGED);
 for(const file of await listFiles(before)){
  if(allowed.has(file))continue;
  const [a,b]=await Promise.all([readFile(join(before,file)),readFile(join(after,file))]);
  if(!a.equals(b))throw Error('Unexpected staging auth asset change: '+file);
 }
 const oldFiles=new Set(await listFiles(before));
 for(const file of await listFiles(after)){
  if(!allowed.has(file)&&!oldFiles.has(file))
   throw Error('Unexpected staging auth artifact: '+file);
 }
}
export async function buildStagingAuthCandidate({
 root=resolve('.'),approvedRedirect,publicKey,enableForTesting=false
}={}){
 const base=resolve(root),source=join(base,SRC),target=join(base,OUT);
 if(relative(base,target)!==OUT||!CONTENT_FENCE.test(relative(base,target))||
  !target.startsWith(base+sep)||source===target)
  throw Error('Unsafe output destination for staging auth');
 // This checks the original mask/preview candidate is still source-pinned.
 await assertCandidate({repositoryRoot:base});
 const originals={};
 for(const name of CHANGED.filter(x=>!x.startsWith('alpha-stage-'))){
  originals[name]=await readFile(join(source,name),'utf8');
 }
 const transformed={
  'auth.js':stageAuthSource(originals['auth.js']),
  'cloud-backup.js':stageCloudSource(originals['cloud-backup.js']),
  'family-alpha-2d-auth-preflight.mjs':stageAvatarPreflightSource(originals['family-alpha-2d-auth-preflight.mjs']),
  'pwa.js':stagePwaSource(),
  'index.html':stageIndexSource(originals['index.html']),
  'alpha-stage-config.js':stageConfigScript({approvedRedirect,publicKey,enableForTesting})
 };
 // Reject all source code accidentally retaining a production API endpoint,
 // including any downloaded/app-cached assets we didn't plan to transform.
 for(const [name,contents]of Object.entries(transformed)){
  if(contents.includes(PROD_BASE))throw Error('Staging artifact routes to production in '+name);
 }
 await rm(target,{recursive:true,force:true});
 await cp(source,target,{recursive:true});
 for(const [name,contents]of Object.entries(transformed))
  await writeFile(join(target,name),contents);
 await verifyPreserved(source,target);
 const manifest={
  schemaVersion:1,kind:'Family Alpha staged Auth routing — OFFLINE ONLY / NOT DEPLOYED',
  releaseGate:'HOLD',projectRef:STAGE_ID,stageApiUrl:STAGE_BASE,
  emailRedirect:enableForTesting?approvedRedirect||null:null,
  routingReadyForQa:enableForTesting===true&&Boolean(validRedirect(approvedRedirect))&&
   typeof publicKey==='string'&&/^sb_publishable_/.test(publicKey),
  keyFingerprint:enableForTesting&&publicKey?sha(publicKey).slice(0,12):null,
  publishingAuthorized:false,realAuthTested:false,protectedAccessVerified:false,
  productionArtifactPreserved:true,
  replacedAssets:Object.keys(transformed),
  blockedUntil:['Owner-approved protected staging origin & Cloudflare Access',
   'Registered staging Supabase callback','Explicit staging publishable key at build',
   'Approved synthetic-account signed-in RLS and Storage tests',
   'Explicit deployment authorization','Physical phone privacy and photo tests']
 };
 await writeFile(join(target,'alpha-stage-auth-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await verifyPreserved(source,target);
 return manifest;
}
export async function assertStagingAuthCandidate({root=resolve('.')}={}){
 const base=resolve(root),source=join(base,SRC),target=join(base,OUT);
 const manifest=JSON.parse(await readFile(join(target,'alpha-stage-auth-manifest.json'),'utf8'));
 if(manifest.releaseGate!=='HOLD'||manifest.publishingAuthorized!==false||
  manifest.realAuthTested!==false||manifest.protectedAccessVerified!==false||
  manifest.projectRef!==STAGE_ID||manifest.stageApiUrl!==STAGE_BASE)
  throw Error('Unsafe staging release metadata');
 await verifyPreserved(source,target);
 const staged=await Promise.all(['auth.js','cloud-backup.js','family-alpha-2d-auth-preflight.mjs','index.html','alpha-stage-config.js','pwa.js'].map(f=>readFile(join(target,f),'utf8')));
 if(!staged[0].includes('closet-alpha-staging-auth-v1')||
  !staged[1].includes('const E=window.ClosetBackupEngine,BASE=stage.base,KEY=stage.key')||
  !staged[2].includes(STAGE_BASE+'/auth/v1/user')||
  !staged[3].includes('alpha-stage-config.js')||
  !staged[4].includes("'HOLD'")||
  staged.some(v=>v.includes(PROD_BASE)))
  throw Error('Staging environment isolation failed');
 // For the unapproved no-deploy artifact, Auth/Cloud must be blocked.
 if(!manifest.routingReadyForQa){
  if(!staged[4].includes('HOLD-NO-CALLBACK-OR-KEY')||
   !staged[4].includes('"key":""')||
   !staged[4].includes('"redirect":""'))
   throw Error('Unapproved candidate must have blank callback and key');
 }
 return manifest;
}
async function main(){
 await run(process.execPath,['scripts/build-family-alpha-staging.mjs'],{cwd:resolve('.')});
 const manifest=await buildStagingAuthCandidate();
 await assertStagingAuthCandidate();
 console.log('Family Alpha staging AUTH candidate built: project '+manifest.projectRef+
  '; callback/key NOT CONFIGURED, Auth and backup fail closed; normal dist unchanged; release HOLD.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await main();
