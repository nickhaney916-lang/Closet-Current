/**
 * Issue #255 — owner-approved staging-only real-login artifact, avatar OFF.
 * Requires explicit STAGE_PUBLIC_KEY at runtime. Never accepts service-role
 * or secret keys, never targets production or an alternate staging host.
 *
 * Builds a NEW folder, never modifies the previously deployed HOLD source,
 * never deploys by itself, never sends email and never creates a user.
 */
import {cp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 assertProtectedPreviewHold, STAGE_PREVIEW_OUTPUT
} from './build-family-alpha-protected-preview-hold.mjs';
import {
 STAGE_ID,PROD_ID,APPROVED_STAGE_CALLBACK,stageConfigScript
} from './build-family-alpha-staging-auth-hold.mjs';

export const AUTH_OUTPUT='dist-family-alpha-OWNER-ONLY-staging-qa';
export const AUTH_MANIFEST='family-alpha-owner-auth-qa-manifest.json';
const digest=data=>createHash('sha256').update(data).digest('hex');
// Restrict the only permitted third-party connection to the STAGING Auth host.
// The held/offline preview stays self-only; production has no source edits.
export const OWNER_STAGE_CONNECT_SRC="connect-src 'self' https://"+STAGE_ID+".supabase.co;";
const HELD_CONNECT_SRC="connect-src 'self';";
export function ownerStageCsp(index){
 if(typeof index!=='string'||index.split('<meta http-equiv="Content-Security-Policy"').length!==2||
    index.split(HELD_CONNECT_SRC).length!==2||index.includes(OWNER_STAGE_CONNECT_SRC)||
    index.includes(PROD_ID)||index.includes('connect-src https:')||
    index.includes('connect-src *'))
   throw Error('Unsafe or unexpected staging CSP source; abort');
 const next=index.replace(HELD_CONNECT_SRC,OWNER_STAGE_CONNECT_SRC);
 if(!next.includes(OWNER_STAGE_CONNECT_SRC)||next.includes(HELD_CONNECT_SRC))
   throw Error('Staging CSP could not be narrowed to exact allowed host');
 return next;
}

