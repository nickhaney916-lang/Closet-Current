import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Evaluate a previously CAPTURED, privacy-safe Supabase metadata snapshot.
 * Never connects to the backend or collects Auth sessions, backup documents,
 * storage object names, user details, secrets or photographs.
 *
 * This checker cannot certify live RLS correctness. CI only verifies that
 * known risks are NOT accidentally relabeled as PASS in an offline report.
 */
export const SNAPSHOT='research/family-alpha-live-readonly/metadata-2026-10-23.json';
const concern=(id,level,details,verifiedBy='metadata')=>Object.freeze({id,level,details,verifiedBy});
const hasAll=(values,needed)=>needed.every(x=>values.includes(x));
export function assessFamilyAlphaMetadata(raw,appAuthSource){
 if(!raw||raw.schemaVersion!==1||raw.captureIsHistorical!==true||
  raw.method?.includes('Read-only Supabase SQL')!==true||
  !Array.isArray(raw.projects)||raw.projects.length!==2||
  raw.releaseStatus!=='HOLD')
  throw Error('Invalid or overclaimed historical metadata source');
 if(typeof appAuthSource!=='string')throw Error('App Auth source required');
 const projects=new Map(raw.projects.map(p=>[p.environment,p]));
 if(projects.size!==2||!projects.has('production')||!projects.has('staging'))
  throw Error('Production and independent staging metadata required');
 const findings=[];
 for(const [environment,project]of projects){
  if(project.verifiedLiveUserDenyAllow!==false)
   throw Error('This read-only metadata is not live account allow/deny evidence');
  if(!project.table?.rlsEnabled||project.table.anonSelect!==false)
   findings.push(concern(environment+'.backup.unsafe','BLOCKER','Backup table must have RLS and no anonymous SELECT'));
  const own=project.table.policies?.find(x=>x.name==='closet_backup_owner');
  if(!own||!own.roles.includes('authenticated')||!own.ownerUsing||!own.ownerWithCheck)
   findings.push(concern(environment+'.backup.owner-policy','BLOCKER','Owner USING and WITH CHECK must be present'));
  if(project.bucket?.name!=='closet-private'||project.bucket.public!==false||
   project.bucket.ownerPathPredicateOnAll!==true||
   !hasAll(project.bucket.policies||[],['closet_photos_read','closet_photos_insert']))
   findings.push(concern(environment+'.private-images','BLOCKER','Private bucket and owner-folder protections required'));
  if(!project.backupRpc?.publicInvoker||!project.backupRpc?.authenticatedExecute||
   project.backupRpc.anonExecute!==false)
   findings.push(concern(environment+'.backup.rpc','BLOCKER','Public invoker RPC must permit authenticated only'));
  if(project.advisorWarnings?.includes('auth_leaked_password_protection'))
   findings.push(concern(environment+'.password-protection','HARDEN','Supabase advisor reports leaked-password protection disabled'));
 }
 const production=projects.get('production'),staging=projects.get('staging');
 if(hasAll(production.table.authenticatedGrants,["TRUNCATE","TRIGGER","REFERENCES"]))
  findings.push(concern('production.overbroad-table-grants','REVIEW',
   'Authenticated role has TRUNCATE/TRIGGER/REFERENCES; TRUNCATE bypasses RLS. Review least-privilege grants before release; do not change live permissions automatically'));
 if(production.table.authenticatedGrants.includes('DELETE'))
  findings.push(concern('production.backup-delete-privilege','REVIEW',
   'Authenticated role can DELETE rows; determine whether backup deletion is necessary and permitted in the app'));
 if(!hasAll(staging.table.authenticatedGrants,['INSERT','UPDATE'])){
  const writer=staging.backupRpc;
  if(!writer.usePrivateWriter||writer.privateFunction!=='closet_rpc_private.save_checked'||
   !writer.privateFunctionSecurityDefiner||writer.privateFunctionOwner!=='closet_backup_writer'||
   writer.restrictedWriterBypassRls!==false||writer.authenticatedRoleMemberOfWriter!==false||
   !writer.privateSchemaAuthenticatedUsage||!writer.privateFunctionAuthenticatedExecute||
   !writer.writerInsertUpdateSelect||!writer.functionValidatesRequestJwtOwner){
   findings.push(concern('staging.restricted-writer-broken','BLOCKER',
    'Missing direct write grants require validated dedicated private writer route'));
  }else{
   findings.push(concern('staging.restricted-writer-model','INFO',
    'No direct authenticated INSERT/UPDATE is intentional; private security-definer function owned by non-BYPASSRLS closet_backup_writer appears wired. Still requires an actual authorized save/restore test'));
  }
 }
 if(!staging.bucket.policies.includes('closet_photos_update'))
  findings.push(concern('staging.no-photo-upsert','REVIEW',
   'No Storage UPDATE policy: content-addressed POST + immutable GET may work, but upsert/replacements should fail. Verify intended client behavior'));
 const expectedProductionRef=production.ref;
 if(!appAuthSource.includes("const URL='https://"+expectedProductionRef+".supabase.co'")||
  !appAuthSource.includes("const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/'"))
  findings.push(concern('current-app.auth-routing-unexpected','REVIEW','Auth endpoint or callback changed: review staged origin before any rollout'));
 else findings.push(concern('staging.app-backend-not-separated','BLOCKER',
  'Current app auth.js still connects to production backend and GitHub Pages callback; do NOT deploy to an alpha site with this config'));
 findings.push(concern('authorization.live-matrix-not-tested','BLOCKER',
  'RLS/storage checked from catalog only. No approved four-user live Auth JWT allow/deny and private-photo object API tests'));
 findings.push(concern('host.access-not-verified','BLOCKER',
  'Cloudflare protected staging access, Auth redirect, approved allowlist and physical phones not verified'));
 return Object.freeze({
  releaseStatus:'HOLD',auditDate:raw.auditDate,
  metadataReadOnly:true,actualPrivateAccountAccessTested:false,
  findings:Object.freeze(findings),
  counts:Object.freeze(Object.fromEntries(['BLOCKER','REVIEW','HARDEN','INFO'].map(level=>
   [level,findings.filter(x=>x.level===level).length])))
 });
}
export async function runStaticMetadataAudit({
 snapshotPath=SNAPSHOT,authFile='public/auth.js'
}={}){
 const [snapshot,source]=await Promise.all([
  readFile(snapshotPath,'utf8'),readFile(authFile,'utf8')
 ]);
 return assessFamilyAlphaMetadata(JSON.parse(snapshot),source);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=await runStaticMetadataAudit();
 if(report.releaseStatus!=='HOLD'||report.metadataReadOnly!==true||
  report.actualPrivateAccountAccessTested!==false)
  throw Error('Unsafe release assurance');
 console.log('Family Alpha LIVE METADATA SNAPSHOT (offline evaluation only): '+JSON.stringify(report.counts));
 for(const item of report.findings)console.log(item.level+' '+item.id+': '+item.details);
 console.log('Release HOLD; no production/staging connection made by this checker.');
}
