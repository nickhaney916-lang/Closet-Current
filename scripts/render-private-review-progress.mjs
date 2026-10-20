// Private, offline-only checklist to help humans complete real source-photo reviews.
// This reports progress, NEVER correctness, legal rights, or production approval.
const assert=(condition,msg)=>{if(!condition)throw Error(msg);};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const sourcePattern=/^commons-[0-9]{4}\.jpg$/;
const itemPattern=/^commons-[0-9]{4}-item-[0-9]{2}$/;
const statuses=Object.freeze({
 'first-draft-present':['First draft received','Next: a different person checks every garment pixel, type and interior opening'],
 'two-review-files-structurally-consistent':['Two files agree structurally','Next: independently verify real reviewer provenance, annotation/image rights, and visual truth; not approved here'],
 'invalid-hold':['Review files need correction','Next: correct invalid draft/review, then repeat the independent second review'],
 'missing-first-draft':['First draft missing','Next: obtain the original first-person annotation before reviewing']
});
const imagePath=(prefix,name)=>prefix+name;

export function renderPrivateReviewProgress(report,{
 imagePrefix='../../benchmark/fixtures/',
 firstEditor='../../benchmark/annotate-garment-native.html',
 secondEditor='../../benchmark/approve-garment-mask-native.html'
}={}){
 assert(report?.schemaVersion===1&&report.status==='REVIEW-HANDOFF-PREFLIGHT-ONLY-NO-QUALITY-APPROVAL'&&
  report.summary?.lockedOriginalsVerified===12&&
  report.summary?.independentlyApprovedFullGarmentMasks===0&&
  report.summary?.productionAuthorized===false&&Array.isArray(report.cases)&&report.cases.length===12,
  'Progress page must never imply real-photo approval');
 const prefixes=[imagePrefix,firstEditor,secondEditor];
 assert(prefixes.every(s=>typeof s==='string'&&!/^(?:https?:|javascript:|data:|\/\/)/i.test(s)&&!s.includes('"')&&!s.includes("'")),
  'Offline viewer cannot link remote sources');
 const caseIds=new Set();
 const sections=report.cases.map(c=>{
  assert(sourcePattern.test(c.image)&&c.id===c.image.slice(0,-4)&&!caseIds.has(c.id)&&Array.isArray(c.items),
   'Invalid or duplicate original source');
  caseIds.add(c.id);
  const items=c.items.map(item=>{
   assert(itemPattern.test(item.itemId)&&item.itemId.startsWith(c.id+'-item-')&&statuses[item.state],
    'Unknown reviewer item or status');
   const [status,action]=statuses[item.state];
   const flags=(Array.isArray(item.topologyFlags)?item.topologyFlags:[])
    .filter(v=>typeof v==='string'&&/^[a-z-]{1,60}$/.test(v));
   return '<li><strong>'+escapeHtml(item.itemId)+'</strong> — '+escapeHtml(status)+
    '<p>'+escapeHtml(action)+'</p>'+
    (flags.length?'<p>Inspection reminders: '+flags.map(escapeHtml).join(', ')+
     ' (not independently established errors)</p>':'')+'</li>';
  }).join('');
  const next=c.items.length?'See each item status. New separate garments need their own first annotation.':
   'First reviewer: open the original photograph in the blank native-grid editor and draw the entire garment.';
  return '<article class="photo"><div class="frame"><img loading="lazy" src="'+escapeHtml(imagePath(imagePrefix,c.image))+
   '" alt="Unchanged original garment photograph '+escapeHtml(c.id)+'"></div><div class="details"><h2>'+
   escapeHtml(c.id)+'</h2><p>'+escapeHtml(c.originalGrid.width)+' × '+escapeHtml(c.originalGrid.height)+
   ' original pixels · '+(c.items.length?'Human review files present':'No review files yet')+'</p><p>'+escapeHtml(next)+'</p>'+
   (items?'<ul>'+items+'</ul>':'')+
   '<p><a href="'+escapeHtml(imagePath(imagePrefix,c.image))+'" download="'+escapeHtml(c.image)+
   '">Save exact source JPG</a></p></div></article>';
 }).join('\n');
 const sum=report.summary;
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src &#39;self&#39; file:; style-src &#39;unsafe-inline&#39;">'+
  '<title>Closet Current — independent garment review worklist</title>'+
  '<style>body{font:16px system-ui,sans-serif;color:#25212e;background:#f6f4fa;max-width:1000px;margin:auto;padding:18px}'+
  'h1{font-size:1.65rem}h2{font-size:1.2rem;margin:.2em 0}p{line-height:1.45}a{color:#432879;overflow-wrap:anywhere}'+
  '.banner{background:#f0eaf6;border:1px solid #cbc2d7;padding:16px;border-radius:12px}'+
  '.stats{display:flex;flex-wrap:wrap;gap:12px}.stat{background:white;border:1px solid #ddd;flex:1 1 110px;padding:12px;border-radius:12px}'+
  '.stat strong{font-size:1.5rem;display:block}.photo{background:#fff;border:1px solid #ded8e5;border-radius:12px;padding:14px;display:flex;gap:16px;margin:14px 0}'+
  '.frame{width:200px;flex-shrink:0;display:flex;align-items:center;justify-content:center}img{width:100%;max-height:290px;object-fit:contain}'+
  '.details{min-width:0}li{margin:12px 0}li p{margin:3px 0 5px}'+
  '@media(max-width:570px){.photo{display:block}.frame{width:100%;height:210px}.frame img{max-height:210px}}'+
  '</style><h1>Independent clothing photo review</h1>'+
  '<section class="banner"><strong>LOCAL REVIEW WORKLIST — NOT VERIFIED GARMENT ACCURACY</strong>'+
  '<p>The photo you see is unchanged. No model-predicted mask or garment label is supplied to the first reviewer. Real people must draw and independently review the true garment edges. A structurally matching second file is NOT an authenticated human review or approved real-photo benchmark.</p>'+
  '<p>First reviewer: <a href="'+escapeHtml(firstEditor)+'">open blank native-resolution annotation editor</a>. '+
  'Second independent reviewer: <a href="'+escapeHtml(secondEditor)+'">open source-bound approval editor</a>. '+
  'Neither page transmits photos; save the exported JSON locally.</p></section>'+
  '<section class="stats" aria-label="Review work progress">'+
  '<div class="stat"><strong>'+sum.lockedOriginalsVerified+'</strong> Original photos</div>'+
  '<div class="stat"><strong>'+sum.photosWithHumanFiles+'</strong> Photos with files</div>'+
  '<div class="stat"><strong>'+sum.firstDraftsValidated+'</strong> Structurally valid first drafts</div>'+
  '<div class="stat"><strong>'+sum.structurallyConsistentReviewPairs+'</strong> Matched first/second pairs</div>'+
  '<div class="stat"><strong>'+sum.invalidItems+'</strong> Invalid items</div>'+
  '<div class="stat"><strong>0</strong> Independently approved masks</div></section>'+
  '<p>Native-pixel review and legal rights are separate requirements. This page is offline and intended to stay on your computer; never upload customer selfies, reviewer IDs or private legal evidence to GitHub.</p>'+
  '<main>'+sections+'</main></html>';
}
