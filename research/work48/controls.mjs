/** Reversible rigid fit controls shared by app and licensed prototype. */
export function mountRigidFitControls(host,{getRecord,redraw,isActive=()=>true,onError=()=>{}}){
 const doc=host.ownerDocument,box=doc.createElement('section');box.className='w48-fit-sliders';
 const fields=[['scale','Garment width / length (proportional)',.8,1.2,.01,1],['tilt','Shoulder tilt',-8,8,1,0],['dx','Shoulder position left / right',-30,30,1,0],['dy','Vertical / hem alignment (moves whole garment)',-48,48,1,0],['leftSleeve','Left sleeve angle',-25,25,1,0],['rightSleeve','Right sleeve angle',-25,25,1,0]];
 const inputs=[];
 for(const [key,label,min,max,step,initial]of fields){const wrap=doc.createElement('label'),input=doc.createElement('input'),value=doc.createElement('span');input.type='range';input.min=min;input.max=max;input.step=step;input.value=initial;input.setAttribute('aria-label',label);input.dataset.fitKey=key;wrap.style.cssText='display:grid;gap:5px;margin:10px 0';input.style.cssText='width:100%;min-height:44px;scroll-margin-block-end:calc(132px + env(safe-area-inset-bottom, 0px))';wrap.append(doc.createTextNode(label),input,value);box.append(wrap);inputs.push([key,input,value,initial]);
  input.oninput=()=>{if(!isActive())return;const r=getRecord();if(!r)return;const old={...r.adjust};r.adjust[key]=Number(input.value);try{redraw(r);value.textContent=input.value;}catch(e){r.adjust=old;input.value=old[key]??initial;onError(e);}};
 }
 host.append(box);
 const sync=()=>{const r=getRecord();for(const [key,input,out,initial]of inputs){input.value=r?.adjust[key]??initial;out.textContent=input.value;input.disabled=!r||(key.endsWith('Sleeve')&&!r.profile.panels?.some(p=>p.side===key.replace('Sleeve','')));}};sync();return {sync,dispose(){for(const [,i]of inputs)i.oninput=null;box.remove();}};
}
