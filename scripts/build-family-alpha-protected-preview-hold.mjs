/**
 * Family Alpha #255 — SECOND, DISABLED staging-only preview adapter.
 * This does not authorize or deploy anything. It never touches the source,
 * production dist, Cloudflare, Supabase, Resend or any real user records.
 *
 * On an approved future iteration, the web root's stage Auth configuration
 * and a separate owner-confirmed rollout could be enabled after live security
 * and actual JWT owner checks. Default output refuses to start all previews.
 */
import {createHash} from 'node:crypto';
import {cp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 assertDisabledIntegratedCandidate,OUTPUT
} from './build-family-alpha-recognition-integrated-hold.mjs';
import {STAGE_BASE,PROD_BASE,STAGE_ID} from './build-family-alpha-staging-auth-hold.mjs';

export const STAGE_PREVIEW_OUTPUT='dist-family-alpha-protected-preview-hold';
export const STAGE_PREVIEW_ROOT='https://closet-current-staging.pages.dev/';
const SHA=s=>createHash('sha256').update(s).digest('hex');
const SOURCE_GATE=" if((host!=='localhost'&&host!=='127.0.0.1')||\n    window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__!==true)return;";
const ALLOWED=new Set([
 'index.html','family-alpha-preview-boot.js',
 'alpha-stage-preview-rollout.js','alpha-stage-preview-hold-manifest.json'
]);

/**
 * A UI availability guard only, NOT an authorization boundary. The controller
 * retains server /auth/v1/user verification and private-wardrobe owner checks.
 * This function is injected literally into the stage-only boot, preventing
 * the build-time predicate from diverging from mocked test expectations.
 */
