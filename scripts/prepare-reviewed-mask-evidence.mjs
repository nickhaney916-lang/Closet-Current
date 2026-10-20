// Offline, fail-closed proposal builder. This does not certify reviewers or rights,
// modify the reference registry, evaluate a model, or authorize production.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inspectHumanOutline} from './human-mask-outline-advisories.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonSha = value => sha(Buffer.from(JSON.stringify(value)));
const validText = value => typeof value === 'string' && value.trim().length > 0;
const hex = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const assert = (condition, message) => { if (!condition) throw Error(message); };
const FORMS = {Tops:['top'],Bottoms:['shorts','trousers','skirt'],Dresses:['dress'],Outerwear:['outerwear'],Shoes:['shoes'],Hosiery:['hosiery'],Accessories:['accessory']};
const maxBytes = 16_000_000;
const bytes = value => Buffer.isBuffer(value) ? value : Buffer.from(value || []);

// The JPEG SOF dimensions come from the ORIGINAL compressed photo, not the
// annotation and not a resized canvas, so a forged grid cannot be imported.
export function jpegDimensions(input) {
 const b = bytes(input);
 assert(b.length >= 8 && b[0] === 0xff && b[1] === 0xd8, 'Not an original JPEG');
 let i = 2;
 while (i < b.length) {
  assert(b[i++] === 0xff, 'Invalid JPEG marker boundary');
  while (i < b.length && b[i] === 0xff) i++;
  const marker = b[i++];
  assert(marker !== 0xda && marker !== 0xd9 && marker !== undefined, 'JPEG dimensions unavailable');
  if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
  assert(i + 2 <= b.length, 'Truncated JPEG segment');
  const len = b.readUInt16BE(i);
  assert(len >= 2 && i + len <= b.length, 'Invalid JPEG segment length');
  if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
   assert(len >= 7, 'Invalid JPEG frame header');
   const height = b.readUInt16BE(i + 3), width = b.readUInt16BE(i + 5);
   assert(width > 0 && height > 0 && width <= 6000 && height <= 6000 && width * height <= 12_000_000,
    'Original exceeds native-pixel review limits');
   return {width, height};
  }
  i += len;
 }
 throw Error('Missing JPEG frame header');
}

export function decodeNativeMask(annotation) {
 const {width,height,runs} = annotation;
 assert(Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0 &&
  width <= 6000 && height <= 6000 && width * height <= 12_000_000 &&
  Array.isArray(runs) && runs.length <= width * height + 1, 'Invalid original-grid mask');
 let offset = 0, pixels = 0, foreground = false;
 for (const count of runs) {
  assert(Number.isSafeInteger(count) && count >= 0 && offset + count <= width * height, 'Invalid RLE run');
  if (foreground) pixels += count;
  offset += count; foreground = !foreground;
 }
 assert(offset === width * height && pixels > 0 && pixels < offset, 'Incomplete/empty/full garment reference');
 return pixels;
}

