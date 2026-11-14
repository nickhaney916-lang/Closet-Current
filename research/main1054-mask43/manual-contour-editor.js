/* MAIN1054 M43: LOCAL public-source pixel-coordinate annotator.
 * Preview uses browser canvas and may alter hidden transparent RGB; it is
 * NEVER the export. Only the exact original-source SHA-pinned JSON coordinate
 * patch is exported; Node M43 independently reconstructs exact original RGB.
 * No network, private owner, synthetic human approval, or 3D admission.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const sourceData=window.M43_ORIGINAL_LICENSED_SOURCES;
 const W=1920,H=2880,limit=2500,patchSchema=
  'MAIN1054_M43_UNVERIFIED_MANUAL_CONTOUR_PATCH/v1';
 const source=$('original'),edited=$('edited');
 const ctxSrc=source.getContext('2d',{willReadFrequently:false});
 const ctxEdit=edited.getContext('2d',{willReadFrequently:false});
 const scratch=document.createElement('canvas');scratch.width=W;scratch.height=H;
 const ctxScratch=scratch.getContext('2d',{willReadFrequently:true});
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctxCanvas=canvas.getContext('2d',{willReadFrequently:true});
 let ready=false,srcImage=null,sourcePixels,baselinePixels,p93Pixels,workingPixels;
 let oldChangeRegion,upper=0,centerX=W/2,centerY=H*.245,zoom=2;
 let active=false,activeStroke=[],strokes=[],changes=new Map(),lastMessage='';
 function msg(s){lastMessage=s;updateStatus();}
 function getCrop(){
  const w=W/zoom,h=w*edited.height/edited.width;
  return {x:Math.max(0,Math.min(W-w,centerX-w/2)),
   y:Math.max(0,Math.min(H-h,centerY-h/2)),width:w,height:h};
 }
 function xyFromEvent(e){
  const rect=edited.getBoundingClientRect(),c=getCrop();
  return {x:Math.max(0,Math.min(W-1,Math.floor(c.x+
   (e.clientX-rect.left)/rect.width*c.width))),
   y:Math.max(0,Math.min(H-1,Math.floor(c.y+
   (e.clientY-rect.top)/rect.height*c.height)))};
 }
 function draw(){
  if(!ready)return;
  const c=getCrop();
  ctxSrc.clearRect(0,0,source.width,source.height);
  ctxEdit.clearRect(0,0,edited.width,edited.height);
  ctxSrc.drawImage(srcImage,c.x,c.y,c.width,c.height,
   0,0,source.width,source.height);
  ctxCanvas.putImageData(workingPixels,0,0);
  ctxEdit.drawImage(canvas,c.x,c.y,c.width,c.height,
   0,0,edited.width,edited.height);
  // Large annotations are made explicitly visible but do not invent RGB.
  for(const [p,operation] of changes){
   const x=p%W,y=Math.floor(p/W);
   if(x<c.x||y<c.y||x>=c.x+c.width||y>=c.y+c.height)continue;
   ctxEdit.fillStyle=operation==='restore'?'rgba(255,190,55,.6)':
    'rgba(0,245,225,.6)';
   ctxEdit.fillRect((x-c.x)*edited.width/c.width,(y-c.y)*edited.height/c.height,
     Math.max(1,edited.width/c.width),Math.max(1,edited.height/c.height));
  }
 }
 function updateStatus(){
  const modes={restore:'original P93-removed fabric candidates',
   remove:'original P93-adjacent suspected background'};
  const restored=[...changes.values()].filter(x=>x==='restore').length;
  const removed=changes.size-restored;
  $('status').textContent=ready?
   'Source: licensed Commons-0053 · original 1920×2880 · '+zoom+'× zoom\n'+
   changes.size+'/'+limit+' manual pixels marked ('+removed+' remove, '+
   restored+' restore) · '+modes[$('mode').value]+'\n'+lastMessage:
   lastMessage||'Loading exact original licensed JPEG, Work47 source and P93 cutout…';
  $('undo').disabled=!strokes.length;
  $('reset').disabled=!changes.size;
  $('export').disabled=!changes.size;
  $('zoomValue').textContent=zoom+'×';
 }
 function nearBright(x,y){
  for(let yy=Math.max(0,y-1);yy<=Math.min(H-1,y+1);yy++)
   for(let xx=Math.max(0,x-1);xx<=Math.min(W-1,x+1);xx++){
    const i=(yy*W+xx)*4;
    const r=sourcePixels.data[i],g=sourcePixels.data[i+1],
     b=sourcePixels.data[i+2];
    if(baselinePixels.data[i+3]>=128&&r>=160&&g>=160&&b>=160&&
     Math.abs(r-g)<4&&Math.abs(g-b)<4)return true;
   }
  return false;
 }
 function permitted(x,y,mode){
  if(y>upper||y<0||x<0||x>=W)return false;
  const p=y*W+x,i=p*4;
  if(changes.has(p))return false;
  if(mode==='restore')
   return p93Pixels.data[i+3]===0&&baselinePixels.data[i+3]>=128&&
    oldChangeRegion[p]===1;
  return p93Pixels.data[i+3]>=128&&baselinePixels.data[i+3]>=128&&
   oldChangeRegion[p]===2&&!nearBright(x,y);
 }
 function applyPoint(x,y,operation){
  if(!permitted(x,y,operation))return false;
  if(changes.size>=limit){msg('2,500-pixel cap reached: export or reset; no extra source pixels changed.');return false;}
  const p=y*W+x,i=p*4;
  changes.set(p,operation);
  if(operation==='restore'){
   for(let k=0;k<3;k++)workingPixels.data[i+k]=sourcePixels.data[i+k];
   workingPixels.data[i+3]=baselinePixels.data[i+3];
  }else{
   workingPixels.data[i+3]=0;
  }
  activeStroke.push(p);
  return true;
 }
 function applyEvent(e){
  const {x,y}=xyFromEvent(e);
  const mode=$('mode').value,rad=Number($('brush').value);
  for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){
   if(dx*dx+dy*dy>rad*rad)continue;
   applyPoint(x+dx,y+dy,mode);
  }
 }
 edited.addEventListener('pointerdown',e=>{
  if(!ready||active)return;
  e.preventDefault();active=true;activeStroke=[];
  if(edited.setPointerCapture)edited.setPointerCapture(e.pointerId);
  applyEvent(e);updateStatus();
 });
 edited.addEventListener('pointermove',e=>{
  if(!ready||!active)return;
  e.preventDefault();applyEvent(e);updateStatus();
 });
 function stopStroke(){
  if(!active)return;
  active=false;
  if(activeStroke.length){
   strokes.push(activeStroke);msg('Draft stroke recorded; this is NOT a verified human review.');
   draw();
  }else msg('No pixel in that stroke satisfied the original-source safety boundary.');
 }
 edited.addEventListener('pointerup',stopStroke);
 edited.addEventListener('pointercancel',stopStroke);
 edited.addEventListener('lostpointercapture',stopStroke);
 function recoverPixel(p){
  const i=p*4;
  for(let k=0;k<4;k++)workingPixels.data[i+k]=p93Pixels.data[i+k];
 }
 $('undo').addEventListener('click',()=>{
  if(!strokes.length)return;
  for(const p of strokes.pop()){changes.delete(p);recoverPixel(p);}
  draw();msg('Last stroke undone; original P93 still unchanged.');
 });
 $('reset').addEventListener('click',()=>{
  changes.clear();strokes=[];workingPixels=new ImageData(
   new Uint8ClampedArray(p93Pixels.data),W,H);
  draw();msg('All unverified pixel proposals cleared; source originals still unchanged.');
 });
 $('zoom').addEventListener('input',()=>{
  zoom=Number($('zoom').value);draw();updateStatus();
 });
 for(const [id,dx,dy] of [['left',-1,0],['right',1,0],
   ['up',0,-1],['down',0,1]]){
  $(id).addEventListener('click',()=>{
   const crop=getCrop();
   centerX=Math.max(0,Math.min(W,centerX+dx*crop.width*.25));
   centerY=Math.max(0,Math.min(H,centerY+dy*crop.height*.25));
   draw();msg('Moved view of the original licensed source.');
  });
 }
 function exportPatch(){
  if(!ready||!changes.size){msg('Annotate at least one valid pixel first.');return;}
  const list=[...changes].sort((a,b)=>a[0]-b[0]).map(([p,operation])=>({
   x:p%W,y:Math.floor(p/W),operation
  }));
  const record={
   schema:patchSchema,sourceId:'commons-0053',
   sourceJpegSHA256:sourceData.originalJpegSHA256,
   baselinePngSHA256:sourceData.baselinePngSHA256,
   p93ProposalSHA256:sourceData.p93ProposalSHA256,
   dimensions:[W,H],changes:list,notes:$('notes').value.slice(0,1500),
   recordKind:'LOCAL_UNVERIFIED_SOURCE_PIXEL_ANNOTATIONS',
   reviewerIdentityIndependentlyVerified:false,
   independentHumanReviewAccepted:false,
   sourceFidelityAccepted:false,acceptedForPhotoDerivedMesh:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD',
   syntheticClicksAreNotRealHumanReview:true,
   originalSourcePixelsExported:false
  };
  const blob=new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='main43-UNVERIFIED-original-contour-annotation.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  msg('Local unverified pixel JSON exported, NOT a reviewed image or 3D permission.');
 }
 $('export').addEventListener('click',exportPatch);
 function loadImage(url){
  return new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);
   img.onerror=()=>reject(Error('Pinned local original source image did not load'));
   img.src=url;
  });
 }
 function pixelsFrom(img){
  ctxScratch.clearRect(0,0,W,H);
  ctxScratch.drawImage(img,0,0);
  return ctxScratch.getImageData(0,0,W,H);
 }
 async function start(){
  if(!sourceData||sourceData.originalJpegSHA256!==
     'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019'||
     sourceData.baselinePngSHA256!==
     'ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4'||
     sourceData.p93ProposalSHA256!==
     'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31')
   throw Error('Source identities mismatch the immutable M41 original');
  const imgs=await Promise.all([sourceData.original,sourceData.baseline,
    sourceData.p93].map(loadImage));
  if(imgs.some(img=>img.naturalWidth!==W||img.naturalHeight!==H))
   throw Error('Actual photographed original dimensions changed');
  [srcImage]=imgs;
  sourcePixels=pixelsFrom(imgs[0]);baselinePixels=pixelsFrom(imgs[1]);
  p93Pixels=pixelsFrom(imgs[2]);
  workingPixels=new ImageData(new Uint8ClampedArray(p93Pixels.data),W,H);
  let top=H,bottom=-1,removed=0;
  oldChangeRegion=new Uint8Array(W*H);
  for(let p=0;p<W*H;p++){
   const i=p*4;
   if(baselinePixels.data[i+3]>=128){
    const y=Math.floor(p/W);top=Math.min(top,y);bottom=Math.max(bottom,y);
   }
   if(baselinePixels.data[i+3]!==p93Pixels.data[i+3]){
    removed++;
    if(baselinePixels.data[i+3]>=128&&p93Pixels.data[i+3]===0)
     oldChangeRegion[p]=1;
   }
  }
  if(removed!==12961||top<0||bottom<=top)
   throw Error('P93 immutable source-alpha proposal not reproduced by browser');
  upper=Math.min(H-1,top+Math.round((bottom-top)*.23));
  // Mark a tight original P93 edge neighborhood just once. UI is only a
  // proposal; Node reconstructor checks the exact same source boundaries.
  for(let p=0;p<W*H;p++)if(oldChangeRegion[p]===1){
   const x=p%W,y=Math.floor(p/W);
   for(let yy=Math.max(0,y-8);yy<=Math.min(H-1,y+8);yy++)
    for(let xx=Math.max(0,x-8);xx<=Math.min(W-1,x+8);xx++){
     const q=yy*W+xx;
     if(oldChangeRegion[q]===0)oldChangeRegion[q]=2;
    }
  }
  ready=true;draw();msg('Ready: actual original, exact Work47 and P93 loaded. All edits remain unverified.');
 }
 // Local public-photo test helper exercises genuine pointer controls. It
 // never signs approval, supplies accounts, edits source files or saves PNGs.
 window.M43_RESEARCH_TEST=Object.freeze({
  findEditable(mode){
   if(!ready)return null;
   for(let y=0;y<=upper;y++)for(let x=0;x<W;x++){
    if(permitted(x,y,mode))return {x,y};
   }
   return null;
  },
  focusOn(x,y){
   centerX=x;centerY=y;draw();
   const c=getCrop(),rect=edited.getBoundingClientRect();
   return {clientX:rect.left+(x-c.x+.5)*rect.width/c.width,
    clientY:rect.top+(y-c.y+.5)*rect.height/c.height};
  },
  state(){return {ready,marked:changes.size,strokes:strokes.length,
   upper,sourceImageLoaded:!!srcImage,
   independentHumanAccepted:false,consumer3D:false,familyAlpha:'HOLD'};}
 });
 start().catch(e=>{msg('BLOCKED genuine original photo editor: '+String(e.message));});
})();
