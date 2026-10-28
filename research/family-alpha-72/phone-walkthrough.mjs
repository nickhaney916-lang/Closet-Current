/** Family Alpha #72: local-only nine-step phone workflow. No network, photos, accounts or storage. */
export const FORMAT='closet-current-alpha72-local-phone-check-v1';
export const STEPS=Object.freeze([
 ['P01','Camera preview and retake'],
 ['P02','Original photo remains visible'],
 ['P03','Review type and color'],
 ['P04','Review two pieces separately'],
 ['P05','Save and reopen My Closet'],
 ['P06','Three outfits and one swap'],
 ['P07','Review 2D cutout and fit'],
 ['P08','Logout hides private wardrobe'],
 ['P09','Fresh session restores only my items']
].map(([id,label])=>Object.freeze({id,label})));
export const STATUSES=Object.freeze(['not-tried','worked','needs-help','blocked']);
export function validateAnswers(a){
 if(!Array.isArray(a)||a.length!==9)throw Error('Nine cases required');
 a.forEach((x,i)=>{
  if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join(',')!=='id,status'||
    x.id!==STEPS[i].id||!STATUSES.includes(x.status))throw Error('Invalid or private result');
 });
 return a;
}
export function makeWalkthroughReport(a){
 validateAnswers(a);
 const counts={notTried:0,worked:0,needsHelp:0,blocked:0};
 for(const x of a)counts[{'not-tried':'notTried','worked':'worked','needs-help':'needsHelp','blocked':'blocked'}[x.status]]++;
 const s=JSON.stringify({format:FORMAT,checks:a.map(x=>({id:x.id,status:x.status})),
  counts,source:'local-self-report-unverified',transmitted:false,
  releaseAuthorization:false,familyAlpha:'HOLD'},null,2)+'\n';
 if(s.length>1600)throw Error('Report size unexpectedly large');
 return s;
}
export function mountWalkthrough(root,{sessionTarget=window,
 getSessionActive=()=>document.getElementById('appShell')?.hidden===false}={}){
 if(!root||typeof root.closest!=='function'||typeof getSessionActive!=='function'||!sessionTarget?.addEventListener)
  throw Error('Protected Device help required');
 let disposed=false;const urls=new Set(),sels=[];
 const alive=()=>!disposed&&root.isConnected&&getSessionActive()===true&&
  root.closest('#appShell')?.hidden===false&&root.closest('#devicecheck')?.hidden===false;
 const instructions=document.createElement('p');instructions.className='fine';
 instructions.textContent='Try each step on your phone. This is a private self-check, not proof of device compatibility. Download before logging out: answers reset between sessions.';
 const summary=document.createElement('p');summary.id='alphaWalkthroughSummary';
 summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
 const list=document.createElement('div');list.className='device-check-steps';
 for(const s of STEPS){
  const label=document.createElement('label');label.className='device-check-step';
  const title=document.createElement('strong');title.textContent=s.id+' — '+s.label;
  const select=document.createElement('select');select.id='alphaWalkthrough-'+s.id;
  select.setAttribute('aria-label',s.label);
  for(const v of STATUSES){const opt=document.createElement('option');opt.value=v;opt.textContent=v.replace(/-/g,' ');select.append(opt);}
  label.append(title,select);list.append(label);sels.push(select);
 }
 const answer=()=>STEPS.map((s,i)=>({id:s.id,status:sels[i].value}));
 const refresh=()=>{const a=answer(),done=a.filter(x=>x.status!=='not-tried').length,
  problems=a.filter(x=>x.status==='needs-help'||x.status==='blocked').length;
  summary.textContent=done+' of 9 steps reviewed; '+problems+' need attention. No release approval.';};
 const reset=()=>{for(const s of sels)s.selectedIndex=0;
  for(const u of urls)URL.revokeObjectURL(u);urls.clear();refresh();};
 const controls=document.createElement('div');controls.className='actions';
 const download=document.createElement('button');download.type='button';download.className='secondary';
 download.id='alphaWalkthroughDownload';download.textContent='Download my phone checklist';
 const restart=document.createElement('button');restart.type='button';restart.className='secondary';
 restart.textContent='Start again';restart.id='alphaWalkthroughReset';
 for(const s of sels)s.onchange=()=>{if(alive())refresh();};
 download.onclick=e=>{
  if(!e.isTrusted||!alive()){summary.textContent='Open Device help while signed in to download the checklist.';return;}
  let u;
  try{u=URL.createObjectURL(new Blob([makeWalkthroughReport(answer())],{type:'application/json'}));
   urls.add(u);const a=document.createElement('a');a.href=u;a.download='closet-current-phone-checklist.json';
   a.hidden=true;root.append(a);a.click();a.remove();
   summary.textContent='Checklist downloaded on this device. No information was sent.';
   setTimeout(()=>{if(urls.delete(u))URL.revokeObjectURL(u);},1500);
  }catch{if(u&&urls.delete(u))URL.revokeObjectURL(u);summary.textContent='No checklist sent; download unavailable.';}
 };
 restart.onclick=e=>{if(e.isTrusted&&alive())reset();};
 const dispose=()=>{disposed=true;download.onclick=null;restart.onclick=null;
  for(const s of sels)s.onchange=null;reset();
  sessionTarget.removeEventListener('closet:alpha-session-changed',reset);
  sessionTarget.removeEventListener('pagehide',dispose);root.replaceChildren();};
 sessionTarget.addEventListener('closet:alpha-session-changed',reset);
 sessionTarget.addEventListener('pagehide',dispose);
 controls.append(download,restart);root.append(instructions,list,controls,summary);
 refresh();return Object.freeze({reset,dispose});
}
if(typeof document!=='undefined'){
 const root=document.getElementById('alphaPhoneWalkthrough');
 if(root)mountWalkthrough(root);
}