function getKey(value){
 if(typeof value!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(value)||
    /SYNTHETIC|EXAMPLE|FAKE|DEMO|PLACEHOLDER/i.test(value))
  throw Error('A real STAGING-only publishable API key is required');
 return value;
}
async function files(root,prefix=''){
 const paths=[];
 for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('A symbolic link cannot be deployed');
  const file=prefix?prefix+'/'+entry.name:entry.name;
  if(entry.isDirectory())paths.push(...await files(root,file));
  else if(entry.isFile())paths.push(file);
  else throw Error('Unexpected deployment filesystem node: '+file);
 }
 return paths.sort();
}
async function compare(src,target){
 const a=await files(src),b=await files(target),expected=new Set(a);
 if(a.length<60||b.length!==a.length+1||!b.includes(AUTH_MANIFEST))
  throw Error('Candidate is not a complete original stage bundle');
 for(const file of b)if(!expected.has(file)&&file!==AUTH_MANIFEST)
  throw Error('Unexpected owner-only staging file: '+file);
 for(const file of a){
  if(!b.includes(file))throw Error('Missing stage asset: '+file);
  if(file==='alpha-stage-config.js')continue;
  const [before,after]=await Promise.all([readFile(join(src,file)),readFile(join(target,file))]);
  if(file==='index.html'){
    if(after.toString('utf8')!==ownerStageCsp(before.toString('utf8')))
      throw Error('Unapproved staged owner-only CSP change');
    continue;
  }
  if(!before.equals(after))throw Error('Unapproved change to source-pinned app: '+file);
 }
 return a.length;
}
export async function buildApprovedOwnerAuth({root=resolve('.'),publicKey}={}){
 const key=getKey(publicKey),base=resolve(root),
  source=join(base,STAGE_PREVIEW_OUTPUT),target=join(base,AUTH_OUTPUT);
 if(relative(base,target)!==AUTH_OUTPUT||target===source||
    !target.startsWith(base+sep))throw Error('Unsafe QA output directory');
 const held=await assertProtectedPreviewHold({root:base});
 if(held.releaseGate!=='HOLD'||held.stagingProjectRef!==STAGE_ID||
    held.deployAllowed!==false||held.stagingAuthReady!==false||
    held.stagingAuthKeyPresent!==false||held.photoAvatarEnabled!==false||
    held.ownerApproved!==false||held.familyReleaseAuthorized!==false)
  throw Error('The audited source stage artifact is not held');
 const sourceConfig=await readFile(join(source,'alpha-stage-config.js'),'utf8');
 if(!sourceConfig.includes('HOLD-NO-CALLBACK-OR-KEY')||
    !sourceConfig.includes('"key":""')||!sourceConfig.includes('"redirect":""'))
  throw Error('Source artifact unexpectedly has a live key');
 const config=stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,
  publicKey:key,enableForTesting:true
 });
 if(config.includes(PROD_ID)||!config.includes('"releaseGate":"HOLD"')||
    !config.includes('"intent":"explicit-qa-only"'))
  throw Error('Owner-only Auth configuration is not staging isolated');
 await rm(target,{recursive:true,force:true});
 await cp(source,target,{recursive:true});
 await writeFile(join(target,'alpha-stage-config.js'),config);
 const heldHtml=await readFile(join(source,'index.html'),'utf8');
 await writeFile(join(target,'index.html'),ownerStageCsp(heldHtml));
 const manifest=Object.freeze({
  kind:'FAMILY_ALPHA_OWNER_ONLY_STAGE_LOGIN_AUTHORIZED',
  stagingProjectRef:STAGE_ID,
  stageRoot:APPROVED_STAGE_CALLBACK,
  sourceHeldConfigSHA256:digest(sourceConfig),
  ownerOnlyAuthConfigSHA256:digest(config),
  publishableKeyPresent:true,
  privilegedKeyPresent:false,
  onlyChangedStageAsset:'alpha-stage-config.js',
  onlyChangedStageAssets:['alpha-stage-config.js','index.html'],
  ownerStageCspOrigin:'https://'+STAGE_ID+'.supabase.co',
  heldPreviewCspUnchanged:true,
  sourceFolder:STAGE_PREVIEW_OUTPUT,
  publicSignupAllowed:false,
  cloudflareAccessPolicyUntouched:true,
  firstPartyAvatarActivated:false,
  familyAccountsAdded:false,
  familyAlphaReleaseAuthorized:false,
  verifiedRealOwnerLogin:false,
  RlsCrossAccountTested:false,
  releaseGate:'HOLD',
  stageDeploymentAuthorized:true,
  productionDeploymentAuthorized:false
 });
 await writeFile(join(target,AUTH_MANIFEST),JSON.stringify(manifest,null,2)+'\n');
 const count=await compare(source,target);
 return Object.freeze({files:count+1,stage:STAGE_ID,
  stageRoot:APPROVED_STAGE_CALLBACK,authReadyConfig:true,
  avatarEnabled:false,releaseGate:'HOLD',familyInvites:false});
}
export async function verifyApprovedOwnerAuth({root=resolve('.'),publicKey}={}){
 const key=getKey(publicKey),base=resolve(root),
  source=join(base,STAGE_PREVIEW_OUTPUT),target=join(base,AUTH_OUTPUT);
 await assertProtectedPreviewHold({root:base});
 const count=await compare(source,target);
 const [manifest,conf,rollout,auth,cloud]=await Promise.all([
  readFile(join(target,AUTH_MANIFEST),'utf8').then(JSON.parse),
  readFile(join(target,'alpha-stage-config.js'),'utf8'),
  readFile(join(target,'alpha-stage-preview-rollout.js'),'utf8'),
  readFile(join(target,'auth.js'),'utf8'),
  readFile(join(target,'cloud-backup.js'),'utf8')
 ]);
 if(manifest.kind!=='FAMILY_ALPHA_OWNER_ONLY_STAGE_LOGIN_AUTHORIZED'||
    manifest.stagingProjectRef!==STAGE_ID||
    manifest.stageRoot!==APPROVED_STAGE_CALLBACK||
    manifest.onlyChangedStageAsset!=='alpha-stage-config.js'||
    JSON.stringify(manifest.onlyChangedStageAssets)!==JSON.stringify(['alpha-stage-config.js','index.html'])||
    manifest.ownerStageCspOrigin!=='https://'+STAGE_ID+'.supabase.co'||
    manifest.heldPreviewCspUnchanged!==true||
    manifest.ownerOnlyAuthConfigSHA256!==digest(conf)||
    manifest.publicSignupAllowed!==false||
    manifest.familyAccountsAdded!==false||
    manifest.familyAlphaReleaseAuthorized!==false||
    manifest.verifiedRealOwnerLogin!==false||
    manifest.firstPartyAvatarActivated!==false||
    manifest.productionDeploymentAuthorized!==false||
    manifest.stageDeploymentAuthorized!==true||
    manifest.releaseGate!=='HOLD'||
    conf!==stageConfigScript({approvedRedirect:APPROVED_STAGE_CALLBACK,publicKey:key,enableForTesting:true})||
    !rollout.includes('"ownerApproved":false')||
    !rollout.includes('"enablePhotoAvatar":false')||
    !auth.includes('const URL=stage.base')||
    !cloud.includes('BASE=stage.base,KEY=stage.key')||
    [auth,cloud,conf].some(s=>s.includes(PROD_ID)||s.includes('service_role')||s.includes('sb_secret_')))
  throw Error('Owner-only staged Auth safeguard failed');
 return Object.freeze({qaFiles:count+1,releaseGate:'HOLD',
  stagingAuthEnabled:true,avatarEnabled:false,familyAlphaAuthorized:false,
  stageRoot:APPROVED_STAGE_CALLBACK,productionUntouched:true});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No dynamic deployment flags accepted');
 const publicKey=process.env.STAGE_PUBLIC_KEY;
 await buildApprovedOwnerAuth({publicKey});
 console.log('OWNER_ONLY_STAGING_AUTH_PREPARED '+JSON.stringify(await verifyApprovedOwnerAuth({publicKey})));
}