export function prepareReviewedMaskEvidence({sourceBytes,firstDraftBytes,annotationBytes,manifest,locked,receipt,
 reviewEvidenceBytes,imageRightsEvidenceBytes,annotationRightsEvidenceBytes}) {
 const source=bytes(sourceBytes),firstDraft=bytes(firstDraftBytes),approved=bytes(annotationBytes);
 assert(source.length && source.length <= maxBytes && firstDraft.length && firstDraft.length <= maxBytes &&
  approved.length && approved.length <= maxBytes, 'Source, original first draft, or annotation exceeds limits');
 const draft=JSON.parse(firstDraft.toString('utf8'));
 const annotation=JSON.parse(approved.toString('utf8'));
 // The second editor approves a FIRST human's unchanged original-pixel RLE.
 // Require those original draft bytes to actually exist, rather than trusting
 // a second-reviewer field in a stand-alone approved JSON.
 assert(draft && typeof draft==='object' && !Array.isArray(draft) &&
  draft.schemaVersion===1 && draft.reviewStatus==='draft' && draft.nativeSourceGrid===true &&
  draft.annotationGrid==='exact-original-pixels' && draft.seedModel==null && draft.modelProposalId==null &&
  !Object.hasOwn(draft,'approvedBy') && !Object.hasOwn(draft,'reviewedAt'),
  'Original first-human draft is absent, model-seeded or already approved');
 const secondReviewerOnly=new Set(['reviewStatus','approvedBy','reviewedAt','verifiedSourceWidth','verifiedSourceHeight','note']);
 // A legitimate second reviewer cannot silently redraw a garment. Edits
 // require a corrected first-human draft and a fresh independent review.
 for(const key of Object.keys(draft)){
  if(secondReviewerOnly.has(key))continue;
  assert(Object.hasOwn(annotation,key) && JSON.stringify(annotation[key])===JSON.stringify(draft[key]),
   'Second review changed first-human draft content: '+key);
 }
 for(const key of Object.keys(annotation)){
  assert(Object.hasOwn(draft,key) || secondReviewerOnly.has(key),
   'Unrecognized injected approval field: '+key);
 }
 assert(decodeNativeMask(draft)>0, 'Invalid independent first-human draft mask');
 assert(draft.image===annotation.image && draft.sourceSha256===annotation.sourceSha256 &&
  draft.width===annotation.width && draft.height===annotation.height &&
  JSON.stringify(draft.runs)===JSON.stringify(annotation.runs),
  'Review changed the original human source-grid mask');
 assert(annotation.schemaVersion===1 && annotation.reviewStatus==='approved' && annotation.nativeSourceGrid===true &&
  annotation.annotationGrid==='exact-original-pixels' && annotation.seedModel==null && annotation.modelProposalId==null,
  'Only first-human, model-blind, source-native approved references can be proposed');
 const sourceHash=sha(source),annotationHash=sha(approved);
 const row=manifest?.cases?.find(r=>r.image===annotation.image);
 const lock=locked?.find(r=>r.image===annotation.image && r.id===row?.id);
 assert(row && lock && /^commons-\d{4}\.jpg$/.test(row.image) &&
  sourceHash===row.sourceSha256 && sourceHash===lock.sha256 && annotation.sourceSha256===sourceHash,
  'Original licensed photo digest not in locked evidence manifest');
 const actual=jpegDimensions(source);
 assert(annotation.width===actual.width && annotation.height===actual.height &&
  annotation.verifiedSourceWidth===actual.width && annotation.verifiedSourceHeight===actual.height,
  'Approved mask does not match original JPEG pixels');
 decodeNativeMask(annotation);
 const humanMaskTopologyAdvisory=inspectHumanOutline(annotation);
 assert(typeof annotation.physicalTargetId==='string' &&
  new RegExp('^'+row.id+'-item-[0-9]{2}$').test(annotation.physicalTargetId) &&
  Array.isArray(FORMS[annotation.humanCategory]) &&
  FORMS[annotation.humanCategory].includes(annotation.humanForm) &&
  validText(annotation.humanTargetLabel) && annotation.humanTargetLabel.length<=100,
  'Physical garment category, form or instance missing');
 const first=annotation.reviewer,second=annotation.approvedBy;
 assert(validText(first) && validText(second) && first.length<=80 && second.length<=80 &&
  first.trim().toLocaleLowerCase('en-US')!==second.trim().toLocaleLowerCase('en-US') &&
  annotation.targetIndependentlyIdentifiedBy===first, 'Distinct human review metadata required');
 assert(validText(annotation.reviewedAt) && !Number.isNaN(Date.parse(annotation.reviewedAt)),
  'Reviewed-at timestamp missing');
 assert(receipt?.schemaVersion===1 && receipt.sourceId===row.id && receipt.sourceSha256===sourceHash &&
  receipt.firstDraftSha256===sha(firstDraft) &&
  receipt.approvedAnnotationSha256===annotationHash && receipt.physicalTargetId===annotation.physicalTargetId &&
  receipt.firstReviewer===first && receipt.secondReviewer===second &&
  /^\d{4}-\d{2}-\d{2}$/.test(receipt.reviewDate||''), 'Independent evidence receipt does not bind to reviewed bytes');
 const proofSpecs=[['review',reviewEvidenceBytes,receipt.review],['imageRights',imageRightsEvidenceBytes,receipt.imageRights],
  ['annotationRights',annotationRightsEvidenceBytes,receipt.annotationRights]];
 const checked={};
 for(const [name,data,meta] of proofSpecs){
  const b=bytes(data);
  assert(b.length>0 && b.length <= maxBytes && meta && hex(meta.sha256) && sha(b)===meta.sha256,
   'Missing or changed '+name+' evidence');
  checked[name]={sha256:meta.sha256, bytes:b};
 }
 for(const name of ['imageRights','annotationRights']) {
  const meta=receipt[name];
  assert(meta.status==='verified-for-test-redistribution' && validText(meta.license) &&
   /^https:\/\/[^\s]+$/.test(meta.sourceUrl), 'Rights proof not independently cleared for test redistribution');
 }
 // Namespace evidence keys; never accept a caller-provided path to insert
 // arbitrary file content into the evidence registry.
 const prefix='reviewed-mask-evidence/'+row.id+'/'+annotation.physicalTargetId+'/';
 const paths={review:prefix+'human-review-evidence.bin',imageRights:prefix+'image-rights-evidence.bin',
  annotationRights:prefix+'annotation-rights-evidence.bin'};
 const record={referenceSha256:jsonSha(annotation),sourceSha256:sourceHash,image:row.image,
  scope:'full-visible-garment',method:'manual-independent-annotation',reviewStatus:'approved',
  annotator:first,reviewer:second,reviewDate:receipt.reviewDate,
  reviewEvidence:paths.review,reviewEvidenceSha256:checked.review.sha256,
  imageRights:{status:'verified-for-test-redistribution',license:receipt.imageRights.license,
   sourceUrl:receipt.imageRights.sourceUrl,evidencePath:paths.imageRights,evidenceSha256:checked.imageRights.sha256},
  annotationRights:{status:'verified-for-test-redistribution',license:receipt.annotationRights.license,
   sourceUrl:receipt.annotationRights.sourceUrl,evidencePath:paths.annotationRights,evidenceSha256:checked.annotationRights.sha256}};
 return {schemaVersion:1,status:'MANUAL-REVIEW-REQUIRED-NOT-REGISTERED',firstDraftSha256:sha(firstDraft),
  approvedAnnotationByteSha256:annotationHash,productionAuthorized:false,
  reviewerIdentitiesAuthenticated:false,rightsIndependentlyAuthenticatedByTool:false,
  requiresHumanEvidenceAudit:true,reference:annotation,record,
  humanMaskTopologyAdvisory,
  evidenceSha256:Object.fromEntries(Object.entries(checked).map(([k,v])=>[paths[k],v.sha256])),
  verifiedOriginalDimensions:actual};
}

