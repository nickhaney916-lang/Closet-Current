// Offline, privacy-limited preflight of first/second real-photo review artifacts.
// Does not authenticate humans/rights, import references, or score extraction.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {jpegDimensions,decodeNativeMask} from './prepare-reviewed-mask-evidence.mjs';
import {inspectHumanOutline} from './human-mask-outline-advisories.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const forms = {Tops:['top'],Bottoms:['shorts','trousers','skirt'],Dresses:['dress'],
 Outerwear:['outerwear'],Shoes:['shoes'],Hosiery:['hosiery'],Accessories:['accessory']};
const fail = message => {throw Error(message);};
const ensure = (check,message) => {if(!check)fail(message);};
const MAX_BYTES=16_000_000;
const FILE_PATTERN=/^(commons-\d{4}-item-\d{2})\.mask\.(draft|approved)\.json$/;
const SECOND_FIELDS=new Set(['reviewStatus','approvedBy','reviewedAt','verifiedSourceWidth','verifiedSourceHeight','note']);
const validName = x => typeof x==='string'&&x.trim().length>0&&x.trim().length<=80;

function parseLimited(input){
 const data=Buffer.isBuffer(input)?input:Buffer.from(input||[]);
 ensure(data.length>0&&data.length<=MAX_BYTES,'Review JSON missing or too large');
 const value=JSON.parse(data.toString('utf8'));
 ensure(value&&typeof value==='object'&&!Array.isArray(value),'Review artifact is not a JSON object');
 return value;
}
function validateDraft(draft,row,dimensions){
 ensure(draft.schemaVersion===1&&draft.reviewStatus==='draft'&&draft.nativeSourceGrid===true&&
  draft.annotationGrid==='exact-original-pixels'&&draft.seedModel==null&&draft.modelProposalId==null&&
  !Object.hasOwn(draft,'approvedBy')&&!Object.hasOwn(draft,'reviewedAt'),'First review must be independent, model-blind, and unapproved');
 ensure(draft.image===row.image&&draft.sourceSha256===row.sourceSha256&&
  draft.width===dimensions.width&&draft.height===dimensions.height,'First draft source or original pixel-grid mismatch');
 ensure(typeof draft.physicalTargetId==='string'&&
  new RegExp('^'+row.id+'-item-\\d{2}$').test(draft.physicalTargetId)&&
  Array.isArray(forms[draft.humanCategory])&&forms[draft.humanCategory].includes(draft.humanForm)&&
  typeof draft.humanTargetLabel==='string'&&draft.humanTargetLabel.trim().length>0&&
  draft.humanTargetLabel.length<=100&&validName(draft.reviewer)&&
  draft.targetIndependentlyIdentifiedBy===draft.reviewer,'First human garment ID/category/form missing');
 decodeNativeMask(draft);
}
function validateSecond(draft,approved,dimensions){
 ensure(approved.schemaVersion===1&&approved.reviewStatus==='approved'&&approved.seedModel==null&&
  approved.modelProposalId==null&&approved.nativeSourceGrid===true&&
  approved.annotationGrid==='exact-original-pixels','Second review artifact is not a native manual review');
 for(const key of Object.keys(draft)){
  if(SECOND_FIELDS.has(key))continue;
  ensure(Object.hasOwn(approved,key)&&JSON.stringify(approved[key])===JSON.stringify(draft[key]),
   'Second review changed first-draft content');
 }
 for(const key of Object.keys(approved)){
  ensure(Object.hasOwn(draft,key)||SECOND_FIELDS.has(key),'Second review injected an unrecognized field');
 }
 ensure(validName(approved.approvedBy)&&approved.approvedBy.trim().toLowerCase()!==draft.reviewer.trim().toLowerCase(),
  'Second reviewer name must differ from first');
 ensure(approved.verifiedSourceWidth===dimensions.width&&approved.verifiedSourceHeight===dimensions.height&&
  typeof approved.reviewedAt==='string'&&!Number.isNaN(Date.parse(approved.reviewedAt)),
  'Second review date or original-grid verification absent');
}

