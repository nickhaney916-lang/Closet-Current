/**
 * CLOUD-RLS-01 — read-only Supabase metadata safety gate.
 *
 * This module never contacts a database, mutates RLS, handles credentials,
 * reads customer rows, or supplies a claim that a signed-in A/B test happened.
 * Input is a separately attested catalog snapshot from read-only metadata
 * queries. The gate intentionally fails closed on missing required facts.
 */
export const CLOUD_RLS_01=Object.freeze({
 snapshotIsNotLiveAccountABTest:true,readsCustomerRows:false,
 databaseMutations:false,clientReleaseAuthorized:false,
 physicalPhonesTested:false,authTokensUsed:false,familyAlpha:'HOLD'
});
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const one=x=>typeof x==='string'&&x.length>0;
export function auditCloudRLS01(snapshot){
 if(!object(snapshot)||snapshot.source!=='read-only-connected-supabase-catalog'||!one(snapshot.observedDate)||
  !object(snapshot.production)||!object(snapshot.staging))
  throw Error('CLOUD01 missing independently observed metadata snapshot');
 const checks=[],warnings=[];
 const requireControl=(env,id,ok)=>checks.push(Object.freeze({env,id,pass:ok===true}));
 for(const env of ['production','staging']){
  const c=snapshot[env];
  if(!object(c.table)||!object(c.ownerPolicy)||!object(c.bucket)||
   !object(c.rpc)||!object(c.privileges)||!Array.isArray(c.storagePolicies))
   throw Error('CLOUD01 missing protected relation/owner/photo metadata in '+env);
  requireControl(env,'single-owner-backup-table',c.table.name==='public.closet_backups'&&
   c.table.primaryKey==='owner_id'&&c.table.ownerType==='uuid');
  requireControl(env,'exposed-public-table-rls-on',c.table.rlsEnabled===true);
  requireControl(env,'unauthenticated-table-denied',c.privileges.anonSelect===false&&
   c.privileges.anonInsert===false);
  requireControl(env,'owner-policy-authenticated-only',
   c.ownerPolicy.role==='authenticated'&&c.ownerPolicy.action==='ALL'&&
   c.ownerPolicy.using==='auth.uid() = owner_id'&&
   c.ownerPolicy.withCheck==='auth.uid() = owner_id');
  requireControl(env,'private-licensed-jpeg-bucket',c.bucket.name==='closet-private'&&
   c.bucket.public===false&&c.bucket.maxBytes===8388608&&
   JSON.stringify(c.bucket.mimeTypes)==='["image/jpeg"]');
  requireControl(env,'rpc-public-wrapper-not-definer',c.rpc.publicWrapperSecurityDefiner===false&&
   c.rpc.authenticatedExecute===true&&c.rpc.anonExecute===false);
  requireControl(env,'rpc-cas-owner-and-revision',c.rpc.revisionCompareAndSwap===true&&
   c.rpc.ownerFromJWT===true&&c.rpc.documentLimitBytes===5242880);
  for(const [cmd,required] of [['SELECT',true],['INSERT',true],
    ['UPDATE',env==='production'],['DELETE',env==='production']]){
   const row=c.storagePolicies.find(p=>p.cmd===cmd);
   if(!row&&!required)continue;
   requireControl(env,'photo-policy-'+cmd,!!row&&row.role==='authenticated'&&
    row.bucket==='closet-private'&&row.ownerPath==='auth.uid()'&&
    (cmd!=='INSERT'&&cmd!=='UPDATE'||row.withCheckOwner===true));
  }
  requireControl(env,'no-wildcard-photo-read',c.storagePolicies.every(p=>
   p.role==='authenticated'&&p.bucket==='closet-private'&&p.ownerPath==='auth.uid()'));
  if(c.advisors?.leakedPasswordProtectionDisabled===true)warnings.push(Object.freeze({
   env,code:'LEAKED_PASSWORD_PROTECTION_DISABLED',
   message:'Supabase Auth leaked-password protection is disabled',
   remediationUrl:'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
  }));
 }
 const p=snapshot.production,st=snapshot.staging;
 requireControl('production','authenticated-rls-crud-grants',
  ['authenticatedSelect','authenticatedInsert','authenticatedUpdate','authenticatedDelete'].every(k=>p.privileges[k]===true));
 requireControl('production','no-public-service-definer',p.rpc.publicWrapperSecurityDefiner===false);
 requireControl('staging','ordinary-auth-users-read-only',
  st.privileges.authenticatedSelect===true&&st.privileges.authenticatedInsert===false&&
  st.privileges.authenticatedUpdate===false&&st.privileges.authenticatedDelete===false);
 const w=st.writer;
 requireControl('staging','isolated-no-bypass-writer-role',object(w)&&
  w.name==='closet_backup_writer'&&w.canLogin===false&&w.bypassRLS===false&&
  w.authenticatedMember===false&&w.anonMember===false&&
  w.canInsert===true&&w.canUpdate===true&&w.canDelete===false);
 requireControl('staging','private-definer-claims-owner-bound',st.rpc.privateFunctionSchema==='closet_rpc_private'&&
  st.rpc.privateFunctionSecurityDefiner===true&&st.rpc.privateFunctionSearchPathBlank===true&&
  st.rpc.privateFunctionClaim==='request.jwt.claim.sub'&&
  st.rpc.privateFunctionOwnerWriteBound===true&&
  st.rpc.privateFunctionAnonExecute===false);
 // Static code review never substitutes for real two-user authenticated API
 // GET/POST/UPDATE/DELETE tests with distinct server-verified JWTs.
 const failed=checks.filter(x=>!x.pass);
 return Object.freeze({
  status:failed.length?'FAIL_RESEARCH_SECURITY_METADATA':'PASS_READ_ONLY_METADATA_ONLY',
  checkedEnvironments:Object.freeze(['production','staging']),
  checkedControls:checks.length,passedControls:checks.length-failed.length,
  failures:Object.freeze(failed),warnings:Object.freeze(warnings),
  observedDate:snapshot.observedDate,
  customerRowsRead:false,serverConfigModified:false,
  signedInTwoAccountProof:false,liveDataAPIJWTProof:false,
  liveStorageJWTProof:false,clientReleaseAuthorized:false,
  photorealismApproved:false,physicalPhonesTested:false,
  familyAlpha:'HOLD'
 });
}