export function protectedStagePreviewEligible({protocol,origin,hostname,pathname,stage,rollout}={}){
 return protocol==='https:'&&
  origin==='https://closet-current-staging.pages.dev'&&
  hostname==='closet-current-staging.pages.dev'&&
  pathname==='/'&&
  stage?.projectRef==='fbnplztkbsteuzrmbgib'&&
  stage?.base==='https://fbnplztkbsteuzrmbgib.supabase.co'&&
  stage?.redirect==='https://closet-current-staging.pages.dev/'&&
  stage?.intent==='explicit-qa-only'&&
  stage?.releaseGate==='HOLD'&&stage?.ready===true&&
  typeof stage?.key==='string'&&stage.key.startsWith('sb_publishable_')&&
  rollout?.projectRef==='fbnplztkbsteuzrmbgib'&&
  rollout?.origin==='https://closet-current-staging.pages.dev'&&
  rollout?.issue===255&&
  rollout?.ownerApproved===true&&
  rollout?.enablePhotoAvatar===true;
}
export function blockedRolloutScript(){
 const settings={
  projectRef:STAGE_ID,origin:'https://closet-current-staging.pages.dev',
  issue:255,ownerApproved:false,enablePhotoAvatar:false,releaseGate:'HOLD',
  provenance:'UNAPPROVED_OFFLINE_SYNTHETIC_ONLY'
 };
 return "'use strict';\n"+
  "// Release HOLD: owner approval, protected Access and signed-in testing missing.\n"+
  "(function(){const value=Object.freeze("+JSON.stringify(settings)+");"+
  "Object.defineProperty(window,'__CLOSET_ALPHA_PREVIEW_ROLLOUT__',"+
  "{value,writable:false,configurable:false,enumerable:false});})();\n";
}
export function guardedStagingPreviewBoot(localBoot){
 if(typeof localBoot!=='string'||localBoot.split(SOURCE_GATE).length!==2||
  !localBoot.includes('window.closetCloud?.getOwnerId')||
  !localBoot.includes('mountAlphaBuilderPreview')||
  !localBoot.includes("getLatestItem:id=>items.find(item=>item.id===id)||null")||
  !localBoot.includes('getDatabase:()=>db')||
  !localBoot.includes('fetchFn:window.fetch.bind(window)')||
  !localBoot.includes('localApproved:true'))
  throw Error('Changed source preview: refuse staging adapter until code is reviewed');
 const replacement=` const stage=window.__CLOSET_ALPHA_STAGE_AUTH__;
 const rollout=window.__CLOSET_ALPHA_PREVIEW_ROLLOUT__;
 const eligible=(${protectedStagePreviewEligible.toString()})({
   protocol:location.protocol,origin:location.origin,hostname:host,
   pathname:location.pathname,stage,rollout
 });
 if(!eligible)return;`;
 const adapted=localBoot.replace(SOURCE_GATE,replacement);
 if(adapted.includes(SOURCE_GATE)||adapted.includes('__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__')||
  !adapted.includes('stage?.ready===true')||
  !adapted.includes('localApproved:true')||
  adapted.includes(PROD_BASE))
  throw Error('Unsafe staged preview boot rewrite');
 return adapted.replace(
  'Local Family Alpha development preview:',
  'Protected Family Alpha staging photo preview:');
}
export function stagingPreviewIndex(index){
 const needle='<script src="family-alpha-preview-boot.js"></script>';
 if(typeof index!=='string'||index.split(needle).length!==2||
  index.includes('alpha-stage-preview-rollout.js')||
  !index.includes('<script src="alpha-stage-config.js"></script>'))
  throw Error('Stage bootstrap loading order changed');
 return index.replace(needle,
  '<script src="alpha-stage-preview-rollout.js"></script>'+needle);
}
async function relativeFiles(dir,prefix=''){
 const result=[];
 for(const e of await readdir(dir,{withFileTypes:true})){
  if(e.isSymbolicLink())throw Error('Symlink within Family Alpha candidate');
  const key=prefix+e.name;
  if(e.isDirectory())result.push(...await relativeFiles(join(dir,e.name),key+'/'));
  else if(e.isFile())result.push(key);
  else throw Error('Unexpected bundle file type');
 }
 return result.sort();
}
async function assertClonedAssets(source,target){
 const before=await relativeFiles(source),after=await relativeFiles(target);
 const b=new Set(before),a=new Set(after);
 for(const filename of before){
  if(!a.has(filename))throw Error('Missing original candidate asset: '+filename);
  if(ALLOWED.has(filename))continue;
  const [x,y]=await Promise.all([
   readFile(join(source,filename)),readFile(join(target,filename))
  ]);
  if(!x.equals(y))throw Error('Unapproved modification: '+filename);
 }
 for(const name of after){
  if(!b.has(name)&&!ALLOWED.has(name))
   throw Error('Unexpected added staging asset: '+name);
 }
}
export async function buildProtectedPreviewHold({root=resolve('.')}={}){
 const base=resolve(root),target=join(base,STAGE_PREVIEW_OUTPUT),
  source=join(base,OUTPUT);
 if(relative(base,target)!==STAGE_PREVIEW_OUTPUT||
  !target.startsWith(base+sep)||target===source)
  throw Error('Unsafe protected stage preview destination');
 const parent=await assertDisabledIntegratedCandidate({root:base});
 if(parent.releaseGate!=='HOLD'||!parent.stageAuthBlocked||
  !parent.missingApprovedCallback||!parent.missingPublishableKey)
  throw Error('Expected exact disabled Family Alpha source');
 const oldBoot=await readFile(join(source,'family-alpha-preview-boot.js'),'utf8');
 const oldIndex=await readFile(join(source,'index.html'),'utf8');
 const stageConfig=await readFile(join(source,'alpha-stage-config.js'),'utf8');
 if(!stageConfig.includes('HOLD-NO-CALLBACK-OR-KEY')||
  !stageConfig.includes('"key":""')||!stageConfig.includes('"redirect":""'))
  throw Error('Staging Auth must remain disabled in this offline build');
 const boot=guardedStagingPreviewBoot(oldBoot),
  index=stagingPreviewIndex(oldIndex),rollout=blockedRolloutScript();
 await rm(target,{recursive:true,force:true});
 await cp(source,target,{recursive:true});
 await Promise.all([
  writeFile(join(target,'family-alpha-preview-boot.js'),boot),
  writeFile(join(target,'index.html'),index),
  writeFile(join(target,'alpha-stage-preview-rollout.js'),rollout)
 ]);
 const manifest={
  kind:'Protected root photo-preview activation contract — NO DEPLOY',
  releaseGate:'HOLD',status:'OFFLINE_STAGING_PREVIEW_DISABLED',
  stagingProjectRef:STAGE_ID,approvedRoot:STAGE_PREVIEW_ROOT,
  sourceManifestSha256:SHA(JSON.stringify(parent)),
  sourceLocalBootSha256:SHA(oldBoot),
  stageBootSha256:SHA(boot),indexSha256:SHA(index),
  rolloutSha256:SHA(rollout),
  sourceRecognitionAppSha256:parent.integrationAppSha256,
  protectedCloudflareAccessProven:false,
  stagingAuthReady:false,stagingAuthKeyPresent:false,
  stagingCallbackRegistered:false,
  ownerApproved:false,photoAvatarEnabled:false,
  signedInJwtRlsProof:false,
  livePreviewTested:false,
  familyReleaseAuthorized:false,deployAllowed:false,
  physicalPhoneValidated:false,
  modifiedOnly:['index.html','family-alpha-preview-boot.js'],
  addedOnly:['alpha-stage-preview-rollout.js',
   'alpha-stage-preview-hold-manifest.json']
 };
 await writeFile(join(target,'alpha-stage-preview-hold-manifest.json'),
  JSON.stringify(manifest,null,2)+'\n');
 await assertClonedAssets(source,target);
 return manifest;
}
export async function assertProtectedPreviewHold({root=resolve('.')}={}){
 const base=resolve(root),source=join(base,OUTPUT),
  target=join(base,STAGE_PREVIEW_OUTPUT);
 const [manifest,boot,index,rollout,config,originalBoot,originalIndex]=await Promise.all([
  readFile(join(target,'alpha-stage-preview-hold-manifest.json'),'utf8').then(JSON.parse),
  readFile(join(target,'family-alpha-preview-boot.js'),'utf8'),
  readFile(join(target,'index.html'),'utf8'),
  readFile(join(target,'alpha-stage-preview-rollout.js'),'utf8'),
  readFile(join(target,'alpha-stage-config.js'),'utf8'),
  readFile(join(source,'family-alpha-preview-boot.js'),'utf8'),
  readFile(join(source,'index.html'),'utf8')
 ]);
 const parent=await assertDisabledIntegratedCandidate({root:base});
 if(manifest.releaseGate!=='HOLD'||manifest.status!=='OFFLINE_STAGING_PREVIEW_DISABLED'||
  manifest.approvedRoot!==STAGE_PREVIEW_ROOT||manifest.stagingProjectRef!==STAGE_ID||
  manifest.deployAllowed!==false||manifest.ownerApproved!==false||
  manifest.photoAvatarEnabled!==false||manifest.stagingAuthReady!==false||
  manifest.stagingAuthKeyPresent!==false||
  manifest.familyReleaseAuthorized!==false||
  manifest.signedInJwtRlsProof!==false||
  manifest.sourceManifestSha256!==SHA(JSON.stringify(parent))||
  manifest.sourceLocalBootSha256!==SHA(originalBoot)||
  manifest.sourceRecognitionAppSha256!==parent.integrationAppSha256||
  manifest.stageBootSha256!==SHA(boot)||manifest.indexSha256!==SHA(index)||
  manifest.rolloutSha256!==SHA(rollout)||
  boot!==guardedStagingPreviewBoot(originalBoot)||
  index!==stagingPreviewIndex(originalIndex)||
  rollout!==blockedRolloutScript()||
  !config.includes('HOLD-NO-CALLBACK-OR-KEY')||
  !config.includes('"key":""')||!config.includes('"redirect":""')||
  [boot,index,rollout].some(x=>x.includes(PROD_BASE)))
  throw Error('Protected staging preview offline HOLD invariants broken');
 await assertClonedAssets(source,target);
 return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No host, key, callback, token or release arguments accepted');
 const report=await buildProtectedPreviewHold();
 await assertProtectedPreviewHold();
 console.log('FAMILY_ALPHA_PROTECTED_PREVIEW_HOLD '+JSON.stringify({
  status:report.status,releaseGate:report.releaseGate,
  ownerApproved:report.ownerApproved,photoAvatarEnabled:report.photoAvatarEnabled,
  stagingAuthKeyPresent:report.stagingAuthKeyPresent,
  stagingCallbackRegistered:report.stagingCallbackRegistered,
  deployAllowed:report.deployAllowed
 }));
}