if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
 const args=process.argv.slice(2);
 const options={};
 for(let i=0;i<args.length;i+=2) {
  assert(args[i]?.startsWith('--') && args[i+1], 'Provide --source --first-draft --annotation --receipt --review-evidence --image-rights-evidence --annotation-rights-evidence --out');
  options[args[i].slice(2)]=args[i+1];
 }
 for(const key of ['source','first-draft','annotation','receipt','review-evidence','image-rights-evidence','annotation-rights-evidence','out'])
  assert(options[key], 'Missing required --'+key);
 const root=path.resolve(process.cwd());
 const out=path.resolve(options.out);
 assert(out.startsWith(root+path.sep+'artifacts'+path.sep) && out.endsWith('.proposal.json'),
  'Write proposals only within artifacts/; canonical approval registry cannot be changed by this tool');
 const r=p=>fs.readFileSync(p);
 const proposal=prepareReviewedMaskEvidence({sourceBytes:r(options.source),firstDraftBytes:r(options['first-draft']),
  annotationBytes:r(options.annotation),
  manifest:JSON.parse(r('benchmark/local-fitting-real-photo-manifest.json')),
  locked:JSON.parse(r('benchmark/locked-photo-sources.json')),
  receipt:JSON.parse(r(options.receipt)),reviewEvidenceBytes:r(options['review-evidence']),
  imageRightsEvidenceBytes:r(options['image-rights-evidence']),
  annotationRightsEvidenceBytes:r(options['annotation-rights-evidence'])});
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(proposal,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:proposal.status,out,sourceSha256:proposal.record.sourceSha256,
  registered:false,productionAuthorized:false}));
}
