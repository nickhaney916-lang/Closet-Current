 
/**
 * Verify a two-corner garment rectangle from TWO independent source-byte
 * and owner-lease-verified P798 points. This is an ORIGINAL-pixel rectangle
 * proposal, NOT a real segmentation mask, owner approval or saved wardrobe.
 */
export function sourceRectFromVerifiedPoints800(first,second,{minimumFraction=.02}={}){
 if(!first||!second||first.schema!=='closet-current-m1-owner-original-point-798/review-only/v1'||
    second.schema!==first.schema||first.ownerId!==second.ownerId||
    first.sourceId!==second.sourceId||first.sourceSHA256!==second.sourceSHA256||
    !sha.test(first.sourceSHA256||'')||!first.sourceBytesSHA256Verified||
    !second.sourceBytesSHA256Verified||!first.capturedFromOriginalJPEG||
    !second.capturedFromOriginalJPEG||first.sourceWidth!==second.sourceWidth||
    first.sourceHeight!==second.sourceHeight||!isPositiveInteger(first.sourceWidth)||
    !isPositiveInteger(first.sourceHeight)||!Number.isFinite(minimumFraction)||
    minimumFraction<.01||minimumFraction>.2)
  fail('two verified source-matched owner corners required');
 const w=first.sourceWidth,h=first.sourceHeight;
 for(const v of [first,second]){
  if(!Number.isInteger(v.pointX)||!Number.isInteger(v.pointY)||
     v.pointX<0||v.pointX>=w||v.pointY<0||v.pointY>=h)
   fail('source rectangle corner outside original JPEG');
 }
 const x0=Math.min(first.pointX,second.pointX),y0=Math.min(first.pointY,second.pointY);
 const x1=Math.max(first.pointX,second.pointX)+1,y1=Math.max(first.pointY,second.pointY)+1;
 if(x1-x0<Math.max(2,Math.ceil(w*minimumFraction))||
    y1-y0<Math.max(2,Math.ceil(h*minimumFraction)))
  fail('rectangle too small: choose opposite garment corners');
 return Object.freeze({
  schema:'closet-current-m1-owner-original-rectangle-800/review-only/v1',
  ownerId:first.ownerId,sourceId:first.sourceId,sourceSHA256:first.sourceSHA256,
  sourceWidth:w,sourceHeight:h,x0,y0,x1,y1,
  normalizedX0:x0/w,normalizedY0:y0/h,
  normalizedX1:x1/w,normalizedY1:y1/h,
  twoVerifiedOriginalJPEGCornerTaps:true,
  userDrawnRectangleInteractionObserved:true,
  independentHumanIdentityVerified:false,
  sourceBoundingBoxOnly:true,actualGarmentMaskGenerated:false,
  sam2ModelRun:false,maskVerified:false,ownerApprovedGarment:false,
  categoryConfirmed:false,subtypeConfirmed:false,colorConfirmed:false,
  autoSaveAllowed:false,privatePersisted:false
 });
}

/**
 * M1 P798 — source-bound, transient ORIGINAL JPEG tap for native Adjust.
 *
 * Research-only human-interface input, NOT a SAM/SAM2 mask, confirmed human
 * annotation, AI classification, saved owner's garment or independent proof.
 * No network requests. This module does not touch IndexedDB or model workers.
 * A caller must validate owner/session/dialog on every call and after digest.
 */
