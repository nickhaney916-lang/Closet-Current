/**
 * Family Alpha #71: local, predefined, anonymous test feedback. No uploads.
 * This module never accesses wardrobe/auth/camera/storage. It only constructs
 * a four-field JSON note via a trusted user download click.
 */
export const FORMAT='closet-current-family-alpha-local-feedback-v1';
export const FIELDS=Object.freeze({
 area:Object.freeze(['camera','recognition','cutout','avatar-fit','three-outfits','saving','login-session','other']),
 symptom:Object.freeze(['could-not-start','incorrect-result','missing-item','looked-wrong','would-not-save','lost-after-reopen','privacy-concern','other']),
 device:Object.freeze(['android-browser','iphone-safari','other-mobile','desktop']),
 severity:Object.freeze(['blocks-testing','needs-improvement','question'])
});
const KEYS=Object.freeze(['area','symptom','device','severity']);
const LABELS=Object.freeze({
 area:'Where did the issue happen?',
 symptom:'What happened?',
 device:'Which kind of device?',
 severity:'How much did it affect your test?'
});
function validateFields(values){
 if(!values||typeof values!=='object'||Array.isArray(values)||
  Object.keys(values).sort().join(',')!==[...KEYS].sort().join(','))
  throw Error('Only predefined issue selections are accepted');
 for(const key of KEYS)
  if(typeof values[key]!=='string'||!FIELDS[key].includes(values[key]))
   throw Error('Unrecognized issue selection');
 return values;
}
export function makePrivateFeedback(values){
 validateFields(values);
 const result={
  format:FORMAT,
  area:values.area,
  symptom:values.symptom,
  device:values.device,
  severity:values.severity,
  sentAutomatically:false,
  photoAttached:false,
  requiresHumanReview:true,
  familyAlphaRelease:'HOLD'
 };
 const content=JSON.stringify(result,null,2)+'\n';
 if(content.length>480)throw Error('Unexpected report size');
 return content;
}
const title=s=>s.replace(/-/g,' ').replace(/^./,x=>x.toUpperCase());
export function mountPrivateFeedback(root,{
 sessionTarget=window,
 getSessionActive=()=>document.getElementById('appShell')?.hidden===false
}={}){
 if(!root||!root.append||!root.closest||!sessionTarget?.addEventListener||
  typeof getSessionActive!=='function')throw Error('Feedback host unavailable');
 let dead=false,pending=new Set();
 const form=document.createElement('form');
 form.className='device-check-intro';
 const selects={};
 for(const key of KEYS){
  const label=document.createElement('label');
  label.textContent=LABELS[key]+' ';
  const sel=document.createElement('select');
  sel.name=key;sel.id='alphaFeedback-'+key;
  for(const value of FIELDS[key]){
   const option=document.createElement('option');
   option.value=value;option.textContent=title(value);
   sel.append(option);
  }
  label.append(sel);form.append(label);selects[key]=sel;
 }
 const instruction=document.createElement('p');
 instruction.className='fine';
 instruction.textContent='Only four preselected answers are saved in a local file. No photos, names, account details or written descriptions. Nothing is sent automatically.';
 const download=document.createElement('button');
 download.className='secondary';download.type='button';download.id='alphaFeedbackDownload';
 download.textContent='Download private test note';
 const status=document.createElement('p');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.id='alphaFeedbackStatus';
 const caution=document.createElement('p');
 caution.className='fine';caution.textContent='Share the downloaded note privately after reviewing it. Do not post photos or account details in public GitHub issues.';
 form.append(instruction,download,status,caution);
 root.append(form);
 const clear=()=>{
  for(const key of KEYS)selects[key].selectedIndex=0;
  status.textContent='';
  for(const u of pending)URL.revokeObjectURL(u);
  pending.clear();
 };
 const alive=()=>!dead&&root.isConnected&&getSessionActive()===true&&
   root.closest('#appShell')?.hidden===false&&root.closest('#devicecheck')?.hidden===false;
 download.onclick=event=>{
  if(!event.isTrusted||!alive()){
   status.textContent='Open Device help while signed in to create a private test note.';
   return;
  }
  let url;
  try{
   const data=makePrivateFeedback(Object.fromEntries(KEYS.map(key=>[key,selects[key].value])));
   const blob=new Blob([data],{type:'application/json'});
   url=URL.createObjectURL(blob);pending.add(url);
   const link=document.createElement('a');
   link.href=url;link.download='closet-current-alpha-feedback.json';
   link.hidden=true;root.append(link);link.click();link.remove();
   status.textContent='Local note downloaded. Nothing was sent.';
   setTimeout(()=>{if(pending.delete(url))URL.revokeObjectURL(url);},1500);
  }catch{
   if(url&&pending.delete(url))URL.revokeObjectURL(url);
   status.textContent='The local note could not be created. No data was sent.';
  }
 };
 const sessionChanged=()=>{clear();};
 const pageHide=()=>{dispose();};
 sessionTarget.addEventListener('closet:alpha-session-changed',sessionChanged);
 sessionTarget.addEventListener('pagehide',pageHide);
 function dispose(){
  dead=true;download.onclick=null;clear();
  sessionTarget.removeEventListener('closet:alpha-session-changed',sessionChanged);
  sessionTarget.removeEventListener('pagehide',pageHide);
  form.remove();
 }
 return Object.freeze({clear,dispose});
}
if(typeof document!=='undefined'){
 const root=document.getElementById('alphaPrivateFeedback');
 if(root)mountPrivateFeedback(root);
}
