// Prepares a CANDIDATE human-reviewed reference manifest. Does not approve
// masks, modify the active benchmark manifest or assume AI prediction = truth.
import {approvedReferenceMask} from './garment-mask-metrics.mjs';

const canonicalId=id=>typeof id==='string'&&/^commons-[0-9]{4}$/.test(id);
const approvedPath=id=>'benchmark/approved-reference-masks/'+id+'.mask.approved.json';

export function planReviewedMaskImports(manifest,sources,submissions,photoHashes){
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.cases)||!Array.isArray(sources)||
    !Array.isArray(submissions)||!submissions.length||!(photoHashes instanceof Map))
  throw Error('Missing verified review inputs');
 const cases=new Map(),locked=new Map(sources.map(x=>[x.id,x]));
 if(locked.size!==sources.length)throw Error('Duplicate locked source');
 for(const entry of manifest.cases){
  if(!canonicalId(entry.id)||cases.has(entry.id)||entry.image!==entry.id+'.jpg')throw Error('Invalid or duplicate review case');
  const source=locked.get(entry.id);
  if(!source?.verified||source.image!==entry.image||source.sha256!==entry.sourceSha256||
     !/^[a-f0-9]{64}$/.test(entry.sourceSha256))throw Error('Review manifest does not match locked source');
  cases.set(entry.id,entry);
 }
 const updates=new Map();
 for(const submission of submissions){
  const id=submission?.id,annotation=submission?.annotation;
  if(!canonicalId(id)||!cases.has(id)||updates.has(id))throw Error('Unknown or duplicate approved mask id');
  const entry=cases.get(id);
  if(entry.reviewStatus==='approved'||entry.referenceMask)throw Error('Already approved: '+id);
  if(entry.reviewStatus!=='pending')throw Error('Invalid prior mask review status');
  if(photoHashes.get(id)!==entry.sourceSha256)throw Error('Verified source image checksum required: '+id);
  if(typeof annotation?.reviewedAt!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(annotation.reviewedAt)||
     !Number.isFinite(Date.parse(annotation.reviewedAt)))throw Error('Approval timestamp required: '+id);
  const mask=approvedReferenceMask(annotation,entry);
  if(mask.length<4)throw Error('Insufficient reviewed outline');
  updates.set(id,{...entry,reviewStatus:'approved',referenceMask:approvedPath(id)});
 }
 const candidate={
  ...manifest,
  status:manifest.cases.every(c=>updates.has(c.id)||c.reviewStatus==='approved')?'human-reviewed':'partially-human-reviewed',
  cases:manifest.cases.map(c=>updates.get(c.id)||c)
 };
 return {candidate,files:[...updates.keys()].map(id=>({id,path:approvedPath(id),
  annotation:submissions.find(x=>x.id===id).annotation})),
  added:updates.size,pending:candidate.cases.filter(x=>x.reviewStatus!=='approved').length,
  activeManifestUnchanged:true};
}
