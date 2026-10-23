/**
 * Development-only explicit photo mask review for Family Alpha.
 * Returns true ONLY on a real user's confirm click while scope is active.
 * Photos are kept solely in DOM during review and removed on cancel, finish,
 * pagehide or abort. No network requests, persistence, telemetry or uploads.
 */
export function confirmReviewedPhotoInContainer(container,detail,{
 isActive=()=>true,signal
}={}){
 if(!container||typeof container.replaceChildren!=='function'||!detail||
  typeof detail.originalImage!=='string'||!detail.originalImage.startsWith('data:image/jpeg;base64,')||
  !detail.transparentImage||typeof isActive!=='function')
  return Promise.resolve(false);
 if(signal?.aborted||!isActive())return Promise.resolve(false);
 return new Promise(resolve=>{
  const d=container.ownerDocument||document;
  const panel=d.createElement('section');panel.className='family-alpha-photo-review';
  panel.setAttribute('aria-label','Review your photographed garment');
  const title=d.createElement('h2');title.textContent='Does this look like your clothing?';
  title.style.cssText='font:600 1.2rem/1.35 system-ui;margin:0 0 8px';
  const caption=d.createElement('p');
  caption.textContent='Automatic photo cutout. Check the edges and fabric. This is a 2D preview, not a realistic fit.';
  caption.style.cssText='font:1rem/1.5 system-ui;margin:0 0 12px';
  const row=d.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px';
  const imageCard=(label,source)=>{
   const figure=d.createElement('figure');figure.style.cssText='margin:0;min-width:0';
   const img=d.createElement('img');
   img.alt=label;
   img.src=source;
   img.style.cssText='display:block;width:100%;aspect-ratio:3/4;object-fit:contain;background:#efefef;border:1px solid #777;border-radius:8px';
   const figCaption=d.createElement('figcaption');
   figCaption.textContent=label;figCaption.style.cssText='font:600 .9rem/1.3 system-ui;text-align:center;margin-top:6px';
   figure.append(img,figCaption);return figure;
  };
  row.append(
   imageCard('Original photo',detail.originalImage),
   imageCard('Transparent cutout',detail.transparentImage.src)
  );
  const actions=d.createElement('div');
  actions.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px';
  const button=(label,primary)=>{
   const b=d.createElement('button');b.type='button';b.textContent=label;
   b.style.cssText='min-height:50px;padding:10px;border-radius:10px;white-space:normal;font:600 1rem system-ui;cursor:pointer;'+
    (primary?'background:#54358d;color:white;border:2px solid #54358d':'background:white;color:#242424;border:2px solid #6b6b6b');
   return b;
  };
  const retake=button('Retake photo',false),confirm=button('Use cutout',true);
  actions.append(retake,confirm);
  panel.append(title,caption,row,actions);
  container.replaceChildren(panel);
  let finished=false;
  function done(value){
   if(finished)return;
   finished=true;
   confirm.removeEventListener('click',onConfirm);
   retake.removeEventListener('click',onRetake);
   signal?.removeEventListener('abort',onAbort);
   (container.ownerDocument?.defaultView||globalThis.window)?.removeEventListener?.('pagehide',onAbort);
   container.replaceChildren();resolve(Boolean(value));
  }
  function onConfirm(event){if(!event.isTrusted)return;done(isActive());}
  function onRetake(){done(false);}
  function onAbort(){done(false);}
  confirm.addEventListener('click',onConfirm);
  retake.addEventListener('click',onRetake);
  signal?.addEventListener('abort',onAbort,{once:true});
  (container.ownerDocument?.defaultView||globalThis.window)?.addEventListener?.('pagehide',onAbort,{once:true});
  if(signal?.aborted||!isActive())done(false);
 });
}
