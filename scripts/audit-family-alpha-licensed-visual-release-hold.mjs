/**
 * Read-only, NO-DEPLOY evidence gate for family avatar visual acceptance.
 *
 * A browser can render an image correctly while its garment cutout is visibly
 * wrong. Do not convert technical PASS or generated provisional masks into
 * permission to onboard real family photos. Evidence is pinned to Work #33's
 * actual licensed 15-photo gallery metadata; no photo pixels are read.
 */
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const GALLERY_SHA='bf731e7fe9e5b8b41864fbf686d84cc80e311b91';
export const GALLERY_FILE='research/family-alpha-33/findings.json';
export const AUDIT_SHA='dd6bac3fa9ff640d4f562cf925337440bdb5cf8f';
export const INSPECTION_FILE=new URL('../docs/evidence/family-alpha-visual-inspection-20261026.json',import.meta.url);

export function auditFamilyVisualEvidence(source,notes){
 if(source?.release!=='HOLD'||source?.clippingPin!==AUDIT_SHA||
    !Array.isArray(source?.rows)||source.rows.length!==15)
  throw Error('Expected immutable licensed-photo visual HOLD cohort');
 if(notes?.ownerApproved!==false||notes?.physicalPhoneVerified!==false||
    notes?.familyReleaseAuthorized!==false||notes?.basis!=='independent-inspection-of-licensed-390px-Chromium-gallery'||
    notes?.galleryCommit!==GALLERY_SHA||!Array.isArray(notes.inspections))
  throw Error('Independent visual inspection cannot claim owner, phone or family approval');
 const sourceSeen=new Set(),quality=new Map();
 let proposals=0,technicalFails=0;
 for(const row of source.rows){
  if(!/^commons-\d{4}$/.test(row?.id)||sourceSeen.has(row.id)||
     typeof row.role!=='string'||!row.role.trim()||
     !/^[a-f0-9]{64}$/.test(row.sourceSHA256)||
     row.ownerApproved!==false||!['PASS','REVIEW','FAIL'].includes(row.decision)||
     (row.decision==='PASS'&&row.priorClippingDecision==='FAIL')||
     !['REVIEW','FAIL'].includes(row.decision)||
     Boolean(row.hasProposal)!==Boolean(row.work30NativeCutoutSHA256)||
     (row.hasProposal&&!/^[a-f0-9]{64}$/.test(row.work30NativeCutoutSHA256)))
   throw Error('Unverified, incomplete or falsely accepted gallery input '+(row?.id||'unknown'));
  sourceSeen.add(row.id);
  if(row.hasProposal)proposals++;else technicalFails++;
  quality.set(row.id,row);
 }
 const observed=new Map();
 for(const record of notes.inspections){
  if(!sourceSeen.has(record?.id)||observed.has(record.id)||
     !['FAIL','REVIEW'].includes(record.assessment)||
     !Array.isArray(record.issues)||record.issues.length<1||
     record.issues.some(x=>typeof x!=='string'||x.length<5)||
     typeof record.explanation!=='string'||record.explanation.length<16||
     record.photoCategory!==quality.get(record.id).role||
     record.screenshot!==('screenshots/chromium-390-'+record.id+'-PROVISIONAL-HOLD.png')||
     record.ownerApproved!==false||record.technicalDisplayPassClaim!==false)
   throw Error('Unsupported case annotation or fake visual approval: '+(record?.id||'unknown'));
  const row=quality.get(record.id);
  if(!row.hasProposal)
   throw Error('Cannot inspect a rendered garment without a verified proposal '+record.id);
  observed.set(record.id,record);
 }
 if(observed.size<3)throw Error('Visual blocker claims require multiple actual inspected examples');
 const assessed=[...observed.values()];
 const missing=source.rows.filter(x=>!x.hasProposal).map(x=>x.id);
 const pending=source.rows.filter(x=>x.hasProposal&&!observed.has(x.id)).map(x=>x.id);
 const reasons=assessed.filter(x=>x.assessment==='FAIL').map(x=>({id:x.id,issues:x.issues}));
 const result={
  kind:'INDEPENDENT_PARTIAL_GALLERY_VISUAL_CHECK',
  issue:255,releaseGate:'HOLD',readyForFourAccounts:false,
  ownerApproved:false,physicalPhoneVerified:false,
  galleryCommit:GALLERY_SHA,clippingCommit:AUDIT_SHA,
  photoCohort:source.rows.length,provisionalCutouts:proposals,
  unrenderablePhotos:technicalFails,visuallyInspected:assessed.length,
  inspectedFails:reasons.length,
  inspectedReviews:assessed.filter(x=>x.assessment==='REVIEW').length,
  inspectedAccepted:0,uninspectedProposals:pending.length,
  noCutoutIds:missing,uninspectedIds:pending,
  visuallyFailedCases:reasons,
  warning:'Technical browser PASS is never apparel visual approval. Gallery and inspections are partial, not owner signoff.'
 };
 if(proposals!==7||technicalFails!==8||assessed.some(x=>x.assessment==='PASS')||
    result.inspectedAccepted!==0||result.readyForFourAccounts)
  throw Error('Invalid release gate: benchmark scope or visual acceptance falsely changed');
 return Object.freeze(result);
}
export async function auditPinnedFamilyVisualEvidence(){
 const raw=execFileSync('git',['show',GALLERY_SHA+':'+GALLERY_FILE],{
  maxBuffer:1024*1024,stdio:['ignore','pipe','ignore']
 });
 const inspection=JSON.parse(await readFile(INSPECTION_FILE,'utf8'));
 return auditFamilyVisualEvidence(JSON.parse(raw.toString('utf8')),inspection);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const report=await auditPinnedFamilyVisualEvidence();
 const output=resolve('benchmark/family-alpha-visual-release-gate-HOLD.json');
 await mkdir(resolve('benchmark'),{recursive:true});
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log('FAMILY_ALPHA_REAL_PHOTO_VISUAL_HOLD',JSON.stringify(report));
}