const sha=/^[a-f0-9]{64}$/;
const fail=why=>{throw Error('M1_OWNER_SOURCE_POINT_798 '+why);};
const limit=10*1024*1024;
function isPositiveInteger(v){return Number.isInteger(v)&&v>0&&v<=8192;}
export function sourceTapCoordinates798({rect,clientX,clientY,width,height}={}){
 if(!rect||!Number.isFinite(rect.left)||!Number.isFinite(rect.top)||
    !Number.isFinite(rect.width)||!Number.isFinite(rect.height)||
    !(rect.width>0&&rect.height>0)||!Number.isFinite(clientX)||
    !Number.isFinite(clientY)||!isPositiveInteger(width)||!isPositiveInteger(height))
   fail('a displayed source rectangle and natural photo dimensions are required');
 const fx=(clientX-rect.left)/rect.width,fy=(clientY-rect.top)/rect.height;
 if(fx<0||fx>1||fy<0||fy>1)
  fail('tap fell outside the original photograph');
 const x=Math.min(width-1,Math.floor(fx*width));
 const y=Math.min(height-1,Math.floor(fy*height));
 return Object.freeze({x,y,normalizedX:(x+.5)/width,normalizedY:(y+.5)/height});
}
export async function verifyOriginalTap798({
 originalPhoto,sourceSHA256,sourceHashVerified,ownerId,sourceId,
 currentOwner,sourceStillCurrent,rect,clientX,clientY,
 imageNaturalWidth,imageNaturalHeight,cryptoProvider=globalThis.crypto
}={}){
 if(!sha.test(sourceSHA256||'')||sourceHashVerified!==true||
    !originalPhoto||originalPhoto.sha256!==sourceSHA256||
    !isPositiveInteger(originalPhoto.width)||!isPositiveInteger(originalPhoto.height)||
    imageNaturalWidth!==originalPhoto.width||imageNaturalHeight!==originalPhoto.height||
    typeof ownerId!=='string'||!ownerId||typeof sourceId!=='string'||!sourceId||
    typeof currentOwner!=='function'||typeof sourceStillCurrent!=='function'||
    typeof cryptoProvider?.subtle?.digest!=='function')
  fail('authenticated canonical JPEG source identity or dimensions missing');
 const leased=()=>currentOwner()===ownerId&&sourceStillCurrent()===true;
 if(!leased())fail('owner session or original draft changed before tap');
 const at=sourceTapCoordinates798({
  rect,clientX,clientY,width:imageNaturalWidth,height:imageNaturalHeight
 });
 const data=originalPhoto.image;
 if(typeof data!=='string'||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(data)||
    data.length>Math.ceil(limit*4/3)+64)
  fail('original must be a size-bounded canonical JPEG data URL, never a remote URL');
 const encoded=data.slice('data:image/jpeg;base64,'.length);
 let str;
 try{str=atob(encoded);}catch{fail('canonical JPEG encoding invalid');}
 if(str.length<32||str.length>limit)fail('JPEG byte count outside privacy/memory limits');
 const bytes=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);
 if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)
  fail('original does not contain a complete JPEG file');
 const proof=await cryptoProvider.subtle.digest('SHA-256',bytes);
 const actual=Array.from(new Uint8Array(proof),x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==sourceSHA256)fail('original JPEG bytes no longer match immutable SHA-256');
 if(!leased())fail('owner session or original draft changed during photo verification');
 return Object.freeze({
  schema:'closet-current-m1-owner-original-point-798/review-only/v1',
  sourceSHA256,sourceId,ownerId,
  sourceWidth:imageNaturalWidth,sourceHeight:imageNaturalHeight,
  pointX:at.x,pointY:at.y,normalizedX:at.normalizedX,normalizedY:at.normalizedY,
  capturedFromOriginalJPEG:true,sourceBytesSHA256Verified:true,
  userInterfaceTapObserved:true,independentRealHumanIdentityVerified:false,
  maskGenerated:false,maskVerified:false,
  modelRun:false,subtypeConfirmed:false,colorConfirmed:false,
  autoSaveAllowed:false,ownerApprovedGarment:false,privatePersisted:false
 });
}

/**
 * Actual opt-in native Adjust control: display the immutable ORIGINAL JPEG
 * (not a crop or synthetic source), and capture a reversible tap. It does
 * not expose model endpoints, copy JPEG to a service, change form inputs,
 * persist a receipt or auto-confirm a saved clothing item.
 */