// Reads original sources from the verified repository test fixture set and
// human JSON only from a caller-supplied local folder. Never copy human input.
export function auditReviewHandoff({manifest,locked,readSource,reviewFiles=new Map()}){
 ensure(Array.isArray(manifest?.cases)&&manifest.cases.length===12,'Expected 12 locked original-photo cases');
 ensure(Array.isArray(locked),'Missing independent locked original list');
 const names=new Set(),items=new Map();
 for(const filename of reviewFiles.keys()){
  ensure(typeof filename==='string'&&!filename.includes('/')&&!filename.includes('\\'),'Review file path must be a flat filename');
  const match=FILE_PATTERN.exec(filename);
  ensure(match,'Unexpected review file: '+filename);
  const item=match[1];
  if(!items.has(item))items.set(item,{});
  items.get(item)[match[2]]=reviewFiles.get(filename);
 }
 const cases=[];
 for(const row of manifest.cases){
  ensure(!names.has(row.id)&&/^commons-\d{4}$/.test(row.id)&&row.image===row.id+'.jpg','Duplicate/malformed source ID');
  names.add(row.id);
  const photo=readSource(row.image),record=locked.find(r=>r.id===row.id);
  ensure(Buffer.isBuffer(photo)&&photo.length<=MAX_BYTES&&sha(photo)===row.sourceSha256&&
   record?.image===row.image&&record.sha256===row.sourceSha256,'Original source hash mismatch');
  const originalGrid=jpegDimensions(photo),caseItems=[];
  for(const [id,files] of items.entries()){
   if(!id.startsWith(row.id+'-item-'))continue;
   const output={itemId:id,state:'missing-first-draft',topologyFlagCount:null,requiresHumanAudit:true};
   try{
    ensure(files.draft,'Approved review has no matching first-human draft');
    const draft=parseLimited(files.draft);
    validateDraft(draft,row,originalGrid);
    ensure(draft.physicalTargetId===id,'Review filename disagrees with physical item ID');
    output.state='first-draft-present';
    const mask=inspectHumanOutline(draft);
    output.topologyFlagCount=mask.flagCount;
    output.topologyFlags=mask.flags.map(f=>f.code);
    if(files.approved!==undefined){
     const reviewed=parseLimited(files.approved);
     validateSecond(draft,reviewed,originalGrid);
     output.state='two-review-files-structurally-consistent';
     output.approvedFileSha256=sha(Buffer.isBuffer(files.approved)?files.approved:Buffer.from(files.approved));
     output.firstDraftSha256=sha(Buffer.isBuffer(files.draft)?files.draft:Buffer.from(files.draft));
    }
   }catch(error){
    output.state='invalid-hold';
    output.reason=String(error.message).slice(0,200);
   }
   caseItems.push(output);
  }
  cases.push({id:row.id,image:row.image,originalSha256:row.sourceSha256,originalGrid,
   state:caseItems.length?'human-review-files-present':'no-human-review-files',
   items:caseItems});
 }
 for(const id of items.keys())ensure([...names].some(source=>id.startsWith(source+'-item-')),
  'Review file references a source absent from the 12-photo licensed case list');
 const statuses=cases.flatMap(c=>c.items);
 const summary={lockedOriginalsVerified:cases.length,
  photosWithHumanFiles:cases.filter(c=>c.items.length).length,
  firstDraftsValidated:statuses.filter(s=>s.state==='first-draft-present'||s.state==='two-review-files-structurally-consistent').length,
  structurallyConsistentReviewPairs:statuses.filter(s=>s.state==='two-review-files-structurally-consistent').length,
  invalidItems:statuses.filter(s=>s.state==='invalid-hold').length,
  independentlyAuthenticatedHumans:0,independentlyApprovedFullGarmentMasks:0,
  legallyAuditedAnnotationRights:0,realPhotoMaskAccuracyMeasured:0,productionAuthorized:false};
 return {schemaVersion:1,status:'REVIEW-HANDOFF-PREFLIGHT-ONLY-NO-QUALITY-APPROVAL',
  privateReviewerNamesExcluded:true,modelPredictionsRead:false,originalPhotoPixelsModified:false,
  registryModified:false,summary,cases};
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const argv=process.argv.slice(2);
 ensure(argv.length===4&&argv[0]==='--reviews'&&argv[2]==='--out',
  'Usage: node scripts/preflight-human-review-handoff.mjs --reviews <local-json-folder> --out <artifacts/.../status.json>');
 const root=process.cwd(),dir=path.resolve(argv[1]),out=path.resolve(argv[3]);
 ensure(out.startsWith(path.resolve(root,'artifacts/private-human-review')+path.sep)&&out.endsWith('.json'),
  'Human review status must be under gitignored artifacts/private-human-review/ as JSON');
 const entries=fs.readdirSync(dir,{withFileTypes:true});
 ensure(entries.length<=120,'Too many review files');
 const reviewFiles=new Map();
 for(const ent of entries){
  ensure(ent.isFile()&&!ent.isSymbolicLink(),'No directories or symlinks in review folder');
  const raw=fs.readFileSync(path.join(dir,ent.name));
  ensure(raw.length<=MAX_BYTES,'Review file too large');
  reviewFiles.set(ent.name,raw);
 }
 const manifest=JSON.parse(fs.readFileSync('benchmark/local-fitting-real-photo-manifest.json'));
 const locked=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
 const report=auditReviewHandoff({manifest,locked,readSource:image=>fs.readFileSync('benchmark/fixtures/'+image),reviewFiles});
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(report.summary));
}
