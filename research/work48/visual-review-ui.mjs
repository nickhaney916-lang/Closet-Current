import {newReviewEvidence,recordReview,validateEvidence,parseReviewImport,serializeReviewExport,CHECKS,REASONS} from './visual-review-evidence.mjs';
// Localhost research-only: no storage API, remote POST, owner sign-off or approvals.
export function mountVisualReview(root,manifest,onNavigate){
 if(!root||typeof onNavigate!=='function')throw Error('Review root/navigation required');
 let evidence=newReviewEvidence(manifest),currentId=manifest.rows[0].id;
 const el=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
 const label=(txt,control)=>{const l=el('label',txt);l.append(control);return l;};
 const heading=el('h2','Human visual acceptance — licensed garments');
 const hint=el('p','Review the original, cutout, previous fit, improved fit and close-ups above. This is local, unverified research only. Your grades never approve a release or replace official decisions.');
 const status=el('p');status.setAttribute('role','status');
 const choice=el('select');choice.setAttribute('aria-label','Your visual grade');
 for(const [value,txt] of [['NOT_REVIEWED','Not reviewed'],['PASS','PASS — all four checks required'],['REVIEW','REVIEW — needs correction'],['FAIL','FAIL — no faithful fit']]){
  const opt=el('option',txt);opt.value=value;choice.append(opt);
 }
 const reason=el('select');reason.setAttribute('aria-label','Visual reason (no personal information)');
 const none=el('option','Choose visual reason');none.value='';reason.append(none);
 for(const text of REASONS){const o=el('option',text);o.value=text;reason.append(o);}
 const checks=el('div');checks.className='review-checks';
 const checkboxes=new Map();
 for(const [id,txt] of [['sourcePixels','Source print and color intact'],['cutoutEdge','Cutout edge clean and complete'],['bodyAttachment','Shoulders and sleeves attached'],['proportions','Waist and body proportions believable']]){
  const input=el('input');input.type='checkbox';input.setAttribute('aria-label',txt);
  checkboxes.set(id,input);checks.append(label(txt,input));
 }
 const save=el('button','Save this review'),next=el('button','Next unreviewed garment'),download=el('button','Export local JSON review');
 for(const b of [save,next,download])b.type='button';
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';upload.setAttribute('aria-label','Import previous manual review');
 const actions=el('div');actions.className='review-actions';actions.append(save,next,download,label('Resume prior local JSON ',upload));
 const lock=el('p','No photo bytes, names, account IDs or personal notes in export. PASS is a self-reported judgment, never verified owner approval. Family Alpha HOLD.');lock.className='review-lock';
 root.append(heading,hint,status,label('Manual decision ',choice),label('Safe visual reason ',reason),checks,actions,lock);
 const render=id=>{
  currentId=id;const row=evidence.rows.find(x=>x.id===id);
  if(!row)throw Error('Unknown licensed visual row');
  choice.value=row.decision;reason.value=row.reason;
  for(const k of CHECKS)checkboxes.get(k).checked=row.checks[k];
  const info=validateEvidence(manifest,evidence);
  status.textContent=info.reviewed+'/15 reviewed · '+info.pending+' pending · manual PASS '+info.pass+', REVIEW '+info.review+', FAIL '+info.fail+' · Family Alpha HOLD · '+id;
 };
 save.onclick=()=>{
  try{evidence=recordReview(manifest,evidence,currentId,choice.value,reason.value,Object.fromEntries(CHECKS.map(k=>[k,checkboxes.get(k).checked])));render(currentId);}
  catch(e){status.textContent='NOT SAVED — '+e.message+' · Family Alpha HOLD';}
 };
 next.onclick=()=>{
  const candidate=evidence.rows.find(x=>x.decision==='NOT_REVIEWED');
  if(candidate){onNavigate(candidate.id);render(candidate.id);}
  else status.textContent='All 15 graded locally; export for independent owner review. Family Alpha HOLD.';
 };
 download.onclick=()=>{
  try{
   const json=serializeReviewExport(manifest,evidence),blob=new Blob([json],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='closet-current-licensed-visual-review-HOLD.json';a.click();
   URL.revokeObjectURL(url);status.textContent='Local JSON downloaded. No server upload or release approval.';
  }catch{status.textContent='Invalid review; export blocked. Family Alpha HOLD.';}
 };
 upload.onchange=async()=>{
  const file=upload.files?.[0];upload.value='';if(!file)return;
  try{if(file.size>32000)throw Error('Review too large');const imported=parseReviewImport(manifest,await file.text());evidence=imported;render(currentId);status.textContent='Prior local review imported. No owner approval. HOLD.';}
  catch{status.textContent='Invalid review file rejected; current work kept. Family Alpha HOLD.';}
 };
 render(currentId);
 return Object.freeze({show:render,counts:()=>validateEvidence(manifest,evidence),dispose:()=>{root.replaceChildren();evidence=null;}});
}
