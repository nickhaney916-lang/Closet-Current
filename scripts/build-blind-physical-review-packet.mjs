// Assemble an independent FIRST-REVIEWER packet from the existing verified
// 10-photo experiment. No model predictions, prompts or expected labels are
// copied into the blind packet. Human approval must happen outside this tool.
import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const SHA=/^[0-9a-f]{64}$/,ID=/^(?:commons|validation)-\d{4}$/;
const hash=x=>createHash('sha256').update(x).digest('hex');
const e=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function createBlindPhysicalReviewPacket(sourceRoot,destRoot,{toolDir='benchmark',expectedCount=10}={}){
 const root=resolve(sourceRoot),dest=resolve(destRoot);
 if(root===dest||dest.startsWith(root+'/')||root.startsWith(dest+'/'))
  throw Error('Output must be outside the source artifact');
 const index=JSON.parse(await readFile(join(root,'reference-review-index.json'),'utf8'));
 const audit=JSON.parse(await readFile(join(root,'source-original-coverage.json'),'utf8'));
 if(index.imageCount!==expectedCount||!Array.isArray(index.cases)||index.cases.length!==expectedCount||
    index.approvedReferences!==0||index.predictionMasksAreGroundTruth!==false||
    index.automaticCustomerMaskPromotion!==false||
    audit.sourcePhotoCount!==expectedCount||audit.verifiedOriginalCount!==expectedCount||
    audit.allOriginalSHA256Matched!==true||audit.independentlyApprovedGarmentMasks!==0||
    audit.measuredPhysicalGarmentAccuracy!==null||audit.canAutoSaveOrPromote!==false||
    !Array.isArray(audit.sources)||audit.sources.length!==expectedCount)
  throw Error('Only complete, unapproved and SHA-verified real-photo sources are accepted');
 const coverage=new Map(audit.sources.map(x=>[x.id,x]));
 if(coverage.size!==expectedCount)throw Error('Duplicate or missing locked source IDs');
 const checked=[],seen=new Set();
 // Check ALL originals before writing even one output to prevent a partial
 // packet from being confused with a complete blinded review.
 for(const entry of index.cases){
  if(!ID.test(entry.id)||seen.has(entry.id)||entry.image!==entry.id+'.jpg'||
     !SHA.test(entry.sourceSha256)||entry.allMasksUnapproved!==true||
     entry.exactOriginalIncludedForReview!==true||
     !Array.isArray(entry.candidateSeeds)||!Array.isArray(entry.attribution?Object.values(entry.attribution):null))
    throw Error('Invalid locked review identity');
  seen.add(entry.id);
  const row=coverage.get(entry.id),source=join(root,'original-photos',entry.image);
  if(!row||row.image!==entry.image||row.sha256!==entry.sourceSha256||
     row.includedUnchanged!==true||row.physicalGarmentCount!==null||
     row.independentlyApprovedMasks!==0)
   throw Error('Missing or altered locked source coverage');
  const bytes=await readFile(source);
  if(bytes.length<4||bytes.length>16_000_000||bytes[0]!==255||bytes[1]!==216||
     bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217||
     hash(bytes)!==entry.sourceSha256)
   throw Error('Original source checksum/JPEG mismatch: '+entry.id);
  checked.push({id:entry.id,image:entry.image,sha256:entry.sourceSha256,
   priority:entry.reviewFirst===true,bytes,credit:entry.attribution});
 }
 if(checked.length!==expectedCount||seen.size!==expectedCount)throw Error('Incomplete original set');
 checked.sort((a,b)=>Number(b.priority)-Number(a.priority)||a.id.localeCompare(b.id));
 const output=join(dest,'original-photos'),tools=join(dest,'tools');
 await mkdir(output,{recursive:true});await mkdir(tools,{recursive:true});
 const copied=[];
 for(const x of checked){
  const file=join(output,x.image);await writeFile(file,x.bytes,{flag:'wx'});
  if(hash(await readFile(file))!==x.sha256)throw Error('Copied JPEG differs from original');
  copied.push({id:x.id,image:x.image,sha256:x.sha256,priorityReview:x.priority});
 }
 for(const filename of ['annotate-garment.html','approve-garment-mask.html','assemble-physical-inventory.html'])
  await copyFile(join(resolve(toolDir),filename),join(tools,filename));
 const cards=copied.map((x,i)=>'<article><h2>'+(i+1)+'. '+e(x.id)+'</h2>'+
  '<a href="original-photos/'+e(x.image)+'" target="_blank" rel="noopener"><img src="original-photos/'+e(x.image)+
  '" alt="Original photo '+e(x.id)+'"></a><p>Use <strong>only the unchanged original</strong> to count and outline every visible physical garment. Draw each item separately, including shoes, accessories, hosiery and any hidden-by-other-clothes portions actually visible. Do not infer invisible fabric.</p>'+
  '<p><a href="original-photos/'+e(x.image)+'" download>Open or save full-resolution original</a> · Source SHA-256: <code>'+e(x.sha256)+'</code></p></article>').join('\n');
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Closet Current · Blind physical garment outline review</title><style>body{font:16px system-ui;max-width:1050px;margin:auto;padding:20px}h1{font-size:1.5rem}h2{font-size:1.1rem}p{line-height:1.55}nav a{display:inline-block;margin:5px;padding:10px;border:1px solid #999;border-radius:8px}article{border:1px solid #bbb;border-radius:12px;padding:15px;margin:18px 0}article img{max-width:100%;max-height:440px;object-fit:contain}code{font-size:.72rem;overflow-wrap:anywhere}</style>'+
  '<h1>Blind original-photo garment review · '+expectedCount+' photos</h1>'+
  '<p><strong>Human first reviewer only.</strong> No model overlays, suggested garment types, masks, or item counts are included. This packet has NO approved masks and NO measured recognition accuracy. Work offline; do not upload photos to a public website.</p>'+
  '<nav><a href="tools/annotate-garment.html">Step 1 · Draw independent physical garment outlines</a><a href="tools/approve-garment-mask.html">Step 2 · Separate reviewer checks outlines</a><a href="tools/assemble-physical-inventory.html">Step 3 · Attest complete photo inventory</a><a href="LICENSES.html">Image credits</a></nav>'+
  '<p>For each source, the first real human draws EACH visible physical garment from a blank mask, without looking at the model proposals. A DIFFERENT human independently verifies the whole scene, garment count, identities, and boundaries before approval. Reviewer names and approval flags must be entered by the actual reviewers in the local tools; no automated approval.</p>'+
  cards+'</html>';
 const licenses='<!doctype html><meta charset="utf-8"><title>Source licenses</title><h1>Verified original image attribution</h1><ul>'+
  checked.map(x=>'<li>'+e(x.id)+' · '+e(x.credit?.author||'See source')+' · '+e(x.credit?.license||'See original rights')+
    ' · <a href="'+e(x.credit?.source||'#')+'">Original source</a></li>').join('')+'</ul>';
 await writeFile(join(dest,'REVIEW-FIRST.html'),html);
 await writeFile(join(dest,'LICENSES.html'),licenses);
 await writeFile(join(dest,'BLIND-REVIEW-INSTRUCTIONS.txt'),
  'FIRST REVIEWER: review each original WITHOUT model suggestions, count ALL visible clothing items, and use tools/annotate-garment.html in blank independent-physical-garment mode. Save each genuine draft.\n\n'+
  'SECOND REVIEWER: a different human inspects full original and every drawn outline using tools/approve-garment-mask.html. Reject wrong or missing garments.\n\n'+
  'AFTER BOTH: use tools/assemble-physical-inventory.html per photo to attest full-scene completeness. Then stage and score the approved inventory using repository scripts.\n\n'+
  'Models, AI guesses, source descriptions, names inserted by automation, and checkbox-only confirmations do NOT establish human truth. No photo was approved by this packet.\n');
 const report={status:'awaiting-two-independent-human-reviewers',sourcePhotoCount:copied.length,
  originalSourceHashesVerified:true,blindToModelProposals:true,
  modelMasksIncluded:0,sourceDescriptionLabelsIncluded:0,
  independentlyApprovedMasks:0,independentPhysicalInventoriesCompleted:0,
  physicalGarmentRecall:null,categoryCorrectRecall:null,pixelIoU:null,
  canPromoteModel:false,canSaveCustomerItems:false,photos:copied};
 await writeFile(join(dest,'BLIND-REVIEW-STATUS.json'),JSON.stringify(report,null,2)+'\n');
 // Explicitly inspect the package's top-level files: no model seeds or
 // prediction overlays are exported by this utility.
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [source,destination]=process.argv.slice(2);
 if(!source||!destination)throw Error('Usage: node scripts/build-blind-physical-review-packet.mjs <existing independent-outline-review> <output>');
 const report=await createBlindPhysicalReviewPacket(source,destination);
 console.log('BLIND_PHYSICAL_REVIEW_PACKET '+JSON.stringify({photos:report.sourcePhotoCount,
  originalHashesVerified:report.originalSourceHashesVerified,
  approvedHumanInventories:report.independentPhysicalInventoriesCompleted,
  categoryRecall:report.categoryCorrectRecall,canPromote:report.canPromoteModel}));
}
