// Read-only, origin-scoped anonymous challenge probe. Never follows redirects,
// sends credentials or authorizes staging deployment from a 302 alone.
import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {checkStagingArtifactIntegrity} from './check-staging-artifact-integrity.mjs';
import {verifyStagingAssetSeal,SEAL_FILE} from './staging-asset-seal.mjs';

export const PATHS=['/','/index.html','/app.js','/auth.js','/cloud-backup.js',
 '/sw.js','/recognition-vectors.json','/phone-photo-check.html',
 '/saved-closet-audit.html','/app.js?v=anonymous-access-probe'];
const MAX_PATHS=250,WORKERS=12;
function checkedPath(path){
 if(typeof path!=='string'||path.length<2||path.length>1024||
  !path.startsWith('/')||path.startsWith('//')||
  path.includes('\\')||/[\u0000-\u001f\u007f#]/.test(path))
  throw Error('Invalid staging route to probe.');
 const u=new URL(path,'https://staging-probe.invalid');
 const pathname=path.split('?')[0];
 if(u.origin!=='https://staging-probe.invalid'||u.pathname!==pathname||u.hash)
  throw Error('Unexpected staging route normalization.');
 for(const part of pathname.split('/').slice(1)){
  let decoded;
  try{decoded=decodeURIComponent(part);}catch{throw Error('Malformed encoded staging route.');}
  if(decoded==='.'||decoded==='..'||decoded.includes('/')||decoded.includes('\\'))
   throw Error('Unsafe path traversal or encoded path separator.');
 }
 if(!pathname||pathname.includes('//'))
  throw Error('Invalid staged file path.');
 return path;
}
function validatePaths(paths){
 if(!Array.isArray(paths)||paths.length===0||paths.length>MAX_PATHS)
  throw Error('Staging route list must contain 1–250 distinct entries.');
 const checked=paths.map(checkedPath);
 if(new Set(checked).size!==checked.length)
  throw Error('Duplicate staging routes are not permitted.');
 return checked;
}
export function stagingOrigin(value){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.pathname!=='/'||
  !/^(?:[a-z0-9-]+\.)?closet-current-staging\.pages\.dev$/.test(u.hostname))
  throw Error('Use the exact separate closet-current-staging.pages.dev origin or one of its preview origins.');
 return u.origin;
}
// Construct complete route coverage from already-verified, immutable local
// artifact metadata. Seal is unsigned; this is coverage, NOT trusted signing.
export async function pathsFromVerifiedStaging(dir='staging-dist'){
 await checkStagingArtifactIntegrity(dir);
 const seal=await verifyStagingAssetSeal(dir);
 if(!seal.allAssetBytesVerified||seal.permittedToDeploy!==false)
  throw Error('Unverified staging bytes cannot populate access inventory.');
 const manifest=JSON.parse(await readFile(join(dir,SEAL_FILE),'utf8'));
 const generated=['/',...manifest.files.map(file=>
  '/'+file.path.split('/').map(encodeURIComponent).join('/')),
  '/'+SEAL_FILE];
 const result=new Set([...PATHS,...generated]);
 // The server may treat cache-busted copies as independent bypasses.
 for(const file of ['index.html','auth.js','cloud-backup.js','sw.js','app.js']){
  if(manifest.files.some(x=>x.path===file))result.add('/'+file+'?v=anonymous-access-probe');
 }
 return validatePaths([...result].sort());
}
export async function probeAnonymousAccess(origins,{request=fetch,paths=PATHS}={}){
 if(!Array.isArray(origins)||origins.length<2||origins.length>10)
  throw Error('Supply staging origin and all known deployment preview origins (2–10).');
 const checked=origins.map(stagingOrigin);
 if(new Set(checked).size!==checked.length||
  !checked.includes('https://closet-current-staging.pages.dev'))
  throw Error('Supply distinct origins including the staging project hostname and deployment previews.');
 const targets=validatePaths(paths);
 const jobs=checked.flatMap(origin=>targets.map(path=>({origin,path})));
 const results=new Array(jobs.length);
 let next=0;
 async function runWorker(){
  while(next<jobs.length){
   const i=next++,{origin,path}=jobs[i];
   let outcome='INCONCLUSIVE',status=null;
   try{
    const response=await request(origin+path,{method:'GET',redirect:'manual',
     credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000),
     headers:{'Cache-Control':'no-cache'}});
    try{
     status=response.status;
     if(status>=200&&status<300)outcome='PUBLIC_RESPONSE';
     else if([301,302,303,307,308].includes(status)){
      const location=new URL(response.headers.get('location')||'',origin+path);
      if(location.protocol==='https:'&&!location.username&&!location.password&&!location.port&&
       /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(location.hostname)&&
       location.pathname.startsWith('/cdn-cgi/access/login/'))
       outcome='ACCESS_LOGIN_REQUIRED';
     }
    }finally{await response.body?.cancel();}
   }catch{/* A timeout/denial is NOT positive evidence of Cloudflare Access. */}
   results[i]={origin,path,status,outcome};
  }
 }
 await Promise.all(Array.from({length:Math.min(WORKERS,jobs.length)},()=>runWorker()));
 return {anonymousProbePassed:results.every(r=>r.outcome==='ACCESS_LOGIN_REQUIRED'),
  totalRoutes:targets.length,originCount:checked.length,coverageSource:paths===PATHS?'fixed-critical':'provided-verified-inventory',
  results,privateCloudflareAccessPolicyVerified:false,
  previewInventoryComplete:false,authorizedTesterAccessVerified:false,
  restrictedStagingDeployed:false,productionPromotion:'BLOCKED'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const args=process.argv.slice(2);
  const switches=args.filter(x=>x.startsWith('--bundle='));
  if(switches.length>1||args.some(x=>x.startsWith('--')&&!x.startsWith('--bundle=')))
   throw Error('Usage: node scripts/check-staging-anonymous-access.mjs [--bundle=staging-dist] <staging origin> <all preview origins>');
  const bundle=switches[0]?.slice('--bundle='.length);
  if(switches.length&&(!bundle||bundle.startsWith('-')))
   throw Error('A valid local staging bundle directory is required.');
  const origins=args.filter(x=>!x.startsWith('--bundle='));
  const paths=bundle?await pathsFromVerifiedStaging(bundle):PATHS;
  const report=await probeAnonymousAccess(origins,{paths});
  console.log(JSON.stringify(report,null,2));
  if(!report.anonymousProbePassed)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