export function mountOriginalTapReview798({
 host,item,ownerId,currentOwner,isActive,enableOwnerBox800=false,enableOwnerMask802=false,enableOwnerMaskCorrection803=false,enableResearchBoxReceipt804=false,enableSAM2PublicEvidence806=false,sam2PublicEvidenceProvider806=null,enableSAM2PublicCorrection808=false
}={}){
 if(!host||typeof host.prepend!=='function'||!item||
    typeof currentOwner!=='function'||typeof isActive!=='function'||
    !ownerId||currentOwner()!==ownerId||!isActive()||
    item.ownerId!==ownerId||item.sourceHashVerified!==true||
    item.originalPhoto?.sha256!==item.sourceSHA256||
    !/^data:image\/jpeg;base64,/.test(item.originalPhoto?.image||''))
  fail('native owner Adjust may not open an unverified original source');
 const source=item.originalPhoto;
 const root=document.createElement('section');
 root.setAttribute('data-mission1-owner-point-798','review-only');
 root.dataset.maskGenerated='false';root.dataset.automaticSave='false';
 root.style.cssText='border:1px solid #a7b5ce;border-radius:10px;padding:12px;margin:12px 0;min-width:0';
 const heading=document.createElement('p');
 heading.textContent='Select a garment point on the ORIGINAL photograph (research preview only). This does not separate clothing or confirm its identity.';
 heading.className='fine';root.append(heading);
 const interactive=document.createElement('button');
 interactive.type='button';interactive.setAttribute('aria-label','Tap original photograph to select garment point');
 interactive.style.cssText='display:inline-block;max-width:100%;padding:0;border:1px solid #6f819e;border-radius:6px;position:relative;overflow:hidden;background:transparent;cursor:crosshair;touch-action:manipulation';
 const photo=document.createElement('img');
 photo.src=source.image;photo.alt='Uncropped original JPEG. Tap the garment you want to review.';
 photo.style.cssText='display:block;max-width:100%;max-height:300px;width:auto;height:auto;object-fit:contain';
 const marker=document.createElement('span');
 marker.dataset.mission1OwnerPointMarker798='none';
 marker.style.cssText='display:none;position:absolute;width:16px;height:16px;border-radius:50%;border:3px solid #fff;background:#1c60ca;box-shadow:0 0 0 1px #122d5d;transform:translate(-50%,-50%);pointer-events:none';
 interactive.append(photo,marker);root.append(interactive);
 const status=document.createElement('p');status.className='fine';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.textContent='No point selected. Tap a visible garment or use Enter to select the center of the photo.';
 root.append(status);
 const clear=document.createElement('button');clear.type='button';
 clear.textContent='Clear garment point';clear.className='secondary';clear.disabled=true;
 root.append(clear);
 let selected=null,busy=false,boxMode=false,boxBusy=false;
 let resetMask802=()=>{},refreshMask802=()=>{};
 let resetSAM2806=()=>{},refreshSAM2806=()=>{};
 let firstVerifiedCorner800=null,selectedBox800=null;
 let keyboardCursorX800=.5,keyboardCursorY800=.5;
 const live=()=>root.isConnected&&isActive()&&currentOwner()===ownerId&&
  item.sourceSHA256===source.sha256&&item.originalPhoto?.image===source.image;
 const reset=()=>{
  resetSAM2806();resetMask802();
  if(enableResearchBoxReceipt804)delete root.dataset.mission1SourcePoint804;
  selected=null;marker.style.display='none';marker.dataset.mission1OwnerPointMarker798='none';
  status.textContent='No point selected. Your original photograph is unchanged.';
  clear.disabled=true;refreshMask802();
 };
 clear.addEventListener('click',reset);
 interactive.addEventListener('click',async event=>{
  // P800 rectangle mode uses the same ORIGINAL JPEG; do not silently turn
  // rectangle-corner taps into independent point review/approval.
  if(boxMode)return;
  if(busy)return;
  busy=true;
  try{
   if(!live())throw Error('The signed-in owner or draft changed');
   if(!photo.complete||!photo.naturalWidth||!photo.naturalHeight)
    throw Error('Original photograph has not finished loading');
   const box=photo.getBoundingClientRect();
   // Keyboard activation (Enter/Space) chooses the center, not (0,0).
   const keyboard=event.detail===0;
   const x=keyboard?box.left+box.width/2:event.clientX;
   const y=keyboard?box.top+box.height/2:event.clientY;
   const point=await verifyOriginalTap798({
    originalPhoto:source,sourceSHA256:item.sourceSHA256,
    sourceHashVerified:item.sourceHashVerified,sourceId:item.id,
    ownerId,currentOwner,sourceStillCurrent:live,
    rect:box,clientX:x,clientY:y,
    imageNaturalWidth:photo.naturalWidth,imageNaturalHeight:photo.naturalHeight
   });
   if(!live())return;
   selected=point;
   // Research-only numeric source coordinates for actual independent model invocation.
   // Never attaches private photo bytes, user identity or persisted data.
   if(enableResearchBoxReceipt804)root.dataset.mission1SourcePoint804=point.pointX+','+point.pointY;
   marker.style.display='block';
   marker.style.left=(point.normalizedX*100)+'%';
   marker.style.top=(point.normalizedY*100)+'%';
   marker.dataset.mission1OwnerPointMarker798='selected';
   status.textContent='Review point at original pixel '+point.pointX+', '+point.pointY+
    '. No AI mask was generated; clothing category, type and color remain unconfirmed.';
   clear.disabled=false;resetSAM2806();resetMask802();refreshMask802();refreshSAM2806();
  }catch{
   if(live()){
    reset();status.textContent='Point not accepted. Check the original photo and signed-in account, then try again.';
   }
  }finally{busy=false;}
 });
 // P800: deliberately gated, local-only ORIGINAL JPEG two-corner rectangle.
 // Reuse the exact P798 verified photo, not a second decoded copy.
 // Do not import SAM2 or persist a crop; P799 oracle box quality was research.
 let resetBox800=()=>{};
 if(enableOwnerBox800===true){
  root.setAttribute('data-mission1-owner-box-800','review-only');
  root.setAttribute('data-owner-box-saved','false');
  const boxStart=document.createElement('button');
  boxStart.type='button';boxStart.className='secondary';
  boxStart.textContent='Draw a rectangle around the garment';
  boxStart.setAttribute('aria-label','Start source garment rectangle selection');
  const boxClear=document.createElement('button');
  boxClear.type='button';boxClear.className='secondary';
  boxClear.textContent='Clear garment rectangle';boxClear.disabled=true;
  const boxStatus=document.createElement('p');
  boxStatus.className='fine';boxStatus.setAttribute('role','status');
  boxStatus.setAttribute('aria-live','polite');
  boxStatus.dataset.mission1OwnerBoxStatus800='review-only';
  boxStatus.textContent='No rectangle selected. Select opposite corners on the original photograph.';
  const overlay=document.createElement('span');
  overlay.style.cssText='display:none;position:absolute;border:2px solid #f5cc37;background:rgba(245,204,55,.15);pointer-events:none;box-sizing:border-box';
  overlay.setAttribute('data-mission1-owner-box-outline-800','none');
  interactive.append(overlay);
  const cursor=()=>{
   marker.style.display='block';
   marker.style.left=(keyboardCursorX800*100)+'%';
   marker.style.top=(keyboardCursorY800*100)+'%';
  };
  resetBox800=()=>{
   resetSAM2806();resetMask802();
   if(enableResearchBoxReceipt804)delete root.dataset.mission1SourceRect804;
   boxMode=false;boxBusy=false;firstVerifiedCorner800=null;selectedBox800=null;
   keyboardCursorX800=.5;keyboardCursorY800=.5;
   overlay.style.display='none';overlay.setAttribute('data-mission1-owner-box-outline-800','none');
   interactive.setAttribute('aria-label','Tap original photograph to select garment point');
   boxClear.disabled=true;refreshMask802();refreshSAM2806();
   boxStatus.textContent='No rectangle selected. Your original photograph is unchanged.';
   marker.style.display='none';
  };
  boxStart.onclick=()=>{
   if(!live())return;
   reset();resetBox800();boxMode=true;
   interactive.setAttribute('aria-label','Select first and opposite original garment rectangle corners');
   boxStatus.textContent='Tap the first corner, then the opposite corner. Keyboard: arrow keys move crosshair; Enter selects each corner.';
   cursor();
  };
  boxClear.onclick=resetBox800;
  interactive.addEventListener('keydown',event=>{
   if(!boxMode||!live())return;
   const steps={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]};
   const delta=steps[event.key];
   if(delta){
    event.preventDefault();
    keyboardCursorX800=Math.min(.98,Math.max(.02,keyboardCursorX800+delta[0]));
    keyboardCursorY800=Math.min(.98,Math.max(.02,keyboardCursorY800+delta[1]));
    cursor();
   }
  });
  interactive.addEventListener('click',async event=>{
   if(!boxMode||boxBusy||!live())return;
   boxBusy=true;
   try{
    if(!photo.complete||!photo.naturalWidth||!photo.naturalHeight)
     throw Error('Original photograph has not loaded');
    const rect=photo.getBoundingClientRect();
    const keyboard=event.detail===0;
    const px=keyboard?rect.left+keyboardCursorX800*rect.width:event.clientX;
    const py=keyboard?rect.top+keyboardCursorY800*rect.height:event.clientY;
    const verified=await verifyOriginalTap798({
     originalPhoto:source,sourceSHA256:item.sourceSHA256,
     sourceHashVerified:item.sourceHashVerified,ownerId,sourceId:item.id,
     currentOwner,sourceStillCurrent:live,rect,clientX:px,clientY:py,
     imageNaturalWidth:photo.naturalWidth,imageNaturalHeight:photo.naturalHeight
    });
    if(!live())return;
    if(!firstVerifiedCorner800){
     firstVerifiedCorner800=verified;
     boxStatus.textContent='First corner verified at original pixel '+verified.pointX+', '+verified.pointY+
      '. Tap or keyboard-select the opposite garment corner.';
    }else{
     const completed=sourceRectFromVerifiedPoints800(firstVerifiedCorner800,verified);
     selectedBox800=completed;boxMode=false;firstVerifiedCorner800=null;
     if(enableResearchBoxReceipt804)root.dataset.mission1SourceRect804=[completed.x0,completed.y0,completed.x1,completed.y1].join(',');
     overlay.style.display='block';
     overlay.style.left=(completed.normalizedX0*100)+'%';
     overlay.style.top=(completed.normalizedY0*100)+'%';
     overlay.style.width=((completed.normalizedX1-completed.normalizedX0)*100)+'%';
     overlay.style.height=((completed.normalizedY1-completed.normalizedY0)*100)+'%';
     overlay.setAttribute('data-mission1-owner-box-outline-800','selected');
     interactive.setAttribute('aria-label','Tap original photograph to select garment point');
     marker.style.display='none';
     boxClear.disabled=false;refreshMask802();refreshSAM2806();
     boxStatus.textContent='Source rectangle pixels '+completed.x0+', '+completed.y0+' to '+
      completed.x1+', '+completed.y1+
      '. This is only a box, not a separated garment mask. No item is saved.';
    }
   }catch{
    resetBox800();
    if(live())boxStatus.textContent='Rectangle not accepted. Select two valid corners on the same original owner photo.';
   }finally{boxBusy=false;}
  });
  root.append(boxStart,boxClear,boxStatus);
  // P806: preview ONLY the exact real SAM2 mask generated by *P804 Linux*
  // using an already-public CC BY original and the exact P804 browser box.
  // This is no live/on-device SAM2 run; no private owner image is exported.
  if(enableSAM2PublicEvidence806===true&&
     typeof sam2PublicEvidenceProvider806==='function'&&
     item.sourceSHA256==='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019'){
   root.dataset.mission1Sam2PublicArtifact806='p804-real-model-output-preview-only';
   const show=document.createElement('button');show.type='button';show.className='secondary';
   show.textContent='Show verified P804 SAM2 public-photo mask';
   show.setAttribute('aria-label','Show archived real SAM2 research mask');show.disabled=true;
   const discard=document.createElement('button');discard.type='button';discard.className='secondary';
   discard.textContent='Discard archived SAM2 preview';discard.disabled=true;
   const note=document.createElement('p');note.className='fine';note.setAttribute('role','status');
   note.setAttribute('aria-live','polite');note.dataset.mission1Sam2Status806='research-only';
   note.textContent='Public-fixture research only. SAM2 was run previously on Linux; it does not run here.';
   const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
   canvas.dataset.mission1Sam2Overlay806='none';
   canvas.style.cssText='display:none;position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
   interactive.append(canvas);
   let epoch=0,busy=false;
   let currentSAM2808=null,brushMode808=null;
   let refreshSAM2808=()=>{},resetBrush808=()=>{};
   resetSAM2806=()=>{
    resetBrush808();currentSAM2808=null;
    epoch++;canvas.style.display='none';canvas.width=0;canvas.height=0;
    canvas.dataset.mission1Sam2Overlay806='none';discard.disabled=true;
    note.textContent='Archived SAM2 preview discarded. Original private wardrobe unchanged.';
   };
   refreshSAM2806=()=>{show.disabled=busy||!live()||!selected||!selectedBox800;};
   discard.onclick=()=>{resetSAM2806();refreshSAM2806();};
   show.onclick=async()=>{
    if(busy||!live()||!selected||!selectedBox800)return;
    resetMask802();resetSAM2806();busy=true;refreshSAM2806();
    const pointInput=selected,boxInput=selectedBox800,run=++epoch;
    try{
     const rect=photo.getBoundingClientRect();
     const verified=await verifyOriginalTap798({
      originalPhoto:source,sourceSHA256:item.sourceSHA256,
      sourceHashVerified:item.sourceHashVerified,ownerId,sourceId:item.id,
      currentOwner,sourceStillCurrent:live,rect,
      clientX:rect.left+pointInput.normalizedX*rect.width,
      clientY:rect.top+pointInput.normalizedY*rect.height,
      imageNaturalWidth:photo.naturalWidth,imageNaturalHeight:photo.naturalHeight
     });
     if(!live()||epoch!==run||boxInput!==selectedBox800||
        pointInput!==selected||pointInput.pointX!==verified.pointX||
        pointInput.pointY!==verified.pointY)return;
     // This test-only provider supplies *only* an immutable public PNG mask
     // and browser engine ID. No private photo bytes or identity are passed.
     const fixture=await sam2PublicEvidenceProvider806();
     if(!live()||epoch!==run||boxInput!==selectedBox800||pointInput!==selected)return;
     const {verifyPublicOriginalSAM2ResearchMask806}=
      await import('./mission1-public-sam2-mask-preview-806.mjs');
     const result=await verifyPublicOriginalSAM2ResearchMask806({
      originalSource:source,box:boxInput,point:verified,
      actorBrowser:fixture?.actorBrowser,pngBase64:fixture?.pngBase64,
      stillCurrent:()=>live()&&epoch===run&&boxInput===selectedBox800&&pointInput===selected
     });
     if(!live()||epoch!==run||boxInput!==selectedBox800||pointInput!==selected)return;
     const decoded=new Image();decoded.src=result.dataURL;await decoded.decode();
     if(decoded.naturalWidth!==result.sourceWidth||decoded.naturalHeight!==result.sourceHeight)
      throw Error('Archived real SAM2 output has wrong original image dimensions');
     const ratio=Math.min(1,512/Math.max(decoded.naturalWidth,decoded.naturalHeight));
     const w=Math.max(1,Math.round(decoded.naturalWidth*ratio));
     const h=Math.max(1,Math.round(decoded.naturalHeight*ratio));
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     if(!ctx)throw Error('In-memory preview is unavailable');
     canvas.width=w;canvas.height=h;ctx.imageSmoothingEnabled=false;
     ctx.drawImage(decoded,0,0,w,h);
     const picture=ctx.getImageData(0,0,w,h);
     let selectedPixels=0;
     for(let i=0;i<picture.data.length;i+=4){
      const maskOn=picture.data[i]>127;
      picture.data[i]=25;picture.data[i+1]=112;picture.data[i+2]=222;
      picture.data[i+3]=maskOn?122:0;
      selectedPixels+=Number(maskOn);
     }
     if(selectedPixels<3||selectedPixels>=w*h)throw Error('Archive mask unsuitable for visual review');
     if(!live()||epoch!==run||boxInput!==selectedBox800||pointInput!==selected)return;
     ctx.putImageData(picture,0,0);
     if(enableSAM2PublicCorrection808===true){
      currentSAM2808={schema:'closet-current-m1-public-original-sam2-manual-808/transient/v1',
       evidence:result,width:w,height:h,overlay:new Uint8ClampedArray(picture.data),
       selectedPixels,manualEditCount:0};
     }
     canvas.dataset.mission1Sam2Overlay806='real-p804-prediction-unverified';
     canvas.style.display='block';discard.disabled=false;
     note.textContent='REAL P804 SAM2 ONNX binary mask REPLAYED from public photo. '+
      'Approx '+Math.round(100*selectedPixels/(w*h))+'% of this thumbnail selected. '+
      'NOT live phone inference, NOT independent mask accuracy, NOT human approved, NOT SAVED.';
    }catch{
     if(live()&&epoch===run){
      resetSAM2806();
      note.textContent='Archived SAM2 public-photo preview unavailable or invalid. No clothing saved or changed.';
     }
    }finally{busy=false;refreshSAM2806();refreshSAM2808();}
   };
   root.append(show,discard,note);
   // P808 optional source-private manual corrections of actual archived SAM2
   // pixels. No model confidence promotion, owner mask approval or saving.
   if(enableSAM2PublicCorrection808===true){
    root.dataset.mission1Sam2ManualCorrection808='unverified-archived-mask-brush-no-save';
    const make=(label,aria)=>{
     const b=document.createElement('button');b.type='button';b.className='secondary';
     b.textContent=label;b.setAttribute('aria-label',aria);b.disabled=true;return b;
    };
    const addButton=make('Add model mask pixels','Add pixels to archived SAM2 mask');
    const eraseButton=make('Erase model mask pixels','Erase pixels from archived SAM2 mask');
    const finish=make('Finish model correction','Finish archived SAM2 mask correction');
    const text=document.createElement('p');text.className='fine';
    text.dataset.mission1Sam2CorrectionStatus808='unverified';
    text.setAttribute('role','status');text.setAttribute('aria-live','polite');
    text.textContent='No real model mask corrections; public research only.';
    let editBusy=false;
    const restorePhoto=()=>{
     interactive.setAttribute('aria-label','Tap original photograph to select garment point');
     if(selected){
      marker.style.left=(selected.normalizedX*100)+'%';
      marker.style.top=(selected.normalizedY*100)+'%';
      marker.style.display='block';
     }
    };
    resetBrush808=()=>{
     brushMode808=null;editBusy=false;
     addButton.disabled=true;eraseButton.disabled=true;finish.disabled=true;
     text.textContent='No corrected SAM2 mask retained or approved. Original JPEG unchanged.';
     if(!boxMode)restorePhoto();
    };
    refreshSAM2808=()=>{
     const active=!!currentSAM2808&&!busy&&live();
     addButton.disabled=!active;eraseButton.disabled=!active;
     if(!active)finish.disabled=true;
    };
    const choose=mode=>{
     if(!live()||!currentSAM2808||busy)return;
     brushMode808=mode;finish.disabled=false;
     interactive.setAttribute('aria-label','Refine archived SAM2 original mask');
     text.textContent='Manual '+mode+' brush on real archived model pixels. NOT a verified or saved cutout.';
    };
    addButton.onclick=()=>choose('add');
    eraseButton.onclick=()=>choose('erase');
    finish.onclick=()=>{
     brushMode808=null;finish.disabled=true;restorePhoto();
     text.textContent='Corrected real model preview remains UNVERIFIED and NOT saved.';
    };
    async function paint808(u,v){
     if(editBusy||!brushMode808||!live()||!currentSAM2808||!selectedBox800||!selected)return;
     editBusy=true;
     const present=currentSAM2808,run=epoch,boxInput=selectedBox800,pointInput=selected,mode=brushMode808;
     try{
      const {correctPublicSAM2Overlay808}=await import('./mission1-public-sam2-mask-brush-808.mjs');
      if(!live()||run!==epoch||present!==currentSAM2808||
         boxInput!==selectedBox800||pointInput!==selected||brushMode808!==mode)return;
      const x=Math.min(present.width-1,Math.max(0,Math.floor(u*present.width)));
      const y=Math.min(present.height-1,Math.max(0,Math.floor(v*present.height)));
      const next=correctPublicSAM2Overlay808({state:present,box:boxInput,point:pointInput,x,y,mode});
      if(!live()||run!==epoch||boxInput!==selectedBox800||pointInput!==selected)return;
      const cx=canvas.getContext('2d');if(!cx)throw Error('SAM2 preview canvas unavailable');
      const out=cx.createImageData(next.width,next.height);out.data.set(next.overlay);
      cx.putImageData(out,0,0);
      currentSAM2808=next;
      text.textContent='Manual '+mode+' on real SAM2 source prediction '+next.manualEditCount+
       ': '+next.lastEditChangedPixels+' thumbnail pixels changed. NOT human-verified, NOT saved.';
     }catch{
      if(live()&&run===epoch)text.textContent='SAM2 mask brush rejected or no change. Original photograph unchanged.';
     }finally{editBusy=false;}
    }
    interactive.addEventListener('click',event=>{
     if(!brushMode808)return;
     event.preventDefault();event.stopImmediatePropagation();
     if(!live())return;
     const r=photo.getBoundingClientRect();
     const u=(event.clientX-r.left)/r.width,v=(event.clientY-r.top)/r.height;
     if(u>=0&&v>=0&&u<=1&&v<=1)void paint808(u,v);
    },true);
    interactive.addEventListener('keydown',event=>{
     if(!brushMode808||!live())return;
     const movement={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]};
     const d=movement[event.key];
     if(d){
      event.preventDefault();event.stopImmediatePropagation();
      keyboardCursorX800=Math.max(.01,Math.min(.99,keyboardCursorX800+d[0]));
      keyboardCursorY800=Math.max(.01,Math.min(.99,keyboardCursorY800+d[1]));
      cursor();
     }else if(event.key==='Enter'||event.key===' '){
      event.preventDefault();event.stopImmediatePropagation();
      void paint808(keyboardCursorX800,keyboardCursorY800);
     }
    },true);
    root.append(addButton,eraseButton,finish,text);
   }
  }
  // P802: an opt-in, on-device, resource-bounded COLOR-CONNECTED preview.
  // This is emphatically NOT SAM2 or a trustworthy independent mask.
  // Requires BOTH the P800 SHA-verified box and a separate P798 owner seed tap.
  if(enableOwnerMask802===true){
   root.dataset.mission1OwnerMask802='ephemeral-local-color-preview';
   const previewButton=document.createElement('button');
   previewButton.type='button';previewButton.className='secondary';
   previewButton.textContent='Preview locally from box and garment point';
   previewButton.setAttribute('aria-label','Preview local source-pixel color region');
   previewButton.disabled=true;
   const dismissPreview=document.createElement('button');
   dismissPreview.type='button';dismissPreview.className='secondary';
   dismissPreview.textContent='Discard local mask preview';dismissPreview.disabled=true;
   const previewStatus=document.createElement('p');
   previewStatus.className='fine';previewStatus.setAttribute('role','status');
   previewStatus.setAttribute('aria-live','polite');
   previewStatus.dataset.mission1LocalMaskStatus802='review-only';
   previewStatus.textContent='Choose an original garment rectangle, then tap a garment pixel inside it. This experimental color preview is not SAM2.';
   const maskCanvas=document.createElement('canvas');
   maskCanvas.style.cssText='display:none;position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
   maskCanvas.dataset.mission1LocalMaskOverlay802='none';
   maskCanvas.setAttribute('aria-hidden','true');
   interactive.append(maskCanvas);
   let maskBusy=false,maskEpoch=0;
   let currentMask803=null,brushMode803=null;
   let updateCorrection803=()=>{},resetCorrection803=()=>{};
   refreshMask802=()=>{
    previewButton.disabled=maskBusy||!selected||!selectedBox800||!live();
   };
   resetMask802=()=>{
    maskEpoch++;
    resetCorrection803();currentMask803=null;
    maskCanvas.style.display='none';maskCanvas.dataset.mission1LocalMaskOverlay802='none';
    maskCanvas.width=0;maskCanvas.height=0;
    dismissPreview.disabled=true;
    previewStatus.textContent='No mask preview retained. Only your original photo is authoritative.';
   };
   dismissPreview.onclick=()=>{resetMask802();refreshMask802();};
   previewButton.onclick=async()=>{
    if(maskBusy||!live()||!selectedBox800||!selected)return;
    resetSAM2806();resetMask802();
    maskBusy=true;refreshMask802();
    const boxInput=selectedBox800,pointInput=selected,epoch=++maskEpoch;
    try{
     if(!photo.complete||!photo.naturalWidth||!photo.naturalHeight)
      throw Error('Original JPEG not decoded');
     const imageRect=photo.getBoundingClientRect();
     // Recompute SHA-256 over ORIGINAL JPEG bytes with an active owner lease.
     const verifiedSeed=await verifyOriginalTap798({
      originalPhoto:source,sourceSHA256:item.sourceSHA256,
      sourceHashVerified:item.sourceHashVerified,ownerId,sourceId:item.id,
      currentOwner,sourceStillCurrent:live,rect:imageRect,
      clientX:imageRect.left+pointInput.normalizedX*imageRect.width,
      clientY:imageRect.top+pointInput.normalizedY*imageRect.height,
      imageNaturalWidth:photo.naturalWidth,imageNaturalHeight:photo.naturalHeight
     });
     if(!live()||maskEpoch!==epoch||boxInput!==selectedBox800||
        pointInput!==selected||verifiedSeed.pointX!==pointInput.pointX||
        verifiedSeed.pointY!==pointInput.pointY)return;
     // Source-private module code only. No image bytes sent to remote model.
     const {makeOwnerSeededLocalPreview802}=
      await import('./mission1-local-mask-preview-802.mjs');
     if(!live()||maskEpoch!==epoch||boxInput!==selectedBox800||pointInput!==selected)return;
     const scale=Math.min(1,512/Math.max(photo.naturalWidth,photo.naturalHeight));
     const w=Math.max(1,Math.round(photo.naturalWidth*scale));
     const h=Math.max(1,Math.round(photo.naturalHeight*scale));
     const sourceCanvas=document.createElement('canvas');sourceCanvas.width=w;sourceCanvas.height=h;
     const ctx=sourceCanvas.getContext('2d',{willReadFrequently:true});
     if(!ctx)throw Error('Local pixel processing unavailable');
     ctx.drawImage(photo,0,0,w,h);
     const bitmap=ctx.getImageData(0,0,w,h);
     const result=makeOwnerSeededLocalPreview802({
      box:boxInput,point:verifiedSeed,pixels:bitmap.data,width:w,height:h
     });
     if(!live()||maskEpoch!==epoch||boxInput!==selectedBox800||pointInput!==selected)return;
     maskCanvas.width=w;maskCanvas.height=h;
     const maskContext=maskCanvas.getContext('2d');
     if(!maskContext)throw Error('Local preview canvas unavailable');
     const overlayImage=maskContext.createImageData(w,h);
     overlayImage.data.set(result.overlay);
     maskContext.putImageData(overlayImage,0,0);
     maskCanvas.style.display='block';
     maskCanvas.dataset.mission1LocalMaskOverlay802='unverified-local-color-region';
     currentMask803=result;updateCorrection803();
     dismissPreview.disabled=false;
     previewStatus.textContent='Local original-pixel COLOR region: '+result.maskPixels+
      ' thumbnail pixels ('+Math.round(result.fractionOfBox*100)+'% of selected box). '+
      'NOT SAM2, not a verified garment cutout, NOT saved. Manually review clothing category, type and color.';
    }catch{
     if(live()&&epoch===maskEpoch){
      resetMask802();
      previewStatus.textContent='Local color preview unavailable or inconclusive. Original photo unchanged; use ordinary manual review.';
     }
    }finally{maskBusy=false;refreshMask802();updateCorrection803();}
   };
   root.append(previewButton,dismissPreview,previewStatus);
   // P803: manual ADD/ERASE brushing of ONLY the ephemeral P802 color
   // preview, never of original JPEG, private garment or an approved cutout.
   if(enableOwnerMaskCorrection803===true){
    root.dataset.mission1OwnerMaskCorrection803='manual-unverified-no-save';
    const makeBrushButton=(label,aria)=>{
     const b=document.createElement('button');b.type='button';b.className='secondary';
     b.textContent=label;b.setAttribute('aria-label',aria);b.disabled=true;
     return b;
    };
    const addBrush=makeBrushButton('Add pixels','Add pixels to local preview');
    const eraseBrush=makeBrushButton('Erase pixels','Erase pixels from local preview');
    const finishBrush=makeBrushButton('Finish correction','Finish local preview correction');
    const correctionStatus=document.createElement('p');
    correctionStatus.className='fine';correctionStatus.setAttribute('role','status');
    correctionStatus.setAttribute('aria-live','polite');
    correctionStatus.dataset.mission1MaskCorrectionStatus803='unverified';
    correctionStatus.textContent='No manual mask correction. This preview is not a verified garment cutout.';
    let paintBusy=false;
    const restorePhotoAction=()=>{
     interactive.setAttribute('aria-label','Tap original photograph to select garment point');
     if(selected){
      marker.style.left=(selected.normalizedX*100)+'%';
      marker.style.top=(selected.normalizedY*100)+'%';
      marker.style.display='block';
     }
    };
    resetCorrection803=()=>{
     brushMode803=null;paintBusy=false;
     addBrush.disabled=true;eraseBrush.disabled=true;finishBrush.disabled=true;
     correctionStatus.textContent='Manual local correction not retained; original photo is unchanged.';
     if(!boxMode)restorePhotoAction();
    };
    updateCorrection803=()=>{
     const ready=!!currentMask803&&live()&&!maskBusy;
     addBrush.disabled=!ready;eraseBrush.disabled=!ready;
     if(!ready)finishBrush.disabled=true;
    };
    const setBrush=mode=>{
     if(!live()||!currentMask803||maskBusy)return;
     brushMode803=mode;finishBrush.disabled=false;
     interactive.setAttribute('aria-label','Refine local source-pixel region');
     correctionStatus.textContent='Local '+mode+' brush active. Tap photo or use arrows then Enter. Only the temporary preview changes; nothing is approved or saved.';
    };
    addBrush.onclick=()=>setBrush('add');
    eraseBrush.onclick=()=>setBrush('erase');
    finishBrush.onclick=()=>{
     brushMode803=null;finishBrush.disabled=true;restorePhotoAction();
     correctionStatus.textContent='Local pixel corrections remain preview-only. No verified mask or private cutout saved.';
    };
    async function paint803(u,v){
     if(paintBusy||!live()||!brushMode803||!currentMask803||!selected||!selectedBox800)return;
     paintBusy=true;
     const current=currentMask803,mode=brushMode803,box=selectedBox800,point=selected,epoch=maskEpoch;
     try{
      const {correctOwnerLocalMask803}=await import('./mission1-local-mask-correction-803.mjs');
      if(!live()||epoch!==maskEpoch||current!==currentMask803||
         box!==selectedBox800||point!==selected||brushMode803!==mode)return;
      const x=Math.min(current.width-1,Math.max(0,Math.floor(u*current.width)));
      const y=Math.min(current.height-1,Math.max(0,Math.floor(v*current.height)));
      const changed=correctOwnerLocalMask803({preview:current,box,point,x,y,mode});
      if(!live()||epoch!==maskEpoch||box!==selectedBox800||point!==selected)return;
      const maskContext=maskCanvas.getContext('2d');
      if(!maskContext)throw Error('Mask preview canvas unavailable');
      const output=maskContext.createImageData(changed.width,changed.height);
      output.data.set(changed.overlay);
      maskContext.putImageData(output,0,0);
      currentMask803=changed;
      correctionStatus.textContent='Manual '+mode+' correction '+changed.manualEditCount+
       ': '+changed.manualEditPixelsChanged+' thumbnail pixels changed. UNVERIFIED, NOT SAM2, NOT saved.';
     }catch{
      if(live()&&epoch===maskEpoch)
       correctionStatus.textContent='Pixel correction rejected or did not change the local mask. Original JPEG unchanged.';
     }finally{paintBusy=false;}
    }
    interactive.addEventListener('click',event=>{
     if(!brushMode803)return;
     event.preventDefault();event.stopImmediatePropagation();
     if(!live())return;
     const r=photo.getBoundingClientRect();
     const u=(event.clientX-r.left)/r.width,v=(event.clientY-r.top)/r.height;
     if(u>=0&&v>=0&&u<=1&&v<=1)void paint803(u,v);
    },true);
    interactive.addEventListener('keydown',event=>{
     if(!brushMode803||!live())return;
     const steps={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]};
     const d=steps[event.key];
     if(d){
      event.preventDefault();event.stopImmediatePropagation();
      keyboardCursorX800=Math.max(.01,Math.min(.99,keyboardCursorX800+d[0]));
      keyboardCursorY800=Math.max(.01,Math.min(.99,keyboardCursorY800+d[1]));
      cursor();
     }else if(event.key==='Enter'||event.key===' '){
      event.preventDefault();event.stopImmediatePropagation();
      void paint803(keyboardCursorX800,keyboardCursorY800);
     }
    },true);
    root.append(addBrush,eraseBrush,finishBrush,correctionStatus);
   }
  }
 }
 host.prepend(root);
 return Object.freeze({
  root,
  getPoint:()=>live()?selected:null,
  getBox:()=>live()?selectedBox800:null,
  clear:reset,
  clearBox:()=>resetBox800(),
  dispose:()=>{reset();resetBox800();root.remove();}
 });
}
