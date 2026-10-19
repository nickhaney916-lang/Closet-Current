// Static, offline review packet. This does not create or approve reference masks.
// Inputs must come from the locked licensed-source manifest and the live model
// prediction runner. Predictions never count as human-validated ground truth.
function escaped(value){
 return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function allowedUrl(value){
 return typeof value==='string'&&/^https:\/\/[^"'<> ]+$/i.test(value)?value:null;
}
export function buildGarmentReviewPacket(manifest,sources,report){
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.cases)||!Array.isArray(sources)||!Array.isArray(report)||
    !manifest.cases.length||manifest.cases.length!==report.length)throw Error('Incomplete garment review packet');
 const sourceMap=new Map(sources.map(s=>[s.id,s]));
 const caseIds=new Set(),reportMap=new Map(report.map(r=>[r.id,r]));
 if(reportMap.size!==report.length)throw Error('Duplicate segmentation predictions');
 const tasks=[];
 for(const entry of manifest.cases){
  if(caseIds.has(entry.id))throw Error('Duplicate review case');
  caseIds.add(entry.id);
  if(!/^commons-\d+$/.test(entry.id)||entry.image!==entry.id+'.jpg'||!/^[a-f0-9]{64}$/.test(entry.sourceSha256))
   throw Error('Invalid review source identity');
  const source=sourceMap.get(entry.id),result=reportMap.get(entry.id);
  if(!source?.verified||source.sha256!==entry.sourceSha256||source.image!==entry.image||
     !source.attribution?.license||!source.attribution?.source||!result)
   throw Error('Missing verified source attribution or model prediction');
  if(!allowedUrl(source.attribution.source)||!allowedUrl(source.attribution.licenseUrl))
   throw Error('Invalid source attribution links');
  if(!['awaiting-human-reference','scored'].includes(result.status))throw Error('Invalid review status');
  if(result.status==='scored'&&!(entry.reviewStatus==='approved'&&entry.referenceMask))
   throw Error('Prediction cannot be scored without approved reference');
  if(result.status==='awaiting-human-reference'&&result.metrics!==null)
   throw Error('Unreviewed result cannot claim ground truth');
  tasks.push({
   id:entry.id,image:entry.image,sourceSha256:entry.sourceSha256,
   title:source.attribution.title||entry.image,
   sourceUrl:source.attribution.source,license:source.attribution.license,
   licenseUrl:source.attribution.licenseUrl,author:source.attribution.author||'See source',
   status:result.status,personDetected:typeof result.personDetected==='boolean'?result.personDetected:null,
   fragmentCount:result.fragments?.count??null,
   files:{
    original:entry.image,
    archivalOriginal:entry.id+'.original.jpg',
    comparison:entry.id+'.side-by-side.png',
    modelSuggestion:entry.id+'.prediction.json'
   }
  });
 }
 if(reportMap.size!==caseIds.size)throw Error('Unexpected review prediction');
 const pending=tasks.filter(t=>t.status!=='scored').length;
 const cards=tasks.map(t=>{
  const links='<a href="'+escaped(t.files.original)+'" download="'+escaped(t.image)+'">1 · Download source photo for annotation (correct filename)</a> · '+
   '<a href="'+escaped(t.files.comparison)+'">Model overlay comparison</a> · '+
   '<a href="'+escaped(t.files.modelSuggestion)+'">Optional prediction seed</a> · '+
   '<a href="'+escaped(t.files.archivalOriginal)+'">Archival original copy (not for annotation)</a>';
  return '<article><h2>'+escaped(t.id)+' — '+escaped(t.title)+'</h2>'+
   '<p><strong>'+ (t.status==='scored'?'Reviewed reference scored':'Awaiting independent human review') +
   '</strong> · '+escaped(t.fragmentCount??'Not counted')+' predicted region(s), not verified pieces</p>'+ 
   '<p><small>Model person-evidence signal: '+escaped(t.personDetected===null?'not provided':t.personDetected?'yes':'no')+'. Standalone garment photographs are not a full-outfit multi-piece accuracy test.</small></p>'+
   '<img src="'+escaped(t.files.comparison)+'" alt="Original garment photo alongside overlaid AI prediction (not verified)" loading="lazy">'+
   '<p>'+links+'</p><p><small>Source: <a href="'+escaped(t.sourceUrl)+'">'+escaped(t.title)+'</a> · '+
   escaped(t.license)+' (<a href="'+escaped(t.licenseUrl)+'">license</a>) · '+escaped(t.author)+'</small></p>'+
   '</article>';
 }).join('\n');
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Closet Current — licensed photo mask review packet</title>'+
  '<style>body{font:16px system-ui;max-width:1050px;margin:auto;padding:20px;background:#f8f7fb;color:#302638}'+
  'h1{font-size:1.7rem}h2{font-size:1.1rem;line-height:1.4}p{line-height:1.55}a{color:#653c98}'+
  'article{background:#fff;border:1px solid #dfd5eb;border-radius:16px;padding:18px;margin:20px 0}'+
  'article img{width:100%;height:auto;object-fit:contain;border-radius:10px;background:#f0eef1}'+
  'small{font-size:.85rem}nav a{display:inline-block;padding:12px;border:1px solid #9a82b9;margin:4px;border-radius:9px}'+
  '.warning{font-weight:650}</style>'+
  '<h1>Independent garment outline review</h1><p><strong>'+pending+' of '+tasks.length+
  ' references still awaiting two-person human approval.</strong> This packet is an offline internal QA tool, not the customer app.</p>'+
  '<p class="warning">AI-produced mask overlays are only suggestions. They are NOT ground truth and cannot be used to report segmentation or color accuracy. Standalone reference photos do not establish accuracy on multi-layer whole outfits.</p>'+
  '<nav><a href="tools/annotate-garment.html">1 · Create / correct first-review draft</a>'+
  '<a href="tools/approve-garment-mask.html">2 · Independent second review</a></nav>'+
  '<p><strong>Use the source photo filename commons-####.jpg exactly.</strong> The byte-identical commons-####.original.jpg is an archival copy only. Annotation exporters use the chosen file name; choosing the archival name creates a draft rejected by the locked manifest.</p>'+
  '<p>For each case: download the linked canonical source photo, open the first-review tool, optionally import the model suggestion, and draw or correct the entire fabric boundary. '+
  'Export a draft bearing your reviewer identity. A different reviewer must inspect the original and entire mask, reject inaccuracies or export an approved reference. '+
  'Only then may the manifest be updated and pixel accuracy measured. Preserve cuffs, hems, soles, straps, laces and actual fabric; exclude people, mannequins, shadows and scenery.</p>'+
  cards+'</html>';
 return {html,manifest:{
  kind:'review-preparation-not-ground-truth',schemaVersion:1,
  pendingReferences:pending,approvedReferences:tasks.length-pending,
  accuracyAvailable:pending===0&&tasks.length>0,cases:tasks
 }};
}
