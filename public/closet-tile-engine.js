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
  if(im.naturalWidth*im.naturalHeight<=3500000){
   const tmp=document.createElement('canvas');
   tmp.width=im.naturalWidth;tmp.height=im.naturalHeight;
   const tc=tmp.getContext('2d',{willReadFrequently:true});
   if(tc)try{
     tc.drawImage(im,0,0);
     bounds=safeWhiteBounds(tc.getImageData(0,0,tmp.width,tmp.height).data,tmp.width,tmp.height);
    }catch{/* retain untrimmed source */ }
   tmp.width=0;tmp.height=0;
  }
  ctx.fillStyle='#f6f3f8';ctx.fillRect(0,0,W,H);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const to=placement(bounds.width,bounds.height);
  ctx.drawImage(im,bounds.x,bounds.y,bounds.width,bounds.height,to.x,to.y,to.width,to.height);
  try{return cv.toDataURL('image/webp',.86);}catch{return null;}
 }
 async function normalized(item){
  if(!item?.id||!valid(item.image))return null;
  const existing=cache.get(item.id);
  if(existing&&existing.source===item.image)return existing.value;
  const value=draw(item);cache.set(item.id,{source:item.image,value});
  if(cache.size>20)cache.delete(cache.keys().next().value);
  return value;
 }
 function apply(img,item){
  if(!img||!item?.image)return;
  const original=item.image;img.src=original;
  normalized(item).then(tile=>{
    if(tile&&img.isConnected&&item.image===original&&img.getAttribute('src')===original)
      img.src=tile;
  }).catch(()=>{});
 }
 root.ClosetTileEngine={placement,safeWhiteBounds,normalized,apply,valid};
 if(typeof module!=='undefined')module.exports=root.ClosetTileEngine;
})(typeof window!=='undefined'?window:globalThis);
