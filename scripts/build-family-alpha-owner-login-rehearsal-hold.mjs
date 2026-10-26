/**
 * Closet Current #255 — SYNTHETIC owner login rehearsal, entirely OFFLINE.
 *
 * Copies the source-pinned COMPLETE protected staging artifact into a separate
 * QA-review directory and changes ONLY alpha-stage-config.js to contain an
 * EXPLICITLY FICTIONAL publishable key. This artifact is never permitted for
 * deployment or real login and contains no Supabase/Cloudflare credentials.
 * The audited login-disabled deployed artifact is not touched.
 */
import {cp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 assertProtectedPreviewHold,STAGE_PREVIEW_OUTPUT,STAGE_PREVIEW_ROOT
} from './build-family-alpha-protected-preview-hold.mjs';
import {stageConfigScript,APPROVED_STAGE_CALLBACK,STAGE_ID,PROD_ID} from './build-family-alpha-staging-auth-hold.mjs';

export const REVIEW_OUTPUT='dist-family-alpha-owner-login-rehearsal-NEVER-DEPLOY';
export const SYNTHETIC_PUBLIC_KEY='sb_publishable_SYNTHETIC_NEVER_VALID_FOR_SUPABASE';
const manifestName='family-alpha-owner-login-rehearsal-NEVER-DEPLOY.json';
const sha=s=>createHash('sha256').update(s).digest('hex');
const ALLOWED=new Set(['alpha-stage-config.js',manifestName]);
async function paths(root,prefix=''){
 const result=[];
 for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('No symbolic links in protected rehearsal package');
  const file=prefix?prefix+'/'+entry.name:entry.name;
  if(entry.isDirectory())result.push(...await paths(root,file));
  else if(entry.isFile())result.push(file);
  else throw Error('Unexpected packaged file type');
 }
 return result.sort();
}
async function compare(source,target){
 const [before,after]=await Promise.all([paths(source),paths(target)]);
 const beforeSet=new Set(before),afterSet=new Set(after);
 for(const file of before){
  if(!afterSet.has(file))throw Error('Lost protected-stage file: '+file);
  if(file==='alpha-stage-config.js')continue;
  const [a,b]=await Promise.all([readFile(join(source,file)),readFile(join(target,file))]);
  if(!a.equals(b))throw Error('Rehearsal modified protected-stage file: '+file);
 }
 for(const file of after)if(!beforeSet.has(file)&&!ALLOWED.has(file))
  throw Error('Unexpected rehearsal file: '+file);
 if(before.length<60||after.length!==before.length+1)
  throw Error('This is not a full protected staging rehearsal');
 return Object.freeze({before:before.length,after:after.length});
}
export function rehearsalConfig(){
 return stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,
  publicKey:SYNTHETIC_PUBLIC_KEY,
  enableForTesting:true
 });
}
export async function buildOwnerLoginRehearsal({root=resolve('.')}={}){
 const base=resolve(root),src=join(base,STAGE_PREVIEW_OUTPUT),dest=join(base,REVIEW_OUTPUT);
 if(relative(base,dest)!==REVIEW_OUTPUT||!dest.startsWith(base+sep)||dest===src)
  throw Error('Unsafe owner-login rehearsal output directory');
 const parent=await assertProtectedPreviewHold({root:base});
 if(parent.releaseGate!=='HOLD'||parent.deployAllowed!==false||
    parent.stagingProjectRef!==STAGE_ID||parent.stagingAuthReady!==false||
    parent.stagingAuthKeyPresent!==false||parent.photoAvatarEnabled!==false||
    parent.ownerApproved!==false||parent.familyReleaseAuthorized!==false)
  throw Error('Source staging Auth or avatar no longer disabled');
 const oldConfig=await readFile(join(src,'alpha-stage-config.js'),'utf8');
 if(!oldConfig.includes('HOLD-NO-CALLBACK-OR-KEY')||
  !oldConfig.includes('"key":""')||!oldConfig.includes('"redirect":""'))
  throw Error('Protected deployed-source config has changed');
 const qaConfig=rehearsalConfig();
 if(qaConfig.includes(PROD_ID)||!qaConfig.includes(SYNTHETIC_PUBLIC_KEY)||
   !qaConfig.includes('explicit-qa-only'))
  throw Error('Unsafe rehearsal configuration');
 await rm(dest,{recursive:true,force:true});
 await cp(src,dest,{recursive:true});
 await writeFile(join(dest,'alpha-stage-config.js'),qaConfig);
 const manifest=Object.freeze({
  schemaVersion:1,
  kind:'SYNTHETIC_OWNER_LOGIN_REHEARSAL_NEVER_DEPLOY',
  approvedStageRoot:STAGE_PREVIEW_ROOT,
  stagingProjectRef:STAGE_ID,
  sourceFolder:STAGE_PREVIEW_OUTPUT,
  sourceHeldConfigSHA256:sha(oldConfig),
  syntheticRehearsalConfigSHA256:sha(qaConfig),
  expectedFilesFromProtectedStage:null,
  onlyChangedAsset:'alpha-stage-config.js',
  syntheticKey:true,
  serverCredentialPresent:false,
  realAuthKeyPresent:false,
  realUserLoginTested:false,
  emailSent:false,
  accountCreated:false,
  liveStageModified:false,
  ownerApprovedForRealAuthActivation:false,
  avatarRolloutEnabled:false,
  familyInvitesEnabled:false,
  publishAllowed:false,
  deployAllowed:false,
  releaseGate:'HOLD',
  nextApprovalNeeded:'Separate explicit owner consent for real staging-only login activation'
 });
 await writeFile(join(dest,manifestName),JSON.stringify(manifest,null,2)+'\n');
 const inventory=await compare(src,dest);
 return Object.freeze({...manifest,sourceFiles:inventory.before,reviewFiles:inventory.after});
}
export async function assertOwnerLoginRehearsal({root=resolve('.')}={}){
 const base=resolve(root),src=join(base,STAGE_PREVIEW_OUTPUT),dest=join(base,REVIEW_OUTPUT);
 await assertProtectedPreviewHold({root:base});
 const inventory=await compare(src,dest);
 const [m,qa,hold,rollout,auth,cloud]=await Promise.all([
  readFile(join(dest,manifestName),'utf8').then(JSON.parse),
  readFile(join(dest,'alpha-stage-config.js'),'utf8'),
  readFile(join(src,'alpha-stage-config.js'),'utf8'),
  readFile(join(dest,'alpha-stage-preview-rollout.js'),'utf8'),
  readFile(join(dest,'auth.js'),'utf8'),
  readFile(join(dest,'cloud-backup.js'),'utf8')
 ]);
 if(m.kind!=='SYNTHETIC_OWNER_LOGIN_REHEARSAL_NEVER_DEPLOY'||
    m.releaseGate!=='HOLD'||m.publishAllowed!==false||
    m.deployAllowed!==false||m.realAuthKeyPresent!==false||
    m.realUserLoginTested!==false||m.ownerApprovedForRealAuthActivation!==false||
    m.avatarRolloutEnabled!==false||m.accountCreated!==false||
    m.stagingProjectRef!==STAGE_ID||m.approvedStageRoot!==STAGE_PREVIEW_ROOT||
    m.sourceHeldConfigSHA256!==sha(hold)||m.syntheticRehearsalConfigSHA256!==sha(qa)||
    qa!==rehearsalConfig()||
    !rollout.includes('"ownerApproved":false')||
    !rollout.includes('"enablePhotoAvatar":false')||
    !auth.includes("const URL=stage.base")||
    !cloud.includes('BASE=stage.base,KEY=stage.key')||
    [qa,auth,cloud].some(x=>x.includes(PROD_ID)||x.includes('sb_secret_')||x.includes('service_role')))
  throw Error('Owner-login rehearsal lost non-deployment and stage isolation guarantees');
 return Object.freeze({releaseGate:'HOLD',deployAllowed:false,productionUntouched:true,
  mockActivationOnly:true,stagingProjectRef:STAGE_ID,
  avatarEnabled:false,realLoginVerified:false,sourceFiles:inventory.before});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No real keys, URLs, account IDs or deployment flags accepted');
 await buildOwnerLoginRehearsal();
 const report=await assertOwnerLoginRehearsal();
 console.log('FAMILY_ALPHA_OWNER_LOGIN_REHEARSAL_HOLD '+JSON.stringify(report));
}
