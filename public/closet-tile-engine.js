'use strict';
(function(root){
 // Normalized closet display only: preserve existing photo, garment details,
 // original RGB and separate recognition source. No invented sleeve geometry.
 const cache=new Map(),W=280,H=340;
 function placement(sw,sh,dw=W,dh=H,pad=.085){
  if(![sw,sh,dw,dh,pad].every(Number.isFinite)||sw<1||sh<1||dw<1||dh<1||pad<0||pad>.3)
   throw Error('Invalid tile dimensions');
  const scale=Math.min(dw*(1-pad*2)/sw,dh*(1-pad*2)/sh);
  const width=sw*scale,height=sh*scale;
  return {x:(dw-width)/2,y:(dh-height)/2,width,height};
 }
 function safeWhiteBounds(data,width,height,channels=4){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<4||height<4
    ||width*height>8000000||![3,4].includes(channels)||data?.length!==width*height*channels)
   throw Error('Invalid tile pixels');
  const full={x:0,y:0,width,height,trimmed:false};
  const corners=[[0,0],[width-1,0],[0,height-1],[width-1,height-1]];
  if(!corners.every(([x,y])=>{const k=(y*width+x)*channels;
    return data[k]>235&&data[k+1]>235&&data[k+2]>235&&(channels===3||data[k+3]>235);
  }))return full;
  let minX=width,maxX=-1,minY=height,maxY=-1,found=0;
  const step=Math.max(1,Math.floor(Math.max(width,height)/800));
  for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){
   const k=(y*width+x)*channels;
   if(channels===4&&data[k+3]<225)continue;
   if(Math.min(data[k],data[k+1],data[k+2])>208)continue;
   found++;minX=Math.min(x,minX);maxX=Math.max(x,maxX);
   minY=Math.min(y,minY);maxY=Math.max(y,maxY);
  }
  const total=Math.ceil(width/step)*Math.ceil(height/step);
  // Never crop faint/white clothing or a narrow garment when unsupported.
  if(maxX<minX||found/total<.14||maxX-minX<width*.40||maxY-minY<height*.40)return full;
  const space=Math.round(Math.min(width,height)*.035);
  const left=Math.max(0,minX-space),top=Math.max(0,minY-space),
   right=Math.min(width,maxX+step+space),bottom=Math.min(height,maxY+step+space);
  if(left>width*.19||top>height*.19||width-right>width*.19||height-bottom>height*.19)return full;
  return {x:left,y:top,width:right-left,height:bottom-top,trimmed:true};
 }
 const valid=s=>typeof s==='string'&&s.length<12000000&&
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
 async function draw(item){
  const source=item?.image;
  if(!valid(source)||typeof document==='undefined'||typeof Image==='undefined')return null;
  const im=new Image();im.src=source;
  try{await im.decode();}catch{return null;}
  if(!im.naturalWidth||!im.naturalHeight||im.naturalWidth*im.naturalHeight>8000000)return null;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');if(!ctx)return null;
  let bounds={x:0,y:0,width:im.naturalWidth,height:im.naturalHeight};
  let pose={rotationDeg:0,action:'keep-original-or-centered'};
  let whiteMatte=null;
  // Inspect only a small preview (< 350px on the longest side) rather
  // than allocating millions of RGBA pixels while swiping on a phone.
  const ratio=Math.min(1,320/Math.max(im.naturalWidth,im.naturalHeight));
  const aw=Math.max(4,Math.round(im.naturalWidth*ratio)),
   ah=Math.max(4,Math.round(im.naturalHeight*ratio));
  const tmp=document.createElement('canvas');tmp.width=aw;tmp.height=ah;
  const tc=tmp.getContext('2d',{willReadFrequently:true});
  if(tc)try{
    tc.drawImage(im,0,0,aw,ah);
    const thumbnail=tc.getImageData(0,0,aw,ah);
    if(typeof root.ClosetWhiteMatte!=='undefined')
      whiteMatte=root.ClosetWhiteMatte.analyze(thumbnail.data,aw,ah);
    const detected=safeWhiteBounds(thumbnail.data,aw,ah);
    if(typeof root.GarmentPoseNormalizer!=='undefined')
     pose=root.GarmentPoseNormalizer.axisPlan(thumbnail.data,aw,ah,item.category);
    if(detected.trimmed)bounds={
      x:detected.x*im.naturalWidth/aw,y:detected.y*im.naturalHeight/ah,
      width:detected.width*im.naturalWidth/aw,
      height:detected.height*im.naturalHeight/ah};
   }catch{/* retain the full image if inspection cannot be done */ }
  tmp.width=0;tmp.height=0;
  // Use a uniform white matte to avoid background wedges when rotating a
  // clean white studio cutout. The saved source remains exactly unchanged.
  const rotation=pose.action==='rotate-derived-tile'?-pose.rotationDeg*Math.PI/180:0;
  const transparent=whiteMatte?.eligible===true;
  if(!transparent){
   ctx.fillStyle=rotation?'#fff':'#f6f3f8';ctx.fillRect(0,0,W,H);
  }
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const to=placement(bounds.width,bounds.height,W,H,rotation?.125:.085);
  const render=(canvas,from)=>{
   if(rotation){
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(rotation);
    ctx.drawImage(canvas,from.x,from.y,from.width,from.height,
      -to.width/2,-to.height/2,to.width,to.height);ctx.restore();
   }else ctx.drawImage(canvas,from.x,from.y,from.width,from.height,
      to.x,to.y,to.width,to.height);
  };
  render(im,bounds);
  if(transparent){
   // Apply a low-resolution alpha map to the original high-resolution RGB.
   // The canvas stays transparent only where exterior background was proven
   // plain white; no garment texture is regenerated.
   const maskCanvas=document.createElement('canvas');
   maskCanvas.width=aw;maskCanvas.height=ah;
   const maskContext=maskCanvas.getContext('2d');
   if(maskContext){
    const imageData=maskContext.createImageData(aw,ah);
    for(let i=0;i<whiteMatte.alpha.length;i++){
     const k=i*4;imageData.data[k]=255;imageData.data[k+1]=255;
     imageData.data[k+2]=255;imageData.data[k+3]=whiteMatte.alpha[i];
    }
    maskContext.putImageData(imageData,0,0);
    ctx.globalCompositeOperation='destination-in';
    try{render(maskCanvas,{x:bounds.x*aw/im.naturalWidth,
      y:bounds.y*ah/im.naturalHeight,
      width:bounds.width*aw/im.naturalWidth,
      height:bounds.height*ah/im.naturalHeight});}
    finally{ctx.globalCompositeOperation='source-over';}
   }
   maskCanvas.width=0;maskCanvas.height=0;
  }
  try{return cv.toDataURL('image/webp',.88);}catch{return null;}
 }
 async function normalized(item){
  if(!item?.id||!valid(item.image))return null;
  // A separately stored generated tile may appear ONLY after explicit visual
  // review with SHA-256 identity checks. Most items use safe local centering.
  // Compare string references directly instead of concatenating multi-MB
  // photo/preview data URIs into a new cache key on every closet redraw.
  const preview=item.normalizedPreview?.image||null;
  const review=item.normalizedPreview?.review;
  // Invalidate when an approval is withdrawn, the item is reclassified,
  // or either checksum changes—even if the image bytes are still identical.
  const approvalKey=[
    item.category||'',
    item.normalizedPreview?.category||'',
    item.normalizedPreview?.sourceSha256||'',
    item.normalizedPreview?.previewSha256||'',
    review?.status||'',review?.approvedByOwner===true,
    review?.identityChecked===true,review?.explicitVisualReview===true
  ].join(':');
  const existing=cache.get(item.id);
  if(existing&&existing.source===item.image&&existing.preview===preview&&
     existing.approvalKey===approvalKey)return existing.value;
  const value=(async()=>{
    if(typeof root.GarmentDisplayPreview!=='undefined'){
      const candidate=await root.GarmentDisplayPreview.approved(item);
      if(candidate&&typeof Image!=='undefined'){
        const check=new Image();check.src=candidate;
        try{await check.decode();return candidate;}catch{/* original fallback */}
      }
    }
    return draw(item);
  })();
  cache.set(item.id,{source:item.image,preview,approvalKey,value});
  if(cache.size>12)cache.delete(cache.keys().next().value);
  return value;
 }
 function apply(img,item){
  if(!img||!item?.image)return;
  const original=item.image;
  if(img.getAttribute('src')!==original)return; // do not overwrite current preview
  normalized(item).then(tile=>{
    if(tile&&img.isConnected&&item.image===original&&img.getAttribute('src')===original)
      img.src=tile;
  }).catch(()=>{});
 }
 // Reduce mobile CPU/battery use by preparing images only when near viewport.
 // Separate record integrity: observer changes an <img>, never stored items.
 let observer;
 const queued=new WeakMap();
 function observe(img,item){
  if(!img||!item?.image)return;
  if(typeof IntersectionObserver==='undefined'){apply(img,item);return;}
  if(!observer)observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){
      observer.unobserve(entry.target);
      const owned=queued.get(entry.target);if(owned)apply(entry.target,owned);
      queued.delete(entry.target);
    }
  },{rootMargin:'120px'});
  queued.set(img,item);observer.observe(img);
 }
 root.ClosetTileEngine={placement,safeWhiteBounds,normalized,apply,observe,valid};
 if(typeof module!=='undefined')module.exports=root.ClosetTileEngine;
})(typeof window!=='undefined'?window:globalThis);
