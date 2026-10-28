/**
 * Family Alpha #64: disclosure, not classification, authorization or approval.
 * Only fixed, explicitly reviewed reason codes may become user-facing text.
 * Never display image data, source filenames, generated confidence scores,
 * account identifiers, untrusted reason strings or free-form diagnostics.
 */
const DETAILS=Object.freeze({
 'semantic-mannequin-hanger-and-fabric-review-required':
   'Inspect the collar, neckline and cuffs for mannequins, hangers or person parts.',
 'pale-fabric-or-background-ambiguity':
   'Pale clothing may blend into the background. Check the full silhouette and hem.',
 'complex-or-clipped-background':
   'Busy or clipped backgrounds may prevent reliable removal. Use manual correction or retake.',
 'busy-or-ambiguous-background':
   'The background cannot be separated reliably. Retake on a plain surface or review manually.',
 'unstable-low-contrast-boundary':
   'Low-contrast edges are uncertain. Inspect straps, sleeves and thin hems.',
 'possible-separation-or-narrow-detail-loss':
   'Thin straps or separate garment pieces may be missing. Compare against the original photograph.',
 'excessive-removal-risk':
   'The proposed isolation may remove fabric. Keep the original photo or manually correct.',
 'multiple-pieces-need-review':
   'Several disconnected objects were found. Check whether every visible piece is clothing.',
 'source-clipped-or-border-contamination':
   'The garment or background touches the photo edge. Retake if the silhouette is incomplete.',
 'empty-or-background-dominant':
   'The cutout may contain too little clothing or too much background. Use the original-photo fallback.',
 'shoe-pair-requires-explicit-confirmation':
   'Confirm two separate real shoes in the original. Never invent a missing shoe.'
});
const SAFE_CODES=Object.freeze(Object.keys(DETAILS));
export function buildIsolationReviewGuidance(prepared){
 const reasons=prepared?.status==='prepared'
  ?prepared?.confidence?.reasons
  :[prepared?.reason];
 const set=new Set();
 if(Array.isArray(reasons)){
  for(const reason of reasons.slice(0,48))
   if(typeof reason==='string'&&Object.hasOwn(DETAILS,reason))set.add(reason);
 }
 const codes=[...set].slice(0,5);
 if(!codes.length)codes.push('semantic-mannequin-hanger-and-fabric-review-required');
 return Object.freeze({
  schema:'closet-isolation-review-v1',
  status:'REVIEW_REQUIRED',
  codes:Object.freeze(codes),
  automaticApproval:false,
  humanReviewRequired:true,
  ownerApproved:false,
  release:'HOLD'
 });
}
export function createIsolationReviewNotice(doc,input){
 if(!doc||typeof doc.createElement!=='function')throw Error('Document UI required');
 const section=doc.createElement('section');
 section.className='alpha64-isolation-guidance';
 section.setAttribute('role','note');
 section.setAttribute('aria-label','Automatic isolation review checks');
 section.style.cssText='padding:12px;border:1px solid #8c8c8c;border-radius:10px;margin:12px 0;background:#f5f5f5;color:#1a1a1a;font:1rem/1.45 system-ui';
 const heading=doc.createElement('strong');
 heading.textContent='Automatic cutout — manual review required';
 section.append(heading);
 const intro=doc.createElement('p');
 intro.textContent='This preview is not proof of clean clothing or a realistic worn fit. Compare both images; correct the mask or retake if unsure.';
 section.append(intro);
 const list=doc.createElement('ul');
 const requested=input?.schema==='closet-isolation-review-v1'&&Array.isArray(input.codes)
  ?input.codes:[];
 const codes=[...new Set(requested.filter(code=>typeof code==='string'&&Object.hasOwn(DETAILS,code)))].slice(0,5);
 if(!codes.length)codes.push('semantic-mannequin-hanger-and-fabric-review-required');
 for(const code of codes){
  const li=doc.createElement('li');
  li.textContent=DETAILS[code];
  list.append(li);
 }
 section.append(list);
 return section;
}
export const SAFE_ISOLATION_REASONS=SAFE_CODES;
